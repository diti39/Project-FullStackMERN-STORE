import api from './axios';

export const getProductReviews = (productId, params) =>
  api.get(`/products/${productId}/reviews`, { params }).then((res) => res.data);
export const createReview = (productId, data) =>
  api.post(`/products/${productId}/reviews`, data).then((res) => res.data);
export const updateReview = (reviewId, data) =>
  api.put(`/reviews/${reviewId}`, data).then((res) => res.data);
export const deleteReview = (reviewId) =>
  api.delete(`/reviews/${reviewId}`).then((res) => res.data);