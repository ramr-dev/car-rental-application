import { z } from 'zod';

// ─── Update own profile ────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name:   z.string().min(2).max(100).trim().optional(),
  phone:  z.string().max(50).trim().nullable().optional(),
  avatar: z.string().url('Avatar must be a valid URL').nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided.' },
);

// ─── Change password ───────────────────────────────────────────────────────

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100),
}).refine(
  (data) => data.currentPassword !== data.newPassword,
  { message: 'New password must differ from your current password.', path: ['newPassword'] },
);

// ─── Submit KYC documents ──────────────────────────────────────────────────

export const submitKycSchema = z.object({
  documentType: z.enum(['DRIVERS_LICENSE', 'PASSPORT', 'NATIONAL_ID']),
  documentNumber: z
    .string()
    .min(4, 'Document number must be at least 4 characters')
    .max(100)
    .trim(),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .refine(
      (d) => new Date(d) > new Date(),
      'Document must not be expired',
    ),
  country: z.string().min(2).max(100).trim(),
  filePath: z
    .string()
    .min(1, 'Document file path is required')
    .max(500),
});

export type UpdateProfileInput  = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SubmitKycInput      = z.infer<typeof submitKycSchema>;
