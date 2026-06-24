import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../lib/async-handler.js';
import * as controller from './braintree.controller.js';
import { braintreeCheckoutSchema } from './braintree.schema.js';

export const braintreeRouter = Router();

// ── GET /api/braintree/client-token ─────────────────────────────────────
// Returns a Braintree client token so the frontend can initialise Drop-in UI.
// Requires authentication so tokens are scoped to real users.
braintreeRouter.get(
  '/client-token',
  requireAuth,
  asyncHandler(controller.clientToken),
);

// ── POST /api/braintree/checkout ─────────────────────────────────────────
// Accepts a paymentMethodNonce + booking details, charges the card via
// Braintree, and creates the booking record in the database.
braintreeRouter.post(
  '/checkout',
  requireAuth,
  validate(braintreeCheckoutSchema),
  asyncHandler(controller.checkout),
);
