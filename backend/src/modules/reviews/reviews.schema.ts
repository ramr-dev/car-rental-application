import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const bookingIdParamSchema = z.object({
  bookingId: z.string().min(2).max(30),
});

export const vehicleIdParamSchema = z.object({
  vehicleId: z.string().regex(/^\d+$/).transform(Number),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
