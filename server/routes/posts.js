const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'medbuddie_dev_secret_change_in_production';

function authenticate(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        req.user = jwt.verify(auth.slice(7), JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// GET /api/posts  — public paginated feed
router.get('/', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = parseInt(req.query.offset) || 0;
    const userId = req.query.userId ? parseInt(req.query.userId) : null;

    const whereClauses = [];
    const params = [limit, offset];

    if (userId) {
        whereClauses.push(`p.user_id = $${params.length + 1}`);
        params.push(userId);
    }

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        const { rows } = await pool.query(
            `SELECT p.id, p.content, p.type, p.tags, p.likes, p.comments_count,
                    p.created_at, u.name AS author, u.username
             FROM posts p
             JOIN users u ON p.user_id = u.id
             ${where}
             ORDER BY p.created_at DESC
             LIMIT $1 OFFSET $2`,
            params
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/posts  — create post (requires auth)
router.post('/', authenticate, async (req, res) => {
    const { content, type, tags } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Content is required' });
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO posts (user_id, content, type, tags)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [req.user.id, content.trim(), type || 'personal', tags || []]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('POST /api/posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/posts/:id/like
router.post('/:id/like', authenticate, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `UPDATE posts SET likes = likes + 1 WHERE id = $1 RETURNING id, likes`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Post not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('Like error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
