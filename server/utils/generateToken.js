import jwt from 'jsonwebtoken';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// Signs a JWT and stores it in an httpOnly cookie (JS on the page can't read it)
const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProd,                    // HTTPS only in production
    sameSite: isProd ? 'none' : 'lax', // 'none' needed when client and API are on different domains
    maxAge: SEVEN_DAYS,
  });
};

export default generateToken;