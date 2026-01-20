
import http from './http';

export const getPet = async () => {
  const res = await http.get('/pet');
  return res.data;
};

export const feedPet = async () => {
  const res = await http.post('/pet/feed');
  return res.data;
};

export const playWithPet = async () => {
  const res = await http.post('/pet/play');
  return res.data;
};

