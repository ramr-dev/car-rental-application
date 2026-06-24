import type { Request, Response } from 'express';
import * as paymentService from './payment.service.js';
import type { CreateCheckoutInput, VerifySessionInput, CreateIntentInput, VerifyIntentInput } from './payment.schema.js';

// POST /api/payments/checkout
export async function createCheckout(req: Request, res: Response): Promise<void> {
  const input  = req.body as CreateCheckoutInput;
  const result = await paymentService.createCheckoutSession(input, req.user!.userId);
  res.json(result);
}

// POST /api/payments/verify
export async function verifySession(req: Request, res: Response): Promise<void> {
  const { sessionId } = req.body as VerifySessionInput;
  const booking = await paymentService.verifyAndCreate(sessionId, req.user!.userId);
  res.status(201).json(booking);
}

// POST /api/payments/intent
export async function createIntent(req: Request, res: Response): Promise<void> {
  const input  = req.body as CreateIntentInput;
  const result = await paymentService.createPaymentIntent(input, req.user!.userId);
  res.json(result);
}

// POST /api/payments/confirm-intent
export async function confirmIntent(req: Request, res: Response): Promise<void> {
  const input   = req.body as VerifyIntentInput;
  const booking = await paymentService.verifyAndCreateFromIntent(input, req.user!.userId);
  res.status(201).json(booking);
}

// GET /api/payments/gateway  — PUBLIC (no auth required)
// Returns the currently active payment gateway so the checkout page
// can decide whether to render Stripe, Razorpay, or Braintree.
export async function getActiveGateway(_req: Request, res: Response): Promise<void> {
  const { prisma } = await import('../../lib/prisma.js');
  const row = await prisma.appConfig.findUnique({
    where: { key: 'active_payment_gateway' },
  });
  res.json({ gateway: row?.value ?? 'stripe' });
}
