import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';

// Never send the password hash back
const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  // Role is NOT taken from the body, so nobody can register themselves as admin
  const user = await User.create({ name, email, password });

  generateToken(res, user._id);
  res.status(201).json(userResponse(user));
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  // password has select:false, so we must ask for it explicitly
  const user = await User.findOne({ email }).select('+password');

  // Same message for both failures so attackers can't tell which emails exist
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  generateToken(res, user._id);
  res.json(userResponse(user));
});

// POST /api/auth/logout
export const logout = (req, res) => {
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out' });
};

// GET /api/auth/me
export const getMe = (req, res) => {
  res.json(userResponse(req.user));
};

// PUT /api/auth/profile
// Body: { name?, email?, currentPassword?, newPassword? }
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;

  // Need the hash to verify the current password
  const user = await User.findById(req.user._id).select('+password');

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;

  if (newPassword) {
    if (!currentPassword || !(await user.matchPassword(currentPassword))) {
      res.status(400);
      throw new Error('Current password is incorrect');
    }
    user.password = newPassword; // hashed by the pre-save hook; minlength is validated by the schema
  }

  await user.save();
  res.json(userResponse(user));
});