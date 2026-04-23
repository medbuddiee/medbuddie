const express = require('express');
const pool    = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/* ── POST /api/consultations — patient requests a consultation ───────────── */
router.post('/', authenticate, async (req, res) => {
    const { doctorId, concern, secondOpinionId } = req.body;

    if (!doctorId || !concern?.trim())
        return res.status(400).json({ error: 'Doctor and concern are required' });

    // Verify doctor exists and is verified
    const doc = await pool.query(
        'SELECT id FROM users WHERE id=$1 AND is_doctor=true AND is_verified_doctor=true',
        [doctorId]
    );
    if (!doc.rows.length)
        return res.status(404).json({ error: 'Doctor not found' });

    try {
        const { rows } = await pool.query(`
            INSERT INTO consultations (patient_id, doctor_id, concern, second_opinion_id)
            VALUES ($1,$2,$3,$4)
            RETURNING id, patient_id AS "patientId", doctor_id AS "doctorId",
                      concern, status, created_at AS "createdAt"
        `, [req.user.id, doctorId, concern.trim(), secondOpinionId || null]);

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('POST /api/consultations error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── GET /api/consultations — list consultations for the current user ────── */
router.get('/', authenticate, async (req, res) => {
    const meId = req.user.id;
    try {
        const { rows } = await pool.query(`
            SELECT
                c.id, c.concern, c.status, c.meeting_url AS "meetingUrl",
                c.scheduled_at AS "scheduledAt", c.notes,
                c.created_at AS "createdAt",
                p.id AS "patientId", p.name AS "patientName",
                p.avatar_url AS "patientAvatar",
                d.id AS "doctorId", d.name AS "doctorName",
                d.avatar_url AS "doctorAvatar",
                d.doctor_specialties AS "doctorSpecialties"
            FROM consultations c
            JOIN users p ON p.id = c.patient_id
            JOIN users d ON d.id = c.doctor_id
            WHERE c.patient_id = $1 OR c.doctor_id = $1
            ORDER BY c.created_at DESC
        `, [meId]);

        res.json(rows);
    } catch (err) {
        console.error('GET /api/consultations error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── PUT /api/consultations/:id — doctor accepts/declines ───────────────── */
router.put('/:id', authenticate, async (req, res) => {
    const { status, scheduledAt, notes } = req.body;
    const meId = req.user.id;

    const allowed = ['accepted', 'declined', 'completed'];
    if (!allowed.includes(status))
        return res.status(400).json({ error: 'Invalid status' });

    try {
        // Only the assigned doctor can update
        const check = await pool.query(
            'SELECT id, patient_id FROM consultations WHERE id=$1 AND doctor_id=$2',
            [req.params.id, meId]
        );
        if (!check.rows.length)
            return res.status(403).json({ error: 'Not authorized' });

        // Generate Jitsi meeting URL when accepting
        let meetingUrl = null;
        if (status === 'accepted') {
            meetingUrl = `https://meet.jit.si/medbuddie-consult-${req.params.id}-${Date.now()}`;
        }

        const { rows } = await pool.query(`
            UPDATE consultations
            SET status        = $1,
                scheduled_at  = $2,
                notes         = $3,
                meeting_url   = COALESCE($4, meeting_url)
            WHERE id = $5
            RETURNING id, status, meeting_url AS "meetingUrl",
                      scheduled_at AS "scheduledAt", notes
        `, [status, scheduledAt || null, notes || null, meetingUrl, req.params.id]);

        res.json(rows[0]);
    } catch (err) {
        console.error('PUT /api/consultations/:id error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── GET /api/consultations/:id/messages ────────────────────────────────── */
router.get('/:id/messages', authenticate, async (req, res) => {
    const meId = req.user.id;
    try {
        // Must be patient or doctor of this consultation
        const access = await pool.query(
            'SELECT id FROM consultations WHERE id=$1 AND (patient_id=$2 OR doctor_id=$2)',
            [req.params.id, meId]
        );
        if (!access.rows.length) return res.status(403).json({ error: 'Not authorized' });

        const { rows } = await pool.query(`
            SELECT m.id, m.content, m.created_at AS "createdAt",
                   u.id AS "senderId", u.name AS "senderName",
                   u.avatar_url AS "senderAvatar",
                   u.is_verified_doctor AS "senderIsDoctor"
            FROM consultation_messages m
            JOIN users u ON u.id = m.sender_id
            WHERE m.consultation_id = $1
            ORDER BY m.created_at ASC
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error('GET messages error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── POST /api/consultations/:id/messages ───────────────────────────────── */
router.post('/:id/messages', authenticate, async (req, res) => {
    const meId = req.user.id;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message content required' });
    try {
        const access = await pool.query(
            'SELECT id FROM consultations WHERE id=$1 AND (patient_id=$2 OR doctor_id=$2)',
            [req.params.id, meId]
        );
        if (!access.rows.length) return res.status(403).json({ error: 'Not authorized' });

        const { rows } = await pool.query(`
            INSERT INTO consultation_messages (consultation_id, sender_id, content)
            VALUES ($1,$2,$3)
            RETURNING id, content, created_at AS "createdAt", sender_id AS "senderId"
        `, [req.params.id, meId, content.trim()]);

        const msg = rows[0];
        const userRow = await pool.query(
            'SELECT name, avatar_url AS "senderAvatar", is_verified_doctor AS "senderIsDoctor" FROM users WHERE id=$1',
            [meId]
        );
        res.status(201).json({ ...msg, senderName: userRow.rows[0].name, ...userRow.rows[0] });
    } catch (err) {
        console.error('POST messages error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
