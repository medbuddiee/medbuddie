-- MedBuddie Database Schema
-- Run once to initialise (or re-run — all statements are idempotent):
--   psql -U <user> -d medbuddie -f schema.sql

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100),
    email         VARCHAR(150) UNIQUE NOT NULL,
    password      TEXT NOT NULL DEFAULT '',
    username      VARCHAR(80) UNIQUE,
    dob           DATE,
    is_caregiver  BOOLEAN DEFAULT FALSE,
    bio           TEXT,
    -- Health metrics (stored as strings so user can enter "5'7", "122/78", etc.)
    weight        VARCHAR(30),
    height        VARCHAR(30),
    bmi           VARCHAR(20),
    blood_pressure VARCHAR(40),
    hba1c         VARCHAR(20),
    lipid_panel   VARCHAR(40),
    -- Medications: [{ name: string, frequency: string }]
    medications   JSONB DEFAULT '[]'::jsonb,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Posts ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content        TEXT NOT NULL,
    -- 'personal' or 'medical_opinion'
    type           VARCHAR(30) DEFAULT 'personal',
    -- e.g. ['#Cardiology', '#Recovery']
    tags           TEXT[] DEFAULT '{}',
    -- Denormalised counts kept in sync by post_likes / comments triggers/routes
    likes          INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Post likes (per-user, prevents double-liking) ───────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)   -- composite PK enforces uniqueness
);

-- ─── Comments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
    id         SERIAL PRIMARY KEY,
    post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes (created separately so they survive re-runs) ─────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_user_id        ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at     ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id     ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at  ON comments(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id   ON post_likes(post_id);

-- ─── Guidelines ──────────────────────────────────────────────────────────────
-- Stores curated evidence-based medical guidelines, grouped by specialty.
-- Seed data is inserted automatically by routes/guidelines.js on first run.
CREATE TABLE IF NOT EXISTS guidelines (
    id               SERIAL PRIMARY KEY,
    title            TEXT NOT NULL,
    specialty        VARCHAR(100) NOT NULL,   -- 'Cardiovascular', 'Neurology', etc.
    source           VARCHAR(200) DEFAULT '', -- e.g. 'AHA/ACC 2024', 'WHO'
    summary          TEXT DEFAULT '',         -- one-line description shown in cards
    tags             TEXT[] DEFAULT '{}',
    bookmark_count   INTEGER DEFAULT 0,
    community_recs   INTEGER DEFAULT 0,
    published_at     TIMESTAMPTZ DEFAULT NOW(),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guidelines_specialty   ON guidelines(specialty);
CREATE INDEX IF NOT EXISTS idx_guidelines_published   ON guidelines(published_at DESC);
