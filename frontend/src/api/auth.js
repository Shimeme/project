
import api from './http';

// login возвращает токен
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

// register нового пользователя
export const register = (email, password, name) =>
  api.post('/auth/register', { email, password, name });

// получить данные текущего пользователя
export const getMe = (token) =>
  api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });

