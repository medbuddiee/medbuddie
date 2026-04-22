const express = require('express');
const pool    = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/* ── POST /api/second-opinions — submit a case ───────────────────────────── */
router.post('/', authenticate, async (req, res) => {
    const { concern, medicalHistory, doctorName, doctorSpecialty } = req.body;

    if (!concern || !concern.trim())
        return res.status(400).json({ error: 'Concern is required' });

    try {
        const { rows } = await pool.query(
            `INSERT INTO second_opinions
                (user_id, concern, medical_history, doctor_name, doctor_specialty)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, concern, medical_history AS "medicalHistory",
                       doctor_name AS "doctorName",
                       doctor_specialty AS "doctorSpecialty",
                       status, submitted_at AS "submittedAt"`,
            [
                req.user.id,
                concern.trim(),
                (medicalHistory || '').trim(),
                (doctorName || '').trim(),
                (doctorSpecialty || '').trim(),
            ]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('POST /api/second-opinions error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── GET /api/second-opinions — list user's submitted cases ─────────────── */
router.get('/', authenticate, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, concern, medical_history AS "medicalHistory",
                    doctor_name AS "doctorName",
                    doctor_specialty AS "doctorSpecialty",
                    status, submitted_at AS "submittedAt"
             FROM second_opinions
             WHERE user_id = $1
             ORDER BY submitted_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/second-opinions error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
