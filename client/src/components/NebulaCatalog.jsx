import { useState, useEffect } from 'react';
import GameCard from './GameCard';
import SearchBar from './SearchBar';

const CDN = 'https://cdn.jsdelivr.net/gh/GoatTech-42/NEBULA-CDN@main';

export default function NebulaCatalog() {
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadPage = async (p) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: '48' });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const r = await fetch(`/api/nebula/catalog?${params}`);
      const data = await r.json();
      setGames(data.games);
      setTotalPages(data.pages || 1);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      setGames([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch('/api/nebula/categories')
      .then(r => r.json())
      .then(data => { setCategories(data.categories || []); setStats(data.stats); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadPage(page);
  }, [page, category]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(window._nebulaSearch);
    window._nebulaSearch = setTimeout(() => { setPage(1); loadPage(1); }, 400);
  };

  return (
    <div>
      <div className="catalog-controls" style={{ marginBottom: 16 }}>
        <SearchBar value={search} onChange={handleSearch} placeholder="Search NEBULA games..." />
        <select className="sort-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {stats && (
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 12 }}>
          {stats.totalGames} games · {stats.categories?.length || 0} categories · ~{Math.round(stats.totalSizeMB)} MB
        </p>
      )}
      {loading ? (
        <div className="loading">Loading nebula games...</div>
      ) : games.length === 0 ? (
        <div className="empty-state">
          <h2>No games found in NEBULA</h2>
          <p>The search didn't match any games</p>
        </div>
      ) : (
        <>
          <div className="game-grid">
            {games.map(g => <GameCard key={g._id} game={g} />)}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
