import type { Request, Response } from 'express';
import * as service from './razorpay.service.js';

// ── POST /api/razorpay/order ───────────────────────────────────────────────

export async function createOrder(req: Request, res: Response) {
  const result = await service.createOrder(req.body, req.user!.userId);
  res.status(201).json(result);
}

// ── POST /api/razorpay/verify ─────────────────────────────────────────────

export async function verify(req: Request, res: Response) {
  const booking = await service.verifyAndCreate(req.body, req.user!.userId);
  res.status(200).json(booking);
}
