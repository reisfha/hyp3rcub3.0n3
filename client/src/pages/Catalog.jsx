import { useState, useEffect } from 'react';
import { fetchGames, fetchCategories, fetchAvailableTags } from '../api/client';
import GameCard from '../components/GameCard';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import NebulaCatalog from '../components/NebulaCatalog';

export default function Catalog() {
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showNebula, setShowNebula] = useState(false);

  useEffect(() => { 
    fetchCategories().then(r => setCategories(r.data.categories));
    fetchAvailableTags().then(r => setAvailableTags(r.data.tags));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchGames({ search, category, sort, tags: selectedTags.length > 0 ? selectedTags : undefined, page, limit: 30 })
      .then(r => {
        setGames(r.data.games);
        setTotalPages(r.data.pages);
      })
      .finally(() => setLoading(false));
  }, [search, category, selectedTags, sort, page]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setPage(1);
  };

  if (showNebula) {
    return (
      <div className="page catalog-page">
        <div className="catalog-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h1>🌌 NEBULA CDN — All Games</h1>
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
            🌌 Browse All NEBULA Games
          </button>
        </div>
        
        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div className="tag-filter">
            <div className="tag-filter-label">Filter by Tags:</div>
            <div className="tag-filter-list">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  className={`tag-filter-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <button 
                className="btn-secondary" 
                onClick={() => { setSelectedTags([]); setPage(1); }}
                style={{ marginTop: 8 }}
              >
                Clear Tags
              </button>
            )}
          </div>
        )}
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
