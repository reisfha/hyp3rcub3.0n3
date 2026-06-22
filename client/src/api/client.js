import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) localStorage.removeItem('token');
  return Promise.reject(err);
});

export const fetchGames = (params) => api.get('/games', { params });
export const fetchFeatured = () => api.get('/games/featured');
export const fetchCategories = () => api.get('/games/categories');
export const fetchGame = (slug) => api.get(`/games/${slug}`);
export const rateGame = (slug, score) => api.post(`/games/${slug}/rate`, { score });
export const fetchRating = (slug) => api.get(`/games/${slug}/rating`);
export const toggleFavorite = (slug) => api.post(`/games/${slug}/favorite`);
export const fetchScores = (slug) => api.get(`/games/${slug}/scores`);
export const submitScore = (slug, score) => api.post(`/games/${slug}/score`, { score });

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const fetchMe = () => api.get('/auth/me');

export const adminFetchGames = () => api.get('/admin/games');
export const adminCreateGame = (data) => api.post('/admin/games', data);
export const adminUpdateGame = (id, data) => api.put(`/admin/games/${id}`, data);
export const adminDeleteGame = (id) => api.delete(`/admin/games/${id}`);
export const adminFetchUsers = () => api.get('/admin/users');
export const adminUpdateRole = (id, role) => api.put(`/admin/users/${id}/role`, { role });
export const adminFetchStats = () => api.get('/admin/stats');
export const adminDeleteUser = (id) => api.delete(`/admin/users/${id}`);

export default api;
