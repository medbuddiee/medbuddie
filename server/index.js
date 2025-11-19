require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
app.use(cors());

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const port = process.env.PORT || 5000;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

app.use(express.json());

/**
 * Third Party Sign In like apple, google and facebook
 */
//Google Signup
app.post('/api/google-login', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;

        // Optional: Save or login user in DB
        res.json({ email, name });
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: 'Invalid token' });
    }
});

//Facebook Sign Up endpoint
app.post('/api/auth/facebook', async (req, res) => {
    const { code } = req.body;
    const redirectUri = 'http://localhost:3000/facebook-callback';

    try {
        // Exchange code for access token
        const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FB_APP_ID}&redirect_uri=${redirectUri}&client_secret=${process.env.FB_APP_SECRET}&code=${code}`);
        const tokenData = await tokenRes.json();

        // Fetch user profile
        const profileRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`);
        const profile = await profileRes.json();

        // Save or fetch user from DB here
        res.json({ user: profile });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Facebook authentication failed' });
    }
});

/**
 * Post and Put requests
 */
// Signup endpoint
app.post('/api/signup', async (req, res) => {
    debugger
    const { name, email, password, username, dob, isCaregiver } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (name, email, password, username, dob, is_caregiver)
             VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, name, email, username, dob, is_caregiver AS "isCaregiver"`,
            [name, email, hashedPassword, username, dob, isCaregiver]
        );

        res.status(201).json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

//login post
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: "User not found" });
        }

        const user = rows[0];

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: "Invalid password" });
        }

        // Strip password before sending response
        delete user.password;

        res.json({
            message: "Login successful",
            user,
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// PUT: update profile
app.put('/api/profile', async (req, res) => {
    const {
        userId,
        name,
        bio,
        weight,
        height,
        bmi,
        bloodPressure,
        lipidPanel,
        medications = [],
    } = req.body;

    try {
        const { rows } = await pool.query(
            `UPDATE users SET
                              name = $1,
                              bio = $2,
                              weight = $3,
                              height = $4,
                              bmi = $5,
                              blood_pressure = $6,
                              lipid_panel = $7,
                              medications = $8::jsonb
             WHERE id = $9
                 RETURNING id, name, bio, weight, height, bmi,
                 blood_pressure AS "bloodPressure",
                 lipid_panel AS "lipidPanel",
                 medications`,
            [
                name,
                bio,
                weight,
                height,
                bmi,
                bloodPressure,
                lipidPanel,
                JSON.stringify(medications),
                userId,
            ]
        );

        if (!rows.length) return res.status(404).json({ error: 'Profile not found' });

        res.json(rows[0]);

    } catch (err) {
        console.error('PUT /api/profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * Get requests
 */
app.get('/api/profile', async (req, res) => {
    const userId = req.user?.id || 1; // demo user
    try {
        const { rows } = await pool.query(
            `SELECT id, name, username, bio, weight, height, bmi,
                    blood_pressure AS "bloodPressure",
                    lipid_panel AS "lipidPanel",
                    medications
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (!rows[0]) return res.status(404).json({ error: 'Not found' });

        const profile = rows[0];
        profile.medications = profile.medications || []; // ✅ no JSON.parse()

        res.json(profile);
    } catch (err) {
        console.error('GET /profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
