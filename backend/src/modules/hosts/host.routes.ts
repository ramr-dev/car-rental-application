import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../lib/async-handler.js';
import * as controller from './host.controller.js';
import {
  submitHostProfileSchema,
  hostSubmitVehicleSchema,
  addScheduleSchema,
  submitChecklistSchema,
} from './host.schema.js';

export const hostRouter = Router();

// All host routes require user authentication
hostRouter.use(requireAuth);

// ── KYC Onboarding ─────────────────────────────────────────────────────────
hostRouter.post('/verify', validate(submitHostProfileSchema), asyncHandler(controller.submitProfile));
hostRouter.get('/profile', asyncHandler(controller.getProfile));

// ── Car Listings ───────────────────────────────────────────────────────────
hostRouter.post('/vehicles', validate(hostSubmitVehicleSchema), asyncHandler(controller.submitVehicle));
hostRouter.get('/vehicles', asyncHandler(controller.listVehicles));

// ── Availability Schedules ──────────────────────────────────────────────────
hostRouter.post('/schedules', validate(addScheduleSchema), asyncHandler(controller.addSchedule));
hostRouter.get('/schedules/:vehicleId', asyncHandler(controller.getSchedules));

// ── Host Dashboard Stats & Financials ──────────────────────────────────────
hostRouter.get('/stats', asyncHandler(controller.getStats));
hostRouter.get('/payouts', asyncHandler(controller.listPayouts));

// ── Checklists (Trip Check-in/Check-out Reports) ───────────────────────────
hostRouter.post('/checklists', validate(submitChecklistSchema), asyncHandler(controller.submitChecklist));
