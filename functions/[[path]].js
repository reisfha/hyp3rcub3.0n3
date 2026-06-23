const JWT_SECRET = globalThis.JWT_SECRET || 'hyp3rcube-jwt-secret';

async function signJWT(payload) {
  const enc = new TextEncoder();
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, iat: Date.now() }));
  const key = await crypto.subtle.importKey('raw', enc.encode(JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`)))));
  return `${header}.${body}.${sig}`;
}

async function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0)), enc.encode(`${parts[0]}.${parts[1]}`));
    if (!valid) return null;
    return JSON.parse(atob(parts[1]));
  } catch { return null; }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function uid() { return crypto.randomUUID().slice(0, 16); }

const CATEGORY_COLORS = {
  'Other': '#6c5ce7',
  'Pokemon': '#ef4444',
  'Platformer': '#f59e0b',
  'Mario': '#ef4444',
  'Sonic': '#3b82f6',
  'Racing': '#10b981',
  'Strategy': '#8b5cf6',
  'Fighting': '#ef4444',
  'Sports': '#10b981',
  'Shooter': '#ec4899',
  'Horror': '#1e293b',
  'Puzzle': '#f59e0b',
  'Minecraft': '#22c55e',
  'Zelda': '#f59e0b',
  'RPG': '#8b5cf6',
  'Simulation': '#06b6d4',
};

function svgThumbnail(title, category) {
  const color = CATEGORY_COLORS[category] || '#6c5ce7';
  const initial = (title || '?')[0].toUpperCase();
  const escaped = (title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${color}dd"/>
    </linearGradient></defs>
    <rect width="320" height="180" fill="url(#g)" rx="8"/>
    <text x="160" y="85" text-anchor="middle" dominant-baseline="central" font-family="system-ui" font-size="72" font-weight="bold" fill="rgba(255,255,255,0.15)" letter-spacing="4">${initial}</text>
    <text x="160" y="140" text-anchor="middle" font-family="system-ui" font-size="13" fill="rgba(255,255,255,0.9)">${escaped}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function getSlug(path) {
  const parts = path.split('/');
  const idx = parts.indexOf('games');
  if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  return null;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const db = env.DB;

  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const user = token ? await verifyJWT(token) : null;

  const body = method === 'POST' || method === 'PUT' ? await request.json().catch(() => ({})) : {};

  async function seed() {
    const exists = await db.prepare('SELECT COUNT(*) as c FROM games').first();
    if (exists.c > 0) return;

    async function fetchGames() {
      const r = await fetch(new URL('/games/games.json', url));
      return r.json().catch(() => ({ games: [] }));
    }

    const nebulaGames = await fetchGames();

    const seedGames = [
      { title: '2048', slug: '2048', description: 'Merge tiles to reach 2048', category: 'Puzzle', tags: '["puzzle","numbers","classic"]', builtIn: 1, builtInComponent: 'Game2048', featured: 1 },
      { title: 'Snake', slug: 'snake', description: 'Classic snake game', category: 'Classic', tags: '["classic","arcade"]', builtIn: 1, builtInComponent: 'SnakeGame' },
      { title: 'Breakout', slug: 'breakout', description: 'Break all the bricks', category: 'Classic', tags: '["classic","arcade"]', builtIn: 1, builtInComponent: 'BreakoutGame' },
      { title: 'Tetris', slug: 'tetris', description: 'Classic block-stacking puzzle', category: 'Puzzle', tags: '["puzzle","classic","blocks"]', builtIn: 1, builtInComponent: 'TetrisGame', featured: 1 },
      { title: 'Flappy Bird', slug: 'flappy-bird', description: 'Tap to fly through pipes', category: 'Classic', tags: '["classic","arcade"]', builtIn: 1, builtInComponent: 'FlappyBirdGame' },
      { title: 'Pac-Man', slug: 'pac-man', description: 'Eat dots and avoid ghosts', category: 'Classic', tags: '["classic","arcade","maze"]', builtIn: 1, builtInComponent: 'PacmanGame', featured: 1 },
      { title: 'Dino Game', slug: 'dino-game', description: 'Chrome dinosaur', category: 'Classic', tags: '["classic","dinosaur","endless"]', builtIn: 1, builtInComponent: 'DinoGame' },
      { title: 'Asteroids', slug: 'asteroids', description: 'Shoot asteroids', category: 'Classic', tags: '["classic","arcade","space"]', builtIn: 1, builtInComponent: 'AsteroidsGame' },
      { title: 'Pong', slug: 'pong', description: 'Classic two-player paddle battle', category: 'Classic', tags: '["classic","arcade","paddle"]', builtIn: 1, builtInComponent: 'PongGame' },
      { title: 'Space Invaders', slug: 'space-invaders', description: 'Defend Earth from aliens', category: 'Classic', tags: '["classic","arcade","space"]', builtIn: 1, builtInComponent: 'SpaceInvadersGame' },
      { title: 'Minesweeper', slug: 'minesweeper', description: 'Find the mines', category: 'Puzzle', tags: '["puzzle","classic","mines"]', builtIn: 1, builtInComponent: 'MinesweeperGame' },
      { title: 'Cookie Clicker', slug: 'cookie-clicker', description: 'Click cookies. Buy upgrades.', category: 'Idle', tags: '["idle","clicker","cookie"]', embedUrl: 'https://orteil.dashnet.org/cookieclicker/', featured: 1 },
      { title: 'Subway Surfers Barcelona', slug: 'subway-surfers', description: 'Endless runner — dodge trains', category: 'Endless Runner', tags: '["runner","3d","popular"]', embedUrl: '/games/subwaysurfersbarcelona.html', featured: 1 },
      { title: 'Subway Surfers Miami', slug: 'subway-surfers-miami', description: 'Endless runner — dash through Miami!', category: 'Endless Runner', tags: '["runner","3d","popular"]', embedUrl: '/games/subwaysurfersmiami.html' },
      { title: 'Temple Run 2', slug: 'temple-run-2', description: 'Escape the temple', category: 'Endless Runner', tags: '["runner","3d","popular"]', embedUrl: '/games/templerun2.html', featured: 1 },
      { title: 'Moto X3M', slug: 'moto-x3m', description: 'Stunt bike racing', category: 'Racing', tags: '["racing","stunts","bike"]', embedUrl: '/games/motox3mm.html', featured: 1 },
      { title: 'Slope', slug: 'slope', description: 'Roll a ball down a 3D slope', category: 'Endless Runner', tags: '["3d","ball","speed"]', embedUrl: '/games/slope.html', featured: 1 },
      { title: '1v1 LOL', slug: '1v1-lol', description: 'Build battle shooter', category: 'Shooter', tags: '["fps","battle","build"]', embedUrl: '/games/1v1lol.html' },
      { title: 'Among Us', slug: 'among-us', description: 'Find the imposter', category: 'Multiplayer', tags: '["imposter","social","deduction"]', embedUrl: '/games/amongus.html' },
      { title: '8 Ball Pool', slug: '8-ball-pool', description: 'Classic pool/billiards', category: 'Sports', tags: '["pool","billiards","sports"]', embedUrl: '/games/8ballpool.html' },
      { title: 'Drive Mad', slug: 'drive-mad', description: 'Drive through wild obstacle courses', category: 'Racing', tags: '["racing","driving","obstacle"]', embedUrl: 'https://games.crazygames.com/en_US/drive-mad/index.html' },
      { title: 'Basket Random', slug: 'basket-random', description: 'Random physics basketball', category: 'Sports', tags: '["basketball","physics","funny"]', embedUrl: 'https://games.crazygames.com/en_US/basket-random/index.html', featured: 1 },
      { title: 'Geometry Dash', slug: 'geometry-dash', description: 'Jump through rhythm-based obstacles', category: 'Platformer', tags: '["rhythm","platformer","hard"]', embedUrl: 'https://games.crazygames.com/en_US/geometry-dash/index.html', featured: 1 },
      { title: 'Fireboy and Watergirl', slug: 'fireboy-watergirl', description: 'Escape the temple together', category: 'Platformer', tags: '["co-op","platformer","puzzle"]', embedUrl: 'https://games.crazygames.com/en_US/fireboy-and-watergirl/index.html' },
    ];

    const stmt = db.prepare(`INSERT INTO games (id, title, slug, description, category, tags, embed_url, built_in, built_in_component, featured, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`);
    for (const g of seedGames) {
      await stmt.bind(uid(), g.title, g.slug, g.description, g.category, g.tags, g.embedUrl || '', g.builtIn || 0, g.builtInComponent || '', g.featured || 0).run();
    }
  }

  try {
    if (path === '/api/health') {
      return json({ status: 'ok', user: user ? user.username : null });
    }

    if (path === '/api/auth/register' && method === 'POST') {
      const { username, email, password } = body;
      if (!username || !email || !password || password.length < 6) return json({ error: 'Invalid input' }, 400);
      const existing = await db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').bind(email, username).first();
      if (existing) return json({ error: 'Email or username already taken' }, 400);
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const hash = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(email)))));
      const id = uid();
      await db.prepare('INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').bind(id, username, email, hash, 'user').run();
      const jwt = await signJWT({ id, username, email, role: 'user' });
      return json({ token: jwt, user: { id, username, email, role: 'user' } });
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const { username, password } = body;
      const row = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
      if (!row) return json({ error: 'Invalid credentials' }, 401);
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const hash = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(row.email)))));
      if (hash !== row.password_hash) return json({ error: 'Invalid credentials' }, 401);
      const jwt = await signJWT({ id: row.id, username: row.username, email: row.email, role: row.role });
      return json({ token: jwt, user: { id: row.id, username: row.username, email: row.email, role: row.role } });
    }

    if (path === '/api/auth/me') {
      if (!user) return json({ error: 'Not authenticated' }, 401);
      return json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    }

    if (path === '/api/games/featured') {
      const rows = await db.prepare("SELECT * FROM games WHERE featured = 1 ORDER BY plays DESC LIMIT 8").all();
      return json({ games: rows.results.map(formatGame) });
    }

    if (path === '/api/games' && method === 'GET') {
      const search = url.searchParams.get('search') || '';
      const category = url.searchParams.get('category') || '';
      const sort = url.searchParams.get('sort') || 'recent';
      const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);
      const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

      let sql = 'SELECT * FROM games WHERE 1=1';
      const binds = [];
      if (search) { sql += ' AND (title LIKE ? OR slug LIKE ?)'; binds.push(`%${search}%`, `%${search}%`); }
      if (category && category !== 'All') { sql += ' AND category = ?'; binds.push(category); }
      const countRow = await db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*) as c')).bind(...binds).first();
      const total = countRow.c;
      const order = sort === 'popular' ? 'plays DESC' : sort === 'rating' ? 'rating_count DESC' : 'created_at DESC';
      sql += ` ORDER BY ${order} LIMIT ? OFFSET ?`;
      binds.push(limit, (page - 1) * limit);
      const rows = await db.prepare(sql).bind(...binds).all();
      return json({ games: rows.results.map(formatGame), total, page, pages: Math.ceil(total / limit) });
    }

    if (!path.startsWith('/api/')) {
      const response = await context.env.ASSETS.fetch(request);
      if (response.status === 404) {
        return context.env.ASSETS.fetch(new URL('/index.html', url));
      }
      return response;
    }

    if (path === '/api/games/request' && method === 'POST') {
      if (!user) return json({ error: 'Not authenticated' }, 401);
      const { url } = body;
      if (!url) return json({ error: 'URL is required' }, 400);
      const id = uid();
      await db.prepare('INSERT INTO game_requests (id, url, submitted_by, created_at) VALUES (?, ?, ?, ?)').bind(id, url, user.id, new Date().toISOString()).run();
      return json({ success: true, id });
    }

    if (path === '/api/games/report-broken' && method === 'POST') {
      if (!user) return json({ error: 'Not authenticated' }, 401);
      const { game_id, game_title, game_slug, description } = body;
      if (!game_id) return json({ error: 'Game ID is required' }, 400);
      const id = uid();
      await db.prepare('INSERT INTO broken_reports (id, game_id, game_title, game_slug, reported_by, description) VALUES (?, ?, ?, ?, ?, ?)').bind(id, game_id, game_title, game_slug, user.id, description || '').run();
      return json({ success: true, id });
    }

    const gameSlug = getSlug(path);
    if (gameSlug) {
      const slug = gameSlug;

      if (path.endsWith('/rate') && method === 'POST') {
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const { score } = body;
        const game = await db.prepare('SELECT * FROM games WHERE slug = ?').bind(slug).first();
        if (!game) return json({ error: 'Game not found' }, 404);
        await db.prepare('INSERT OR REPLACE INTO ratings (id, user_id, game_id, score) VALUES (?, ?, ?, ?)').bind(uid(), user.id, game.id, score).run();
        const agg = await db.prepare('SELECT COUNT(*) as c, SUM(score) as s FROM ratings WHERE game_id = ?').bind(game.id).first();
        await db.prepare('UPDATE games SET rating_sum = ?, rating_count = ? WHERE id = ?').bind(agg.s || 0, agg.c, game.id).run();
        return json({ success: true });
      }

      if (path.endsWith('/rating')) {
        const game = await db.prepare('SELECT * FROM games WHERE slug = ?').bind(slug).first();
        if (!game) return json({ error: 'Game not found' }, 404);
        const r = await db.prepare('SELECT score FROM ratings WHERE game_id = ? AND user_id = ?').bind(game.id, user?.id || '').first();
        return json({ score: r?.score || 0 });
      }

      if (path.endsWith('/score') && method === 'POST') {
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const { score } = body;
        const game = await db.prepare('SELECT * FROM games WHERE slug = ?').bind(slug).first();
        if (!game) return json({ error: 'Game not found' }, 404);
        await db.prepare('INSERT INTO scores (id, user_id, game_id, score) VALUES (?, ?, ?, ?)').bind(uid(), user.id, game.id, Number(score)).run();
        return json({ success: true });
      }

      if (path.endsWith('/scores')) {
        const game = await db.prepare('SELECT * FROM games WHERE slug = ?').bind(slug).first();
        if (!game) return json({ error: 'Game not found' }, 404);
        const rows = await db.prepare('SELECT s.score, s.created_at, u.username FROM scores s JOIN users u ON u.id = s.user_id WHERE s.game_id = ? ORDER BY s.score DESC LIMIT 50').bind(game.id).all();
        return json({ scores: rows.results });
      }

      if (path.includes('/favorite')) {
        const game = await db.prepare('SELECT * FROM games WHERE slug = ?').bind(slug).first();
        if (!game) return json({ error: 'Game not found' }, 404);

        if (method === 'GET') {
          if (!user) return json({ favorited: false });
          const f = await db.prepare('SELECT id FROM favorites WHERE user_id = ? AND game_id = ?').bind(user.id, game.id).first();
          return json({ favorited: !!f });
        }

        if (!user) return json({ error: 'Not authenticated' }, 401);

        if (method === 'POST') {
          await db.prepare('INSERT OR IGNORE INTO favorites (id, user_id, game_id) VALUES (?, ?, ?)').bind(uid(), user.id, game.id).run();
          return json({ favorited: true });
        }

        if (method === 'DELETE') {
          await db.prepare('DELETE FROM favorites WHERE user_id = ? AND game_id = ?').bind(user.id, game.id).run();
          return json({ favorited: false });
        }
      }

      const game = await db.prepare('SELECT * FROM games WHERE slug = ?').bind(slug).first();
      if (!game) return json({ error: 'Game not found' }, 404);
      await db.prepare('UPDATE games SET plays = plays + 1 WHERE id = ?').bind(game.id).run();
      return json({ game: formatGame({ ...game, plays: game.plays + 1 }) });
    }

    if (path.startsWith('/api/profile')) {
      if (!user) return json({ error: 'Not authenticated' }, 401);
      if (path.endsWith('/favorites')) {
        const rows = await db.prepare('SELECT g.* FROM favorites f JOIN games g ON g.id = f.game_id WHERE f.user_id = ? ORDER BY f.created_at DESC').bind(user.id).all();
        return json({ games: rows.results.map(formatGame) });
      }
    }

    if (path.startsWith('/api/leaderboard')) {
      const slug = path.replace('/api/leaderboard/', '');
      if (slug) {
        const game = await db.prepare('SELECT * FROM games WHERE slug = ?').bind(slug).first();
        if (!game) return json({ error: 'Game not found' }, 404);
        const rows = await db.prepare('SELECT s.score, s.created_at, u.username FROM scores s JOIN users u ON u.id = s.user_id WHERE s.game_id = ? ORDER BY s.score DESC LIMIT 100').bind(game.id).all();
        return json({ scores: rows.results, game: formatGame(game) });
      }
      const rows = await db.prepare('SELECT DISTINCT slug, title FROM games WHERE slug IN (SELECT DISTINCT slug FROM games WHERE built_in = 1)').all();
      return json({ games: rows.results });
    }

    if (path === '/api/nebula/catalog') {
      const nebulaUrl = new URL('/games/games.json', url);
      const r = await fetch(nebulaUrl.toString());
      const catalog = await r.json();
      const search = url.searchParams.get('search') || '';
      const category = url.searchParams.get('category') || '';
      const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
      const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);
      let games = (catalog.games || []).slice(0, 500);
      if (search) { const s = search.toLowerCase(); games = games.filter(g => g.name.toLowerCase().includes(s) || g.tags?.some(t => t.includes(s))); }
      if (category && category !== 'All') { games = games.filter(g => (g.category || 'Other') === category); }
      const total = games.length;
      const start = (page - 1) * limit;
      const paged = games.slice(start, start + limit);
      const stats = { ...catalog.stats, totalGames: 500 };
      return json({
        games: paged.map(g => ({ _id: g.id, title: g.name, slug: `nebula-${g.slug}`, category: g.category || 'Other', tags: g.tags || [], description: g.description, embedUrl: '/' + g.file, thumbnail: svgThumbnail(g.name, g.category), plays: 0, rating: 0, ratingCount: 0, builtIn: false })),
        total, page, pages: Math.ceil(total / limit), stats
      });
    }

    if (path === '/api/nebula/categories') {
      const r = await fetch(new URL('/games/games.json', url).toString());
      const catalog = await r.json();
      const stats = { ...catalog.stats, totalGames: 500 };
      return json({ categories: catalog.categories || [], stats });
    }

    if (path.startsWith('/api/admin')) {
      if (!user || user.role !== 'admin') return json({ error: 'Unauthorized' }, 403);
      if (path === '/api/admin/stats') {
        const [games, users, scores] = await Promise.all([
          db.prepare('SELECT COUNT(*) as c FROM games').first(),
          db.prepare('SELECT COUNT(*) as c FROM users').first(),
          db.prepare('SELECT COUNT(*) as c FROM scores').first(),
        ]);
        return json({ stats: { games: games.c, users: users.c, scores: scores.c } });
      }
      if (path === '/api/admin/users') {
        const rows = await db.prepare('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC').all();
        return json({ users: rows.results });
      }
      if (path.match(/\/admin\/users\/[\w-]+\/role$/)) {
        const userId = path.split('/')[4];
        const { role } = body;
        if (!['user', 'admin'].includes(role)) return json({ error: 'Invalid role' }, 400);
        await db.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, userId).run();
        return json({ success: true });
      }
      if (path.match(/\/admin\/users\/[\w-]+$/)) {
        const userId = path.split('/').pop();
        if (method === 'DELETE') {
          await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
          return json({ success: true });
        }
      }
      if (path === '/api/admin/games' && method === 'GET') {
        const rows = await db.prepare('SELECT * FROM games ORDER BY created_at DESC').all();
        return json({ games: rows.results.map(formatGame) });
      }
      if (path === '/api/admin/games' && method === 'POST') {
        const g = body;
        const id = uid();
        await db.prepare('INSERT INTO games (id, title, slug, description, category, tags, embed_url, built_in, built_in_component, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, g.title, (g.slug || g.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), g.description, g.category, JSON.stringify(g.tags || []), g.embedUrl || '', g.builtIn ? 1 : 0, g.builtInComponent || '', g.featured ? 1 : 0).run();
        return json({ game: { ...g, _id: id } });
      }
      if (path.match(/\/admin\/games\/[\w-]+$/)) {
        const gameId = path.split('/').pop();
        if (method === 'PUT') {
          const g = body;
          await db.prepare('UPDATE games SET title=?, description=?, category=?, tags=?, embed_url=?, featured=? WHERE id=?').bind(g.title, g.description, g.category, JSON.stringify(g.tags || []), g.embedUrl || '', g.featured ? 1 : 0, gameId).run();
          return json({ success: true });
        }
        if (method === 'DELETE') {
          await db.prepare('DELETE FROM games WHERE id = ?').bind(gameId).run();
          return json({ success: true });
        }
      }
      if (path === '/api/admin/games/slug' && method === 'POST') {
        const { id, slug } = body;
        const clean = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await db.prepare('UPDATE games SET slug = ? WHERE id = ?').bind(clean, id).run();
        return json({ success: true, slug: clean });
      }
      if (path === '/api/admin/requests' && method === 'GET') {
        const rows = await db.prepare('SELECT r.*, u.username as submitter_username FROM game_requests r LEFT JOIN users u ON u.id = r.submitted_by ORDER BY r.created_at DESC').all();
        const approved = await db.prepare("SELECT url FROM game_requests WHERE status = 'approved'").all();
        const approvedUrls = new Set(approved.results.map(r => r.url));
        return json({ requests: rows.results, approvedUrls: [...approvedUrls] });
      }
      if (path === '/api/admin/requests/approve' && method === 'POST') {
        const { id } = body;
        const reqRow = await db.prepare('SELECT * FROM game_requests WHERE id = ?').bind(id).first();
        if (!reqRow) return json({ error: 'Request not found' }, 404);
        await db.prepare("UPDATE game_requests SET status = 'approved' WHERE id = ?").bind(id).run();
        const existing = await db.prepare('SELECT id FROM games WHERE embed_url = ?').bind(reqRow.url).first();
        if (!existing) {
          const gameId = uid();
          let title = reqRow.title || await fetchPageTitle(reqRow.url) || urlToSlug(reqRow.url);
          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          await db.prepare("INSERT INTO games (id, title, slug, description, category, tags, embed_url, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(gameId, title, slug, reqRow.description || '', 'External', '[]', reqRow.url, 0).run();
        }
        return json({ success: true });
      }
      if (path.match(/\/admin\/requests\/[\w-]+$/) && method === 'DELETE') {
        const reqId = path.split('/').pop();
        await db.prepare('DELETE FROM game_requests WHERE id = ?').bind(reqId).run();
        return json({ success: true });
      }
      if (path.match(/\/admin\/requests\/[\w-]+$/) && method === 'PUT') {
        const reqId = path.split('/').pop();
        const { title, description, admin_notes } = body;
        await db.prepare('UPDATE game_requests SET title = COALESCE(?, title), description = COALESCE(?, description), admin_notes = COALESCE(?, admin_notes) WHERE id = ?').bind(title || null, description || null, admin_notes || null, reqId).run();
        return json({ success: true });
      }
      if (path === '/api/admin/broken-reports' && method === 'GET') {
        const rows = await db.prepare('SELECT r.*, u.username as reporter_username FROM broken_reports r LEFT JOIN users u ON u.id = r.reported_by ORDER BY r.created_at DESC').all();
        return json({ reports: rows.results });
      }
      if (path === '/api/admin/broken-reports/resolve' && method === 'POST') {
        const { id } = body;
        await db.prepare('UPDATE broken_reports SET resolved = 1 WHERE id = ?').bind(id).run();
        return json({ success: true });
      }
      if (path.match(/\/admin\/broken-reports\/[\w-]+$/) && method === 'DELETE') {
        const reportId = path.split('/').pop();
        await db.prepare('DELETE FROM broken_reports WHERE id = ?').bind(reportId).run();
        return json({ success: true });
      }
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    return json({ error: err.message || 'Internal error' }, 500);
  }
}

function formatGame(g) {
  return {
    _id: g.id,
    title: g.title,
    slug: g.slug,
    description: g.description,
    category: g.category,
    tags: JSON.parse(g.tags || '[]'),
    embedUrl: g.embed_url || '',
    builtIn: !!g.built_in,
    builtInComponent: g.built_in_component || '',
    thumbnail: g.thumbnail || '',
    featured: !!g.featured,
    plays: g.plays || 0,
    rating: g.rating_count > 0 ? (g.rating_sum / g.rating_count).toFixed(1) : 0,
    ratingCount: g.rating_count || 0,
    ratingSum: g.rating_sum || 0,
    createdAt: g.created_at
  };
}

async function fetchPageTitle(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

function urlToSlug(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  } catch {
    return url.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}
