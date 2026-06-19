import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../lib/async-handler.js';
import * as controller from './razorpay.controller.js';
import { createRazorpayOrderSchema, verifyRazorpaySchema } from './razorpay.schema.js';

export const razorpayRouter = Router();

// ── POST /api/razorpay/order ───────────────────────────────────────────────
// Creates a Razorpay order. Returns { orderId, amount, currency, keyId }.
razorpayRouter.post(
  '/order',
  requireAuth,
  validate(createRazorpayOrderSchema),
  asyncHandler(controller.createOrder),
);

// ── POST /api/razorpay/verify ─────────────────────────────────────────────
// Verifies payment HMAC signature and creates the booking record.
// Idempotent — safe to call twice with the same razorpay_order_id.
razorpayRouter.post(
  '/verify',
  requireAuth,
  validate(verifyRazorpaySchema),
  asyncHandler(controller.verify),
);
