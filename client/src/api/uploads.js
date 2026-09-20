import api from './axios';

// files: array of File objects. Returns [{ url, publicId }]
export const uploadImages = (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  // No Content-Type header: the browser sets multipart/form-data with the correct boundary
  return api.post('/uploads', formData).then((res) => res.data);
};

export const deleteUploadedImage = (publicId) =>
  api.delete('/uploads', { params: { publicId } }).then((res) => res.data);