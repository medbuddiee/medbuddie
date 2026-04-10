const express = require('express');
const pool = require('../config/db');

const router = express.Router();

/**
 * GET /api/search?q=<query>
 *
 * Returns a combined preview used by the TopNav search dropdown:
 *   { posts: [...up to 5], users: [...up to 4] }
 *
 * Post fields:  id, content (truncated), type, created_at, author
 * User fields:  id, name, username, bio
 *
 * Uses ILIKE for case-insensitive substring matching.
 * Special LIKE characters (%, _, \) are escaped to prevent injection.
 */
router.get('/', async (req, res) => {
    const raw = (req.query.q || '').trim();
    if (!raw) return res.json({ posts: [], users: [] });

    // Escape ILIKE wildcards so user input is treated as a literal string
    const like = `%${raw.replace(/[%_\\]/g, '\\$&')}%`;

    try {
        const [postsResult, usersResult] = await Promise.all([
            pool.query(
                `SELECT
                    p.id,
                    -- Truncate long content for the dropdown preview
                    LEFT(p.content, 140) AS content,
                    p.type,
                    p.created_at,
                    u.name AS author
                 FROM posts p
                 JOIN users u ON u.id = p.user_id
                 WHERE p.content ILIKE $1
                    OR p.tags::text ILIKE $1
                 ORDER BY p.created_at DESC
                 LIMIT 5`,
                [like]
            ),
            pool.query(
                `SELECT id, name, username, bio
                 FROM users
                 WHERE name     ILIKE $1
                    OR username ILIKE $1
                 LIMIT 4`,
                [like]
            ),
        ]);

        res.json({
            posts: postsResult.rows,
            users: usersResult.rows,
        });
    } catch (err) {
        console.error('GET /api/search error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
