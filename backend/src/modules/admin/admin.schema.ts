import { z } from 'zod';

// ─── Params ────────────────────────────────────────────────────────────────

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive('User ID must be a positive integer'),
});

export const kycIdParamSchema = z.object({
  id: z.coerce.number().int().positive('KYC document ID must be a positive integer'),
});

// ─── User list query ───────────────────────────────────────────────────────

export const userListQuerySchema = z.object({
  search:    z.string().trim().optional(),
  role:      z.enum(['CUSTOMER', 'ADMIN']).optional(),
  kycStatus: z.enum(['NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  isBlocked: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Update user role ──────────────────────────────────────────────────────

export const updateRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'ADMIN']),
});

// ─── Block / unblock user ─────────────────────────────────────────────────

export const updateBlockSchema = z.object({
  isBlocked: z.boolean(),
});

// ─── KYC list query ───────────────────────────────────────────────────────

export const kycListQuerySchema = z.object({
  status: z.enum(['NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  search: z.string().trim().optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
});

// ─── KYC review ───────────────────────────────────────────────────────────

export const kycReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status must be APPROVED or REJECTED' }),
  }),
  reviewNote: z.string().max(500).trim().optional(),
});

export type UserIdParam       = z.infer<typeof userIdParamSchema>;
export type KycIdParam        = z.infer<typeof kycIdParamSchema>;
export type UserListQuery     = z.infer<typeof userListQuerySchema>;
export type UpdateRoleInput   = z.infer<typeof updateRoleSchema>;
export type UpdateBlockInput  = z.infer<typeof updateBlockSchema>;
export type KycListQuery      = z.infer<typeof kycListQuerySchema>;
export type KycReviewInput    = z.infer<typeof kycReviewSchema>;
