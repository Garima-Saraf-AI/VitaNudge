# 🌿 NutriTrack

**Full-stack diabetic-friendly vegetarian meal tracker**

Built with: Node.js + Express + SQLite (backend) · React + Vite (frontend)

---

## Features

- **Meal logging** — search food library, enter quantity + unit, live macro preview
- **Smart serving calc** — egg whites per piece, paneer per 100g, milk per 100ml — all correctly stored
- **AI label scanner** — photograph any nutrition label, Claude reads it server-side
- **Water tracker** — glass taps, ml buttons, 7-day chart
- **Blood glucose log** — fasting / post-meal, zones, trend chart
- **Weekly dashboard** — 4 charts, streaks, avg macros
- **45 pre-loaded foods** — all corrected per base unit
- **Auth** — JWT login/register, per-user data

---

## Requirements

- Node.js **v18 or higher** — https://nodejs.org
- npm (comes with Node)
- An **Anthropic API key** (only needed for label scanning) — https://console.anthropic.com

---

## Quick Start

### 1. Clone / download the project

```bash
# If you have git:
git clone <your-repo-url>
cd nutritrack

# Or just extract the zip and cd into it
```

### 2. Run setup (installs everything + seeds DB)

```bash
bash setup.sh
```

### 3. Add your Anthropic API key (for scanning)

Edit `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

### 4. Start backend

```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### 5. Start frontend (new terminal tab)

```bash
cd frontend
npm run dev
# Opens http://localhost:3000
```

### 6. Open app

Go to **http://localhost:3000** — register an account and start tracking.

---

## Project Structure

```
nutritrack/
├── backend/
│   ├── server.js              # Express entry point
│   ├── .env                   # Config (API keys, port)
│   ├── database/
│   │   ├── init.js            # Create all tables
│   │   ├── seed.js            # Insert 45 default foods
│   │   ├── db.js              # SQLite connection singleton
│   │   └── nutritrack.db      # Generated on first run
│   ├── middleware/
│   │   └── auth.js            # JWT auth middleware
│   └── routes/
│       ├── auth.js            # Register, login, profile
│       ├── foods.js           # Food library CRUD
│       ├── meals.js           # Meal log CRUD
│       ├── health.js          # Water, glucose, goals, summary
│       └── scan.js            # AI label scan (Anthropic API)
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            # Routes + nav
│       ├── styles/global.css
│       ├── hooks/
│       │   └── useAuth.jsx    # Auth context
│       ├── utils/
│       │   ├── api.js         # Axios client
│       │   └── calc.js        # Serving calc, date utils
│       ├── components/
│       │   ├── FoodSearch.jsx # Search dropdown + qty controls
│       │   └── LogModal.jsx   # Library log modal
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Tracker.jsx    # Main daily log
│           ├── ScanAdd.jsx    # AI scan + manual food entry
│           ├── Library.jsx    # Food library
│           ├── Water.jsx      # Water tracker
│           ├── Glucose.jsx    # Blood glucose log
│           ├── Weekly.jsx     # 7-day charts
│           └── Goals.jsx      # Targets + profile
│
└── setup.sh                   # One-command setup
```

---

## Database (SQLite)

All data stored in `backend/database/nutritrack.db` — a single file, no server needed.

| Table         | Purpose |
|---------------|---------|
| `users`       | Accounts (hashed passwords) |
| `goals`       | Per-user macro targets |
| `foods`       | Library — 45 defaults + user custom |
| `meal_logs`   | Daily food entries with macros |
| `water_logs`  | Water intake entries |
| `glucose_logs`| Blood glucose readings |
| `scan_cache`  | (Reserved) scan history |

---

## Serving Size Logic (the key fix)

Every food is stored per its **natural base unit**:

| Food          | Base unit     | How to log 5 whites |
|---------------|---------------|---------------------|
| Egg white     | 1 piece (33g) | qty=5, unit=piece → ×5 |
| Paneer        | 100g          | qty=80, unit=g → ×0.8 |
| Multigrain roti | 1 roti (30g)| qty=3, unit=piece → ×3 |
| Low-fat milk  | 100ml         | qty=250, unit=ml → ×2.5 |
| Almonds       | 1 nut (1.2g)  | qty=10, unit=piece → ×10 |

---

## API Endpoints

### Auth
```
POST /api/auth/register   { name, email, password }
POST /api/auth/login      { email, password }
GET  /api/auth/me
PUT  /api/auth/profile    { name, age, weight_kg, height_cm, condition }
```

### Foods
```
GET    /api/foods?search=&category=&sort=
POST   /api/foods
PUT    /api/foods/:id
DELETE /api/foods/:id
```

### Meals
```
GET    /api/meals?date=YYYY-MM-DD
GET    /api/meals/range?from=&to=
POST   /api/meals   { food_id, food_name, meal_type, log_date, qty, unit, amt_label }
DELETE /api/meals/:id
```

### Health
```
GET  /api/health/summary?date=
GET  /api/health/water?date=
POST /api/health/water     { ml, log_date }
DELETE /api/health/water/:id
GET  /api/health/water/range?from=&to=
GET  /api/health/glucose?date=
POST /api/health/glucose   { value_mgdl, timing, log_date }
DELETE /api/health/glucose/:id
GET  /api/health/glucose/range?from=&to=
GET  /api/health/goals
PUT  /api/health/goals     { cal, protein_g, fiber_g, carbs_g, water_ml }
```

### Scan
```
POST /api/scan   { imageBase64, mediaType }
```

---

## Production Build

```bash
# Build frontend
cd frontend && npm run build

# Set env
cd ../backend
echo "NODE_ENV=production" >> .env

# Start (serves frontend + API on port 5000)
npm start
# Open http://localhost:5000
```

---

## Troubleshooting

**Port in use** — change `PORT=` in `backend/.env`

**Scan not working** — check `ANTHROPIC_API_KEY` is set correctly in `backend/.env`

**DB reset** — delete `backend/database/nutritrack.db` and restart backend

**CORS error** — make sure both servers are running; frontend dev server proxies `/api` to backend automatically
