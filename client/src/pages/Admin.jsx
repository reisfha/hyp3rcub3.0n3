import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminFetchGames, adminCreateGame, adminUpdateGame, adminDeleteGame, adminFetchUsers, adminUpdateRole, adminFetchStats, adminFetchRequests, adminApproveRequest, adminDeleteRequest, adminUpdateRequest, adminFetchBrokenReports, adminResolveReport, adminDeleteReport, adminUpdateSlug } from '../api/client';

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('games');
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [requests, setRequests] = useState([]);
  const [approvedUrls, setApprovedUrls] = useState([]);
  const [editingReq, setEditingReq] = useState(null);
  const [reqForm, setReqForm] = useState({ title: '', description: '', admin_notes: '' });
  const [reports, setReports] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', slug: '', description: '', category: '', embedUrl: '', builtIn: false, builtInComponent: '', featured: false });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) navigate('/');
  }, [user, loading, navigate]);

  const load = async () => {
    const [g, u, s, r] = await Promise.all([adminFetchGames(), adminFetchUsers(), adminFetchStats(), adminFetchRequests()]);
    const [br] = await Promise.all([adminFetchBrokenReports()]);
    setGames(g.data.games);
    setUsers(u.data.users);
    setStats(s.data.stats);
    setRequests(r.data.requests);
    setApprovedUrls(r.data.approvedUrls || []);
    setReports(br.data.reports);
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
     const action = role === 'admin' ? 'promote to Admin' : 'demote to User';
     if (!confirm(`Are you sure you want to ${action}?`)) return;
     await adminUpdateRole(id, role);
     load();
   };

  return (
    <div className="page admin-page">
      <h1>⚙️ Admin Panel</h1>
      <div className="admin-tabs">
        {['games', 'users', 'stats', 'requests', 'broken'].map(t => (
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

      {tab === 'requests' && (
        <div className="admin-requests">
          <div className="admin-form">
            <h3>Game Requests</h3>
            <p>Review submitted game URL requests. Approve to auto-add to catalog.</p>
          </div>
          <table className="admin-table">
            <thead><tr><th>URL</th><th>Title</th><th>Submitter</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id || r._id}>
                  <td><a href={r.url} target="_blank" rel="noreferrer">{r.url}</a></td>
                  <td>
                    {editingReq === (r.id || r._id) ? (
                      <input value={reqForm.title} onChange={e => setReqForm({...reqForm, title: e.target.value})} />
                    ) : (
                      r.title || '-'
                    )}
                  </td>
                  <td>{r.submitter_username || r.submittedBy || '-'}</td>
                  <td><span className={`request-status status-${r.status}`}>{r.status}</span></td>
                  <td className="admin-actions">
                    {r.status !== 'approved' && (
                      <button onClick={async () => { await adminApproveRequest(r.id || r._id); load(); }}>Approve</button>
                    )}
                    {editingReq === (r.id || r._id) ? (
                      <>
                        <button onClick={async () => { await adminUpdateRequest(r.id || r._id, reqForm); setEditingReq(null); load(); }}>Save</button>
                        <button onClick={() => setEditingReq(null)}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => { setEditingReq(r.id || r._id); setReqForm({ title: r.title || '', description: r.description || '', admin_notes: r.admin_notes || '' }); }}>Edit</button>
                    )}
                    <button className="btn-danger" onClick={async () => { if (confirm('Delete this request?')) { await adminDeleteRequest(r.id || r._id); load(); } }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'broken' && (
        <div className="admin-broken">
          <h3>Broken Game Reports</h3>
          <table className="admin-table">
            <thead><tr><th>Game</th><th>Reporter</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id || r._id}>
                  <td>{r.game_title}</td>
                  <td>{r.reporter_username || r.reported_by || '-'}</td>
                  <td>{r.resolved ? 'Resolved' : 'Pending'}</td>
                  <td>{r.created_at}</td>
                  <td className="admin-actions">
                    {!r.resolved && <button onClick={async () => { await adminResolveReport(r.id || r._id); load(); }}>Resolve</button>}
                    <button className="btn-danger" onClick={async () => { if (confirm('Delete this report?')) { await adminDeleteReport(r.id || r._id); load(); } }}>Delete</button>
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
                 <td className="admin-actions">
                   {u.role === 'admin' ? (
                     <button className="btn-role-toggle" onClick={() => handleRole(u._id, 'user')}>Demote</button>
                   ) : (
                     <button className="btn-role-toggle" onClick={() => handleRole(u._id, 'admin')}>Promote</button>
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
