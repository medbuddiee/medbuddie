require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { router: authRouter } = require('./routes/auth');
const profileRouter = require('./routes/profile');
const postsRouter      = require('./routes/posts');
const searchRouter     = require('./routes/search');
const guidelinesRouter = require('./routes/guidelines');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', authRouter);          // POST /api/signup, /api/login, /api/google-login
app.use('/api/auth', authRouter);     // POST /api/auth/facebook
app.use('/api/profile', profileRouter); // GET/PUT /api/profile
app.use('/api/posts', postsRouter);   // GET/POST /api/posts, likes, comments
app.use('/api/search',     searchRouter);     // GET /api/search?q=...
app.use('/api/guidelines', guidelinesRouter); // GET /api/guidelines

// Backward-compat alias for old /login path
app.post('/login', (req, res, next) => {
    req.url = '/login'; // authRouter already has this as /login
    authRouter(req, res, next);
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`MedBuddie server running on http://localhost:${port}`);
});
