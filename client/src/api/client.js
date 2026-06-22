import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

export const fetchGames = (params) => api.get('/games', { params });
export const fetchFeatured = () => api.get('/games/featured');
export const fetchCategories = () => api.get('/games/categories');
export const fetchGame = (slug) => api.get(`/games/${slug}`);
export const rateGame = (id, score) => api.post(`/games/${id}/rate`, { score });
export const fetchRating = (id) => api.get(`/games/${id}/rating`);
export const toggleFavorite = (id) => api.post(`/games/${id}/favorite`);
export const fetchScores = (id) => api.get(`/games/${id}/scores`);
export const submitScore = (id, value) => api.post(`/games/${id}/scores`, { value });

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const fetchMe = () => api.get('/auth/me');
export const logout = () => api.get('/auth/logout');

export const adminFetchGames = () => api.get('/admin/games');
export const adminCreateGame = (data) => api.post('/admin/games', data);
export const adminUpdateGame = (id, data) => api.put(`/admin/games/${id}`, data);
export const adminDeleteGame = (id) => api.delete(`/admin/games/${id}`);
export const adminFetchUsers = () => api.get('/admin/users');
export const adminUpdateRole = (id, role) => api.put(`/admin/users/${id}/role`, { role });
export const adminFetchStats = () => api.get('/admin/stats');

export default api;
