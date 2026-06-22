import { useState, useEffect } from 'react';
import { fetchGames, fetchCategories } from '../api/client';
import GameCard from '../components/GameCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import NebulaCatalog from '../components/NebulaCatalog';

export default function Catalog() {
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showNebula, setShowNebula] = useState(false);

  useEffect(() => { fetchCategories().then(r => setCategories(r.data.categories)); }, []);

  useEffect(() => {
    setLoading(true);
    fetchGames({ search, category, sort, page, limit: 30 })
      .then(r => {
        setGames(r.data.games);
        setTotalPages(r.data.pages);
      })
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  if (showNebula) {
    return (
      <div className="page catalog-page">
        <div className="catalog-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h1>🌌 NEBULA CDN — 2,790 Games</h1>
            <button className="btn-secondary" onClick={() => setShowNebula(false)}>← Back to Main Catalog</button>
          </div>
        </div>
        <NebulaCatalog />
      </div>
    );
  }

  return (
    <div className="page catalog-page">
      <div className="catalog-header">
        <h1>🎮 All Games</h1>
        <SearchBar value={search} onChange={handleSearch} />
        <div className="catalog-controls">
          <CategoryFilter categories={categories} selected={category} onSelect={(c) => { setCategory(c); setPage(1); }} />
          <select className="sort-select" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
            <option value="">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="name">A-Z</option>
          </select>
          <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setShowNebula(true)}>
            🌌 Browse 2,790+ NEBULA Games
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : games.length === 0 ? (
        <div className="empty-state">
          <h2>No games found</h2>
          <p>Try a different search or category</p>
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
