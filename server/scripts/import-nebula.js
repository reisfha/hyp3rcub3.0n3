require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Game = require('../models/Game');
const fs = require('fs');
const path = require('path');

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/GoatTech-42/NEBULA-CDN@main';
const GAMES_JSON = path.join(__dirname, '../../client/public/games/games.json');

async function importNebula() {
  const catalog = JSON.parse(fs.readFileSync(GAMES_JSON, 'utf-8'));
  const existingGames = await Game.find({});
  const existingSlugs = new Set(existingGames.map(g => g.slug));

  let imported = 0, skipped = 0, errors = 0;

  for (const g of catalog.games) {
    try {
      if (existingSlugs.has(g.slug)) {
        skipped++;
        continue;
      }

      const game = {
        title: g.name,
        slug: g.slug,
        description: g.description || `Play ${g.name} — a ${g.category || 'other'} game from the NEBULA CDN collection.`,
        category: g.category || 'Other',
        tags: g.tags || [],
        embedUrl: `${CDN_BASE}/${g.file}`,
        builtIn: false,
        builtInComponent: '',
        thumbnail: '',
        featured: false,
        plays: 0,
        ratingSum: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString()
      };

      await Game.insert(game);
      imported++;
      existingSlugs.add(g.slug);
    } catch (err) {
      errors++;
      console.error(`  Error importing "${g.name}" (${g.slug}): ${err.message}`);
    }
  }

  const total = catalog.games.length;
  console.log(`\nNEBULA CDN Import Complete:`);
  console.log(`  Total in catalog: ${total}`);
  console.log(`  Imported:         ${imported}`);
  console.log(`  Skipped (exists): ${skipped}`);
  console.log(`  Errors:           ${errors}`);
  console.log(`  DB total:         ${imported + existingGames.length}`);
  process.exit(0);
}

importNebula().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
