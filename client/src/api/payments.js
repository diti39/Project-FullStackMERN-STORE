import api from './axios';

export const createPaymentIntent = (orderId) =>
  api.post('/payments/create-intent', { orderId }).then((res) => res.data);

export const syncPayment = (orderId) =>
  api.post('/payments/sync', { orderId }).then((res) => res.data);