const express = require('express');
const path = require('path');
const fs = require('fs');
const Game = require('../models/Game');
const User = require('../models/User');
const Rating = require('../models/Rating');
const Score = require('../models/Score');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, category, sort, tags, page = 1, limit = 30 } = req.query;
    const query = {};
    
    // Search in title and tags
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { tags: searchRegex }
      ];
    }
    
    if (category) query.category = category;
    
    // Filter by specific tags if provided
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'popular') sortObj = { plays: -1 };
    if (sort === 'rating') sortObj = { ratingCount: -1 };
    if (sort === 'name') sortObj = { title: 1 };

    let q = Game.find(query).sort(sortObj);
    const total = await Game.count(query);
    const games = await q.skip((page - 1) * limit).limit(Number(limit));

    res.json({ games, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/request', isAuthenticated, async (req, res) => {
  try {
    const GameRequest = require('../models/GameRequest');
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    const request = await GameRequest.insert({
      url,
      submittedBy: req.user._id,
      createdAt: new Date().toISOString()
    });
    res.json({ success: true, id: request._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/report-broken', isAuthenticated, async (req, res) => {
  try {
    const BrokenReport = require('../models/BrokenReport');
    const { game_id, game_title, game_slug, description } = req.body;
    if (!game_id) return res.status(400).json({ error: 'Game ID is required' });
    const report = await BrokenReport.insert({
      game_id, game_title, game_slug,
      reported_by: req.user._id,
      description: description || '',
      resolved: false,
      createdAt: new Date().toISOString()
    });
    res.json({ success: true, id: report._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const games = await Game.find({ featured: true }).sort({ createdAt: -1 }).limit(6);
    res.json({ games });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const all = await Game.find({});
    const cats = [...new Set(all.map(g => g.category).filter(Boolean))];
    res.json({ categories: cats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tags/available', async (req, res) => {
  try {
    const all = await Game.find({});
    const tagsSet = new Set();
    all.forEach(g => {
      if (Array.isArray(g.tags)) {
        g.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    const tags = Array.from(tagsSet).sort();
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const game = await Game.findOne({ slug: req.params.slug });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    await Game.update({ _id: game._id }, { $inc: { plays: 1 } });
    game.plays = (game.plays || 0) + 1;
    const rating = game.ratingCount > 0 ? Math.round((game.ratingSum / game.ratingCount) * 10) / 10 : 0;
    res.json({ game: { ...game, rating } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const BUILTIN_GAMES_DIR = path.join(__dirname, '../../client/src/games');

const GAME_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0a0f; color: #e0e0f0; font-family: 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
.builtin-game { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; position: relative; }
.game-canvas, .game-svg { border-radius: 8px; max-width: 100%; height: auto; display: block; }
.game-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; border-radius: 8px; z-index: 10; }
.game-overlay h2 { font-family: 'Orbitron', monospace; font-size: 28px; color: #ff00aa; text-shadow: 0 0 10px #ff00aa, 0 0 20px #ff00aa; }
.game-overlay p { font-size: 18px; }
.game-controls-hint { font-size: 12px; color: #6666aa; }
.btn-primary { background: #00f0ff; color: #000; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 700; }
.btn-primary:hover { box-shadow: 0 0 10px #00f0ff, 0 0 20px #00f0ff; }
.board-2048 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; width: 320px; padding: 8px; background: #12121a; border-radius: 8px; border: 1px solid #2a2a4e; }
.tile-2048 { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-family: 'Orbitron', monospace; font-weight: 700; transition: all 0.1s; }
.game-score { font-family: 'Orbitron', monospace; font-size: 18px; color: #00f0ff; margin-bottom: 8px; }
.tetris-board { display: grid; grid-template-columns: repeat(10, 1fr); gap: 1px; width: 240px; padding: 4px; background: #0a0a1a; border-radius: 4px; border: 2px solid #2a2a4e; }
.tetris-cell { aspect-ratio: 1; border-radius: 2px; }
.board-minesweeper { display: grid; grid-template-columns: repeat(9, 32px); gap: 1px; background: #2a2a4e; padding: 4px; border-radius: 4px; }
.ms-cell { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #1a1a2e; cursor: pointer; font-size: 14px; font-weight: 700; user-select: none; }
.ms-cell.revealed { background: #12121a; }
.ms-cell.mine { background: rgba(255,0,0,0.2); }
.cookie-game { gap: 16px; }
.cookie-count { font-family: 'Orbitron', monospace; font-size: 36px; color: #ffcc00; text-shadow: 0 0 20px rgba(255,204,0,0.5); }
.cookie-btn { background: none; border: none; cursor: pointer; }
.cookie-btn:active { transform: scale(0.9); }
.cookie-circle { font-size: 80px; filter: drop-shadow(0 0 20px rgba(255,204,0,0.3)); }
.cookie-upgrades { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 12px; }
.cookie-upgrade { padding: 8px 16px; border-radius: 6px; border: 1px solid #2a2a4e; background: #1a1a2e; color: #e0e0f0; cursor: pointer; font-size: 13px; }
.cookie-upgrade:hover:not(:disabled) { border-color: #ffcc00; color: #ffcc00; }
.cookie-upgrade:disabled { opacity: 0.3; cursor: default; }
.void-maze-hud { display: flex; justify-content: space-between; width: 100%; max-width: 700px; padding: 0 4px; font-family: 'Orbitron', monospace; font-size: 14px; }
.void-maze-level { color: #00f0ff; text-shadow: 0 0 10px #00f0ff; }
.void-maze-score { color: #e0e0f0; }
.void-maze-canvas-wrapper { width: 100%; max-width: 700px; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; }
.void-maze .game-canvas { width: 100%; height: 100%; border-radius: 8px; border: 1px solid #2a2a4e; cursor: crosshair; }
`;

function transformBuiltinSource(code, componentName) {
  return code
    .replace(/^import\s+.*from\s+['"]react['"];\s*/m, `const { useState, useEffect, useRef, useCallback, useMemo } = React;\n`)
    .replace(`export default function ${componentName}`, `function ${componentName}`);
}

function buildBuiltinHtml(gameTitle, componentName, source) {
  const safeTitle = gameTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const transformed = transformBuiltinSource(source, componentName);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>${GAME_CSS}</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
${transformed}

function App() {
  const [score, setScore] = React.useState(0);
  return React.createElement(${componentName}, { onScore: setScore });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
</script>
</body>
</html>`;
}

router.get('/:slug/download', async (req, res) => {
  try {
    const game = await Game.findOne({ slug: req.params.slug });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const embedUrl = game.embedUrl;
    const gameTitle = game.title || 'Game';

    if (embedUrl) {
      const filename = path.basename(embedUrl);

      if (embedUrl.startsWith('/games/')) {
        const filePath = path.join(__dirname, '../../client/public', embedUrl);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.sendFile(filePath);
      }

      if (embedUrl.startsWith('/nebula/')) {
        const cdnPath = embedUrl.replace('/nebula/', '');
        const cdnUrl = `https://cdn.jsdelivr.net/gh/GoatTech-42/NEBULA-CDN@main/${cdnPath}`;
        const r = await fetch(cdnUrl);
        if (!r.ok) return res.status(404).json({ error: 'File not found on CDN' });
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', r.headers.get('content-type') || 'application/octet-stream');
        const buf = await r.arrayBuffer();
        return res.send(Buffer.from(buf));
      }

      if (embedUrl.startsWith('http://') || embedUrl.startsWith('https://')) {
        const r = await fetch(embedUrl, { signal: AbortSignal.timeout(10000) });
        if (!r.ok) return res.status(502).json({ error: 'Failed to fetch external game' });
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', r.headers.get('content-type') || 'application/octet-stream');
        const buf = await r.arrayBuffer();
        return res.send(Buffer.from(buf));
      }
    }

    if (game.builtIn && game.builtInComponent) {
      const componentName = game.builtInComponent;
      const filePath = path.join(BUILTIN_GAMES_DIR, `${componentName}.jsx`);
      if (fs.existsSync(filePath)) {
        const source = fs.readFileSync(filePath, 'utf-8');
        const html = buildBuiltinHtml(gameTitle, componentName, source);
        const safeName = gameTitle.replace(/[^a-zA-Z0-9 ]/g, '');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}.html"`);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    }

    const fallbackHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${gameTitle}</title><style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0f;color:#e0e0f0;text-align:center;padding:20px}h1{color:#00f0ff}a{color:#ff00aa}</style></head><body><h1>${gameTitle}</h1><p>This is a built-in game on Hyp3rCub3.0n3.</p><p>Play it online at <a href="${req.protocol}://${req.get('host')}/game/${game.slug}">${req.protocol}://${req.get('host')}/game/${game.slug}</a></p></body></html>`;
    res.setHeader('Content-Disposition', `attachment; filename="${gameTitle.replace(/[^a-zA-Z0-9 ]/g, '')}.html"`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(fallbackHtml);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/rate', isAuthenticated, async (req, res) => {
  try {
    const { score } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be 1-5' });
    }
    const existing = await Rating.findOne({ userId: req.user._id, gameId: req.params.id });
    if (existing) {
      const diff = score - existing.score;
      await Rating.update({ _id: existing._id }, { $set: { score } });
      await Game.update({ _id: req.params.id }, { $inc: { ratingSum: diff } });
    } else {
      await Rating.insert({ userId: req.user._id, gameId: req.params.id, score });
      await Game.update({ _id: req.params.id }, { $inc: { ratingSum: score, ratingCount: 1 } });
    }
    const game = await Game.findOne({ _id: req.params.id });
    const rating = game.ratingCount > 0 ? Math.round((game.ratingSum / game.ratingCount) * 10) / 10 : 0;
    res.json({ rating, ratingCount: game.ratingCount || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/rating', isAuthenticated, async (req, res) => {
  try {
    const rating = await Rating.findOne({ userId: req.user._id, gameId: req.params.id });
    res.json({ score: rating ? rating.score : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/favorite', isAuthenticated, async (req, res) => {
  try {
    const favs = req.user.favorites || [];
    const idx = favs.indexOf(req.params.id);
    if (idx > -1) {
      favs.splice(idx, 1);
    } else {
      favs.push(req.params.id);
    }
    await User.update({ _id: req.user._id }, { $set: { favorites: favs } });
    res.json({ favorites: favs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/scores', async (req, res) => {
  try {
    const scores = await Score.find({ gameId: req.params.id }).sort({ value: -1 }).limit(50);
    res.json({ scores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/scores', isAuthenticated, async (req, res) => {
  try {
    const { value } = req.body;
    if (!value || typeof value !== 'number') {
      return res.status(400).json({ error: 'Invalid score' });
    }
    const score = await Score.insert({
      userId: req.user._id,
      gameId: req.params.id,
      value,
      username: req.user.username,
      createdAt: new Date().toISOString()
    });
    res.json({ score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
