import express from 'express';
import { updateReview, deleteReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Listing and creating reviews lives under /api/products/:id/reviews
router.route('/:id').put(protect, updateReview).delete(protect, deleteReview);

export default router;