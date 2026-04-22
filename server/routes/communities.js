const express = require('express');
const pool    = require('../config/db');
const { authenticate, softAuthenticate } = require('../middleware/auth');

const router = express.Router();

/* ── GET /api/communities ────────────────────────────────────────────────── */
router.get('/', softAuthenticate, async (req, res) => {
    const { category, q, limit = 50, offset = 0 } = req.query;
    const meId = req.user?.id || null;

    try {
        let queryText = `
            SELECT
                c.id, c.name, c.description, c.category, c.icon,
                c.members_count AS "membersCount",
                c.posts_count   AS "postsCount",
                c.created_at    AS "createdAt",
                u.name          AS "creatorName",
                ${meId ? `EXISTS(SELECT 1 FROM community_members WHERE user_id=$1 AND community_id=c.id)` : 'false'} AS "isMember"
            FROM communities c
            LEFT JOIN users u ON u.id = c.created_by
            WHERE true
        `;
        const params = meId ? [meId] : [];
        let paramIdx = params.length + 1;

        if (category && category !== 'All') {
            queryText += ` AND c.category = $${paramIdx}`;
            params.push(category);
            paramIdx++;
        }
        if (q && q.trim()) {
            queryText += ` AND (c.name ILIKE $${paramIdx} OR c.description ILIKE $${paramIdx})`;
            params.push(`%${q.trim()}%`);
            paramIdx++;
        }

        queryText += ` ORDER BY c.members_count DESC, c.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const { rows } = await pool.query(queryText, params);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/communities error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── POST /api/communities — create a community ─────────────────────────── */
router.post('/', authenticate, async (req, res) => {
    const { name, description, category, icon } = req.body;

    if (!name || !name.trim())
        return res.status(400).json({ error: 'Community name is required' });

    try {
        const { rows } = await pool.query(`
            INSERT INTO communities (name, description, category, icon, created_by, members_count)
            VALUES ($1, $2, $3, $4, $5, 1)
            RETURNING id, name, description, category, icon,
                      members_count AS "membersCount", posts_count AS "postsCount",
                      created_at AS "createdAt"
        `, [
            name.trim(),
            (description || '').trim(),
            (category || 'General').trim(),
            icon || '🏥',
            req.user.id,
        ]);

        const community = rows[0];

        // Creator auto-joins
        await pool.query(
            'INSERT INTO community_members (user_id, community_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [req.user.id, community.id]
        );

        res.status(201).json({ ...community, isMember: true });
    } catch (err) {
        console.error('POST /api/communities error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── GET /api/communities/:id ────────────────────────────────────────────── */
router.get('/:id', softAuthenticate, async (req, res) => {
    const meId = req.user?.id || null;
    try {
        const { rows } = await pool.query(`
            SELECT
                c.id, c.name, c.description, c.category, c.icon,
                c.members_count AS "membersCount", c.posts_count AS "postsCount",
                c.created_at AS "createdAt", u.name AS "creatorName",
                ${meId ? `EXISTS(SELECT 1 FROM community_members WHERE user_id=$2 AND community_id=c.id)` : 'false'} AS "isMember"
            FROM communities c LEFT JOIN users u ON u.id = c.created_by
            WHERE c.id = $1
        `, meId ? [req.params.id, meId] : [req.params.id]);

        if (!rows.length) return res.status(404).json({ error: 'Community not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('GET /api/communities/:id error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── POST /api/communities/:id/join — toggle membership ─────────────────── */
router.post('/:id/join', authenticate, async (req, res) => {
    const communityId = parseInt(req.params.id);
    const userId      = req.user.id;

    try {
        const existing = await pool.query(
            'SELECT 1 FROM community_members WHERE user_id=$1 AND community_id=$2',
            [userId, communityId]
        );

        if (existing.rows.length) {
            await pool.query(
                'DELETE FROM community_members WHERE user_id=$1 AND community_id=$2',
                [userId, communityId]
            );
            await pool.query(
                'UPDATE communities SET members_count = GREATEST(0, members_count - 1) WHERE id=$1',
                [communityId]
            );
            res.json({ member: false });
        } else {
            await pool.query(
                'INSERT INTO community_members (user_id, community_id) VALUES ($1,$2)',
                [userId, communityId]
            );
            await pool.query(
                'UPDATE communities SET members_count = members_count + 1 WHERE id=$1',
                [communityId]
            );
            res.json({ member: true });
        }
    } catch (err) {
        console.error('POST /api/communities/:id/join error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── GET /api/communities/:id/posts ─────────────────────────────────────── */
router.get('/:id/posts', softAuthenticate, async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;
    const meId = req.user?.id || null;

    try {
        const { rows } = await pool.query(`
            SELECT
                p.id, p.content, p.type, p.tags, p.likes, p.comments_count AS "commentsCount",
                p.created_at AS "created_at",
                u.id AS "authorId", u.name AS "author", u.username,
                u.avatar_url AS "authorAvatar",
                u.is_verified_doctor AS "authorIsDoctor",
                ${meId ? `EXISTS(SELECT 1 FROM post_likes WHERE user_id=$3 AND post_id=p.id)` : 'false'} AS "likedByMe"
            FROM posts p JOIN users u ON u.id = p.user_id
            WHERE p.community_id = $1
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET ${meId ? '$4' : '$3'}
        `, meId ? [req.params.id, parseInt(limit), meId, parseInt(offset)]
                : [req.params.id, parseInt(limit), parseInt(offset)]);

        res.json(rows);
    } catch (err) {
        console.error('GET /api/communities/:id/posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── POST /api/communities/:id/posts — post in community ────────────────── */
router.post('/:id/posts', authenticate, async (req, res) => {
    const communityId = parseInt(req.params.id);
    const { content, type = 'personal', tags = [] } = req.body;

    if (!content || !content.trim())
        return res.status(400).json({ error: 'Content is required' });

    // Must be a member to post
    const membership = await pool.query(
        'SELECT 1 FROM community_members WHERE user_id=$1 AND community_id=$2',
        [req.user.id, communityId]
    );
    if (!membership.rows.length)
        return res.status(403).json({ error: 'Join the community to post' });

    try {
        const tagArray = Array.isArray(tags)
            ? tags
            : tags.split(',').map(t => t.trim()).filter(Boolean);

        const { rows } = await pool.query(`
            INSERT INTO posts (user_id, content, type, tags, community_id)
            VALUES ($1,$2,$3,$4,$5)
            RETURNING id, content, type, tags, likes, comments_count AS "commentsCount", created_at
        `, [req.user.id, content.trim(), type, tagArray, communityId]);

        await pool.query(
            'UPDATE communities SET posts_count = posts_count + 1 WHERE id=$1',
            [communityId]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('POST /api/communities/:id/posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── GET /api/communities/:id/members ───────────────────────────────────── */
router.get('/:id/members', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT u.id, u.name, u.username, u.avatar_url AS "avatarUrl",
                   u.is_doctor AS "isDoctor", cm.joined_at AS "joinedAt"
            FROM community_members cm JOIN users u ON u.id = cm.user_id
            WHERE cm.community_id = $1
            ORDER BY cm.joined_at ASC
            LIMIT 50
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/communities/:id/members error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
