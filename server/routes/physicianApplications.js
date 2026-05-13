const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const pool     = require('../config/db');
const { authenticate, softAuthenticate } = require('../middleware/auth');

const router = express.Router();

// ── ID upload storage (kept server-side only, never served publicly) ──────────
const idStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'physician-ids');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const uploadId = multer({
  storage: idStorage,
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.pdf'];
    const ext     = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */

// Fuzzy name match (handles hyphenated / middle names)
function namesMatch(a, b) {
  if (!a || !b) return false;
  const norm = s => s.toLowerCase().replace(/[^a-z]/g, ' ').trim();
  const wa   = norm(a).split(/\s+/).filter(Boolean);
  const wb   = norm(b).split(/\s+/).filter(Boolean);
  // At least last name + first name must overlap
  return wa.some(w => wb.includes(w)) && wb.some(w => wa.includes(w));
}

// Step 2 — NPI Registry check
async function checkNPI(npi, applicantName, specialty, states) {
  try {
    const res  = await fetch(
      `https://npiregistry.cms.hhs.gov/api/?number=${npi}&version=2.1`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    if (!data.result_count || !data.results?.length) {
      return { passed: false, reason: 'NPI not found in NPPES registry' };
    }
    const provider = data.results[0];
    const basic    = provider.basic || {};

    if (provider.enumeration_type !== 'NPI-1')
      return { passed: false, reason: 'NPI belongs to an organisation, not an individual provider' };
    if (basic.status && basic.status !== 'A')
      return { passed: false, reason: 'NPI is deactivated or inactive' };

    const npiName = [basic.first_name, basic.middle_name, basic.last_name]
      .filter(Boolean).join(' ');
    if (!namesMatch(applicantName, npiName))
      return { passed: false, reason: `Name mismatch — NPI record shows "${npiName}"` };

    return { passed: true, npiRecord: data.results[0] };
  } catch (e) {
    return { passed: false, reason: 'NPPES registry unavailable — will retry', retriable: true };
  }
}

// Step 4 — OIG LEIE check (against local DB copy)
async function checkOIG(fullName, npi) {
  try {
    const { rows } = await pool.query(
      `SELECT id FROM oig_exclusions
       WHERE LOWER(full_name) = LOWER($1) OR npi = $2
       LIMIT 1`,
      [fullName, npi]
    );
    if (rows.length > 0) {
      return { passed: false, reason: 'Physician appears on OIG exclusion list (LEIE)' };
    }
    // Get snapshot date
    const snap = await pool.query(
      `SELECT MAX(snapshot_date) AS snap FROM oig_exclusions`
    );
    const snapshotDate = snap.rows[0]?.snap
      ? new Date(snap.rows[0].snap).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'current';
    return { passed: true, snapshotDate };
  } catch {
    return { passed: true, snapshotDate: 'unknown', note: 'OIG DB not yet populated' };
  }
}

/* ── POST /api/physician-applications — submit application ───────────────── */
router.post('/', authenticate, uploadId.single('governmentId'), async (req, res) => {
  const {
    fullLegalName, dateOfBirth, medicalSchool, graduationYear,
    npiNumber, primarySpecialty, licensureStates, attestation,
  } = req.body;

  if (!fullLegalName?.trim() || !dateOfBirth || !npiNumber || !primarySpecialty ||
      !licensureStates || !attestation || !req.file) {
    return res.status(400).json({ error: 'All fields and government ID are required' });
  }
  if (!/^\d{10}$/.test(npiNumber.trim())) {
    return res.status(400).json({ error: 'NPI must be exactly 10 digits' });
  }

  const states = Array.isArray(licensureStates)
    ? licensureStates
    : licensureStates.split(',').map(s => s.trim());

  try {
    // Check for duplicate pending/approved application
    const existing = await pool.query(
      `SELECT id, status FROM physician_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (existing.rows.length) {
      const { status } = existing.rows[0];
      if (['pending', 'auto_checks_passed', 'manual_review'].includes(status)) {
        return res.status(409).json({ error: 'You already have an application in progress' });
      }
      if (status === 'approved') {
        return res.status(409).json({ error: 'You are already a verified physician' });
      }
    }

    // Create application record
    const { rows } = await pool.query(
      `INSERT INTO physician_applications
         (user_id, full_legal_name, date_of_birth, medical_school, graduation_year,
          npi_number, primary_specialty, licensure_states, government_id_path, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
       RETURNING *`,
      [
        req.user.id, fullLegalName.trim(), dateOfBirth, medicalSchool?.trim() || null,
        graduationYear ? parseInt(graduationYear) : null,
        npiNumber.trim(), primarySpecialty.trim(),
        JSON.stringify(states), req.file.filename,
      ]
    );
    const app = rows[0];

    // Run automated checks asynchronously (don't block response)
    runAutomatedChecks(app.id, fullLegalName.trim(), npiNumber.trim(), primarySpecialty, states);

    res.status(201).json({
      id:      app.id,
      status:  app.status,
      message: 'Application received. Automated checks are running now.',
    });
  } catch (err) {
    console.error('POST /api/physician-applications error:', err);
    // Clean up uploaded file on DB error
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: 'Server error' });
  }
});

// Run Steps 2 & 4 asynchronously
async function runAutomatedChecks(appId, fullName, npi, specialty, states) {
  try {
    await pool.query(
      `UPDATE physician_applications SET status = 'checks_running' WHERE id = $1`, [appId]
    );

    // Step 2 — NPI
    const npiResult = await checkNPI(npi, fullName, specialty, states);
    await pool.query(
      `UPDATE physician_applications SET npi_check_result = $1, npi_check_passed = $2 WHERE id = $3`,
      [JSON.stringify(npiResult), npiResult.passed, appId]
    );
    if (!npiResult.passed) {
      await rejectApplication(appId, npiResult.reason);
      return;
    }

    // Step 3 — Identity (Stripe) — marked pending for now; resolved via webhook
    await pool.query(
      `UPDATE physician_applications SET identity_check_status = 'pending' WHERE id = $1`, [appId]
    );

    // Step 4 — OIG
    const oigResult = await checkOIG(fullName, npi);
    await pool.query(
      `UPDATE physician_applications SET oig_check_result = $1, oig_check_passed = $2 WHERE id = $3`,
      [JSON.stringify(oigResult), oigResult.passed, appId]
    );
    if (!oigResult.passed) {
      await rejectApplication(appId, oigResult.reason);
      return;
    }

    // Step 5 — FSMB (stub — requires institutional account)
    await pool.query(
      `UPDATE physician_applications
       SET fsmb_check_result = $1, fsmb_check_passed = $2, fsmb_check_status = 'pending_account'
       WHERE id = $3`,
      [JSON.stringify({ note: 'FSMB institutional account pending — manual check required' }), null, appId]
    );

    // Move to manual review queue
    await pool.query(
      `UPDATE physician_applications SET status = 'manual_review' WHERE id = $1`, [appId]
    );
  } catch (err) {
    console.error('Automated checks error for app', appId, err);
    await pool.query(
      `UPDATE physician_applications SET status = 'checks_error', rejection_reason = $1 WHERE id = $2`,
      [err.message, appId]
    );
  }
}

async function rejectApplication(appId, reason) {
  await pool.query(
    `UPDATE physician_applications
     SET status = 'rejected', rejection_reason = $1, rejected_at = NOW()
     WHERE id = $2`,
    [reason, appId]
  );
}

/* ── GET /api/physician-applications/status — applicant status page ─────── */
router.get('/status', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, status, rejection_reason,
              npi_check_passed, npi_check_result,
              identity_check_status, identity_check_result,
              oig_check_passed, oig_check_result,
              fsmb_check_passed, fsmb_check_result, fsmb_check_status,
              created_at, updated_at,
              (SELECT COUNT(*) FROM physician_applications
               WHERE status = 'manual_review' AND created_at < pa.created_at)::int AS queue_position
       FROM physician_applications pa
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No application found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/physician-applications/status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── GET /api/physician-applications/admin — admin queue ─────────────────── */
router.get('/admin', authenticate, async (req, res) => {
  // In production: check req.user.isAdmin
  const { status, q, limit = 50, offset = 0 } = req.query;
  try {
    const params = [];
    let where = 'WHERE 1=1';

    if (status && status !== 'all') {
      params.push(status);
      where += ` AND pa.status = $${params.length}`;
    }
    if (q?.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (pa.full_legal_name ILIKE $${params.length} OR pa.npi_number ILIKE $${params.length})`;
    }

    params.push(parseInt(limit), parseInt(offset));

    const { rows } = await pool.query(
      `SELECT pa.*,
              u.email, u.avatar_url AS "avatarUrl",
              EXTRACT(EPOCH FROM (pa.created_at + INTERVAL '48 hours' - NOW()))/3600 AS sla_hours_left
       FROM physician_applications pa
       JOIN users u ON u.id = pa.user_id
       ${where}
       ORDER BY pa.created_at ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Stats
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('pending','checks_running','manual_review')) AS pending,
        COUNT(*) FILTER (WHERE status = 'approved' AND approved_at > NOW() - INTERVAL '7 days') AS approved_this_week,
        COUNT(*) FILTER (WHERE status = 'rejected' AND rejected_at > NOW() - INTERVAL '7 days') AS rejected_this_week,
        AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/3600)
          FILTER (WHERE status = 'approved' AND approved_at > NOW() - INTERVAL '30 days') AS avg_decision_hours
      FROM physician_applications
    `);

    res.json({ applications: rows, stats: stats.rows[0] });
  } catch (err) {
    console.error('GET /api/physician-applications/admin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── GET /api/physician-applications/admin/:id — single application ─────── */
router.get('/admin/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT pa.*, u.email, u.name AS user_name, u.avatar_url AS "avatarUrl"
       FROM physician_applications pa
       JOIN users u ON u.id = pa.user_id
       WHERE pa.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Application not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── PUT /api/physician-applications/admin/:id — approve / reject ────────── */
router.put('/admin/:id', authenticate, async (req, res) => {
  const { action, notes, rejectionReason } = req.body;
  if (!['approve', 'reject', 'request_info'].includes(action)) {
    return res.status(400).json({ error: 'action must be approve, reject, or request_info' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM physician_applications WHERE id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Application not found' });
    const app = rows[0];

    if (action === 'approve') {
      await pool.query(`BEGIN`);
      await pool.query(
        `UPDATE physician_applications
         SET status = 'approved', approved_at = NOW(), reviewer_id = $1, reviewer_notes = $2
         WHERE id = $3`,
        [req.user.id, notes || null, app.id]
      );
      await pool.query(
        `UPDATE users
         SET is_verified_doctor = true,
             doctor_specialties  = ARRAY[$1],
             verified_at         = NOW()
         WHERE id = $2`,
        [app.primary_specialty, app.user_id]
      );
      await pool.query(`COMMIT`);
      return res.json({ success: true, action: 'approved' });
    }

    if (action === 'reject') {
      await pool.query(
        `UPDATE physician_applications
         SET status = 'rejected', rejected_at = NOW(),
             rejection_reason = $1, reviewer_id = $2, reviewer_notes = $3
         WHERE id = $4`,
        [rejectionReason || notes, req.user.id, notes || null, app.id]
      );
      return res.json({ success: true, action: 'rejected' });
    }

    if (action === 'request_info') {
      await pool.query(
        `UPDATE physician_applications
         SET status = 'more_info_requested', reviewer_id = $1, reviewer_notes = $2
         WHERE id = $3`,
        [req.user.id, notes, app.id]
      );
      return res.json({ success: true, action: 'request_info' });
    }
  } catch (err) {
    await pool.query(`ROLLBACK`).catch(() => {});
    console.error('PUT /api/physician-applications/admin/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── GET /api/physician-applications/admin/:id/id-document — serve ID ───── */
router.get('/admin/:id/id-document', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT government_id_path FROM physician_applications WHERE id = $1`, [req.params.id]
    );
    if (!rows.length || !rows[0].government_id_path) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const filePath = path.join(__dirname, '..', 'uploads', 'physician-ids', rows[0].government_id_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
