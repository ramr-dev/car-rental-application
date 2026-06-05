import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './error.middleware.js';

// ─── JWT payload shape ─────────────────────────────────────────────────────

export interface JwtPayload {
  userId: number;
  role: 'CUSTOMER' | 'ADMIN';
}

// Augment Express Request so req.user is typed everywhere
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── requireAuth ──────────────────────────────────────────────────────────
// Verifies the Bearer token in Authorization header.
// Attaches decoded payload to req.user.
// Throws 401 if missing or invalid.

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, 'Token is invalid or expired', 'UNAUTHORIZED');
  }
}

// ─── requireAdmin ─────────────────────────────────────────────────────────
// Extends requireAuth — additionally enforces ADMIN role.
// Throws 403 if the authenticated user is not an admin.

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError(403, 'Admin access required', 'FORBIDDEN');
    }
    next();
  });
}
