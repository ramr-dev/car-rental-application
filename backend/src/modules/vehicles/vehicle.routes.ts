import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../lib/async-handler.js';
import * as controller from './vehicle.controller.js';
import { vehicleImageUpload } from '../../lib/upload.js';
import {
  vehicleListQuerySchema,
  vehicleIdParamSchema,
  createVehicleSchema,
  updateVehicleSchema,
} from './vehicle.schema.js';

export const vehicleRouter = Router();

// ── POST /api/vehicles/upload-image ───────────────────────────────────────
// Admin — upload a vehicle photo; returns { url } for the stored file.
// Must be registered BEFORE /:id routes to avoid param capture.
vehicleRouter.post(
  '/upload-image',
  requireAdmin,
  vehicleImageUpload.single('image'),
  asyncHandler(controller.uploadImage),
);

// ── GET /api/vehicles ──────────────────────────────────────────────────────
// Public — list vehicles with optional filters, sort, and pagination
vehicleRouter.get(
  '/',
  validate(vehicleListQuerySchema, 'query'),
  asyncHandler(controller.list),
);

// ── GET /api/vehicles/:id ──────────────────────────────────────────────────
// Public — single vehicle detail
vehicleRouter.get(
  '/:id',
  validate(vehicleIdParamSchema, 'params'),
  asyncHandler(controller.getById),
);

// ── GET /api/vehicles/:id/booked-dates ────────────────────────────────────
// Public — returns booked date ranges for calendar date-picker in booking form
vehicleRouter.get(
  '/:id/booked-dates',
  validate(vehicleIdParamSchema, 'params'),
  asyncHandler(controller.getBookedRanges),
);

// ── POST /api/vehicles ─────────────────────────────────────────────────────
// Admin — add a vehicle to the fleet
vehicleRouter.post(
  '/',
  requireAdmin,
  validate(createVehicleSchema),
  asyncHandler(controller.create),
);

// ── PATCH /api/vehicles/:id ────────────────────────────────────────────────
// Admin — update any vehicle field (partial update supported)
vehicleRouter.patch(
  '/:id',
  requireAdmin,
  validate(vehicleIdParamSchema, 'params'),
  validate(updateVehicleSchema),
  asyncHandler(controller.update),
);

// ── DELETE /api/vehicles/:id ───────────────────────────────────────────────
// Admin — remove a vehicle (blocked if active bookings exist)
vehicleRouter.delete(
  '/:id',
  requireAdmin,
  validate(vehicleIdParamSchema, 'params'),
  asyncHandler(controller.remove),
);
