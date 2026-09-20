import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  UPLOAD_FOLDER,
  isCloudinaryConfigured,
  uploadBuffer,
  deleteImages,
} from '../config/cloudinary.js';

// POST /api/uploads  (multipart/form-data, field name "images")
// Returns [{ url, publicId }]. The client puts these into the product form and saves them with the product.
export const uploadImages = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured) {
    res.status(500);
    throw new Error('Image uploads are not configured on the server (check the CLOUDINARY_* variables)');
  }
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No images were uploaded');
  }

  const results = await Promise.allSettled(req.files.map((file) => uploadBuffer(file.buffer)));

  const uploaded = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => ({ url: r.value.secure_url, publicId: r.value.public_id }));

  // All or nothing: if any file failed, remove the ones that did upload
  if (uploaded.length !== req.files.length) {
    results
      .filter((r) => r.status === 'rejected')
      .forEach((r) => console.error('Cloudinary upload failed:', r.reason?.message || r.reason));
    await deleteImages(uploaded.map((img) => img.publicId));
    res.status(502);
    throw new Error('Image upload failed. Check that the files are valid images and try again.');
  }

  res.status(201).json(uploaded);
});

// DELETE /api/uploads?publicId=...
// Used when an admin removes an image they just uploaded but haven't saved yet.
export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.query;

  if (typeof publicId !== 'string' || !publicId.startsWith(`${UPLOAD_FOLDER}/`)) {
    res.status(400);
    throw new Error('Invalid image id');
  }

  // Never delete an image a product is still using
  if (await Product.exists({ 'images.publicId': publicId })) {
    res.status(400);
    throw new Error('This image is used by a product');
  }

  await deleteImages([publicId]);
  res.json({ message: 'Image removed' });
});