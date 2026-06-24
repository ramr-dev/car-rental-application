import { z } from 'zod';

// ── POST /api/braintree/client-token ──────────────────────────────────────
// No body needed — returns a client token for the frontend Drop-in UI.

// ── POST /api/braintree/checkout ─────────────────────────────────────────
// Accepts all booking details + the Braintree payment nonce.

export const braintreeCheckoutSchema = z.object({
  paymentMethodNonce: z.string().min(1, 'paymentMethodNonce is required'),
  vehicleId:          z.number().int().positive(),
  startDate:          z.string().min(1),
  endDate:            z.string().min(1),
  pickupLocation:     z.string().min(1),
  dropoffLocation:    z.string().optional(),
  customerName:       z.string().min(1),
  customerEmail:      z.string().email(),
  customerPhone:      z.string().min(1),
  licenseNumber:      z.string().min(1),
  licenseExpiry:      z.string().min(1),
  licenseCountry:     z.string().min(1),
  notes:              z.string().optional(),
  hasDamageProtection: z.preprocess((val) => val === 'true' || val === true || val === 1 || val === '1', z.boolean()).optional(),
});

export type BraintreeCheckoutInput = z.infer<typeof braintreeCheckoutSchema>;
