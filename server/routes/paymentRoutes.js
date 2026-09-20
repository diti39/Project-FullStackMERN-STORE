import express from 'express';
import { createPaymentIntent, syncPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// The webhook is NOT here: it needs the raw request body, so app.js registers it before express.json()
router.post('/create-intent', protect, createPaymentIntent);
router.post('/sync', protect, syncPayment);

export default router;