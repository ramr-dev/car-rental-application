import type { Request, Response } from 'express';
import * as adminService from './admin.service.js';
import type {
  UserIdParam,
  KycIdParam,
  UserListQuery,
  UpdateRoleInput,
  UpdateBlockInput,
  KycListQuery,
  KycReviewInput,
} from './admin.schema.js';

// ── GET /api/admin/users ───────────────────────────────────────────────────
export async function listUsers(req: Request, res: Response): Promise<void> {
  const query  = req.query as unknown as UserListQuery;
  const result = await adminService.listUsers(query);
  res.json(result);
}

// ── PATCH /api/admin/users/:id/role ───────────────────────────────────────
export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as UserIdParam;
  const input  = req.body as UpdateRoleInput;
  const user   = await adminService.updateUserRole(id, input);
  res.json(user);
}

// ── PATCH /api/admin/users/:id/block ──────────────────────────────────────
export async function updateBlockStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as UserIdParam;
  const input  = req.body as UpdateBlockInput;
  const user   = await adminService.updateBlockStatus(id, input);
  res.json(user);
}

// ── GET /api/admin/kyc ────────────────────────────────────────────────────
export async function listKyc(req: Request, res: Response): Promise<void> {
  const query  = req.query as unknown as KycListQuery;
  const result = await adminService.listKyc(query);
  res.json(result);
}

// ── PATCH /api/admin/kyc/:id/review ──────────────────────────────────────
export async function reviewKyc(req: Request, res: Response): Promise<void> {
  const { id }  = req.params as unknown as KycIdParam;
  const input   = req.body as KycReviewInput;
  const doc     = await adminService.reviewKyc(id, req.user!.userId, input);
  res.json(doc);
}

// ── GET /api/admin/config/gateway ─────────────────────────────────────────
export async function getGateway(_req: Request, res: Response): Promise<void> {
  const row = await (await import('../../lib/prisma.js')).prisma.appConfig.findUnique({
    where: { key: 'active_payment_gateway' },
  });
  res.json({ gateway: row?.value ?? 'stripe' });
}

// ── PATCH /api/admin/config/gateway ───────────────────────────────────────
export async function setGateway(req: Request, res: Response): Promise<void> {
  const { gateway } = req.body as { gateway: string };
  if (!['stripe', 'razorpay'].includes(gateway)) {
    res.status(400).json({ error: 'Invalid gateway. Must be "stripe" or "razorpay".' });
    return;
  }
  await (await import('../../lib/prisma.js')).prisma.appConfig.upsert({
    where:  { key: 'active_payment_gateway' },
    update: { value: gateway },
    create: { key: 'active_payment_gateway', value: gateway },
  });
  res.json({ gateway });
}
