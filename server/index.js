require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const pool    = require('./config/db');

const { router: authRouter } = require('./routes/auth');
const profileRouter          = require('./routes/profile');
const postsRouter            = require('./routes/posts');
const searchRouter           = require('./routes/search');
const guidelinesRouter       = require('./routes/guidelines');
const bookmarksRouter        = require('./routes/bookmarks');
const secondOpinionsRouter   = require('./routes/secondOpinions');
const usersRouter            = require('./routes/users');
const communitiesRouter      = require('./routes/communities');
const consultationsRouter    = require('./routes/consultations');
const npiRouter              = require('./routes/npi');

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

        // ── Doctor fields on users ───────────────────────────────────────────
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_doctor BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_specialties TEXT[] DEFAULT '{}'`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number VARCHAR(100)`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified_doctor BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_bio TEXT`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS years_experience INTEGER`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS npi_number VARCHAR(10)`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS npi_verified BOOLEAN DEFAULT FALSE`,

        // ── Followers ───────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS user_followers (
            follower_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at   TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (follower_id, following_id)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_user_followers_following ON user_followers(following_id)`,
        `CREATE INDEX IF NOT EXISTS idx_user_followers_follower  ON user_followers(follower_id)`,

        // ── Communities ─────────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS communities (
            id            SERIAL PRIMARY KEY,
            name          VARCHAR(100) NOT NULL,
            description   TEXT DEFAULT '',
            category      VARCHAR(100) DEFAULT 'General',
            icon          VARCHAR(10)  DEFAULT '🏥',
            created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
            members_count INTEGER DEFAULT 0,
            posts_count   INTEGER DEFAULT 0,
            created_at    TIMESTAMPTZ DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS community_members (
            user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
            joined_at    TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (user_id, community_id)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id)`,
        `ALTER TABLE posts ADD COLUMN IF NOT EXISTS community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL`,

        // ── Consultations (doctor ↔ patient video sessions) ─────────────────
        `CREATE TABLE IF NOT EXISTS consultations (
            id                SERIAL PRIMARY KEY,
            second_opinion_id INTEGER REFERENCES second_opinions(id) ON DELETE SET NULL,
            patient_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            doctor_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status            VARCHAR(30) DEFAULT 'pending',
            meeting_url       TEXT,
            scheduled_at      TIMESTAMPTZ,
            notes             TEXT,
            concern           TEXT NOT NULL DEFAULT '',
            created_at        TIMESTAMPTZ DEFAULT NOW()
        )`,
        `CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id)`,
        `CREATE INDEX IF NOT EXISTS idx_consultations_doctor  ON consultations(doctor_id)`,

        // ── Consultation messages (in-app chat) ─────────────────────────────
        `CREATE TABLE IF NOT EXISTS consultation_messages (
            id              SERIAL PRIMARY KEY,
            consultation_id INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
            sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content         TEXT NOT NULL,
            created_at      TIMESTAMPTZ DEFAULT NOW()
        )`,
        `CREATE INDEX IF NOT EXISTS idx_consult_messages_consult ON consultation_messages(consultation_id)`,
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

    // Security headers
    app.use(helmet({
        contentSecurityPolicy: false, // React app handles its own CSP
        crossOriginEmbedderPolicy: false,
    }));

    // CORS — allow only known origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:5173', 'http://localhost:3000'];
    app.use(cors({
        origin: (origin, cb) => {
            // allow server-to-server (no origin) and listed origins
            if (!origin || allowedOrigins.some(o => origin.startsWith(o.trim()))) {
                cb(null, true);
            } else {
                cb(new Error(`CORS: origin ${origin} not allowed`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Body size limit — prevent oversized payloads
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
    app.use('/api/users',           usersRouter);          // people / follow system
    app.use('/api/communities',     communitiesRouter);    // communities
    app.use('/api/consultations',   consultationsRouter);  // doctor consultations
    app.use('/api/npi',             npiRouter);            // NPPES NPI verification

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

    // Global error handler — never leak internals to clients in production
    app.use((err, _req, res, _next) => {
        console.error('Unhandled error:', err);
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(err.status || 500).json({
            error: isDev ? (err.message || 'Internal server error') : 'Internal server error',
        });
    });

    app.listen(port, () => {
        console.log(`MedBuddie server running on http://localhost:${port}`);
    });
}

start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
