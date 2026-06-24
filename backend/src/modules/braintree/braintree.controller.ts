import type { Request, Response } from 'express';
import * as braintreeService from './braintree.service.js';
import type { BraintreeCheckoutInput } from './braintree.schema.js';

// GET /api/braintree/client-token
export async function clientToken(_req: Request, res: Response): Promise<void> {
  const data = await braintreeService.getClientToken();
  res.json(data);
}

// POST /api/braintree/checkout
export async function checkout(req: Request, res: Response): Promise<void> {
  const input   = req.body as BraintreeCheckoutInput;
  const booking = await braintreeService.checkout(input, req.user!.userId);
  res.status(201).json(booking);
}
