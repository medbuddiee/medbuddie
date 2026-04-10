-- MedBuddie Database Schema
-- Run once to initialise the database:
--   psql -U <user> -d <database> -f schema.sql

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
    -- Health metrics
    weight        VARCHAR(30),
    height        VARCHAR(30),
    bmi           VARCHAR(20),
    blood_pressure VARCHAR(40),
    hba1c         VARCHAR(20),
    lipid_panel   VARCHAR(40),
    -- Medications stored as a JSON array: [{ name, frequency }]
    medications   JSONB DEFAULT '[]'::jsonb,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Posts ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content        TEXT NOT NULL,
    -- 'personal' | 'medical_opinion'
    type           VARCHAR(30) DEFAULT 'personal',
    -- e.g. ['#Cardiology', '#Recovery']
    tags           TEXT[] DEFAULT '{}',
    likes          INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Comments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
    id         SERIAL PRIMARY KEY,
    post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seed sample posts (optional — remove for production) ────────────────────
-- INSERT INTO users (name, email, password, username)
-- VALUES ('Jane Doe', 'jane@example.com', '', 'janedoe')
-- ON CONFLICT DO NOTHING;
