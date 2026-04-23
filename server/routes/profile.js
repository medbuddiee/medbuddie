const express = require('express');
const pool    = require('../config/db');
const multer  = require('multer');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/* ── Multer — avatar upload (memory storage → base64 in DB) ─────────────── */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
    fileFilter: (_req, file, cb) => {
        if (/^image\//.test(file.mimetype)) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

/* ── GET /api/profile ────────────────────────────────────────────────────── */
router.get('/', authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        const { rows } = await pool.query(
            `SELECT id, name, username, bio, weight, height, bmi,
                    blood_pressure  AS "bloodPressure",
                    lipid_panel     AS "lipidPanel",
                    hba1c, medications, email,
                    avatar_url      AS "avatarUrl",
                    is_doctor       AS "isDoctor",
                    is_verified_doctor AS "isVerifiedDoctor",
                    doctor_specialties AS "doctorSpecialties",
                    doctor_bio      AS "doctorBio",
                    years_experience AS "yearsExperience",
                    license_number  AS "licenseNumber"
             FROM users WHERE id = $1`,
            [userId]
        );
        if (!rows[0]) return res.status(404).json({ error: 'User not found' });
        const profile = rows[0];
        profile.medications = profile.medications || [];
        res.json(profile);
    } catch (err) {
        console.error('GET /api/profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── PUT /api/profile ────────────────────────────────────────────────────── */
router.put('/', authenticate, async (req, res) => {
    const {
        name, bio, weight, height, bmi,
        bloodPressure, hba1c, lipidPanel, medications = [],
    } = req.body;

    const resolvedId = req.user.id;

    try {
        const { rows } = await pool.query(
            `UPDATE users SET
                name           = $1, bio            = $2,
                weight         = $3, height         = $4,
                bmi            = $5, blood_pressure  = $6,
                hba1c          = $7, lipid_panel     = $8,
                medications    = $9::jsonb
             WHERE id = $10
             RETURNING id, name, bio, weight, height, bmi,
                       blood_pressure AS "bloodPressure",
                       hba1c, lipid_panel AS "lipidPanel",
                       medications`,
            [name, bio, weight, height, bmi, bloodPressure, hba1c,
             lipidPanel, JSON.stringify(medications), resolvedId]
        );
        if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('PUT /api/profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── POST /api/profile/avatar — upload profile photo ─────────────────────── */
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Store as base64 data URL so it works on any host (no ephemeral filesystem)
    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    try {
        const { rows } = await pool.query(
            `UPDATE users SET avatar_url = $1 WHERE id = $2
             RETURNING id, avatar_url AS "avatarUrl"`,
            [dataUrl, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'User not found' });
        res.json({ avatarUrl: rows[0].avatarUrl });
    } catch (err) {
        console.error('POST /api/profile/avatar error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
