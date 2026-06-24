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
  if (!['stripe', 'razorpay', 'braintree'].includes(gateway)) {
    res.status(400).json({ error: 'Invalid gateway. Must be "stripe", "razorpay", or "braintree".' });
    return;
  }
  await (await import('../../lib/prisma.js')).prisma.appConfig.upsert({
    where:  { key: 'active_payment_gateway' },
    update: { value: gateway },
    create: { key: 'active_payment_gateway', value: gateway },
  });
  res.json({ gateway });
}

// ── P2P Host & Verification Management ─────────────────────────────────────
import * as adminHostService from './admin.host.service.js';

// GET /api/admin/hosts/pending
export async function listPendingHosts(_req: Request, res: Response): Promise<void> {
  const result = await adminHostService.listPendingHosts();
  res.json(result);
}

// PATCH /api/admin/hosts/:userId/verify
export async function verifyHost(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.userId);
  const { status } = req.body as { status: 'VERIFIED' | 'REJECTED' };
  if (!['VERIFIED', 'REJECTED'].includes(status)) {
    res.status(400).json({ error: 'Status must be VERIFIED or REJECTED.' });
    return;
  }
  const result = await adminHostService.verifyHost(userId, status);
  res.json(result);
}

// GET /api/admin/vehicles/pending
export async function listPendingVehicles(_req: Request, res: Response): Promise<void> {
  const result = await adminHostService.listPendingVehicles();
  res.json(result);
}

// PATCH /api/admin/vehicles/:vehicleId/approve
export async function approveVehicle(req: Request, res: Response): Promise<void> {
  const vehicleId = Number(req.params.vehicleId);
  const { approve } = req.body as { approve: boolean };
  const result = await adminHostService.approveVehicle(vehicleId, approve);
  res.json(result);
}

// GET /api/admin/payouts/pending
export async function listPendingPayouts(_req: Request, res: Response): Promise<void> {
  const result = await adminHostService.listPendingPayouts();
  res.json(result);
}

// POST /api/admin/payouts/process
export async function processPayout(req: Request, res: Response): Promise<void> {
  const { hostId, referenceNum } = req.body as { hostId: number; referenceNum?: string };
  if (!hostId) {
    res.status(400).json({ error: 'hostId is required.' });
    return;
  }
  const result = await adminHostService.processPayout(hostId, referenceNum);
  res.status(201).json(result);
}
