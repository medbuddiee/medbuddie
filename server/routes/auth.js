const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/db');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'medbuddie_dev_secret_change_in_production';

function makeToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// POST /api/signup
router.post('/signup', async (req, res) => {
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
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        // Fetch password hash separately, then return camelCase profile
        const { rows } = await pool.query(
            'SELECT id, password FROM users WHERE email = $1',
            [email]
        );
        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const valid = await bcrypt.compare(password, rows[0].password);
        if (!valid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Return full camelCase profile (same shape as GET /api/profile)
        const { rows: profile } = await pool.query(
            `SELECT id, name, email, username, dob,
                    is_caregiver   AS "isCaregiver",
                    bio, weight, height, bmi,
                    blood_pressure AS "bloodPressure",
                    hba1c,
                    lipid_panel    AS "lipidPanel",
                    medications
             FROM users WHERE id = $1`,
            [rows[0].id]
        );
        const user = profile[0];
        user.medications = user.medications || [];
        const token = makeToken(user);
        res.json({ message: 'Login successful', user, token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/google-login
router.post('/google-login', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, name } = ticket.getPayload();

        const result = await pool.query(
            `INSERT INTO users (name, email, password, username)
             VALUES ($1, $2, '', $3)
             ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
             RETURNING id, name, email, username, bio, weight, height, bmi,
                       blood_pressure AS "bloodPressure",
                       lipid_panel AS "lipidPanel",
                       hba1c, medications`,
            [name, email, email.split('@')[0]]
        );
        const user = result.rows[0];
        user.medications = user.medications || [];
        const jwtToken = makeToken(user);
        res.json({ user, token: jwtToken });
    } catch (err) {
        console.error('Google login error:', err);
        res.status(401).json({ error: 'Invalid Google token' });
    }
});

// POST /api/auth/facebook
router.post('/facebook', async (req, res) => {
    const { code } = req.body;
    const redirectUri = process.env.FB_REDIRECT_URI || 'http://localhost:3000/facebook-callback';
    try {
        const tokenRes = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FB_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${process.env.FB_APP_SECRET}&code=${code}`
        );
        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error.message);

        const profileRes = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`
        );
        const fbProfile = await profileRes.json();
        if (!fbProfile.email) {
            return res.status(400).json({ error: 'Facebook account has no email address' });
        }

        const result = await pool.query(
            `INSERT INTO users (name, email, password, username)
             VALUES ($1, $2, '', $3)
             ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
             RETURNING id, name, email, username, bio, weight, height, bmi,
                       blood_pressure AS "bloodPressure",
                       lipid_panel AS "lipidPanel",
                       hba1c, medications`,
            [fbProfile.name, fbProfile.email, fbProfile.email.split('@')[0]]
        );
        const user = result.rows[0];
        user.medications = user.medications || [];
        const token = makeToken(user);
        res.json({ user, token });
    } catch (err) {
        console.error('Facebook auth error:', err);
        res.status(500).json({ error: 'Facebook authentication failed' });
    }
});

module.exports = { router, makeToken };
