import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { deleteImages } from '../config/cloudinary.js';
import asyncHandler from '../utils/asyncHandler.js';

// Only these fields can be set from a request body
const ALLOWED_FIELDS = [
  'name', 'description', 'price', 'category', 'brand',
  'images', 'countInStock', 'isFeatured',
];

const pickAllowed = (body) =>
  Object.fromEntries(Object.entries(body).filter(([key]) => ALLOWED_FIELDS.includes(key)));

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1, numReviews: -1 },
};

// GET /api/products?keyword=&category=&minPrice=&maxPrice=&sort=&page=&limit=
export const getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, sort = 'newest' } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);

  const filter = {};
  if (keyword) filter.$text = { $search: keyword };
  if (category) filter.category = category;
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort(SORT_OPTIONS[sort] || SORT_OPTIONS.newest)
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({ products, page, pages: Math.ceil(total / limit), total });
});

// GET /api/products/categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json(categories);
});

// GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

// POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    ...pickAllowed(req.body),
    createdBy: req.user._id, // set by the protect middleware
  });
  res.status(201).json(product);
});

// PUT /api/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const oldImageIds = product.images.map((i) => i.publicId).filter(Boolean);

  Object.assign(product, pickAllowed(req.body));
  const updated = await product.save(); // runs validators

  // Only after the save succeeded: delete images that were removed from the product
  const keptIds = new Set(updated.images.map((i) => i.publicId));
  await deleteImages(oldImageIds.filter((id) => !keptIds.has(id)));

  res.json(updated);
});

// DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  await Review.deleteMany({ product: product._id });
  await deleteImages(product.images.map((i) => i.publicId).filter(Boolean));
  res.json({ message: 'Product removed' });
});