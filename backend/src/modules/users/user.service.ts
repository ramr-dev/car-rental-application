import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { env } from '../../config/env.js';
import type { UpdateProfileInput, ChangePasswordInput, SubmitKycInput } from './user.schema.js';

// ─── Response mapper ───────────────────────────────────────────────────────

function toUserResponse(user: {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  kycStatus: string;
  isBlocked: boolean;
  createdAt: Date;
}) {
  return {
    id:        String(user.id),
    name:      user.name,
    email:     user.email,
    phone:     user.phone   ?? undefined,
    avatar:    user.avatar  ?? undefined,
    role:      user.role === 'ADMIN' ? 'admin' : 'user',
    kycStatus: user.kycStatus.toLowerCase() as
      'not_started' | 'pending' | 'approved' | 'rejected',
    isBlocked: user.isBlocked,
    createdAt: user.createdAt.toISOString(),
  };
}

// ─── getMe ────────────────────────────────────────────────────────────────

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true,
      avatar: true, role: true, kycStatus: true,
      isBlocked: true, createdAt: true,
    },
  });

  if (!user) throw new AppError(404, 'User not found.', 'NOT_FOUND');
  return toUserResponse(user);
}

// ─── updateMe ─────────────────────────────────────────────────────────────

export async function updateMe(userId: number, input: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name   !== undefined && { name:   input.name   }),
      ...(input.phone  !== undefined && { phone:  input.phone  }),
      ...(input.avatar !== undefined && { avatar: input.avatar }),
    },
    select: {
      id: true, name: true, email: true, phone: true,
      avatar: true, role: true, kycStatus: true,
      isBlocked: true, createdAt: true,
    },
  });

  return toUserResponse(user);
}

// ─── changePassword ────────────────────────────────────────────────────────

export async function changePassword(userId: number, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user) throw new AppError(404, 'User not found.', 'NOT_FOUND');

  const match = await bcrypt.compare(input.currentPassword, user.password);
  if (!match) {
    throw new AppError(401, 'Current password is incorrect.', 'WRONG_PASSWORD');
  }

  const hashed = await bcrypt.hash(input.newPassword, env.BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data:  { password: hashed },
  });

  // Invalidate all refresh tokens so other sessions are logged out
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

// ─── getMyKyc ─────────────────────────────────────────────────────────────

export async function getMyKyc(userId: number) {
  const docs = await prisma.kycDocument.findMany({
    where:   { userId },
    orderBy: { submittedAt: 'desc' },
  });

  return {
    data: docs.map((doc) => ({
      id:             doc.id,
      userId:         String(doc.userId),
      documentType:   doc.documentType,
      documentNumber: doc.documentNumber,
      expiryDate:     doc.expiryDate.toISOString().split('T')[0],
      country:        doc.country,
      filePath:       doc.filePath,
      status:         doc.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
      reviewNote:     doc.reviewNote ?? undefined,
      submittedAt:    doc.submittedAt.toISOString(),
      reviewedAt:     doc.reviewedAt?.toISOString() ?? undefined,
    })),
  };
}

// ─── deleteKyc ────────────────────────────────────────────────────────────

export async function deleteKyc(userId: number, docId: number) {
  const doc = await prisma.kycDocument.findUnique({
    where: { id: docId },
    select: { id: true, userId: true, status: true },
  });

  if (!doc) throw new AppError(404, 'KYC document not found.', 'NOT_FOUND');
  if (doc.userId !== userId) throw new AppError(403, 'Access denied.', 'FORBIDDEN');
  if (doc.status === 'APPROVED') {
    throw new AppError(422, 'Approved documents cannot be deleted.', 'KYC_APPROVED');
  }

  await prisma.kycDocument.delete({ where: { id: docId } });

  // Reset user kyc status if no remaining non-rejected docs
  const remaining = await prisma.kycDocument.findFirst({
    where: { userId, status: { in: ['PENDING', 'APPROVED'] } },
  });
  if (!remaining) {
    await prisma.user.update({
      where: { id: userId },
      data:  { kycStatus: 'NOT_STARTED' },
    });
  }
}

// ─── submitKyc ────────────────────────────────────────────────────────────

export async function submitKyc(userId: number, input: SubmitKycInput) {
  // Prevent duplicate pending submissions
  const existing = await prisma.kycDocument.findFirst({
    where: { userId, status: 'PENDING' },
  });

  if (existing) {
    throw new AppError(
      409,
      'You already have a KYC submission under review. Please wait for it to be processed.',
      'KYC_ALREADY_PENDING',
    );
  }

  // Create the document record
  const doc = await prisma.kycDocument.create({
    data: {
      userId,
      documentType:   input.documentType,
      documentNumber: input.documentNumber,
      expiryDate:     new Date(input.expiryDate),
      country:        input.country,
      filePath:       input.filePath,
      status:         'PENDING',
    },
  });

  // Advance the user's KYC status to PENDING
  await prisma.user.update({
    where: { id: userId },
    data:  { kycStatus: 'PENDING' },
  });

  return {
    id:             doc.id,
    userId:         String(doc.userId),
    documentType:   doc.documentType,
    documentNumber: doc.documentNumber,
    expiryDate:     doc.expiryDate.toISOString().split('T')[0],
    country:        doc.country,
    status:         doc.status,
    submittedAt:    doc.submittedAt.toISOString(),
  };
}
