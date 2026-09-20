import express from 'express';
import { getStats } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Everything under /api/admin requires an admin
router.use(protect, adminOnly);

router.get('/stats', getStats);

export default router;