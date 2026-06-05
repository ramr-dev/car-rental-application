import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../lib/async-handler.js';
import * as controller from './payment.controller.js';
import { createCheckoutSchema, verifySessionSchema, createIntentSchema, verifyIntentSchema } from './payment.schema.js';

export const paymentRouter = Router();

// ── POST /api/payments/checkout ───────────────────────────────────────────
paymentRouter.post(
  '/checkout',
  requireAuth,
  validate(createCheckoutSchema),
  asyncHandler(controller.createCheckout),
);

// ── POST /api/payments/verify ─────────────────────────────────────────────
paymentRouter.post(
  '/verify',
  requireAuth,
  validate(verifySessionSchema),
  asyncHandler(controller.verifySession),
);

// ── POST /api/payments/intent ─────────────────────────────────────────────
// Creates a Stripe PaymentIntent for the custom Elements checkout page.
// Returns { clientSecret, paymentIntentId }.
paymentRouter.post(
  '/intent',
  requireAuth,
  validate(createIntentSchema),
  asyncHandler(controller.createIntent),
);

// ── POST /api/payments/confirm-intent ─────────────────────────────────────
// Verifies a completed PaymentIntent and creates the booking.
// Idempotent — safe to call twice with the same paymentIntentId.
paymentRouter.post(
  '/confirm-intent',
  requireAuth,
  validate(verifyIntentSchema),
  asyncHandler(controller.confirmIntent),
);
