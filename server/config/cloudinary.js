import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// All product images live under this folder, so we can recognise (and safely delete) our own uploads
export const UPLOAD_FOLDER = 'mern-store/products';

export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

// Uploads an in-memory file buffer. Resolves with Cloudinary's result (secure_url, public_id, ...).
export const uploadBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: UPLOAD_FOLDER,
        resource_type: 'image',
        // Cloudinary checks the real file contents, not just the extension the client claimed
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        // Shrink huge originals before storing them
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

// Best-effort cleanup. Never throws: a failed cloud deletion must not break the request that triggered it.
export const deleteImages = async (publicIds = []) => {
  if (publicIds.length === 0 || !isCloudinaryConfigured) return;

  const results = await Promise.allSettled(publicIds.map((id) => cloudinary.uploader.destroy(id)));
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Failed to delete image ${publicIds[i]}:`, r.reason?.message || r.reason);
    }
  });
};