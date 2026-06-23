const express = require('express');
const Game = require('../models/Game');
const User = require('../models/User');
const { isAdmin } = require('../middleware/auth');

const GameRequest = require('../models/GameRequest');
const BrokenReport = require('../models/BrokenReport');
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
    const cleanSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const game = await Game.insert({
      title, slug: cleanSlug,
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

router.post('/games/slug', isAdmin, async (req, res) => {
  try {
    const { id, slug } = req.body;
    const clean = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await Game.update({ _id: id }, { $set: { slug: clean } });
    res.json({ success: true, slug: clean });
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

router.get('/requests', isAdmin, async (req, res) => {
  try {
    const requests = await GameRequest.find({}).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/requests/approve', isAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    const reqRow = await GameRequest.findOne({ _id: id });
    if (!reqRow) return res.status(404).json({ error: 'Request not found' });
    await GameRequest.update({ _id: id }, { $set: { status: 'approved' } });
    const existing = await Game.findOne({ embedUrl: reqRow.url });
    if (!existing) {
      const slug = reqRow.title
        ? reqRow.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : new URL(reqRow.url).hostname.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await Game.insert({
        title: reqRow.title || slug,
        slug,
        description: reqRow.description || '',
        category: 'External',
        tags: [],
        embedUrl: reqRow.url,
        featured: false,
        plays: 0,
        ratingSum: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString()
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/requests/approved', isAdmin, async (req, res) => {
  try {
    const approved = await GameRequest.find({ status: 'approved' });
    res.json({ approvedUrls: approved.map(r => r.url) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/requests/:id', isAdmin, async (req, res) => {
  try {
    const { title, description, admin_notes } = req.body;
    await GameRequest.update({ _id: req.params.id }, { $set: { title, description, admin_notes } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/requests/:id', isAdmin, async (req, res) => {
  try {
    await GameRequest.remove({ _id: req.params.id });
    res.json({ success: true });
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

router.get('/broken-reports', isAdmin, async (req, res) => {
  try {
    const reports = await BrokenReport.find({}).sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/broken-reports/resolve', isAdmin, async (req, res) => {
  try {
    await BrokenReport.update({ _id: req.body.id }, { $set: { resolved: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/broken-reports/:id', isAdmin, async (req, res) => {
  try {
    await BrokenReport.remove({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
