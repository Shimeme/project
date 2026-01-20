
import http from './http';

export const getDecorations = async () => {
  const res = await http.get('/decorations');
  return res.data;
};

export const buyDecoration = async (decoration) => {
  const res = await http.post('/decorations/buy', {
    decoration,
  });
  return res.data;
};
