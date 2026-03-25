import axios from 'axios';

// In production (HF Spaces), frontend is served from the same origin as backend
// so we use empty string (relative URLs). In dev, use VITE_API_URL or localhost.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('truthfeed_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 auto logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('truthfeed_token');
      localStorage.removeItem('truthfeed_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────
export const signup = (username, email, password) =>
  api.post('/auth/signup', { username, email, password });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const logout = () =>
  api.post('/auth/logout');

export const getMe = () =>
  api.get('/auth/me');

// ─── News ─────────────────────────────────────────
export const postNews = (title, content, category) =>
  api.post('/news/post', { title, content, category });

export const getFeed = (page = 1, limit = 10) =>
  api.get(`/news/feed?page=${page}&limit=${limit}`);

export const getTrending = () =>
  api.get('/news/trending');

export const getBreaking = () =>
  api.get('/news/breaking');

export const searchNews = (query) =>
  api.get(`/news/search?query=${encodeURIComponent(query)}`);

export const getMyPosts = () =>
  api.get('/news/my-posts');

export const getNewsByCategory = (category) =>
  api.get(`/news/category/${encodeURIComponent(category)}`);

export const getNewsDetail = (id) =>
  api.get(`/news/${id}`);

export const deleteMyNews = (id) =>
  api.delete(`/news/${id}`);

// ─── Engagement ───────────────────────────────────
export const upvote = (id) =>
  api.post(`/engagement/${id}/upvote`);

export const downvote = (id) =>
  api.post(`/engagement/${id}/downvote`);

export const bookmark = (id) =>
  api.post(`/engagement/${id}/bookmark`);

export const getBookmarks = () =>
  api.get('/engagement/bookmarks/me');

export const addComment = (id, content) =>
  api.post(`/engagement/${id}/comment`, { content });

export const getComments = (id) =>
  api.get(`/engagement/${id}/comments`);

export const getBookmarkStatus = (id) =>
  api.get(`/engagement/${id}/bookmark-status`);


// ─── Admin ────────────────────────────────────────
export const getDashboard = () =>
  api.get('/admin/dashboard');

export const getAnalytics = () =>
  api.get('/admin/analytics');

export const getAllNews = () =>
  api.get('/admin/all-news');

export const getRejected = () =>
  api.get('/admin/rejected');

export const overrideNews = (id) =>
  api.post(`/admin/override/${id}`);

export const deleteNews = (id) =>
  api.delete(`/admin/delete/${id}`);

export default api;
