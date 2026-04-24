const express = require('express');
const pool = require('../config/db');
const { authenticate, softAuthenticate } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/posts — public paginated feed ────────────────────────────────────
// Query params:
//   limit  (max 50, default 20)
//   offset (default 0)
//   userId — filter by author id
//   q      — full-text search: ILIKE match on content and tags
// When caller is authenticated, each post includes likedByMe: true/false
router.get('/', softAuthenticate, async (req, res) => {
    const limit      = Math.min(parseInt(req.query.limit)  || 20, 50);
    const offset     = parseInt(req.query.offset) || 0;
    const filterUser = req.query.userId ? parseInt(req.query.userId) : null;
    const rawQuery   = (req.query.q || '').trim();
    const viewerId   = req.user?.id || null;   // null for anonymous viewers

    // Build param list and WHERE clause dynamically
    const params = [];
    const conditions = [];

    if (filterUser) {
        params.push(filterUser);
        conditions.push(`p.user_id = $${params.length}`);
    }

    if (rawQuery) {
        // Escape ILIKE wildcards so search is a literal substring match
        const like = `%${rawQuery.replace(/[%_\\]/g, '\\$&')}%`;
        params.push(like);
        const p = params.length;
        // Reusing the same param index ($p) twice in one clause is valid in pg
        conditions.push(`(p.content ILIKE $${p} OR p.tags::text ILIKE $${p})`);
    }

    // viewerId param used in the LEFT JOIN below
    if (viewerId) {
        params.push(viewerId);
    }
    const viewerRef = viewerId ? `$${params.length}` : 'NULL';

    params.push(limit);
    const limitRef = `$${params.length}`;
    params.push(offset);
    const offsetRef = `$${params.length}`;

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const { rows } = await pool.query(
            `SELECT
                p.id,
                p.user_id        AS "authorId",
                p.content,
                p.type,
                p.tags,
                p.likes,
                p.comments_count,
                p.created_at,
                u.name           AS author,
                u.username,
                u.avatar_url     AS "authorAvatar",
                u.is_verified_doctor AS "authorIsDoctor",
                -- likedByMe is TRUE only when the viewer has a row in post_likes
                (pl.user_id IS NOT NULL) AS "likedByMe"
             FROM posts p
             JOIN  users      u  ON u.id  = p.user_id
             LEFT JOIN post_likes pl
                   ON pl.post_id = p.id AND pl.user_id = ${viewerRef}
             ${where}
             ORDER BY p.created_at DESC
             LIMIT ${limitRef} OFFSET ${offsetRef}`,
            params
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/posts — create a post (requires auth) ──────────────────────────
router.post('/', authenticate, async (req, res) => {
    const { content, type, tags } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Content is required' });
    }
    if (content.length > 10000)
        return res.status(400).json({ error: 'Post content must be under 10,000 characters' });

    // Accept any valid type; fall back to 'personal'
    const VALID_TYPES = ['medical_opinion', 'medical_question', 'personal'];
    const postType = VALID_TYPES.includes(type) ? type : 'personal';

    // Accept tags as an array or comma-separated string
    const parsedTags = Array.isArray(tags)
        ? tags.map(t => String(t).trim()).filter(Boolean)
        : (typeof tags === 'string'
            ? tags.split(',').map(t => t.trim()).filter(Boolean)
            : []);

    try {
        const { rows } = await pool.query(
            `INSERT INTO posts (user_id, content, type, tags)
             VALUES ($1, $2, $3, $4)
             RETURNING id, user_id AS "authorId", content, type, tags,
                       likes, comments_count, created_at`,
            [req.user.id, content.trim(), postType, parsedTags]
        );
        // Augment with author info so the client can render it immediately
        const post = {
            ...rows[0],
            author:    req.user.name,
            username:  req.user.name,
            likedByMe: false,
        };
        res.status(201).json(post);
    } catch (err) {
        console.error('POST /api/posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── DELETE /api/posts/:id — delete own post ───────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id`,
            [req.params.id, req.user.id]
        );
        if (!rows.length) {
            return res.status(404).json({ error: 'Post not found or not yours' });
        }
        res.json({ deleted: true, id: parseInt(req.params.id) });
    } catch (err) {
        console.error('DELETE /api/posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/posts/:id/like — toggle like (like ↔ unlike) ───────────────────
// Uses a transaction so the post_likes row and the denormalised counter stay in sync.
router.post('/:id/like', authenticate, async (req, res) => {
    const postId  = parseInt(req.params.id);
    const userId  = req.user.id;
    const client  = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check whether this user already liked the post
        const existing = await client.query(
            'SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2',
            [userId, postId]
        );

        let likedByMe;
        if (existing.rows.length) {
            // Already liked → unlike
            await client.query(
                'DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2',
                [userId, postId]
            );
            await client.query(
                'UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE id = $1',
                [postId]
            );
            likedByMe = false;
        } else {
            // Not yet liked → like
            await client.query(
                'INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)',
                [userId, postId]
            );
            await client.query(
                'UPDATE posts SET likes = likes + 1 WHERE id = $1',
                [postId]
            );
            likedByMe = true;
        }

        const { rows } = await client.query(
            'SELECT id, likes FROM posts WHERE id = $1',
            [postId]
        );
        await client.query('COMMIT');

        if (!rows.length) return res.status(404).json({ error: 'Post not found' });
        res.json({ id: postId, likes: rows[0].likes, likedByMe });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Like toggle error:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// ── GET /api/posts/:id/comments — list comments (public) ─────────────────────
router.get('/:id/comments', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT
                c.id,
                c.content,
                c.created_at,
                c.user_id AS "authorId",
                u.name    AS author,
                u.username,
                u.avatar_url AS "authorAvatar"
             FROM comments c
             JOIN users u ON u.id = c.user_id
             WHERE c.post_id = $1
             ORDER BY c.created_at ASC`,
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET comments error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/posts/:id/comments — add a comment (requires auth) ──────────────
router.post('/:id/comments', authenticate, async (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment content is required' });
    }
    if (content.length > 2000)
        return res.status(400).json({ error: 'Comment must be under 2,000 characters' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `INSERT INTO comments (post_id, user_id, content)
             VALUES ($1, $2, $3)
             RETURNING id, content, created_at, user_id AS "authorId"`,
            [req.params.id, req.user.id, content.trim()]
        );
        // Keep the denormalised comments_count on the post in sync
        await client.query(
            'UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1',
            [req.params.id]
        );
        await client.query('COMMIT');

        res.status(201).json({
            ...rows[0],
            author:   req.user.name,
            username: req.user.name,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST comment error:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// ── DELETE /api/posts/:id/comments/:commentId — delete own comment ────────────
router.delete('/:id/comments/:commentId', authenticate, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.commentId, req.user.id]
        );
        if (!rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Comment not found or not yours' });
        }
        await client.query(
            'UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = $1',
            [req.params.id]
        );
        await client.query('COMMIT');

        res.json({ deleted: true, id: parseInt(req.params.commentId) });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('DELETE comment error:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// ── GET /api/posts/top-week — top posts by likes in the last 7 days ──────────
router.get('/top-week', softAuthenticate, async (req, res) => {
    const limit    = Math.min(parseInt(req.query.limit) || 20, 50);
    const viewerId = req.user?.id || null;

    const params = [];
    if (viewerId) params.push(viewerId);
    const viewerRef = viewerId ? `$${params.length}` : 'NULL';
    params.push(limit);
    const limitRef = `$${params.length}`;

    try {
        const { rows } = await pool.query(
            `SELECT
                p.id,
                p.user_id        AS "authorId",
                p.content,
                p.type,
                p.tags,
                p.likes,
                p.comments_count,
                p.created_at,
                u.name           AS author,
                u.username,
                u.avatar_url     AS "authorAvatar",
                u.is_verified_doctor AS "authorIsDoctor",
                (pl.user_id IS NOT NULL) AS "likedByMe"
             FROM posts p
             JOIN  users u ON u.id = p.user_id
             LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = ${viewerRef}
             WHERE p.created_at >= NOW() - INTERVAL '7 days'
               AND p.community_id IS NULL
             ORDER BY p.likes DESC, p.comments_count DESC, p.created_at DESC
             LIMIT ${limitRef}`,
            params
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/posts/top-week error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
