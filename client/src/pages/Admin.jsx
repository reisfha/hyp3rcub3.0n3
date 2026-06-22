import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminFetchGames, adminCreateGame, adminUpdateGame, adminDeleteGame, adminFetchUsers, adminUpdateRole, adminFetchStats } from '../api/client';

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('games');
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', slug: '', description: '', category: '', embedUrl: '', builtIn: false, builtInComponent: '', featured: false });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) navigate('/');
  }, [user, loading, navigate]);

  const load = async () => {
    const [g, u, s] = await Promise.all([adminFetchGames(), adminFetchUsers(), adminFetchStats()]);
    setGames(g.data.games);
    setUsers(u.data.users);
    setStats(s.data.stats);
  };

  useEffect(() => { if (user?.role === 'admin') load(); }, [user]);

  const handleSave = async () => {
    if (editing) {
      await adminUpdateGame(editing, form);
    } else {
      await adminCreateGame(form);
    }
    setEditing(null);
    setForm({ title: '', slug: '', description: '', category: '', embedUrl: '', builtIn: false, builtInComponent: '', featured: false });
    load();
  };

  const handleEdit = (g) => {
    setEditing(g._id);
    setForm(g);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this game?')) return;
    await adminDeleteGame(id);
    load();
  };

  const handleRole = async (id, role) => {
    await adminUpdateRole(id, role);
    load();
  };

  return (
    <div className="page admin-page">
      <h1>⚙️ Admin Panel</h1>
      <div className="admin-tabs">
        {['games', 'users', 'stats'].map(t => (
          <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="admin-stats">
          <div className="stat-card"><h3>{stats.games}</h3><p>Games</p></div>
          <div className="stat-card"><h3>{stats.users}</h3><p>Users</p></div>
          <div className="stat-card"><h3>{stats.scores}</h3><p>Score Submissions</p></div>
        </div>
      )}

      {tab === 'games' && (
        <div className="admin-games">
          <div className="admin-form">
            <h3>{editing ? 'Edit Game' : 'Add Game'}</h3>
            <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            <input placeholder="Slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} />
            <input placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <input placeholder="Embed URL" value={form.embedUrl} onChange={e => setForm({...form, embedUrl: e.target.value})} />
            <label><input type="checkbox" checked={form.builtIn} onChange={e => setForm({...form, builtIn: e.target.checked})} /> Built-in</label>
            <input placeholder="Built-in component name" value={form.builtInComponent} onChange={e => setForm({...form, builtInComponent: e.target.value})} />
            <label><input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} /> Featured</label>
            <button className="btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Add'} Game</button>
            {editing && <button onClick={() => { setEditing(null); setForm({ title: '', slug: '', description: '', category: '', embedUrl: '', builtIn: false, builtInComponent: '', featured: false }); }}>Cancel</button>}
          </div>
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Category</th><th>Plays</th><th>Actions</th></tr></thead>
            <tbody>
              {games.map(g => (
                <tr key={g._id}>
                  <td>{g.title}</td><td>{g.category}</td><td>{g.plays}</td>
                  <td className="admin-actions">
                    <button onClick={() => handleEdit(g)}>Edit</button>
                    <button className="btn-danger" onClick={() => handleDelete(g._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'users' && (
        <table className="admin-table">
          <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>{u.username}</td><td>{u.email}</td>
                <td><span className={`profile-role role-${u.role}`}>{u.role}</span></td>
                <td>
                  {u.role === 'admin' ? (
                    <button onClick={() => handleRole(u._id, 'user')}>Demote</button>
                  ) : (
                    <button onClick={() => handleRole(u._id, 'admin')}>Promote</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
