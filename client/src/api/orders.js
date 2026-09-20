import api from './axios';

export const createOrder = (data) => api.post('/orders', data).then((res) => res.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((res) => res.data);
export const getMyOrders = () => api.get('/orders/mine').then((res) => res.data);
export const cancelOrder = (id) => api.put(`/orders/${id}/cancel`).then((res) => res.data);
export const getAllOrders = (params) => api.get('/orders', { params }).then((res) => res.data);
export const updateOrderStatus = (id, status) =>
  api.put(`/orders/${id}/status`, { status }).then((res) => res.data);