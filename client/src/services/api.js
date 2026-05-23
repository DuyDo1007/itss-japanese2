import axios from 'axios';

/**
 * Axios instance dùng chung — tự động prefix /api
 * Vite proxy đã cấu hình chuyển /api → http://localhost:5000
 */
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 600000,
});

// Response interceptor — unwrap data.data
api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data || err.message)
);

export default api;
