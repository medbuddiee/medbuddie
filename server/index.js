require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const app = express();
app.use(cors());
app.use(express.json());

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'medbuddie_dev_secret_change_in_production';

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// JWT middleware — attaches req.user if token is valid
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

function makeToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

// POST /api/signup
app.post('/api/signup', async (req, res) => {
    const { name, email, password, username, dob, isCaregiver } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (name, email, password, username, dob, is_caregiver)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, name, email, username, dob, is_caregiver AS "isCaregiver"`,
            [name || username, email, hashedPassword, username, dob, isCaregiver || false]
        );
        const user = result.rows[0];
        const token = makeToken(user);
        res.status(201).json({ user, token });
    } catch (err) {
        console.error('Signup error:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        delete user.password;
        const token = makeToken(user);
        res.json({ message: 'Login successful', user, token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Keep old /login path for backward compat (frontend still uses it in some places)
app.post('/login', (req, res, next) => {
    req.url = '/api/login';
    next('route');
});

// POST /api/google-login
app.post('/api/google-login', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, name, picture } = ticket.getPayload();

        // Upsert user in DB
        const result = await pool.query(
            `INSERT INTO users (name, email, password, username)
             VALUES ($1, $2, '', $3)
             ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
             RETURNING id, name, email, username, bio, weight, height, bmi,
                       blood_pressure AS "bloodPressure",
                       lipid_panel AS "lipidPanel",
                       hba1c,
                       medications`,
            [name, email, email.split('@')[0]]
        );
        const user = result.rows[0];
        user.medications = user.medications || [];
        const jwtToken = makeToken(user);
        res.json({ user, token: jwtToken, picture });
    } catch (err) {
        console.error('Google login error:', err);
        res.status(401).json({ error: 'Invalid Google token' });
    }
});

// POST /api/auth/facebook
app.post('/api/auth/facebook', async (req, res) => {
    const { code } = req.body;
    const redirectUri = process.env.FB_REDIRECT_URI || 'http://localhost:3000/facebook-callback';
    try {
        const tokenRes = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FB_APP_ID}&redirect_uri=${redirectUri}&client_secret=${process.env.FB_APP_SECRET}&code=${code}`
        );
        const tokenData = await tokenRes.json();
        const profileRes = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`
        );
        const profile = await profileRes.json();
        res.json({ user: profile });
    } catch (err) {
        console.error('Facebook auth error:', err);
        res.status(500).json({ error: 'Facebook authentication failed' });
    }
});

// ─── Profile Routes ───────────────────────────────────────────────────────────

// GET /api/profile  (uses JWT; falls back to userId query param for dev)
app.get('/api/profile', async (req, res) => {
    const auth = req.headers.authorization;
    let userId;

    if (auth && auth.startsWith('Bearer ')) {
        try {
            const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
            userId = decoded.id;
        } catch {
            return res.status(401).json({ error: 'Invalid token' });
        }
    } else if (req.query.userId) {
        userId = parseInt(req.query.userId);
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { rows } = await pool.query(
            `SELECT id, name, username, bio, weight, height, bmi,
                    blood_pressure AS "bloodPressure",
                    lipid_panel AS "lipidPanel",
                    hba1c,
                    medications
             FROM users WHERE id = $1`,
            [userId]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Not found' });
        const profile = rows[0];
        profile.medications = profile.medications || [];
        res.json(profile);
    } catch (err) {
        console.error('GET /api/profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/profile
app.put('/api/profile', async (req, res) => {
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

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    try {
        const { rows } = await pool.query(
            `UPDATE users SET
                name = $1,
                bio = $2,
                weight = $3,
                height = $4,
                bmi = $5,
                blood_pressure = $6,
                hba1c = $7,
                lipid_panel = $8,
                medications = $9::jsonb
             WHERE id = $10
             RETURNING id, name, bio, weight, height, bmi,
                       blood_pressure AS "bloodPressure",
                       hba1c,
                       lipid_panel AS "lipidPanel",
                       medications`,
            [name, bio, weight, height, bmi, bloodPressure, hba1c, lipidPanel, JSON.stringify(medications), userId]
        );
        if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('PUT /api/profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Posts Routes ─────────────────────────────────────────────────────────────

// GET /api/posts — public feed
app.get('/api/posts', async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    try {
        const { rows } = await pool.query(
            `SELECT p.id, p.content, p.type, p.tags, p.likes, p.comments_count,
                    p.created_at, u.name AS author, u.username
             FROM posts p
             JOIN users u ON p.user_id = u.id
             ORDER BY p.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/posts — create post (requires auth)
app.post('/api/posts', authenticate, async (req, res) => {
    const { content, type, tags } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });
    try {
        const { rows } = await pool.query(
            `INSERT INTO posts (user_id, content, type, tags)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [req.user.id, content, type || 'personal', tags || []]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('POST /api/posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/posts/:id/like
app.post('/api/posts/:id/like', authenticate, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `UPDATE posts SET likes = likes + 1 WHERE id = $1 RETURNING likes`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Post not found' });
        res.json({ likes: rows[0].likes });
    } catch (err) {
        console.error('Like error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`MedBuddie server running on http://localhost:${port}`);
});
