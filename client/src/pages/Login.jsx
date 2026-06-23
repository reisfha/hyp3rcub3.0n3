import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await login({ username, password });
      setUser(r.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h1>Login</h1>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary">Login</button>
        </form>
        <p className="auth-switch">No account? <Link to="/register">Sign up</Link></p>
      </div>
    </div>
  );
}
