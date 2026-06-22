import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchGames } from '../api/client';
import GameCard from '../components/GameCard';

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [favGames, setFavGames] = useState([]);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.favorites?.length) {
      fetchGames({ limit: 200 }).then(r => {
        const favs = r.data.games.filter(g => user.favorites.includes(g._id));
        setFavGames(favs);
      });
    }
  }, [user]);

  if (loading || !user) return <div className="page loading">Loading...</div>;

  return (
    <div className="page profile-page">
      <div className="profile-card">
        <div className="profile-avatar">
          {user.avatar ? <img src={user.avatar} alt="" /> : <div className="avatar-placeholder">{user.username[0]}</div>}
        </div>
        <h1>{user.username}</h1>
        <p className="profile-email">{user.email}</p>
        <span className={`profile-role role-${user.role}`}>{user.role}</span>
      </div>

      <section className="section">
        <h2>⭐ Favorites ({favGames.length})</h2>
        {favGames.length === 0 ? (
          <p className="empty-hint">No favorites yet. Browse games and click ☆ to add!</p>
        ) : (
          <div className="game-grid">
            {favGames.map(g => <GameCard key={g._id} game={g} />)}
          </div>
        )}
      </section>
    </div>
  );
}
