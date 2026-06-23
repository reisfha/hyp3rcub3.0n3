# Hyp3rCub3.0n3

Unblocked games portal — browse, play, and rate browser games.

## Run without npm

### Play individual games (nothing required)

Open any file in `client/dist/games/` directly in your browser:

```sh
open client/dist/games/slope.html
```

35 standalone games available including Slope, Run 3, Cookie Clicker, Subway Surfers, and more.

### Full site with Node.js only (no npm commands)

Dependencies are pre-installed (`node_modules/` is included). Just start the server:

```sh
node server/server.js
```

Opens at `http://localhost:3001` — both the frontend and API work.

### Frontend only with Python (no Node.js at all)

Serve the pre-built frontend with Python's built-in HTTP server:

```sh
python3 -m http.server 8080 -d client/dist && open localhost:8080
```

Auto-Opens at `http://localhost:8080` — the UI loads but API features (login, ratings, leaderboards) won't work since there's no backend.

## Full development setup

```sh
npm install && npm run dev
```

Runs Express backend on `:3001` and Vite dev server on `:5173` with hot reload.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Server + client dev mode |
| `npm run build` | Build client for production |
| `npm start` | Production server |
| `npm run seed` | Seed database with games |
