import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createOrder).get(protect, adminOnly, getAllOrders);

// '/mine' must be declared before '/:id'
router.get('/mine', protect, getMyOrders);

router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelMyOrder);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;