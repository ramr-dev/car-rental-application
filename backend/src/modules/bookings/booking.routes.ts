import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../lib/async-handler.js';
import * as controller from './booking.controller.js';
import {
  bookingIdParamSchema,
  bookingListQuerySchema,
  createBookingSchema,
  updateStatusSchema,
} from './booking.schema.js';

export const bookingRouter = Router();

// ── GET /api/bookings ──────────────────────────────────────────────────────
// Admin → all bookings (paginated, filterable by status)
// Customer → own bookings only
bookingRouter.get(
  '/',
  requireAuth,
  validate(bookingListQuerySchema, 'query'),
  asyncHandler(controller.list),
);

// ── GET /api/bookings/:id ──────────────────────────────────────────────────
// Auth — customers can only view their own booking
bookingRouter.get(
  '/:id',
  requireAuth,
  validate(bookingIdParamSchema, 'params'),
  asyncHandler(controller.getById),
);

// ── POST /api/bookings ─────────────────────────────────────────────────────
// Auth — create a new booking (includes availability + date overlap check)
bookingRouter.post(
  '/',
  requireAuth,
  validate(createBookingSchema),
  asyncHandler(controller.create),
);

// ── PATCH /api/bookings/:id/status ────────────────────────────────────────
// Admin — advance booking through the status workflow
bookingRouter.patch(
  '/:id/status',
  requireAdmin,
  validate(bookingIdParamSchema, 'params'),
  validate(updateStatusSchema),
  asyncHandler(controller.updateStatus),
);

// ── PATCH /api/bookings/:id/cancel ────────────────────────────────────────
// Auth — customer cancels their own PENDING or CONFIRMED booking
bookingRouter.patch(
  '/:id/cancel',
  requireAuth,
  validate(bookingIdParamSchema, 'params'),
  asyncHandler(controller.cancel),
);
