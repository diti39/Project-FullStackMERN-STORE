import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/products/:id/reviews?page=&limit=
export const getProductReviews = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

  if (!(await Product.exists({ _id: productId }))) {
    res.status(404);
    throw new Error('Product not found');
  }

  const [total, reviews] = await Promise.all([
    Review.countDocuments({ product: productId }),
    Review.find({ product: productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({ reviews, page, pages: Math.ceil(total / limit), total });
});

// POST /api/products/:id/reviews
export const createReview = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const { rating, comment } = req.body;

  if (!(await Product.exists({ _id: productId }))) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Only customers whose order for this product was delivered can review it
  const hasPurchased = await Order.exists({
    user: req.user._id,
    status: 'delivered',
    'orderItems.product': productId,
  });
  if (!hasPurchased) {
    res.status(403);
    throw new Error('You can only review products you have received');
  }

  if (await Review.exists({ user: req.user._id, product: productId })) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    comment,
  });

  res.status(201).json(review);
});

// PUT /api/reviews/:id  (author only)
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (String(review.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own review');
  }

  // Only these two fields can change
  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment;

  const updated = await review.save(); // validators + rating recalculation hook
  res.json(updated);
});

// DELETE /api/reviews/:id  (author or admin)
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const isAuthor = String(review.user) === String(req.user._id);
  if (!isAuthor && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not allowed to delete this review');
  }

  await Review.findOneAndDelete({ _id: review._id }); // triggers the rating recalculation hook
  res.json({ message: 'Review removed' });
});