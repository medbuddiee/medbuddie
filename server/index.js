require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const pool    = require('./config/db');

const { router: authRouter } = require('./routes/auth');
const profileRouter          = require('./routes/profile');
const postsRouter            = require('./routes/posts');
const searchRouter           = require('./routes/search');
const guidelinesRouter       = require('./routes/guidelines');
const bookmarksRouter        = require('./routes/bookmarks');
const secondOpinionsRouter   = require('./routes/secondOpinions');

const app  = express();
const port = process.env.PORT || 5000;

/* ═══════════════════════════════════════════════════════════════════════════
   RUN ALL MIGRATIONS BEFORE ACCEPTING REQUESTS
   Each ALTER / CREATE is idempotent (IF NOT EXISTS / IF NOT EXISTS column).
   ═══════════════════════════════════════════════════════════════════════════ */
async function runMigrations() {
    const migrations = [
        // Add avatar_url to users if it doesn't exist
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL`,

        // Guideline bookmarks
        `CREATE TABLE IF NOT EXISTS user_guideline_bookmarks (
            user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            guideline_id INTEGER NOT NULL REFERENCES guidelines(id) ON DELETE CASCADE,
            created_at   TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (user_id, guideline_id)
        )`,

        // Second opinions
        `CREATE TABLE IF NOT EXISTS second_opinions (
            id               SERIAL PRIMARY KEY,
            user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            doctor_name      VARCHAR(120),
            doctor_specialty VARCHAR(100),
            concern          TEXT NOT NULL,
            medical_history  TEXT DEFAULT '',
            status           VARCHAR(30) DEFAULT 'pending',
            submitted_at     TIMESTAMPTZ DEFAULT NOW()
        )`,

        `CREATE INDEX IF NOT EXISTS idx_second_opinions_user
         ON second_opinions(user_id)`,
    ];

    for (const sql of migrations) {
        try {
            await pool.query(sql);
        } catch (err) {
            // Log but don't crash — some may fail on old PG versions
            console.error('Migration warning:', err.message);
        }
    }
    console.log('Migrations complete.');
}

/* ═══════════════════════════════════════════════════════════════════════════
   START SERVER
   ═══════════════════════════════════════════════════════════════════════════ */
async function start() {
    await runMigrations();

    app.use(cors());
    app.use(express.json());

    // Serve uploaded files (avatars, etc.)
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Routes
    app.use('/api',              authRouter);           // signup / login / google
    app.use('/api/auth',         authRouter);           // facebook callback
    app.use('/api/profile',      profileRouter);        // profile + avatar upload
    app.use('/api/posts',        postsRouter);          // feed CRUD + likes + comments
    app.use('/api/search',       searchRouter);         // search
    app.use('/api/guidelines',   guidelinesRouter);     // guidelines list + content
    app.use('/api/bookmarks',    bookmarksRouter);      // guideline bookmarks
    app.use('/api/second-opinions', secondOpinionsRouter); // second opinion cases

    // Backward-compat alias
    app.post('/login', (req, res, next) => {
        req.url = '/login';
        authRouter(req, res, next);
    });

    // Serve React build in production
    const clientBuild = path.join(__dirname, '..', 'client', 'dist');
    if (require('fs').existsSync(clientBuild)) {
        app.use(express.static(clientBuild));
        app.get('*', (_req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
    }

    // Global error handler
    app.use((err, _req, res, _next) => {
        console.error('Unhandled error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    });

    app.listen(port, () => {
        console.log(`MedBuddie server running on http://localhost:${port}`);
    });
}

start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
