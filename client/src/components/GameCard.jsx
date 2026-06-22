import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toggleFavorite } from '../api/client';
import { useState } from 'react';

export default function GameCard({ game, onFavoriteToggle }) {
  const { user } = useAuth();
  const [faved, setFaved] = useState(user?.favorites?.includes(game._id));

  const handleFav = async (e) => {
    e.preventDefault();
    if (!user) return;
    await toggleFavorite(game._id);
    setFaved(!faved);
    onFavoriteToggle?.();
  };

  return (
    <Link to={`/game/${game.slug}`} className="game-card">
      <div className="game-card-thumb">
        {game.thumbnail ? (
          <img src={game.thumbnail} alt={game.title} />
        ) : (
          <div className="game-card-placeholder">
            <span className="placeholder-icon">{game.title[0]}</span>
          </div>
        )}
        <span className="game-card-category">{game.category}</span>
        {user && (
          <button className={`game-card-fav ${faved ? 'faved' : ''}`} onClick={handleFav}>
            {faved ? '★' : '☆'}
          </button>
        )}
      </div>
      <div className="game-card-info">
        <h3>{game.title}</h3>
        <div className="game-card-meta">
          <span className="game-rating">
            {'★'.repeat(Math.round(game.rating || 0))}{'☆'.repeat(5 - Math.round(game.rating || 0))}
            <small> ({game.ratingCount})</small>
          </span>
          <span className="game-plays">{game.plays} plays</span>
        </div>
      </div>
    </Link>
  );
}
