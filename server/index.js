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


// Signup endpoint
app.post('/api/signup', async (req, res) => {
    const { name, email, password, username, dob } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (name, email, password, username, dob)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, email, username, dob`,
            [name, email, hashedPassword, username, dob]
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

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
