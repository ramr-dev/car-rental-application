import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../lib/async-handler.js';
import * as controller from './reviews.controller.js';
import { createReviewSchema, bookingIdParamSchema, vehicleIdParamSchema } from './reviews.schema.js';

export const reviewRouter = Router();

// Submit a review for a completed booking (authenticated user)
reviewRouter.post(
  '/bookings/:bookingId',
  requireAuth,
  validate(bookingIdParamSchema, 'params'),
  validate(createReviewSchema),
  asyncHandler(controller.createReview),
);

// Get reviews for a vehicle (public)
reviewRouter.get(
  '/vehicles/:vehicleId',
  validate(vehicleIdParamSchema, 'params'),
  asyncHandler(controller.getVehicleReviews),
);
