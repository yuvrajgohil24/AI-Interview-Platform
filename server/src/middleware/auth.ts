import { Request, Response, NextFunction } from 'express';
import { AUTH_COOKIE, verifyToken } from '../utils/auth';

export interface AuthedRequest extends Request {
  userId: string;
}

// Reads the JWT from the httpOnly cookie, falling back to a Bearer header (API clients, tests)
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.[AUTH_COOKIE] || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: "Invalid token" });
  (req as AuthedRequest).userId = decoded.userId;
  next();
};
