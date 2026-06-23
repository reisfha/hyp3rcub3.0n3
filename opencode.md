# Hyp3rCub3.0n3 — Project Context

## Stack
- **Frontend**: React 18 + Vite 5 + React Router 6, neon CSS theme
- **Backend** (dev): Express 4 + passport + neDB (local), runs on :3001
- **Backend** (prod): Cloudflare Pages Functions (functions/[[path]].js), D1 database
- **Deploy**: Git push to `main` → Cloudflare Pages auto-builds + deploys

## Current State
- Live at `https://hyp3rcub3-0n3.pages.dev`
- Git remote: `https://github.com/reisfha/hyp3rcub3.0n3`
- D1 DB: `hyp3rcube` (id: `d8412166-8d72-4224-8c46-497cb5d5e410`), binding name `DB`
- JWT_SECRET: `hyp3rcube-jwt-secret-production-2026`
- Account ID: `cc65bf6d96102ed06b566d64063fe2b1`
- CF API token: stored as PAGES_API_TOKEN / cfat token
- **D1 binding must be re-added after any Pages reconfig** via API PATCH: `{"deployment_configs":{"production":{"d1_databases":{"DB":{"id":"d8412166-8d72-4224-8c46-497cb5d5e410"}}},"preview":{"same"}}}`

## Running Locally
```
npm install && npm run dev        # Express :3001 + Vite :5173
npm run build                     # Build client → client/dist/
npm start                         # Express only, serves built client
```

## Schema (7 tables in D1)
`users` (id, username, email, password_hash, role, created_at)
`games` (id, title, slug, description, category, tags, embed_url, built_in, built_in_component, thumbnail, featured, plays, rating_sum, rating_count, created_at)
`ratings` (user_id, game_id, score) — unique per user+game
`scores` (id, user_id, game_id, score, created_at)
`favorites` (id, user_id, game_id) — unique per user+game
`game_requests` (id, url, title, description, status, submitted_by, admin_notes, created_at)
`broken_reports` (id, game_id, game_title, game_slug, reported_by, description, resolved, created_at)

## Key Architecture

### Routing (functions/[[path]].js)
1. Static asset check via `env.ASSETS.fetch(url)` — serve file if 200
2. SPA fallback: return `index.html` for non-API, non-file paths
3. API routes defined as `if (path === '/api/...')` blocks before slug handler
4. Slug handler: catches `/games/X` paths to serve game pages

### API Endpoints
- `POST /api/auth/register` / `POST /api/auth/login` / `GET /api/auth/me`
- `GET /api/games` — paginated (30/page), search, category filter, sort (rating/plays/title/newest)
- `GET /api/games/:slug` — single game
- `POST /api/games/:slug/play` — increment play count
- `POST /api/games/:slug/rate` — rate 1-5
- `POST /api/games/:slug/favorite` / `DELETE /api/games/:slug/favorite`
- `GET /api/games/:slug/scores` / `POST /api/games/:slug/scores`
- `POST /api/games/report-broken` — report broken game
- `POST /api/games/request` — submit game URL request (auto-fetches title)
- `GET /api/nebula/catalog` — NEBULA CDN catalog (capped at 500), with auto-generated SVG thumbnails
- `GET /api/nebula/categories` — NEBULA CDN categories
- `GET /api/categories` — unique categories from games table
- `GET /api/leaderboard/:slug` / `GET /api/leaderboard`
- `GET /api/favorites` — user's favorites
- `GET /api/admin/stats` / `GET /api/admin/games` / `POST /api/admin/games` / `PUT/DELETE /api/admin/games/:id`
- `GET /api/admin/users` / `PUT/DELETE /api/admin/users/:id`
- `GET /api/admin/requests` / `POST /api/admin/requests/:id/approve` / `DELETE /api/admin/requests/:id`
- `GET /api/admin/broken-reports` / `POST /api/admin/broken-reports/:id/resolve` / `DELETE /api/admin/broken-reports/:id`

### Login
Username-based (not email). JWT stored in localStorage. Admin role check for admin routes.

### Thumbnails
- D1 games: manually assigned `thumbnail` URLs (67 games, 52 with real cover images + 15 from web)
- NEBULA games: auto-generated SVG data URIs with category-based gradient colors + first letter watermark + title
- Fallback: Google favicon service for external URLs, then first-letter placeholder

### Client Pages
- `/` — catalog (search, filter, sort, paginated grid)
- `/game/:slug` — game detail (iframe embed, rating, scores, favorites, report broken)
- `/request` — game request submission
- `/login` — username/password login
- `/admin` — admin dashboard (Games, Users, Stats, Requests, Broken tabs)
- NEBULA CDN catalog accessible via toggle button on catalog page

### NEBULA CDN
- Source: `https://github.com/GoatTech-42/NEBULA-CDN` (2790 games)
- Served from `client/public/games/games.json` + HTML files via CDN
- Catalog capped at 500, 48 per page, with category filter + search

### Express Server Routes
- `server/server.js` — Express app setup, session, passport, routes
- `server/routes/games.js` — game CRUD, ratings, scores, favorites, requests, broken reports
- `server/routes/admin.js` — admin management endpoints
- `server/routes/nebula.js` — NEBULA CDN catalog + categories (with SVG thumbnail generation)
- `server/routes/auth.js` — register/login with bcrypt + JWT

### Client Structure
```
client/src/
├── api/client.js          — axios API client
├── App.jsx                — router setup
├── components/
│   ├── Navbar.jsx
│   ├── GameCard.jsx       — card with thumbnail logic
│   ├── SearchBar.jsx
│   ├── CategoryFilter.jsx
│   ├── NebulaCatalog.jsx
│   └── FullscreenButton.jsx
├── context/AuthContext.jsx
├── pages/
│   ├── Catalog.jsx
│   ├── GamePage.jsx
│   ├── Login.jsx
│   ├── RequestGame.jsx
│   └── Admin.jsx
├── games/                 — built-in game components
└── styles/neon.css        — theme + component styles
```

### SPA Routing
Cloudflare Function: `ASSETS.fetch()` first → if 404, return `index.html` for SPA routes. API paths never get SPA fallback.

## Last Deploy Issue
D1 binding `DB` was dropped from Pages project (cause unknown). Fixed via API PATCH adding `d1_databases` to both production and preview deployment configs, then pushed empty commit to trigger redeploy.
