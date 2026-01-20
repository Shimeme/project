
import http from './http';


export const login = async (email, password) => {
  return await http.post('/auth/login', { email, password });
};

export const register = async (email, password) => {
  return await http.post('/auth/register', { email, password });
};
export const getMe = async () => {
  const res = await http.get('/me');
  return res.data;
};

export const logout = () => {
  localStorage.removeItem('guildquest_token');
  localStorage.removeItem('guildquest_refresh_token');
  localStorage.removeItem('guildquest_user');
};

