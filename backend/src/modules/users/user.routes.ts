import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { kycUpload } from '../../lib/upload.js';
import * as controller from './user.controller.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  submitKycSchema,
} from './user.schema.js';

export const userRouter = Router();

// ── GET /api/users/me ──────────────────────────────────────────────────────
userRouter.get(
  '/me',
  requireAuth,
  asyncHandler(controller.getMe),
);

// ── PATCH /api/users/me ────────────────────────────────────────────────────
userRouter.patch(
  '/me',
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(controller.updateMe),
);

// ── PATCH /api/users/me/password ──────────────────────────────────────────
userRouter.patch(
  '/me/password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(controller.changePassword),
);

// ── POST /api/users/kyc/upload ─────────────────────────────────────────────
// Upload a single KYC document file. Returns the server URL for the file.
// Must be defined before the /kyc POST route to avoid route conflict.
userRouter.post(
  '/kyc/upload',
  requireAuth,
  kycUpload.single('file'),
  asyncHandler(controller.uploadKycFile),
);

// ── GET /api/users/kyc ────────────────────────────────────────────────────
// Returns the authenticated user's own KYC document submissions.
userRouter.get(
  '/kyc',
  requireAuth,
  asyncHandler(controller.getMyKyc),
);

// ── DELETE /api/users/kyc/:id ─────────────────────────────────────────────
// Delete a pending KYC document (owner only).
userRouter.delete(
  '/kyc/:id',
  requireAuth,
  asyncHandler(controller.deleteKyc),
);

// ── POST /api/users/kyc ────────────────────────────────────────────────────
// Submit identity document metadata for KYC verification.
userRouter.post(
  '/kyc',
  requireAuth,
  validate(submitKycSchema),
  asyncHandler(controller.submitKyc),
);
