import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../lib/async-handler.js';
import * as controller from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  adminLoginSchema,
  refreshSchema,
  logoutSchema,
} from './auth.schema.js';

export const authRouter = Router();

// Stricter rate limit for all auth endpoints — prevents brute force.
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please try again in 15 minutes.' },
});

// ── POST /api/auth/register ────────────────────────────────────────────────
authRouter.post(
  '/register',
  authLimit,
  validate(registerSchema),
  asyncHandler(controller.register),
);

// ── POST /api/auth/login ───────────────────────────────────────────────────
authRouter.post(
  '/login',
  authLimit,
  validate(loginSchema),
  asyncHandler(controller.login),
);

// ── POST /api/auth/admin/login ─────────────────────────────────────────────
authRouter.post(
  '/admin/login',
  authLimit,
  validate(adminLoginSchema),
  asyncHandler(controller.adminLogin),
);

// ── POST /api/auth/refresh ─────────────────────────────────────────────────
authRouter.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(controller.refresh),
);

// ── POST /api/auth/logout ──────────────────────────────────────────────────
authRouter.post(
  '/logout',
  validate(logoutSchema),
  asyncHandler(controller.logout),
);
