
import axios from 'axios';
import { API_BASE_URL } from '../config';

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('guildquest_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401 handler
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('guildquest_token');
      localStorage.removeItem('guildquest_refresh_token');
      localStorage.removeItem('guildquest_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default http;

