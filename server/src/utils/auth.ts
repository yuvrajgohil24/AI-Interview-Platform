import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// No default secret: a known fallback would let anyone forge tokens on any
// deployment that forgot to set one (staging, preview, etc.).
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set (add it to server/.env)');
}

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

// Access tokens are short-lived; the long-lived refresh token (see token.service) renews them
export const ACCESS_TOKEN_TTL_SEC = 15 * 60;

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SEC });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
};

export const AUTH_COOKIE = 'token';
export const REFRESH_COOKIE = 'refresh_token';

// httpOnly keeps tokens out of reach of page scripts (XSS). For a client and API on
// different sites set COOKIE_SAMESITE=none (requires HTTPS, so `secure` is forced on).
const sameSite = (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax';

const baseCookie = {
  httpOnly: true,
  sameSite,
  secure: process.env.NODE_ENV === 'production' || sameSite === 'none'
};

export const authCookieOptions = {
  ...baseCookie,
  maxAge: ACCESS_TOKEN_TTL_SEC * 1000,
  path: '/'
};

// The refresh token is only ever sent to the auth endpoints, never to the interview API
export const REFRESH_COOKIE_PATH = '/api/auth';
export const refreshCookieOptions = (maxAgeMs: number) => ({
  ...baseCookie,
  maxAge: maxAgeMs,
  path: REFRESH_COOKIE_PATH
});
