const express = require('express');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'medbuddie_dev_secret_change_in_production';

/* ── Auth middleware ─────────────────────────────────────────────────────── */
function authenticate(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        req.user = jwt.verify(auth.slice(7), JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/* ── Auto-create table ───────────────────────────────────────────────────── */
pool.query(`
    CREATE TABLE IF NOT EXISTS second_opinions (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doctor_name      VARCHAR(120),
        doctor_specialty VARCHAR(100),
        concern          TEXT NOT NULL,
        medical_history  TEXT DEFAULT '',
        status           VARCHAR(30) DEFAULT 'pending',
        submitted_at     TIMESTAMPTZ DEFAULT NOW()
    )
`).catch(err => console.error('Second opinions table migration error:', err));

pool.query(`CREATE INDEX IF NOT EXISTS idx_second_opinions_user ON second_opinions(user_id)`)
   .catch(() => {});

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
