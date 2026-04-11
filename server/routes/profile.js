const express = require('express');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'medbuddie_dev_secret_change_in_production';

/* ── Ensure avatar_url column exists ────────────────────────────────────── */
pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL`)
    .catch(err => console.error('avatar_url migration error:', err));

/* ── Auth helpers ────────────────────────────────────────────────────────── */
function resolveUserId(req) {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
        try { return jwt.verify(auth.slice(7), JWT_SECRET).id; } catch { return null; }
    }
    if (req.query.userId) return parseInt(req.query.userId);
    return null;
}

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

/* ── Multer — avatar upload ──────────────────────────────────────────────── */
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename:    (req,  file,  cb) => {
        const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
        const name = `user_${req.user?.id || 'unknown'}_${Date.now()}${ext}`;
        cb(null, name);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        if (/^image\//.test(file.mimetype)) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

/* ── GET /api/profile ────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { rows } = await pool.query(
            `SELECT id, name, username, bio, weight, height, bmi,
                    blood_pressure  AS "bloodPressure",
                    lipid_panel     AS "lipidPanel",
                    hba1c, medications, email,
                    avatar_url      AS "avatarUrl"
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

/* ── PUT /api/profile ────────────────────────────────────────────────────── */
router.put('/', async (req, res) => {
    const {
        userId, name, bio, weight, height, bmi,
        bloodPressure, hba1c, lipidPanel, medications = [],
    } = req.body;

    const resolvedId = userId || resolveUserId(req);
    if (!resolvedId) return res.status(400).json({ error: 'userId is required' });

    try {
        const { rows } = await pool.query(
            `UPDATE users SET
                name           = $1, bio            = $2,
                weight         = $3, height         = $4,
                bmi            = $5, blood_pressure  = $6,
                hba1c          = $7, lipid_panel     = $8,
                medications    = $9::jsonb
             WHERE id = $10
             RETURNING id, name, bio, weight, height, bmi,
                       blood_pressure AS "bloodPressure",
                       hba1c, lipid_panel AS "lipidPanel",
                       medications, avatar_url AS "avatarUrl"`,
            [name, bio, weight, height, bmi, bloodPressure, hba1c,
             lipidPanel, JSON.stringify(medications), resolvedId]
        );
        if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('PUT /api/profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ── POST /api/profile/avatar — upload profile photo ─────────────────────── */
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    try {
        const { rows } = await pool.query(
            `UPDATE users SET avatar_url = $1 WHERE id = $2
             RETURNING id, avatar_url AS "avatarUrl"`,
            [avatarUrl, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'User not found' });
        res.json({ avatarUrl: rows[0].avatarUrl });
    } catch (err) {
        console.error('POST /api/profile/avatar error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
