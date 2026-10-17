import { Response, Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import {
  hashPassword, comparePassword, generateToken,
  AUTH_COOKIE, REFRESH_COOKIE, authCookieOptions, refreshCookieOptions
} from '../utils/auth';
import {
  issueRefreshToken, rotateRefreshToken, revokeRefreshToken, deleteExpiredTokens, REFRESH_TTL_MS
} from '../services/token.service';
import { authenticate, AuthedRequest } from '../middleware/auth';

const router = Router();

const publicUser = (u: { id: string; email: string; name: string | null }) => ({
  id: u.id,
  email: u.email,
  name: u.name || u.email.split('@')[0]
});

const setAccessCookie = (res: Response, userId: string) =>
  res.cookie(AUTH_COOKIE, generateToken(userId), authCookieOptions);

const setRefreshCookie = (res: Response, token: string) =>
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions(REFRESH_TTL_MS));

const clearAuthCookies = (res: Response) => {
  const { maxAge: _a, ...access } = authCookieOptions;
  const { maxAge: _r, ...refresh } = refreshCookieOptions(0);
  res.clearCookie(AUTH_COOKIE, access);
  res.clearCookie(REFRESH_COOKIE, refresh);
};

// Begins a login: short-lived access cookie + a fresh refresh-token family
const startSession = async (res: Response, userId: string) => {
  setAccessCookie(res, userId);
  setRefreshCookie(res, await issueRefreshToken(userId));
};

const email = z.string().trim().toLowerCase().email().max(254);

const signupSchema = z.object({
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().trim().min(1).max(100).optional()
});

const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128)
});

router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password, name } = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    await startSession(res, user.id);
    res.json({ user: publicUser(user) });
  } catch (error: any) {
    // Unique-constraint race: two signups for the same email at once
    if (error?.code === 'P2002') return res.status(400).json({ error: "User already exists" });
    console.error(error);
    res.status(500).json({ error: "Signup failed" });
  }
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Valid email and password required" });
  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await deleteExpiredTokens(user.id);
    await startSession(res, user.id);
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Trades a valid refresh cookie for a new access token and a rotated refresh token
router.post('/refresh', async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (!raw) return res.status(401).json({ error: "No refresh token" });

  try {
    const result = await rotateRefreshToken(raw);
    if (result.status === 'invalid') {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Session expired, please log in again" });
    }

    // Make sure the account still exists before minting a new access token
    const user = await prisma.user.findUnique({ where: { id: result.userId } });
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Session expired, please log in again" });
    }

    setAccessCookie(res, user.id);
    // 'grace' = a concurrent request already rotated; the browser has its new refresh cookie
    if (result.status === 'rotated') setRefreshCookie(res, result.refreshToken);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Refresh failed" });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: (req as AuthedRequest).userId } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (raw) await revokeRefreshToken(raw);
  } catch (error) {
    console.error(error);
  }
  clearAuthCookies(res);
  res.json({ success: true });
});

export default router;
