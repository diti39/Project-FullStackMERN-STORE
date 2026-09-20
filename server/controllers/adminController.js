import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';

const LOW_STOCK_THRESHOLD = 5;

// GET /api/admin/stats
export const getStats = asyncHandler(async (req, res) => {
  const [users, products, orders, revenueAgg, statusAgg, lowStock, recentOrders] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    // Revenue = money actually received
    Order.aggregate([
      { $match: { isPaid: true, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.find({ countInStock: { $lte: LOW_STOCK_THRESHOLD } })
      .sort({ countInStock: 1 })
      .limit(5)
      .select('name countInStock'),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name'),
  ]);

  res.json({
    users,
    products,
    orders,
    revenue: Math.round((revenueAgg[0]?.total ?? 0) * 100) / 100,
    ordersByStatus: Object.fromEntries(statusAgg.map((s) => [s._id, s.count])),
    lowStock,
    recentOrders,
  });
});