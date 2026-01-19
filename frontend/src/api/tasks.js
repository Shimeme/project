

import api from './http';

export const getTasks = () => api.get('/tasks');
export const createTask = (task) => api.post('/tasks', task);

export const completeTask = (task) => api.put(`/tasks/${task.id}/complete`);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

