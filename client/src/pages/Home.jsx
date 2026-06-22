import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchFeatured, fetchGames } from '../api/client';
import GameCard from '../components/GameCard';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [recent, setRecent] = useState([]);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    fetchFeatured().then(r => setFeatured(r.data.games || []));
    fetchGames({ sort: 'popular', limit: 8 }).then(r => setPopular(r.data.games || []));
    fetchGames({ limit: 8 }).then(r => setRecent(r.data.games || []));
  }, []);

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="neon-cyan">Hyp3r</span>
            <span className="neon-magenta">Cub3</span>
            <span className="neon-cyan">.0n3</span>
          </h1>
          <p className="hero-sub">Unblocked games. Anywhere. Anytime.</p>
          <div className="hero-actions">
            <Link to="/games" className="btn-primary">Play Now</Link>
            <Link to="/leaderboard" className="btn-secondary">Leaderboards</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>🔥 Featured Games</h2>
          <Link to="/games" className="section-link">View All →</Link>
        </div>
        <div className="game-grid">
          {featured.map(g => <GameCard key={g._id} game={g} />)}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>📈 Most Popular</h2>
          <Link to="/games?sort=popular" className="section-link">View All →</Link>
        </div>
        <div className="game-grid">
          {popular.map(g => <GameCard key={g._id} game={g} />)}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>🆕 Recently Added</h2>
          <Link to="/games" className="section-link">View All →</Link>
        </div>
        <div className="game-grid">
          {recent.map(g => <GameCard key={g._id} game={g} />)}
        </div>
      </section>
    </div>
  );
}
