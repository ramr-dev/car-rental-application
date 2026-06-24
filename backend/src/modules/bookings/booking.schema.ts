import { z } from 'zod';

// ─── ID param ─────────────────────────────────────────────────────────────

export const bookingIdParamSchema = z.object({
  id: z.string().min(1, 'Booking ID is required'),
});

// ─── List query ───────────────────────────────────────────────────────────

export const bookingListQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
    .optional(),
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  asHost: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});

// ─── Create ───────────────────────────────────────────────────────────────

export const createBookingSchema = z.object({
  vehicleId:      z.number().int().positive('Vehicle ID is required'),
  startDate:      z.string().min(1, 'Start date is required'),
  endDate:        z.string().min(1, 'End date is required'),
  pickupLocation:  z.string().min(3).max(255).trim(),
  dropoffLocation: z.string().max(255).trim().optional(),
  customerName:   z.string().min(2).max(255).trim(),
  customerEmail:  z.string().email('Valid email required'),
  customerPhone:  z.string().min(7).max(50).trim(),
  licenseNumber:  z.string().min(4).max(50).trim(),
  licenseExpiry:  z.string().min(1, 'License expiry date is required'),
  licenseCountry: z.string().min(2).max(100).trim(),
  notes:          z.string().max(1000).trim().optional(),
}).refine(
  (data) => {
    const diffMs = new Date(data.endDate).getTime() - new Date(data.startDate).getTime();
    return diffMs >= 6 * 3_600_000;
  },
  { message: 'Vehicle must be rented for at least 6 hours', path: ['endDate'] },
).refine(
  (data) => new Date(data.startDate) >= new Date(new Date().toDateString()),
  { message: 'Start date cannot be in the past', path: ['startDate'] },
);

// ─── Update status (admin) ────────────────────────────────────────────────

export const updateStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Status must be one of: CONFIRMED, ACTIVE, COMPLETED, CANCELLED' }),
  }),
});

export type BookingIdParam      = z.infer<typeof bookingIdParamSchema>;
export type BookingListQuery    = z.infer<typeof bookingListQuerySchema>;
export type CreateBookingInput  = z.infer<typeof createBookingSchema>;
export type UpdateStatusInput   = z.infer<typeof updateStatusSchema>;
