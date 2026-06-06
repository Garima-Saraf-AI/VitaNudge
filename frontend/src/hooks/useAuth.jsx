import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firstLogin, setFirstLogin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('nt_token');
    if (token) {
      api.get('/auth/me')
        .then(data => setUser(data.user))
        .catch(() => localStorage.removeItem('nt_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('nt_token', data.token);
    setUser(data.user);
    if (data.first_login) setFirstLogin(true);
    return data;
  }

  async function register(name, email, password) {
    const data = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('nt_token', data.token);
    setUser(data.user);
    setFirstLogin(true);
    return data;
  }

  function logout() {
    localStorage.removeItem('nt_token');
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, setUser, login, register, logout, loading, firstLogin, setFirstLogin }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
