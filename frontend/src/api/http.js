

// api/http.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://unhid-unretiring-kyler.ngrok-free.dev/api/v1', // <- добавляем /api/v1
});

export default api;

