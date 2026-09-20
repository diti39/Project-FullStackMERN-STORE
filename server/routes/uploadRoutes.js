import express from 'express';
import upload from '../middleware/upload.js';
import { uploadImages, deleteImage } from '../controllers/uploadController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// protect runs BEFORE multer, so anonymous users can't push files through the server
router.use(protect, adminOnly);

router.post('/', upload.array('images', 5), uploadImages);
router.delete('/', deleteImage);

export default router;