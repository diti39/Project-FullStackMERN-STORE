import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // send the httpOnly JWT cookie with every request
});

// Turns any axios error into a readable message for the UI
export const getErrorMessage = (err) =>
  err.response?.data?.message || err.message || 'Something went wrong';

export default api;