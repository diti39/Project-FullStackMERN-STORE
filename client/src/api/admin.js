import api from './axios';

export const getStats = () => api.get('/admin/stats').then((res) => res.data);