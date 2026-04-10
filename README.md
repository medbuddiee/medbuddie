# MedBuddie

A healthcare social platform where patients and physicians connect, share health information, track personal health data, and seek second opinions.

---

## App Composition

```
medbuddie/
├── client/          # React + Vite frontend (port 5173)
└── server/          # Express.js + PostgreSQL backend (port 5000)
```

### Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `HomePage` | Landing page with feature overview |
| `/signin` | `SignIn` | Login with email/password or social auth |
| `/signup` | `SignUp` | Registration with DOB and caregiver option |
| `/dashboard` | `Dashboard` | Main feed (protected — requires login) |
| `/profile` | `ProfilePage` | View health overview, activity, diet, medications |
| `/edit-profile` | `EditProfilePage` | Edit personal info, health data, medications |

### Dashboard Layout (three-column)

```
+-------------------------------------------------------------+
|                         Top Nav                              |
+--------------+-------------------------+--------------------+
|   Sidebar    |      Health Feed        |   Right Sidebar    |
|              |                         |                    |
| Health Feed  |  Post creation box      | Current Guidelines |
| Guidelines   |  Health Feed posts      | Top Articles       |
| Articles     |  (physician filter)     | Private Messages   |
| MedBuddies   |                         | MedBuddies         |
| Following    |                         | Personal Stats     |
| Communities  |                         |                    |
| 2nd Opinion  |                         |                    |
| ------------ |                         |                    |
| Stats        |                         |                    |
| Activity     |                         |                    |
| Diet         |                         |                    |
| Medications  |                         |                    |
+--------------+-------------------------+--------------------+
```

### Backend API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/signup` | — | Register new user |
| `POST` | `/api/login` | — | Login, returns JWT |
| `POST` | `/api/google-login` | — | Google OAuth token exchange |
| `POST` | `/api/auth/facebook` | — | Facebook OAuth code exchange |
| `GET` | `/api/profile` | JWT or `?userId=` | Get user profile |
| `PUT` | `/api/profile` | — | Update profile & medications |
| `GET` | `/api/posts` | — | Paginated health feed posts |
| `POST` | `/api/posts` | JWT | Create a new post |
| `POST` | `/api/posts/:id/like` | JWT | Like a post |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, React Router 7, React Icons |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL (via `pg`) |
| Auth | bcrypt passwords + JWT (7-day tokens) |
| OAuth | Google OAuth 2.0, Facebook OAuth |

---

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14
- A PostgreSQL database named `medbuddie` (or any name you set in `.env`)

---

## Setup & Running

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd medbuddie

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment variables

```bash
cd server
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=medbuddie
PORT=5000

JWT_SECRET=replace_with_a_long_random_string

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
FB_APP_ID=your_facebook_app_id
FB_APP_SECRET=your_facebook_app_secret
FB_REDIRECT_URI=http://localhost:3000/facebook-callback
```

### 3. Initialise the database

```bash
# Create the database (if it does not exist yet)
createdb medbuddie

# Run the schema
psql -U postgres -d medbuddie -f server/schema.sql
```

### 4. Start the servers

Open **two** terminal windows:

```bash
# Terminal 1 — backend
cd server
npm run dev        # uses nodemon for hot-reload
# Server running at http://localhost:5000

# Terminal 2 — frontend
cd client
npm run dev
# App running at http://localhost:5173
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:5000`, so no CORS issues during development.

---

## Development Notes

### Folder structure (client)

```
client/src/
+-- App.jsx                          # Routes + PrivateRoute guard
+-- main.jsx                         # React entry point
+-- context/
|   +-- UserContext.jsx              # Global user state (login, logout, updateUser)
+-- components/
    +-- HomePage.jsx / .css          # Landing page
    +-- SignIn.jsx / .css            # Login page
    +-- SignUp.jsx / .css            # Registration page
    +-- Dashboard/
    |   +-- Dashboard.jsx            # Layout wrapper
    |   +-- TopNav.jsx               # Top navigation bar
    |   +-- Sidebar.jsx              # Left navigation
    |   +-- Feed.jsx                 # Health feed + post creation
    |   +-- PostCard.jsx             # Individual post card
    |   +-- RightSidebar.jsx         # Articles, buddies, personal stats
    |   +-- Dashboard.css
    +-- Profile/
        +-- ProfilePage.jsx          # View profile (Health Overview, Activity, Diet, Meds)
        +-- EditProfilePage.jsx      # Edit profile (health data + medications)
        +-- Profile.css
```

### Folder structure (server)

```
server/
+-- index.js        # All routes and Express app
+-- schema.sql      # Database schema — run once to initialise
+-- .env.example    # Environment variable template
+-- config/
|   +-- db.js       # (stub)
+-- routes/
    +-- auth.js     # (stub)
    +-- profile.js  # (stub)
```

---

## Key Features

- **Authentication** — Email/password with bcrypt, JWT tokens (7-day expiry), Google OAuth upsert
- **Health Profile** — Weight, height, BMI, blood pressure, HbA1c %, lipid panel, medications list
- **Health Feed** — Create and browse medical opinion and personal health posts; like posts
- **Physician Filter** — Toggle to show only physician-tagged content in the feed
- **Activity & Diet Summary** — Steps, calories burned, workout time; macronutrient breakdown and intermittent fasting window
- **Medications Tracker** — Medications with daily timestamps on profile view
- **MedBuddies** — Social connections shown in sidebar and right panel
- **Second Opinions** — Dedicated tab on profile for physician feedback requests

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | Yes | PostgreSQL port (default 5432) |
| `DB_USER` | Yes | PostgreSQL username |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `DB_NAME` | Yes | Database name |
| `PORT` | No | Server port (default 5000) |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `GOOGLE_CLIENT_ID` | For Google OAuth | OAuth 2.0 client ID from Google Cloud Console |
| `FB_APP_ID` | For Facebook OAuth | App ID from Meta Developer Portal |
| `FB_APP_SECRET` | For Facebook OAuth | App Secret from Meta Developer Portal |
| `FB_REDIRECT_URI` | For Facebook OAuth | Callback URL registered in your Facebook app |
