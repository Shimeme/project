
import http from './http';

export const getTasks = async () => {
  const res = await http.get('/tasks');
  return res.data;
};

export const createTask = async ({ title, description, reward }) => {
  const res = await http.post('/tasks', {
    title,
    description,
    reward,
  });
  return res.data;
};

export const createBulkTasks = async (tasks) => {
  const res = await http.post('/tasks/bulk', { tasks });
  return res.data;
};

export const completeTask = async (id) => {
  const res = await http.post(`/tasks/${id}/complete`);
  return res.data;
};

export const deleteTask = async (id) => {
  const res = await http.delete(`/tasks/${id}`);
  return res.data;
};

