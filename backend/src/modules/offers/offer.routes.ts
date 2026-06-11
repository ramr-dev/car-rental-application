import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../lib/async-handler.js';
import * as controller from './offer.controller.js';
import { createOfferSchema, updateOfferSchema, offerIdParamSchema } from './offer.schema.js';

export const offerRouter = Router();

// Public: any visitor can read active offers (used for customer banner)
offerRouter.get('/', asyncHandler(controller.getActiveOffers));

// Admin only: full CRUD
offerRouter.get(
  '/all',
  requireAdmin,
  asyncHandler(controller.getAllOffers),
);

offerRouter.post(
  '/',
  requireAdmin,
  validate(createOfferSchema),
  asyncHandler(controller.createOffer),
);

offerRouter.put(
  '/:id',
  requireAdmin,
  validate(offerIdParamSchema, 'params'),
  validate(updateOfferSchema),
  asyncHandler(controller.updateOffer),
);

offerRouter.delete(
  '/:id',
  requireAdmin,
  validate(offerIdParamSchema, 'params'),
  asyncHandler(controller.deleteOffer),
);

offerRouter.patch(
  '/:id/toggle',
  requireAdmin,
  validate(offerIdParamSchema, 'params'),
  asyncHandler(controller.toggleOffer),
);
