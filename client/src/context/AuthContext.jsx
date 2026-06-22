import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchMe } from '../api/client';

const AuthContext = createContext(null);

function parseToken(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = parseToken(token);
      if (payload) {
        setUser({ id: payload.id, username: payload.username, email: payload.email, role: payload.role });
        setLoading(false);
        return;
      }
    }
    fetchMe()
      .then(r => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const updateUser = useCallback((u) => {
    if (u && u.token) {
      localStorage.setItem('token', u.token);
      setUser(u.user);
    } else if (u) {
      setUser(u);
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser: updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
