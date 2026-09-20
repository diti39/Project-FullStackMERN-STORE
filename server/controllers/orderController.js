import Order from '../models/Order.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import { cancelPaymentIntent, refundPaymentIntent } from '../config/stripe.js';

const FREE_SHIPPING_OVER = 100;
const SHIPPING_FEE = 10;
const TAX_RATE = 0.1;
const FINAL_STATUSES = ['cancelled', 'delivered'];

const round2 = (n) => Math.round(n * 100) / 100;

// Give stock back (used on cancellation or when order creation fails midway)
const restoreStock = (items) =>
  Product.bulkWrite(
    items.map((i) => ({
      updateOne: { filter: { _id: i.product }, update: { $inc: { countInStock: i.qty } } },
    }))
  );

// POST /api/orders
// Body: { orderItems: [{ product, qty }], shippingAddress: {...}, paymentMethod? }
// The client only sends product ids and quantities. Prices come from the database.
export const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Validate quantities and merge duplicate products
  const qtyById = new Map();
  for (const item of orderItems) {
    const qty = Number(item.qty);
    if (!item.product || !Number.isInteger(qty) || qty < 1) {
      res.status(400);
      throw new Error('Each item needs a product id and a whole-number qty of at least 1');
    }
    const id = String(item.product);
    qtyById.set(id, (qtyById.get(id) || 0) + qty);
  }

  // Load the real products (an invalid id triggers a CastError, handled as 400)
  const products = await Product.find({ _id: { $in: [...qtyById.keys()] } });
  if (products.length !== qtyById.size) {
    res.status(404);
    throw new Error('One or more products were not found');
  }

  // Snapshot name, image and price from the database
  const items = products.map((p) => ({
    product: p._id,
    name: p.name,
    image: p.images[0]?.url,
    price: p.price,
    qty: qtyById.get(String(p._id)),
  }));

  const itemsPrice = round2(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  const shippingPrice = itemsPrice > FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  const taxPrice = round2(itemsPrice * TAX_RATE);
  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

  // Reserve stock. Each update only succeeds if enough stock remains, so two
  // simultaneous buyers can never both get the last item.
  const reserved = [];
  try {
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, countInStock: { $gte: item.qty } },
        { $inc: { countInStock: -item.qty } }
      );
      if (!updated) {
        res.status(400);
        throw new Error(`Not enough stock for "${item.name}"`);
      }
      reserved.push(item);
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems: items,
      shippingAddress,
      paymentMethod: paymentMethod || 'stripe',
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

    res.status(201).json(order);
  } catch (err) {
    // Undo any stock we already took
    if (reserved.length) await restoreStock(reserved);
    throw err;
  }
});

// GET /api/orders/mine
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id  (owner or admin)
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const isOwner = String(order.user._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not allowed to view this order');
  }

  res.json(order);
});

// PUT /api/orders/:id/cancel  (owner, only while pending and unpaid)
export const cancelMyOrder = asyncHandler(async (req, res) => {
  // One atomic update: also prevents cancelling twice and restoring stock twice
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: 'pending', isPaid: false },
    { status: 'cancelled' },
    { new: true }
  );

  if (!order) {
    res.status(400);
    throw new Error('Order not found, or it can no longer be cancelled');
  }

  await restoreStock(order.orderItems);
  await cancelPaymentIntent(order.paymentIntentId); // the customer can't pay a cancelled order
  res.json(order);
});

// GET /api/orders?status=&page=&limit=  (admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({ orders, page, pages: Math.ceil(total / limit), total });
});

// PUT /api/orders/:id/status  (admin)  Body: { status }
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = Order.schema.path('status').enumValues;

  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${allowed.join(', ')}`);
  }

  const update = { status };
  if (status === 'delivered') update.deliveredAt = new Date();

  // Cancelled and delivered orders are final
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, status: { $nin: FINAL_STATUSES } },
    update,
    { new: true, runValidators: true }
  );

  if (!order) {
    res.status(400);
    throw new Error('Order not found, or it is already cancelled/delivered');
  }

  if (status === 'cancelled') {
    await restoreStock(order.orderItems);
    // Paid orders are refunded automatically; unpaid ones just lose their open payment
    if (order.isPaid) await refundPaymentIntent(order.paymentIntentId);
    else await cancelPaymentIntent(order.paymentIntentId);
  }
  res.json(order);
});