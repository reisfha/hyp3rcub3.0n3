const express = require('express');
const Game = require('../models/Game');
const User = require('../models/User');
const Rating = require('../models/Rating');
const Score = require('../models/Score');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 30 } = req.query;
    const query = {};
    if (search) query.title = { $regex: new RegExp(search, 'i') };
    if (category) query.category = category;

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
