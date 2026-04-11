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

/* ── GET /api/bookmarks — list current user's bookmarked guideline IDs ───── */
router.get('/', authenticate, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT guideline_id AS id FROM user_guideline_bookmarks WHERE user_id = $1`,
            [req.user.id]
        );
        res.json(rows.map(r => r.id));
    } catch (err) {
        console.error('GET /api/bookmarks error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── POST /api/bookmarks/:guidelineId — toggle bookmark ─────────────────── */
router.post('/:guidelineId', authenticate, async (req, res) => {
    const guidelineId = parseInt(req.params.guidelineId);
    if (!guidelineId) return res.status(400).json({ error: 'Invalid guideline ID' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const existing = await client.query(
            `SELECT 1 FROM user_guideline_bookmarks WHERE user_id = $1 AND guideline_id = $2`,
            [req.user.id, guidelineId]
        );

        let bookmarked;
        if (existing.rows.length) {
            /* Already bookmarked → remove */
            await client.query(
                `DELETE FROM user_guideline_bookmarks WHERE user_id = $1 AND guideline_id = $2`,
                [req.user.id, guidelineId]
            );
            await client.query(
                `UPDATE guidelines SET bookmark_count = GREATEST(0, bookmark_count - 1) WHERE id = $1`,
                [guidelineId]
            );
            bookmarked = false;
        } else {
            /* Not yet bookmarked → add */
            await client.query(
                `INSERT INTO user_guideline_bookmarks (user_id, guideline_id) VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [req.user.id, guidelineId]
            );
            await client.query(
                `UPDATE guidelines SET bookmark_count = bookmark_count + 1 WHERE id = $1`,
                [guidelineId]
            );
            bookmarked = true;
        }

        await client.query('COMMIT');
        res.json({ bookmarked, guidelineId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /api/bookmarks toggle error:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
