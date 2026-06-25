require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const adminRoutes = require('./routes/admin');
const nebulaRoutes = require('./routes/nebula');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'hyp3rcube',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/games', express.static(path.join(__dirname, '../client/public/games')));
app.use('/games', express.static(path.join(__dirname, '../client/dist/games')));
app.use(express.static(path.join(__dirname, '../client/dist')));

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/nebula', nebulaRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', user: req.user ? req.user.username : null });
});

app.get('/nebula/*', async (req, res) => {
  const filePath = req.path.replace('/nebula/', '');
  const cdnUrl = `https://cdn.jsdelivr.net/gh/GoatTech-42/NEBULA-CDN@main/${filePath}`;
  try {
    const r = await fetch(cdnUrl);
    if (!r.ok) return res.status(404).send('Not found');
    const contentType = filePath.endsWith('.html') ? 'text/html; charset=utf-8' : r.headers.get('content-type') || 'application/octet-stream';
    res.set('Content-Type', contentType);
    const buf = await r.arrayBuffer();
    res.send(Buffer.from(buf));
  } catch (err) {
    res.status(500).send('Proxy error');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Hyp3rCub3.0n3 running on http://localhost:${PORT}`);
});
