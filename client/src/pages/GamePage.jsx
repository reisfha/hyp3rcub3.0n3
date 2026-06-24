import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchGame, rateGame, fetchRating, submitScore, reportBroken } from '../api/client';
import { useAuth } from '../context/AuthContext';
import FullscreenButton from '../components/FullscreenButton';

import Game2048 from '../games/Game2048';
import SnakeGame from '../games/SnakeGame';
import BreakoutGame from '../games/BreakoutGame';
import TetrisGame from '../games/TetrisGame';
import FlappyBirdGame from '../games/FlappyBirdGame';
import PacmanGame from '../games/PacmanGame';
import DinoGame from '../games/DinoGame';
import AsteroidsGame from '../games/AsteroidsGame';
import PongGame from '../games/PongGame';
import SpaceInvadersGame from '../games/SpaceInvadersGame';
import MinesweeperGame from '../games/MinesweeperGame';
import CookieClickerGame from '../games/CookieClickerGame';
import EmulatorGame from '../games/EmulatorGame';

const builtInGames = {
  Game2048, SnakeGame, BreakoutGame, TetrisGame, FlappyBirdGame,
  PacmanGame, DinoGame, AsteroidsGame, PongGame, SpaceInvadersGame,
  MinesweeperGame, CookieClickerGame, EmulatorGame
};

export default function GamePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reportSent, setReportSent] = useState(false);

  const handleReport = async () => {
    if (!user || !game) return;
    try {
      await reportBroken({ game_id: game._id || game.id, game_title: game.title, game_slug: slug, description: '' });
      setReportSent(true);
    } catch {}
  };

  useEffect(() => {
    if (slug.startsWith('nebula-')) {
      const nebulaSlug = slug.replace('nebula-', '');
      fetch('/api/nebula/catalog?limit=1&search=' + encodeURIComponent(nebulaSlug))
        .then(r => r.json())
        .then(data => {
          const found = data.games?.find(g => g.slug === slug);
          if (found) {
            setGame({ ...found, _id: nebulaSlug, builtIn: false });
          } else {
            setGame({
              _id: nebulaSlug,
              title: nebulaSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              slug,
              description: 'Play this game from the NEBULA CDN collection',
              category: 'NEBULA',
              tags: [],
              embedUrl: `/games/${nebulaSlug}.html`,
              thumbnail: '',
              plays: 0,
              rating: 0,
              ratingCount: 0,
              builtIn: false
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      fetchGame(slug).then(r => {
        setGame(r.data.game);
        setLoading(false);
      }).catch(err => {
        console.error('Failed to fetch game:', err);
        setLoading(false);
      });
    }
  }, [slug]);

  const gameSlug = slug.startsWith('nebula-') ? null : slug;

  useEffect(() => {
    if (user && gameSlug) {
      fetchRating(gameSlug).then(r => setUserRating(r.data.score));
    }
  }, [user, gameSlug]);

  const handleRate = async (score) => {
    if (!user || !gameSlug) return;
    await rateGame(gameSlug, score);
    setUserRating(score);
    const updated = await fetchGame(gameSlug);
    setGame(updated.data.game);
  };

  const handleScoreSubmit = async () => {
    if (!user || !gameSlug || !score) return;
    await submitScore(gameSlug, score);
  };

  if (loading) return <div className="page loading">Loading...</div>;
  if (!game) return <div className="page">Game not found</div>;

  const BuiltInComponent = builtInGames[game.builtInComponent];
  const isNebula = slug.startsWith('nebula-');

  return (
    <div className="page game-page">
      <div className="game-page-header">
        <Link to="/games" className="back-link">← Back to Games</Link>
        <h1>{game.title}</h1>
      </div>

      <div className="game-player-wrapper" id="game-player">
        {game.builtIn && BuiltInComponent ? (
          <div className="game-builtin-container">
            <BuiltInComponent onScore={setScore} />
          </div>
        ) : (
          <iframe
            src={game.embedUrl}
            className="game-iframe"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-fullscreen"
            title={game.title}
          />
        )}
        <FullscreenButton targetId="game-player" />
      </div>

      {game.description && <p className="game-description">{game.description}</p>}
      {game.instructions && <div className="game-instructions"><strong>How to play:</strong> {game.instructions}</div>}

      <div className="game-meta-section">
        {!isNebula && (
          <div className="game-rating-section">
            <h3>Rate this game</h3>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  className={`star ${s <= (userRating || game.rating || 0) ? 'active' : ''}`}
                  onClick={() => handleRate(s)}
                  disabled={!user}
                >
                  ★
                </button>
              ))}
              <span className="rating-info">
                {game.rating} / 5 ({game.ratingCount} votes)
              </span>
            </div>
          </div>
        )}

        {game.builtIn && !isNebula && (
          <div className="game-score-section">
            <h3>Submit Score</h3>
            <div className="score-input">
              <input type="number" value={score} onChange={e => setScore(Number(e.target.value))} />
              <button onClick={handleScoreSubmit} disabled={!user || !score}>Submit</button>
            </div>
          </div>
        )}

        <div className="game-tags">
          {game.tags?.map(t => <span key={t} className="tag">{t}</span>)}
          {isNebula && <span className="tag" style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)' }}>NEBULA CDN</span>}
        </div>
        {user && !reportSent && (
          <button className="btn-report" onClick={handleReport} style={{ marginTop: '1rem' }}>Report Broken</button>
        )}
        {reportSent && <p className="report-thanks" style={{ marginTop: '1rem' }}>Thanks — we'll check it out.</p>}
      </div>
    </div>
  );
}
