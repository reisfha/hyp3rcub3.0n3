import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchGames, fetchScores } from '../api/client';

export default function Leaderboard() {
  const { slug } = useParams();
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    fetchGames({ limit: 200 }).then(r => setGames(r.data.games.filter(g => g.builtIn)));
  }, []);

  useEffect(() => {
    if (slug) {
      const g = games.find(g => g.slug === slug);
      if (g) {
        setSelectedGame(g);
        fetchScores(g._id).then(r => setScores(r.data.scores));
      }
    }
  }, [slug, games]);

  const handleSelect = (game) => {
    setSelectedGame(game);
    fetchScores(game._id).then(r => setScores(r.data.scores));
  };

  return (
    <div className="page leaderboard-page">
      <h1>🏆 Leaderboard</h1>
      <div className="leaderboard-layout">
        <div className="leaderboard-sidebar">
          <h3>Games</h3>
          {games.map(g => (
            <Link
              key={g._id}
              to={`/leaderboard/${g.slug}`}
              className={`lb-game ${selectedGame?._id === g._id ? 'active' : ''}`}
              onClick={() => handleSelect(g)}
            >
              {g.title}
            </Link>
          ))}
        </div>
        <div className="leaderboard-main">
          {selectedGame ? (
            <>
              <h2>{selectedGame.title}</h2>
              {scores.length === 0 ? (
                <p className="empty-hint">No scores yet. Be the first!</p>
              ) : (
                <table className="lb-table">
                  <thead>
                    <tr><th>#</th><th>Player</th><th>Score</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {scores.map((s, i) => (
                      <tr key={s._id} className={i < 3 ? `lb-top lb-top-${i + 1}` : ''}>
                        <td>{i + 1}</td>
                        <td>{s.username}</td>
                        <td>{s.value.toLocaleString()}</td>
                        <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <p className="empty-hint">Select a game to view its leaderboard</p>
          )}
        </div>
      </div>
    </div>
  );
}
