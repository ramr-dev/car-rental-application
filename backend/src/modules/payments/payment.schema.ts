import { z } from 'zod';

// ── Create Checkout Session ────────────────────────────────────────────────
// Same booking data the customer enters in the multi-step form.

export const createCheckoutSchema = z.object({
  vehicleId:       z.number().int().positive('Vehicle ID is required'),
  startDate:       z.string().min(1, 'Start date is required'),
  endDate:         z.string().min(1, 'End date is required'),
  pickupLocation:  z.string().min(3).max(255).trim(),
  dropoffLocation: z.string().max(255).trim().optional(),
  customerName:    z.string().min(2).max(255).trim(),
  customerEmail:   z.string().email('Valid email required'),
  customerPhone:   z.string().min(7).max(50).trim(),
  licenseNumber:   z.string().min(4).max(50).trim(),
  licenseExpiry:   z.string().min(1, 'License expiry date is required'),
  licenseCountry:  z.string().min(2).max(100).trim(),
  notes:           z.string().max(1000).trim().optional(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] },
).refine(
  (data) => new Date(data.startDate) >= new Date(new Date().toDateString()),
  { message: 'Start date cannot be in the past', path: ['startDate'] },
);

// ── Verify Session ─────────────────────────────────────────────────────────

export const verifySessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

// ── Create PaymentIntent (custom Elements page) ───────────────────────────
export const createIntentSchema = createCheckoutSchema;

// ── Verify PaymentIntent ──────────────────────────────────────────────────
export const verifyIntentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type VerifySessionInput  = z.infer<typeof verifySessionSchema>;
export type CreateIntentInput   = z.infer<typeof createIntentSchema>;
export type VerifyIntentInput   = z.infer<typeof verifyIntentSchema>;
