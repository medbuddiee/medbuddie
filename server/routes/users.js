const express = require('express');
const pool    = require('../config/db');
const { authenticate, softAuthenticate } = require('../middleware/auth');

const router = express.Router();

/* ── GET /api/users — discover people ───────────────────────────────────────*/
router.get('/', softAuthenticate, async (req, res) => {
    const { q, limit = 30, offset = 0 } = req.query;
    const meId = req.user?.id || null;

    try {
        let queryText = `
            SELECT
                u.id, u.name, u.username, u.bio,
                u.avatar_url         AS "avatarUrl",
                u.is_doctor          AS "isDoctor",
                u.is_verified_doctor AS "isVerifiedDoctor",
                u.doctor_specialties AS "doctorSpecialties",
                (SELECT COUNT(*) FROM user_followers WHERE following_id = u.id)::int AS "followersCount",
                (SELECT COUNT(*) FROM user_followers WHERE follower_id  = u.id)::int AS "followingCount",
                ${meId ? `EXISTS(SELECT 1 FROM user_followers WHERE follower_id=$1 AND following_id=u.id)` : 'false'} AS "isFollowing"
            FROM users u
            ${meId ? `WHERE u.id != $1` : 'WHERE true'}
        `;

        const params = meId ? [meId] : [];
        let paramIdx = params.length + 1;

        if (q && q.trim()) {
            queryText += ` AND (u.name ILIKE $${paramIdx} OR u.username ILIKE $${paramIdx} OR u.bio ILIKE $${paramIdx})`;
            params.push(`%${q.trim()}%`);
            paramIdx++;
        }

        queryText += ` ORDER BY "followersCount" DESC, u.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const { rows } = await pool.query(queryText, params);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/users error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── POST /api/users/doctor-register — register as a doctor ─────────────────
   MUST be defined before GET /:id so Express doesn't treat "doctor-register"
   as a user ID.                                                              */
router.post('/doctor-register', authenticate, async (req, res) => {
    const { specialties, licenseNumber, doctorBio, yearsExperience } = req.body;

    if (!specialties?.length || !licenseNumber?.trim())
        return res.status(400).json({ error: 'Specialties and license number are required' });

    try {
        const { rows } = await pool.query(`
            UPDATE users
            SET is_doctor          = true,
                doctor_specialties = $2,
                license_number     = $3,
                doctor_bio         = $4,
                years_experience   = $5,
                is_verified_doctor = true
            WHERE id = $1
            RETURNING id, name, email, username,
                      is_doctor          AS "isDoctor",
                      doctor_specialties AS "doctorSpecialties",
                      license_number     AS "licenseNumber",
                      doctor_bio         AS "doctorBio",
                      years_experience   AS "yearsExperience",
                      is_verified_doctor AS "isVerifiedDoctor"
        `, [
            req.user.id,
            specialties,
            licenseNumber.trim(),
            (doctorBio || '').trim(),
            parseInt(yearsExperience) || 0,
        ]);
        res.json(rows[0]);
    } catch (err) {
        console.error('POST /api/users/doctor-register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── GET /api/users/doctors/list — list verified doctors ────────────────────
   MUST be defined before GET /:id so "doctors" isn't treated as a user ID.  */
router.get('/doctors/list', softAuthenticate, async (req, res) => {
    const { specialty, q } = req.query;

    try {
        let queryText = `
            SELECT u.id, u.name, u.username, u.avatar_url AS "avatarUrl",
                   u.doctor_specialties AS "doctorSpecialties",
                   u.doctor_bio         AS "doctorBio",
                   u.years_experience   AS "yearsExperience",
                   (SELECT COUNT(*) FROM consultations WHERE doctor_id=u.id AND status='completed')::int
                       AS "completedConsultations"
            FROM users u
            WHERE u.is_doctor = true AND u.is_verified_doctor = true
        `;
        const params = [];
        let paramIdx = 1;

        if (specialty && specialty !== 'All') {
            queryText += ` AND $${paramIdx} = ANY(u.doctor_specialties)`;
            params.push(specialty);
            paramIdx++;
        }
        if (q && q.trim()) {
            queryText += ` AND (u.name ILIKE $${paramIdx} OR u.doctor_bio ILIKE $${paramIdx})`;
            params.push(`%${q.trim()}%`);
            paramIdx++;
        }

        queryText += ' ORDER BY "completedConsultations" DESC, u.created_at DESC';

        const { rows } = await pool.query(queryText, params);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/users/doctors/list error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── GET /api/users/:id — single user profile ───────────────────────────── */
router.get('/:id', softAuthenticate, async (req, res) => {
    const userId = parseInt(req.params.id);
    if (!Number.isFinite(userId) || userId < 1)
        return res.status(400).json({ error: 'Invalid user ID' });
    const meId = req.user?.id || null;
    try {
        const { rows } = await pool.query(`
            SELECT
                u.id, u.name, u.username, u.bio, u.avatar_url AS "avatarUrl",
                u.is_doctor          AS "isDoctor",
                u.is_verified_doctor AS "isVerifiedDoctor",
                u.doctor_specialties AS "doctorSpecialties",
                u.doctor_bio         AS "doctorBio",
                u.years_experience   AS "yearsExperience",
                (SELECT COUNT(*) FROM user_followers WHERE following_id = u.id)::int AS "followersCount",
                (SELECT COUNT(*) FROM user_followers WHERE follower_id  = u.id)::int AS "followingCount",
                ${meId ? `EXISTS(SELECT 1 FROM user_followers WHERE follower_id=$2 AND following_id=u.id)` : 'false'} AS "isFollowing"
            FROM users u WHERE u.id = $1
        `, meId ? [req.params.id, meId] : [req.params.id]);

        if (!rows.length) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('GET /api/users/:id error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── POST /api/users/:id/follow — toggle follow ─────────────────────────── */
router.post('/:id/follow', authenticate, async (req, res) => {
    const followingId = parseInt(req.params.id);
    if (!Number.isFinite(followingId) || followingId < 1)
        return res.status(400).json({ error: 'Invalid user ID' });
    const followerId  = req.user.id;

    if (followingId === followerId)
        return res.status(400).json({ error: 'Cannot follow yourself' });

    try {
        const existing = await pool.query(
            'SELECT 1 FROM user_followers WHERE follower_id=$1 AND following_id=$2',
            [followerId, followingId]
        );

        if (existing.rows.length) {
            await pool.query(
                'DELETE FROM user_followers WHERE follower_id=$1 AND following_id=$2',
                [followerId, followingId]
            );
            res.json({ following: false });
        } else {
            await pool.query(
                'INSERT INTO user_followers (follower_id, following_id) VALUES ($1,$2)',
                [followerId, followingId]
            );
            res.json({ following: true });
        }
    } catch (err) {
        console.error('POST /api/users/:id/follow error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── GET /api/users/:id/followers ───────────────────────────────────────── */
router.get('/:id/followers', softAuthenticate, async (req, res) => {
    const meId = req.user?.id || null;
    try {
        const { rows } = await pool.query(`
            SELECT u.id, u.name, u.username, u.avatar_url AS "avatarUrl",
                   u.is_doctor AS "isDoctor",
                   (SELECT COUNT(*) FROM user_followers WHERE following_id=u.id)::int AS "followersCount",
                   ${meId ? `EXISTS(SELECT 1 FROM user_followers WHERE follower_id=$2 AND following_id=u.id)` : 'false'} AS "isFollowing"
            FROM user_followers f JOIN users u ON u.id = f.follower_id
            WHERE f.following_id = $1
            ORDER BY f.created_at DESC
        `, meId ? [req.params.id, meId] : [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/users/:id/followers error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── GET /api/users/:id/following ───────────────────────────────────────── */
router.get('/:id/following', softAuthenticate, async (req, res) => {
    const meId = req.user?.id || null;
    try {
        const { rows } = await pool.query(`
            SELECT u.id, u.name, u.username, u.avatar_url AS "avatarUrl",
                   u.is_doctor AS "isDoctor",
                   (SELECT COUNT(*) FROM user_followers WHERE following_id=u.id)::int AS "followersCount",
                   ${meId ? `EXISTS(SELECT 1 FROM user_followers WHERE follower_id=$2 AND following_id=u.id)` : 'false'} AS "isFollowing"
            FROM user_followers f JOIN users u ON u.id = f.following_id
            WHERE f.follower_id = $1
            ORDER BY f.created_at DESC
        `, meId ? [req.params.id, meId] : [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/users/:id/following error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
