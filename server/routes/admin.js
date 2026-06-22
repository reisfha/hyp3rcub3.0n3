const express = require('express');
const Game = require('../models/Game');
const User = require('../models/User');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/games', isAdmin, async (req, res) => {
  try {
    const games = await Game.find({}).sort({ createdAt: -1 });
    res.json({ games });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/games', isAdmin, async (req, res) => {
  try {
    const { title, slug, description, category, tags, embedUrl, builtIn, builtInComponent, thumbnail, instructions, featured } = req.body;
    const game = await Game.insert({
      title, slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description, category, tags: tags || [],
      embedUrl, builtIn: !!builtIn, builtInComponent: builtInComponent || '',
      thumbnail: thumbnail || '', instructions: instructions || '',
      featured: !!featured, plays: 0, ratingSum: 0, ratingCount: 0,
      createdAt: new Date().toISOString()
    });
    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/games/:id', isAdmin, async (req, res) => {
  try {
    const { _id, createdAt, ...data } = req.body;
    await Game.update({ _id: req.params.id }, { $set: data });
    const game = await Game.findOne({ _id: req.params.id });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/games/:id', isAdmin, async (req, res) => {
  try {
    await Game.remove({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const sanitized = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    res.json({ users: sanitized });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/role', isAdmin, async (req, res) => {
  try {
    await User.update({ _id: req.params.id }, { $set: { role: req.body.role } });
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...rest } = user;
    res.json({ user: rest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', isAdmin, async (req, res) => {
  try {
    const gameCount = await Game.count({});
    const userCount = await User.count({});
    const allGames = await Game.find({});
    const totalPlays = allGames.reduce((sum, g) => sum + (g.plays || 0), 0);
    res.json({ stats: { games: gameCount, users: userCount, plays: totalPlays } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
