const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const GAMES_JSON_PATH = path.join(__dirname, '../../client/public/games/games.json');

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
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

function readCatalog() {
  return JSON.parse(fs.readFileSync(GAMES_JSON_PATH, 'utf-8'));
}

router.get('/catalog', (req, res) => {
  try {
    const catalog = readCatalog();
    const { search, category, page = 1, limit = 50 } = req.query;
    let games = (catalog.games || []).slice(0, 500);

    if (search) {
      const s = search.toLowerCase();
      games = games.filter(g => g.name.toLowerCase().includes(s) || g.tags?.some(t => t.includes(s)));
    }
    if (category && category !== 'All') {
      games = games.filter(g => (g.category || 'Other') === category);
    }

    const total = games.length;
    const start = (page - 1) * limit;
    const paged = games.slice(start, start + Number(limit));
    const stats = { ...catalog.stats, totalGames: 500 };

    res.json({
      games: paged.map(g => ({
        _id: g.id,
        title: g.name,
        slug: `nebula-${g.slug}`,
        category: g.category || 'Other',
        tags: g.tags || [],
        description: g.description,
        embedUrl: '/' + g.file,
        thumbnail: svgThumbnail(g.name, g.category),
        plays: 0,
        rating: 0,
        ratingCount: 0,
        builtIn: false
      })),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      stats
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read NEBULA catalog', detail: err.message });
  }
});

router.get('/categories', (req, res) => {
  try {
    const catalog = readCatalog();
    const stats = { ...catalog.stats, totalGames: 500 };
    res.json({ categories: catalog.categories || [], stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
