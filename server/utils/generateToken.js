import jwt from 'jsonwebtoken';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// 'lax' works when the browser reaches the API through the same domain as the website
// (the Vercel /api proxy in client/vercel.json). Only set COOKIE_SAMESITE=none if the client
// calls an API on a different domain directly; browsers such as Safari may then block the cookie.
const sameSite = process.env.COOKIE_SAMESITE || 'lax';

// Shared by login (set) and logout (clear): a cookie can only be cleared with matching attributes.
// maxAge is deliberately NOT here: Express 4's clearCookie would turn it into a future expiry.
export const cookieOptions = {
  httpOnly: true, // JavaScript on the page cannot read the token
  secure: process.env.NODE_ENV === 'production' || sameSite === 'none', // HTTPS only in production
  sameSite,
};

// Signs a JWT and stores it in an httpOnly cookie
const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('jwt', token, { ...cookieOptions, maxAge: SEVEN_DAYS });
};

export default generateToken;