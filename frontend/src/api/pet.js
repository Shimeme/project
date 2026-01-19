
import api from './http';

export const getPet = () => api.get('/pet');

export const feedPet = () => api.put('/pet/feed');
export const playWithPet = () => api.put('/pet/play');

