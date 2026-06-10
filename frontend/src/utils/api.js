import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const apiBaseURL = normalizeApiUrl(rawApiUrl);

const api = axios.create({ baseURL: apiBaseURL });

function normalizeApiUrl(value) {
  const trimmed = String(value || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '/api';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem('nt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    // Only auto-redirect to login for 401 errors on protected routes
    // Don't redirect on login/register failures (let the page handle the error)
    const isAuthEndpoint = err.config?.url?.includes('/auth/login') || err.config?.url?.includes('/auth/register');

    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('nt_token');
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default api;
