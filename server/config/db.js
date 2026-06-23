const Datastore = require('nedb-promises');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');

const users = Datastore.create({ filename: path.join(dataDir, 'users.db'), autoload: true });
const games = Datastore.create({ filename: path.join(dataDir, 'games.db'), autoload: true });
const ratings = Datastore.create({ filename: path.join(dataDir, 'ratings.db'), autoload: true });
const scores = Datastore.create({ filename: path.join(dataDir, 'scores.db'), autoload: true });
const gameRequests = Datastore.create({ filename: path.join(dataDir, 'gameRequests.db'), autoload: true });
const brokenReports = Datastore.create({ filename: path.join(dataDir, 'brokenReports.db'), autoload: true });

users.ensureIndex({ fieldName: 'email', unique: true });
users.ensureIndex({ fieldName: 'username', unique: true });
ratings.ensureIndex({ fieldName: ['userId', 'gameId'], unique: true });
scores.ensureIndex({ fieldName: ['gameId', 'value'] });

module.exports = { users, games, ratings, scores, gameRequests, brokenReports };
