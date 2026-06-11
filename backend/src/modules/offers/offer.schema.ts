import { z } from 'zod';

export const createOfferSchema = z.object({
  title:           z.string().min(2).max(120),
  description:     z.string().max(500).default(''),
  discountPercent: z.number().min(0.01).max(100),
  minDays:         z.number().int().min(1),
  maxDays:         z.number().int().min(1).nullable().optional(),
  isActive:        z.boolean().default(true),
  badgeColor:      z.enum(['primary', 'success', 'warning', 'destructive']).default('primary'),
});

export const updateOfferSchema = createOfferSchema.partial();

export const offerIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
