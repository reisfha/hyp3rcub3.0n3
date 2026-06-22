const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const GAMES_JSON_PATH = path.join(__dirname, '../../client/public/games/games.json');

function readCatalog() {
  return JSON.parse(fs.readFileSync(GAMES_JSON_PATH, 'utf-8'));
}

router.get('/catalog', (req, res) => {
  try {
    const catalog = readCatalog();
    const { search, category, page = 1, limit = 50 } = req.query;
    let games = catalog.games || [];

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

    res.json({
      games: paged.map(g => ({
        _id: g.id,
        title: g.name,
        slug: `nebula-${g.slug}`,
        category: g.category || 'Other',
        tags: g.tags || [],
        description: g.description,
        embedUrl: '/' + g.file,
        thumbnail: '',
        plays: 0,
        rating: 0,
        ratingCount: 0,
        builtIn: false
      })),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      stats: catalog.stats
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read NEBULA catalog', detail: err.message });
  }
});

router.get('/categories', (req, res) => {
  try {
    const catalog = readCatalog();
    res.json({ categories: catalog.categories || [], stats: catalog.stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
