# VitaNudge $0 Deployment Setup

Goal: deploy the hosted PWA with Netlify Free, Render Free, and Neon Free.

## Current Status

- Frontend is ready to accept a production API URL through `VITE_API_URL`.
- Netlify SPA routing config has been added in `netlify.toml`.
- Environment examples have been added for frontend and backend.
- Neon migration is still the main remaining technical step before a reliable hosted backend.

## 1. Netlify Frontend

Use these settings in Netlify:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable:
  - `VITE_API_URL=https://your-render-backend.onrender.com/api`

Do this after Render gives the backend URL.

Expected result:

- `https://your-site.netlify.app/login` loads directly.
- Refreshing `/login`, `/scan`, `/report`, and `/recipes` does not show a 404.
- Browser title shows `VitaNudge - Small nudges. Big results.`

## 2. Render Backend

Use these settings in Render:

- Service type: Web Service
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment: Node
- Plan: Free

Environment variables:

- `NODE_ENV=production`
- `PORT=5001` or leave unset if Render provides its own port
- `FRONTEND_URL=https://your-site.netlify.app`
- `JWT_SECRET=<long random value>`
- `DATABASE_URL=<Neon connection string after database migration>`
- `WEEKLY_EMAIL_SCHEDULER=off`
- `SUPPORT_EMAIL=support.vitanudge@gmail.com`

Optional for beta:

- `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`

Expected result:

- `https://your-render-backend.onrender.com/api/ping` returns JSON.
- Netlify app can register/login without CORS errors.

## 3. Neon Database

Use Neon Free for hosted Postgres.

Needed later:

- Create Neon project.
- Copy the pooled connection string.
- Add it to Render as `DATABASE_URL`.
- Migrate schema/data from SQLite to Postgres.
- Update backend database layer to use Postgres in production.

Do not paste the Neon password into chat or docs.

## 4. Local Testing Commands

Backend:

```bash
npm --prefix backend run dev
```

Frontend:

```bash
npm --prefix frontend run dev -- --host 0.0.0.0
```

Frontend build:

```bash
npm --prefix frontend run test:build
```

Backend regression:

```bash
npm --prefix backend run test:regression
```

## 5. Go / No-Go For Hosted MVP

Go when:

- Netlify frontend loads over HTTPS.
- Render backend health check works.
- Netlify can call Render without CORS errors.
- Registration and login work.
- Data persists after backend restart.
- Mobile browser testing passes on iPhone Safari and Android Chrome.

No-go when:

- Database still loses hosted data after restart.
- Routes 404 on refresh.
- CORS blocks API calls.
- Login/register fails.
- The app depends on localhost.

