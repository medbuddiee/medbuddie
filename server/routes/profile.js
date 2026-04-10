const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'medbuddie_dev_secret_change_in_production';

// Resolve user ID from JWT header or query param
function resolveUserId(req) {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
        try {
            const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
            return decoded.id;
        } catch {
            return null;
        }
    }
    if (req.query.userId) return parseInt(req.query.userId);
    return null;
}

// GET /api/profile
router.get('/', async (req, res) => {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized — provide a Bearer token or ?userId=' });

    try {
        const { rows } = await pool.query(
            `SELECT id, name, username, bio, weight, height, bmi,
                    blood_pressure AS "bloodPressure",
                    lipid_panel   AS "lipidPanel",
                    hba1c, medications, email
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

// PUT /api/profile
router.put('/', async (req, res) => {
    const {
        userId,
        name,
        bio,
        weight,
        height,
        bmi,
        bloodPressure,
        hba1c,
        lipidPanel,
        medications = [],
    } = req.body;

    // Accept userId from body (legacy) OR from JWT
    const resolvedId = userId || resolveUserId(req);
    if (!resolvedId) return res.status(400).json({ error: 'userId is required' });

    try {
        const { rows } = await pool.query(
            `UPDATE users SET
                name           = $1,
                bio            = $2,
                weight         = $3,
                height         = $4,
                bmi            = $5,
                blood_pressure = $6,
                hba1c          = $7,
                lipid_panel    = $8,
                medications    = $9::jsonb
             WHERE id = $10
             RETURNING id, name, bio, weight, height, bmi,
                       blood_pressure AS "bloodPressure",
                       hba1c,
                       lipid_panel    AS "lipidPanel",
                       medications`,
            [name, bio, weight, height, bmi, bloodPressure, hba1c, lipidPanel, JSON.stringify(medications), resolvedId]
        );
        if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('PUT /api/profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
