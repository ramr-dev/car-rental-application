import { z } from 'zod';

// ── Create Razorpay Order ──────────────────────────────────────────────────
// Same booking details as Stripe checkout — vehicle + customer + dates.

export const createRazorpayOrderSchema = z.object({
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

// ── Verify Razorpay Payment ────────────────────────────────────────────────
// After Razorpay checkout popup success, the frontend sends these three IDs.
// Backend verifies HMAC signature before creating the booking.

export const verifyRazorpaySchema = z.object({
  razorpay_order_id:   z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature:  z.string().min(1, 'Signature is required'),
});

export type CreateRazorpayOrderInput = z.infer<typeof createRazorpayOrderSchema>;
export type VerifyRazorpayInput      = z.infer<typeof verifyRazorpaySchema>;
