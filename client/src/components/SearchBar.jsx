export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-bar">
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Search games...'}
      />
      {value && (
        <button className="search-clear" onClick={() => onChange('')}>×</button>
      )}
    </div>
  );
}
