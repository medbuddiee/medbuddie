# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MedBuddie is a healthcare social platform connecting patients and physicians. It uses a split client/server architecture with a React frontend and Express backend.

## Development Commands

### Setup
```bash
# Install all dependencies
npm run install:all

# Or individually
npm install --prefix server
npm install --prefix client
```

### Running the App
```bash
# Backend (from repo root or server/)
npm run dev --prefix server        # nodemon hot-reload on port 5000
npm start --prefix server          # production mode

# Frontend (from repo root or client/)
npm run dev --prefix client        # Vite dev server on port 5173
```

Both must run simultaneously in development. The Vite dev server proxies `/api/*` requests to `http://localhost:5000`.

### Testing
```bash
# Backend (Jest)
npm test --prefix server           # run once
npm run test:watch --prefix server # watch mode

# Frontend (Vitest)
npm test --prefix client           # run once
npm run test:watch --prefix client # watch mode
```

### Linting & Building
```bash
npm run lint --prefix client       # ESLint (React hooks + refresh plugins)
npm run build --prefix client      # Vite production build → client/dist/
npm run build                      # Root alias: installs client deps + builds
```

### Database
```bash
# Initialize schema (run from server/)
node -e "require('./config/db'); require('fs').readFileSync('./schema.sql','utf8').split(';').filter(s=>s.trim()).forEach(async s => { try { await require('./config/db').query(s) } catch(e){} })"

# Seed sample data
node seed.js                       # run from server/
```

## Environment Variables

Copy `server/.env.example` to `server/.env`. Required variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string (used on Railway) |
| `DB_HOST/PORT/USER/PASSWORD/NAME` | Individual DB fields (used locally instead of DATABASE_URL) |
| `JWT_SECRET` | Signs JWT tokens (7-day expiry) |
| `GOOGLE_CLIENT_ID` | Google OAuth app credential |
| `PORT` | Server port (defaults to 5000) |
| `ALLOWED_ORIGINS` | Comma-separated extra CORS origins |
| `RAILWAY_PUBLIC_DOMAIN` | Auto-added to CORS allowlist on Railway |
| `FB_APP_ID/FB_APP_SECRET/FB_REDIRECT_URI` | Facebook OAuth (optional) |

## Architecture

### Directory Layout
```
medbuddie/
├── client/              # React 19 + Vite 7 frontend
│   └── src/
│       ├── App.jsx          # Route definitions + PrivateRoute guards
│       ├── main.jsx         # Entry; wraps app in UserProvider
│       ├── context/
│       │   └── UserContext.jsx  # Global auth state (user, login(), logout())
│       └── components/
│           ├── Dashboard/       # Three-column feed layout
│           ├── Profile/         # User profiles
│           ├── DoctorDashboard/ # Physician workspace
│           └── ...              # Communities, Guidelines, SecondOpinion, etc.
├── server/              # Express 4 backend
│   ├── index.js             # App entry: helmet, rate-limit, CORS, route mounts, DB migrations
│   ├── schema.sql           # PostgreSQL DDL (run on startup)
│   ├── config/db.js         # pg Pool (supports DATABASE_URL or individual vars)
│   ├── middleware/auth.js   # authenticate() and softAuthenticate()
│   ├── routes/              # One file per domain (auth, posts, profile, etc.)
│   ├── guidelineContent.js  # Static embedded guidelines data
│   └── uploads/             # Multer avatar/file storage
├── railway.toml
└── nixpacks.toml
```

### Auth Flow
- JWT tokens (`{ id, email, name }`, 7-day expiry) are issued on signup/login and stored in `localStorage` as `"token"`.
- Sent in requests via `Authorization: Bearer <token>`.
- Two middleware variants: `authenticate` (hard-requires JWT) and `softAuthenticate` (gracefully continues if absent).
- Google OAuth: frontend sends Google ID token → server verifies via `google-auth-library` → upserts user → returns JWT.
- Passwords hashed with bcrypt (10 rounds).

### Database
- PostgreSQL with raw SQL via the `pg` Pool — no ORM.
- Schema migrations run automatically when `server/index.js` starts (reads `schema.sql`).
- Key tables: `users`, `posts`, `post_likes`, `comments`, `guidelines`, `user_guideline_bookmarks`, `second_opinions`, `user_followers`, `communities`, `community_members`, `consultations`, `consultation_messages`.
- User health metrics stored as strings; medications stored as JSONB (`[{ name, frequency }]`).
- Doctor fields on the `users` table: `is_doctor`, `doctor_specialties[]`, `npi_number`, `is_verified_doctor`, `doctor_bio`, `years_experience`.

### API Design
- All backend routes are prefixed `/api/`.
- Routes are mounted in `server/index.js` and implemented in `server/routes/`.
- In production, Express serves the Vite build from `client/dist/` and falls back to `index.html` for client-side routing.
- NPI verification hits the live NPPES federal registry from `server/routes/npi.js`.

### Frontend State
- `UserContext` (React Context) holds the logged-in user object and exposes `login(user, token)` / `logout()`.
- Both `user` and `token` are persisted to `localStorage` and rehydrated on page load.
- `PrivateRoute` in `App.jsx` redirects unauthenticated users to `/signin`.

## Mobile App (Expo / React Native)

Lives in `mobile/` — completely separate from `client/`. Both share the same `server/` backend.

### Running
```bash
# From mobile/ or repo root
npm run mobile           # Opens Expo CLI (scan QR with Expo Go app)
npm run mobile:ios       # iOS Simulator
npm run mobile:android   # Android Emulator
```

### Setup
```bash
cp mobile/.env.example mobile/.env
# Set EXPO_PUBLIC_API_URL to your machine's LAN IP for local dev
# e.g. EXPO_PUBLIC_API_URL=http://192.168.1.42:5000
# Find your IP: ipconfig getifaddr en0
npm install --prefix mobile
```

### Architecture
- **Routing**: Expo Router (file-based, same mental model as Next.js)
  - `app/(auth)/` — sign-in, sign-up stack
  - `app/(tabs)/` — five-tab layout: feed, guidelines, communities, medbuddies, profile
  - `app/guideline/[id].jsx`, `app/community/[id].jsx` — detail screens
  - `app/second-opinion.jsx`, `app/edit-profile.jsx` — modal/stack screens
- **Auth storage**: `expo-secure-store` instead of `localStorage` (same JWT, different store)
- **API**: `mobile/utils/api.js` — `apiFetch()` auto-attaches `Authorization` header from SecureStore; base URL from `EXPO_PUBLIC_API_URL`
- **Icons**: `@expo/vector-icons` (Ionicons, MaterialIcons, etc.) — replaces `react-icons`
- **No CSS**: all styles via `StyleSheet.create()` — no HTML/CSS anywhere in `mobile/`

### Key difference from web
`EXPO_PUBLIC_*` env vars are inlined at Metro bundle time. For local development on a physical device, `localhost` won't route to your machine — you must use the LAN IP address in `EXPO_PUBLIC_API_URL`.

## Deployment

Deployed to [Railway](https://railway.app). The root `package.json` `build` and `start` scripts are the Railway entry points: build compiles the React app, then the Express server serves it from `client/dist/`.
