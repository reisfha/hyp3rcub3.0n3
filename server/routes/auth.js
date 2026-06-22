const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ error: 'Email or username already taken' });
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.insert({
      username, email, password: hashed,
      avatar: '', role: 'user', verified: false, favorites: [],
      createdAt: new Date().toISOString()
    });
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      res.json({ user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar, role: user.role, favorites: user.favorites } });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: info.message });
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      res.json({ user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar, role: user.role, favorites: user.favorites } });
    });
  })(req, res, next);
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', {
  successRedirect: process.env.CLIENT_URL,
  failureRedirect: process.env.CLIENT_URL + '/login'
}));

router.get('/discord', passport.authenticate('discord'));
router.get('/discord/callback', passport.authenticate('discord', {
  successRedirect: process.env.CLIENT_URL,
  failureRedirect: process.env.CLIENT_URL + '/login'
}));

router.get('/apple', passport.authenticate('apple'));
router.post('/apple/callback', (req, res, next) => {
  passport.authenticate('apple', {
    successRedirect: process.env.CLIENT_URL,
    failureRedirect: process.env.CLIENT_URL + '/login'
  })(req, res, next);
});

router.get('/me', isAuthenticated, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      role: req.user.role,
      favorites: req.user.favorites || []
    }
  });
});

router.get('/logout', (req, res) => {
  req.logout(() => res.json({ success: true }));
});

module.exports = router;
