const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findOne({ _id: id });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new LocalStrategy({
  usernameField: 'username'
}, async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return done(null, false, { message: 'No account with that username' });
    if (!user.password) return done(null, false, { message: 'Account uses social login' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return done(null, false, { message: 'Wrong password' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

if (process.env.GOOGLE_CLIENT_ID) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    proxy: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user && profile.emails?.[0]?.value) {
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          await User.update({ _id: user._id }, { $set: { googleId: profile.id, avatar: user.avatar || profile.photos?.[0]?.value } });
          user = await User.findOne({ _id: user._id });
        }
      }
      if (!user) {
        user = await User.insert({
          username: profile.displayName.replace(/\s+/g, '') + '_' + Math.random().toString(36).slice(2, 6),
          email: profile.emails?.[0]?.value || `${profile.id}@google.user`,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value || '',
          verified: true, role: 'user', favorites: [],
          createdAt: new Date().toISOString()
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

if (process.env.DISCORD_CLIENT_ID) {
  const DiscordStrategy = require('passport-discord').Strategy;
  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: '/api/auth/discord/callback',
    scope: ['identify', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ discordId: profile.id });
      if (!user && profile.email) {
        user = await User.findOne({ email: profile.email });
        if (user) {
          await User.update({ _id: user._id }, { $set: { discordId: profile.id, avatar: user.avatar || `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` } });
          user = await User.findOne({ _id: user._id });
        }
      }
      if (!user) {
        user = await User.insert({
          username: profile.username + '_' + profile.discriminator,
          email: profile.email || `${profile.id}@discord.user`,
          discordId: profile.id,
          avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
          verified: true, role: 'user', favorites: [],
          createdAt: new Date().toISOString()
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

if (process.env.APPLE_CLIENT_ID) {
  const AppleStrategy = require('passport-apple').Strategy;
  passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKeyString: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    callbackURL: process.env.APPLE_CALLBACK_URL,
    scope: ['name', 'email']
  }, async (accessToken, refreshToken, idToken, profile, done) => {
    try {
      const appleId = profile?.id || idToken?.sub;
      const email = profile?.email || idToken?.email;
      let user = await User.findOne({ appleId });
      if (!user && email) {
        user = await User.findOne({ email });
        if (user) {
          await User.update({ _id: user._id }, { $set: { appleId } });
          user = await User.findOne({ _id: user._id });
        }
      }
      if (!user) {
        user = await User.insert({
          username: `apple_user_${Math.random().toString(36).slice(2, 8)}`,
          email: email || `${appleId}@apple.private`,
          appleId, verified: true, role: 'user', favorites: [],
          createdAt: new Date().toISOString()
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

module.exports = passport;
