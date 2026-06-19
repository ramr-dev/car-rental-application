import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../lib/async-handler.js';
import * as controller from './gps.controller.js';
import { gpsUpdateSchema } from './gps.schema.js';

export const gpsRouter = Router();

// ── POST /api/gps/update ──────────────────────────────────────────────────
// Receive GPS data from device or simulator (API key auth, not JWT)
gpsRouter.post(
  '/update',
  validate(gpsUpdateSchema),
  asyncHandler(controller.update),
);

// ── GET /api/gps/locations ────────────────────────────────────────────────
// Admin — get all vehicle positions for the tracking map
gpsRouter.get(
  '/locations',
  requireAdmin,
  asyncHandler(controller.locations),
);
