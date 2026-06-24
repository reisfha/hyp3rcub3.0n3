require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Game = require('../models/Game');

const CDN = '';

const games = [
  /* === Built-in (React) games === */
  { title: '2048', slug: '2048', description: 'Merge tiles to reach 2048', category: 'Puzzle', tags: ['puzzle', 'numbers', 'classic'], builtIn: true, builtInComponent: 'Game2048', featured: true },
  { title: 'Snake', slug: 'snake', description: 'Classic snake game — eat food, grow, don\'t crash', category: 'Classic', tags: ['classic', 'arcade'], builtIn: true, builtInComponent: 'SnakeGame' },
  { title: 'Breakout', slug: 'breakout', description: 'Break all the bricks with your paddle', category: 'Classic', tags: ['classic', 'arcade', 'paddle'], builtIn: true, builtInComponent: 'BreakoutGame' },
  { title: 'Tetris', slug: 'tetris', description: 'Classic block-stacking puzzle', category: 'Puzzle', tags: ['puzzle', 'classic', 'blocks'], builtIn: true, builtInComponent: 'TetrisGame', featured: true },
  { title: 'Flappy Bird', slug: 'flappy-bird', description: 'Tap to fly through pipes', category: 'Classic', tags: ['classic', 'arcade', 'bird'], builtIn: true, builtInComponent: 'FlappyBirdGame' },
  { title: 'Pac-Man', slug: 'pac-man', description: 'Eat dots and avoid ghosts in the classic maze', category: 'Classic', tags: ['classic', 'arcade', 'maze'], builtIn: true, builtInComponent: 'PacmanGame', featured: true },
  { title: 'Dino Game', slug: 'dino-game', description: 'Chrome dinosaur — jump over cacti', category: 'Classic', tags: ['classic', 'dinosaur', 'endless'], builtIn: true, builtInComponent: 'DinoGame' },
  { title: 'Asteroids', slug: 'asteroids', description: 'Shoot asteroids in the classic arcade shooter', category: 'Classic', tags: ['classic', 'arcade', 'space', 'shooter'], builtIn: true, builtInComponent: 'AsteroidsGame' },
  { title: 'Pong', slug: 'pong', description: 'Classic two-player paddle battle', category: 'Classic', tags: ['classic', 'arcade', 'paddle', 'multiplayer'], builtIn: true, builtInComponent: 'PongGame' },
  { title: 'Space Invaders', slug: 'space-invaders', description: 'Defend Earth from alien invaders', category: 'Classic', tags: ['classic', 'arcade', 'space', 'shooter'], builtIn: true, builtInComponent: 'SpaceInvadersGame' },
  { title: 'Minesweeper', slug: 'minesweeper', description: 'Find the mines without blowing up', category: 'Puzzle', tags: ['puzzle', 'classic', 'mines'], builtIn: true, builtInComponent: 'MinesweeperGame' },
   { title: 'Cookie Clicker', slug: 'cookie-clicker', description: 'Click cookies. Buy upgrades. Get rich.', category: 'Idle', tags: ['idle', 'clicker', 'cookie'], builtIn: true, builtInComponent: 'CookieClickerGame' },
   { title: 'Retro Emulator', slug: 'retro-emulator', description: 'Play classic games from NES, SNES, GameBoy, GBA, and N64 by loading ROM files', category: 'Emulation', tags: ['emulator', 'retro', 'classic', 'nes', 'snes', 'gameboy'], builtIn: true, builtInComponent: 'EmulatorGame', featured: true },
  { title: 'Void Maze', slug: 'void-maze', description: 'A top-down non-Euclidean maze — only a small circle of vision, and the darkness shifts the walls behind you', category: 'Puzzle', tags: ['maze', 'dark', 'puzzle', 'non-euclidean'], builtIn: true, builtInComponent: 'VoidMaze' },

  /* === Embed from NEBULA CDN (jsdelivr) === */
  { title: 'Subway Surfers Barcelona', slug: 'subway-surfers', description: 'Endless runner — dodge trains through Barcelona', category: 'Endless Runner', tags: ['runner', '3d', 'popular'], embedUrl: `${CDN}/games/subwaysurfersbarcelona.html`, featured: true },
  { title: 'Subway Surfers Miami', slug: 'subway-surfers-miami', description: 'Endless runner — dash through Miami!', category: 'Endless Runner', tags: ['runner', '3d', 'popular'], embedUrl: `${CDN}/games/subwaysurfersmiami.html` },
  { title: 'Temple Run 2', slug: 'temple-run-2', description: 'Escape the temple in this endless runner classic', category: 'Endless Runner', tags: ['runner', '3d', 'popular'], embedUrl: `${CDN}/games/templerun2.html`, featured: true },
  { title: 'Moto X3M', slug: 'moto-x3m', description: 'Stunt bike racing with insane obstacles', category: 'Racing', tags: ['racing', 'stunts', 'bike'], embedUrl: `${CDN}/games/motox3mm.html`, featured: true },
  { title: 'Moto X3M 2', slug: 'moto-x3m-2', description: 'More stunts, more bikes, more chaos!', category: 'Racing', tags: ['racing', 'stunts', 'bike'], embedUrl: `${CDN}/games/motox3m2.html` },
  { title: 'Moto X3M Pool Party', slug: 'moto-x3m-pool', description: 'Summer stunt bike racing', category: 'Racing', tags: ['racing', 'stunts', 'summer'], embedUrl: `${CDN}/games/motox3mpoolparty.html` },
  { title: 'Smash Karts', slug: 'smash-karts', description: 'Multiplayer kart battle arena', category: 'Multiplayer', tags: ['multiplayer', 'racing', 'battle'], embedUrl: `${CDN}/games/smashkarts.html` },
  { title: 'Paper.io', slug: 'paper-io', description: 'Claim territory in this colorful .io game', category: '.io', tags: ['io', 'territory', 'multiplayer'], embedUrl: `${CDN}/games/paperio.html` },
  { title: 'Paper.io 3D', slug: 'paper-io-3d', description: 'Territory claiming in 3D!', category: '.io', tags: ['io', 'territory', '3d'], embedUrl: `${CDN}/games/paperio3d.html` },
  { title: 'Stickman Hook', slug: 'stickman-hook', description: 'Swing through levels as a stickman', category: 'Physics', tags: ['physics', 'swing', 'stickman'], embedUrl: `${CDN}/games/stickmanhook.html` },
  { title: 'Slope', slug: 'slope', description: 'Roll a ball down a 3D slope at high speed', category: 'Endless Runner', tags: ['3d', 'ball', 'speed'], embedUrl: `${CDN}/games/slope.html`, featured: true },
  { title: 'Run 3', slug: 'run-3', description: 'Run through space tunnels', category: 'Endless Runner', tags: ['runner', 'space', '3d'], embedUrl: `${CDN}/games/run3.html` },
  { title: 'Basketball Stars', slug: 'basketball-stars', description: 'One-on-one basketball showdown', category: 'Sports', tags: ['sports', 'basketball', 'multiplayer'], embedUrl: `${CDN}/games/basketballstars.html` },
  { title: 'Basketball Legends', slug: 'basketball-legends', description: 'Arcade basketball action', category: 'Sports', tags: ['sports', 'basketball'], embedUrl: `${CDN}/games/basketballlegends.html` },
  { title: 'Bad Ice-Cream', slug: 'bad-ice-cream', description: 'Collect fruit as an ice cream in this 2D puzzle', category: 'Puzzle', tags: ['puzzle', '2d', 'ice cream'], embedUrl: `${CDN}/games/badicecream.html` },
  { title: 'Bad Ice-Cream 2', slug: 'bad-ice-cream-2', description: 'More fruity ice cream fun!', category: 'Puzzle', tags: ['puzzle', '2d', 'ice cream'], embedUrl: `${CDN}/games/badicecream2.html` },
  { title: 'Penalty Kicks', slug: 'penalty-kicks', description: 'Soccer penalty shootout', category: 'Sports', tags: ['soccer', 'penalty', 'sports'], embedUrl: `${CDN}/games/penaltykicks.html` },
  { title: 'Cookie Clicker', slug: 'cookie-clicker-embed', description: 'Click cookies. Buy upgrades. Get rich.', category: 'Idle', tags: ['idle', 'clicker', 'cookie'], embedUrl: `${CDN}/games/cookieclicker.html` },
  { title: '1v1 LOL', slug: '1v1-lol', description: 'Build battle shooter', category: 'Shooter', tags: ['fps', 'battle', 'build'], embedUrl: `${CDN}/games/1v1lol.html` },
  { title: 'Among Us', slug: 'among-us', description: 'Find the imposter among the crew', category: 'Multiplayer', tags: ['imposter', 'social', 'deduction'], embedUrl: `${CDN}/games/amongus.html` },
  { title: '1 on 1 Soccer', slug: '1on1-soccer', description: 'Head-to-head soccer match', category: 'Sports', tags: ['soccer', '1v1'], embedUrl: `${CDN}/games/1on1soccer.html` },
  { title: '8 Ball Pool', slug: '8-ball-pool', description: 'Classic pool/billiards', category: 'Sports', tags: ['pool', 'billiards', 'sports'], embedUrl: `${CDN}/games/8ballpool.html` },
  { title: 'World Cup Penalty', slug: 'world-cup-penalty', description: 'Score penalties in the World Cup!', category: 'Sports', tags: ['soccer', 'penalty', 'world cup'], embedUrl: `${CDN}/games/penaltykicks.html` },
  { title: 'Rooftop Snipers', slug: 'rooftop-snipers', description: '2-player rooftop shooting duel', category: 'Multiplayer', tags: ['shooter', '2-player', 'duel'], embedUrl: `${CDN}/games/rooftopsnipers.html` },
  { title: 'Tunnel Rush', slug: 'tunnel-rush', description: 'Race through a colorful tunnel at high speed', category: 'Endless Runner', tags: ['speed', '3d', 'tunnel'], embedUrl: `${CDN}/games/tunnelrush.html` },
  { title: 'Bottle Flip 3D', slug: 'bottle-flip', description: 'Flip the bottle and land it standing', category: 'Physics', tags: ['physics', 'bottle', 'flip'], embedUrl: `${CDN}/games/bottleflip3d.html` },
  { title: 'Flappy Dunk', slug: 'flappy-dunk', description: 'Flappy Bird meets basketball', category: 'Sports', tags: ['flappy', 'basketball', 'skill'], embedUrl: `${CDN}/games/flappydunk.html` },
  { title: 'Drift Boss', slug: 'drift-boss', description: 'Drift your car around endless corners', category: 'Racing', tags: ['drift', 'car', 'endless'], embedUrl: `${CDN}/games/driftboss.html` },
  { title: 'Crossy Road', slug: 'crossy-road', description: 'Hop across roads, rivers, and trains', category: 'Classic', tags: ['endless', 'retro', 'chicken'], embedUrl: `${CDN}/games/crossyroad.html` },
  { title: 'Basketball FRVR', slug: 'basketball-frvr', description: 'Score hoops in this simple basketball game', category: 'Sports', tags: ['basketball', 'arcade'], embedUrl: `${CDN}/games/basketballfrvr.html` },
  { title: 'Bouncy Basketball', slug: 'bouncy-basketball', description: 'Bounce the ball into the hoop!', category: 'Sports', tags: ['basketball', 'bouncy'], embedUrl: `${CDN}/games/bouncybasketball.html` },
  { title: 'Age of War', slug: 'age-of-war', description: 'Battle through the ages in this strategy game', category: 'Strategy', tags: ['strategy', 'war', 'tower defense'], embedUrl: `${CDN}/games/ageofwar.html` },
  { title: 'Rooftop Snipers 2', slug: 'rooftop-snipers-2', description: 'More rooftop shooting madness!', category: 'Multiplayer', tags: ['shooter', '2-player'], embedUrl: `${CDN}/games/rooftopsnipers2.html` },
  { title: 'Stickman Clash', slug: 'stickman-clash', description: 'Stickman fighting action', category: 'Fighting', tags: ['stickman', 'fighting', 'battle'], embedUrl: `${CDN}/games/stickmanclash.html` },
  { title: 'Stickman Duel', slug: 'stickman-duel', description: 'Duel another stickman with weapons', category: 'Fighting', tags: ['stickman', 'duel', 'weapons'], embedUrl: `${CDN}/games/stickmanduel.html` },

  /* === Embed from CrazyGames === */
  { title: 'Drive Mad', slug: 'drive-mad', description: 'Drive a car through wild obstacle courses', category: 'Racing', tags: ['racing', 'driving', 'obstacle'], embedUrl: 'https://games.crazygames.com/en_US/drive-mad/index.html' },
  { title: 'Basket Random', slug: 'basket-random', description: 'Random physics basketball mayhem', category: 'Sports', tags: ['basketball', 'physics', 'funny'], embedUrl: 'https://games.crazygames.com/en_US/basket-random/index.html', featured: true },
  { title: 'Snow Rider 3D', slug: 'snow-rider-3d', description: 'Race down snowy slopes on a sled', category: 'Racing', tags: ['snow', '3d', 'endless'], embedUrl: 'https://games.crazygames.com/en_US/snow-rider-3d/index.html' },
  { title: 'Geometry Dash', slug: 'geometry-dash', description: 'Jump and fly through rhythm-based obstacles', category: 'Platformer', tags: ['rhythm', 'platformer', 'hard'], embedUrl: 'https://games.crazygames.com/en_US/geometry-dash/index.html', featured: true },
  { title: 'Mr Bullet', slug: 'mr-bullet', description: 'Shoot enemies with trick shots and physics', category: 'Puzzle', tags: ['shooter', 'physics', 'puzzle'], embedUrl: 'https://games.crazygames.com/en_US/mr-bullet/index.html' },
  { title: 'Bob the Robber', slug: 'bob-the-robber', description: 'Sneak through buildings and steal the loot', category: 'Platformer', tags: ['stealth', 'platformer', 'puzzle'], embedUrl: 'https://games.crazygames.com/en_US/bob-the-robber/index.html' },
  { title: 'Fireboy and Watergirl', slug: 'fireboy-watergirl', description: 'Control two characters to escape the temple', category: 'Platformer', tags: ['co-op', 'platformer', 'puzzle'], embedUrl: 'https://games.crazygames.com/en_US/fireboy-and-watergirl/index.html' },
  { title: 'Soccer Random', slug: 'soccer-random', description: 'Chaotic physics-based soccer', category: 'Sports', tags: ['soccer', 'physics', 'funny'], embedUrl: 'https://games.crazygames.com/en_US/soccer-random/index.html' },
  { title: 'Rocket Soccer Derby', slug: 'rocket-soccer-derby', description: 'Rocket-powered car soccer', category: 'Sports', tags: ['soccer', 'cars', 'multiplayer'], embedUrl: 'https://games.crazygames.com/en_US/rocket-soccer-derby/index.html' },
  { title: 'Duck Life', slug: 'duck-life', description: 'Train your duck to become a racing champion', category: 'RPG', tags: ['training', 'racing', 'duck'], embedUrl: 'https://games.crazygames.com/en_US/duck-life/index.html' },
  { title: 'Learn to Fly', slug: 'learn-to-fly', description: 'Help a penguin fly by upgrading equipment', category: 'Simulation', tags: ['penguin', 'upgrades', 'physics'], embedUrl: 'https://games.crazygames.com/en_US/learn-to-fly/index.html' },
  { title: 'Raft Wars', slug: 'raft-wars', description: 'Defend your raft by shooting enemies', category: 'Shooter', tags: ['shooter', 'physics', 'strategy'], embedUrl: 'https://games.crazygames.com/en_US/raft-wars/index.html' },
  { title: 'Boxing Random', slug: 'boxing-random', description: 'Random physics boxing brawler', category: 'Fighting', tags: ['boxing', 'physics', 'funny'], embedUrl: 'https://games.crazygames.com/en_US/boxing-random/index.html' },
  { title: 'Archery World Tour', slug: 'archery-world-tour', description: 'Compete in archery across global locations', category: 'Sports', tags: ['archery', 'sports', 'aim'], embedUrl: 'https://games.crazygames.com/en_US/archery-world-tour/index.html' },
  { title: 'EvoWizard', slug: 'evowizard', description: 'Evolve as a wizard through waves of enemies', category: 'RPG', tags: ['magic', 'waves', 'upgrades'], embedUrl: 'https://games.crazygames.com/en_US/ewizard/index.html' },
  { title: 'Zombies vs Plants', slug: 'zombies-vs-plants', description: 'Defend your garden from zombie hordes', category: 'Strategy', tags: ['tower-defense', 'zombies', 'strategy'], embedUrl: 'https://games.crazygames.com/en_US/zombies-vs-plants/index.html' }
];

async function seed() {
  try {
    await Game.remove({}, { multi: true });
    const inserted = [];
    for (const g of games) {
      const doc = await Game.insert({ ...g, plays: 0, ratingSum: 0, ratingCount: 0, createdAt: new Date().toISOString() });
      inserted.push(doc);
    }
    console.log(`Seeded ${inserted.length} games`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
