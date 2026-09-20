import 'dotenv/config';
import connectDB from './config/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Review from './models/Review.js';
import mongoose from 'mongoose';

const img = (text) => ({ url: `https://placehold.co/600x400?text=${encodeURIComponent(text)}` });

const products = [
  { name: 'Wireless Headphones', category: 'Electronics', brand: 'SoundCore', price: 79.99, countInStock: 25, isFeatured: true, description: 'Over-ear Bluetooth headphones with 30-hour battery life and active noise cancelling.' },
  { name: 'Mechanical Keyboard', category: 'Electronics', brand: 'KeyForge', price: 119.0, countInStock: 12, description: 'Hot-swappable mechanical keyboard with tactile switches and RGB backlight.' },
  { name: 'Smart Watch', category: 'Electronics', brand: 'Pulse', price: 199.5, countInStock: 8, isFeatured: true, description: 'Fitness tracking, heart rate monitor, and 5-day battery.' },
  { name: 'Running Shoes', category: 'Sports', brand: 'Stride', price: 89.0, countInStock: 40, description: 'Lightweight breathable running shoes with responsive cushioning.' },
  { name: 'Yoga Mat', category: 'Sports', brand: 'FlowFit', price: 24.99, countInStock: 60, description: 'Non-slip 6mm yoga mat with carrying strap.' },
  { name: 'Ceramic Coffee Mug', category: 'Home', brand: 'Hearth', price: 12.5, countInStock: 100, description: 'Handmade 350ml ceramic mug, dishwasher safe.' },
  { name: 'Desk Lamp', category: 'Home', brand: 'Lumen', price: 34.0, countInStock: 0, description: 'Adjustable LED desk lamp with three brightness levels.' },
  { name: 'Backpack', category: 'Fashion', brand: 'Trail', price: 54.9, countInStock: 30, isFeatured: true, description: 'Water-resistant 25L backpack with padded laptop compartment.' },
];

const run = async () => {
  await connectDB();
  await Promise.all([User.deleteMany(), Product.deleteMany(), Review.deleteMany()]);

  const admin = await User.create({
    name: 'Admin', email: 'admin@example.com', password: 'admin123', role: 'admin',
  });
  await User.create({
    name: 'Jane Customer', email: 'jane@example.com', password: 'jane123',
  });

  await Product.insertMany(
    products.map((p) => ({ ...p, images: [img(p.name)], createdBy: admin._id }))
  );

  console.log('Seeded 2 users and', products.length, 'products');
  console.log('Admin ID (use as createdBy in Step 2 tests):', admin._id.toString());
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});