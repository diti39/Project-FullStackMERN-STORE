// Creates an admin account (or promotes an existing user) WITHOUT touching any other data.
// Unlike seed.js, this is safe to run against a production database.
//
// Usage:
//   node --env-file=.env.production createAdmin.js you@example.com "a-strong-password" "Your Name"
//
// .env.production only needs a MONGO_URI line that points at your production database.
import 'dotenv/config'; // fallback to .env; variables from --env-file take priority
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

const [email, password, name = 'Admin'] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node createAdmin.js <email> <password> [name]');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Please use a password of at least 10 characters.');
  process.exit(1);
}

await connectDB();

try {
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    existing.role = 'admin'; // promote only; the password is left unchanged
    await existing.save();
    console.log(`${email} already existed and is now an admin (password unchanged).`);
  } else {
    await User.create({ name, email, password, role: 'admin' });
    console.log(`Admin created: ${email}`);
  }
} finally {
  await mongoose.disconnect();
}