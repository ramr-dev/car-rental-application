import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../lib/async-handler.js';
import * as controller from './admin.controller.js';
import {
  userIdParamSchema,
  kycIdParamSchema,
  userListQuerySchema,
  updateRoleSchema,
  updateBlockSchema,
  kycListQuerySchema,
  kycReviewSchema,
} from './admin.schema.js';

export const adminRouter = Router();

// All admin routes require ADMIN role — applied once here for the whole router
adminRouter.use(requireAdmin);

// ── Customer management ───────────────────────────────────────────────────

// GET /api/admin/users
// List all users with optional search, role, kycStatus, isBlocked filters
adminRouter.get(
  '/users',
  validate(userListQuerySchema, 'query'),
  asyncHandler(controller.listUsers),
);

// PATCH /api/admin/users/:id/role
// Change a user's role between CUSTOMER and ADMIN
adminRouter.patch(
  '/users/:id/role',
  validate(userIdParamSchema, 'params'),
  validate(updateRoleSchema),
  asyncHandler(controller.updateUserRole),
);

// PATCH /api/admin/users/:id/block
// Block or unblock a customer account
// Blocking also invalidates all their active refresh tokens
adminRouter.patch(
  '/users/:id/block',
  validate(userIdParamSchema, 'params'),
  validate(updateBlockSchema),
  asyncHandler(controller.updateBlockStatus),
);

// ── KYC management ────────────────────────────────────────────────────────

// GET /api/admin/kyc
// List KYC document submissions, filterable by status
adminRouter.get(
  '/kyc',
  validate(kycListQuerySchema, 'query'),
  asyncHandler(controller.listKyc),
);

// PATCH /api/admin/kyc/:id/review
// Approve or reject a KYC submission — also updates the user's kycStatus
adminRouter.patch(
  '/kyc/:id/review',
  validate(kycIdParamSchema, 'params'),
  validate(kycReviewSchema),
  asyncHandler(controller.reviewKyc),
);

// ── Dashboard statistics (Phase 7) ────────────────────────────────────────

adminRouter.get('/stats/dashboard', (_req, res) => {
  res.status(501).json({ message: 'Not implemented — Phase 7' });
});

adminRouter.get('/stats/revenue', (_req, res) => {
  res.status(501).json({ message: 'Not implemented — Phase 7' });
});

adminRouter.get('/stats/bookings', (_req, res) => {
  res.status(501).json({ message: 'Not implemented — Phase 7' });
});
