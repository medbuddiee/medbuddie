require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { router: authRouter } = require('./routes/auth');
const profileRouter          = require('./routes/profile');
const postsRouter            = require('./routes/posts');
const searchRouter           = require('./routes/search');
const guidelinesRouter       = require('./routes/guidelines');
const bookmarksRouter        = require('./routes/bookmarks');
const secondOpinionsRouter   = require('./routes/secondOpinions');

const app  = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Serve uploaded files (avatars, etc.) ─────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', authRouter);                          // POST /api/signup, /api/login
app.use('/api/auth', authRouter);                     // POST /api/auth/facebook
app.use('/api/profile',         profileRouter);       // GET/PUT /api/profile, POST /api/profile/avatar
app.use('/api/posts',           postsRouter);         // CRUD + likes + comments
app.use('/api/search',          searchRouter);        // GET /api/search?q=
app.use('/api/guidelines',      guidelinesRouter);    // GET /api/guidelines[/:id/content]
app.use('/api/bookmarks',       bookmarksRouter);     // GET/POST /api/bookmarks[/:guidelineId]
app.use('/api/second-opinions', secondOpinionsRouter);// GET/POST /api/second-opinions

// Backward-compat alias
app.post('/login', (req, res, next) => {
    req.url = '/login';
    authRouter(req, res, next);
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(port, () => {
    console.log(`MedBuddie server running on http://localhost:${port}`);
});
