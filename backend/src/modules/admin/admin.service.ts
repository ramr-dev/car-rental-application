import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type {
  UserListQuery,
  UpdateRoleInput,
  UpdateBlockInput,
  KycListQuery,
  KycReviewInput,
} from './admin.schema.js';

// ─── Response mappers ──────────────────────────────────────────────────────

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
  _count?: { bookings: number };
}) {
  return {
    id:            String(user.id),
    name:          user.name,
    email:         user.email,
    phone:         user.phone  ?? undefined,
    avatar:        user.avatar ?? undefined,
    role:          user.role === 'ADMIN' ? 'admin' : 'user',
    kycStatus:     user.kycStatus.toLowerCase() as
      'not_started' | 'pending' | 'approved' | 'rejected',
    isBlocked:     user.isBlocked,
    createdAt:     user.createdAt.toISOString(),
    bookingCount:  user._count?.bookings ?? 0,
  };
}

type KycDocWithUser = Prisma.KycDocumentGetPayload<{
  include: { user: { select: { id: true; name: true; email: true } } };
}>;

function toKycResponse(doc: KycDocWithUser) {
  return {
    id:             doc.id,
    userId:         String(doc.userId),
    userName:       doc.user.name,
    userEmail:      doc.user.email,
    documentType:   doc.documentType,
    documentNumber: doc.documentNumber,
    expiryDate:     doc.expiryDate.toISOString().split('T')[0],
    country:        doc.country,
    filePath:       doc.filePath,
    status:         doc.status,
    reviewedById:   doc.reviewedById ? String(doc.reviewedById) : undefined,
    reviewNote:     doc.reviewNote   ?? undefined,
    submittedAt:    doc.submittedAt.toISOString(),
    reviewedAt:     doc.reviewedAt?.toISOString() ?? undefined,
  };
}

// ─── listUsers ─────────────────────────────────────────────────────────────

export async function listUsers(query: UserListQuery) {
  const where: Prisma.UserWhereInput = {};

  if (query.search) {
    where.OR = [
      { name:  { contains: query.search } },
      { email: { contains: query.search } },
    ];
  }
  if (query.role)      where.role      = query.role;
  if (query.kycStatus) where.kycStatus = query.kycStatus;
  if (query.isBlocked !== undefined) where.isBlocked = query.isBlocked;

  const skip = (query.page - 1) * query.limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, avatar: true,
        role: true, kycStatus: true, isBlocked: true, createdAt: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users.map(toUserResponse),
    pagination: {
      total,
      page:      query.page,
      limit:     query.limit,
      pageCount: Math.ceil(total / query.limit),
    },
  };
}

// ─── updateUserRole ────────────────────────────────────────────────────────

export async function updateUserRole(id: number, input: UpdateRoleInput) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!user) throw new AppError(404, 'User not found.', 'NOT_FOUND');

  if (user.role === input.role) {
    throw new AppError(
      422,
      `User already has the ${input.role} role.`,
      'ROLE_UNCHANGED',
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data:  { role: input.role },
    select: {
      id: true, name: true, email: true, phone: true, avatar: true,
      role: true, kycStatus: true, isBlocked: true, createdAt: true,
      _count: { select: { bookings: true } },
    },
  });

  return toUserResponse(updated);
}

// ─── updateBlockStatus ─────────────────────────────────────────────────────

export async function updateBlockStatus(id: number, input: UpdateBlockInput) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isBlocked: true, role: true },
  });
  if (!user) throw new AppError(404, 'User not found.', 'NOT_FOUND');

  // Prevent blocking an admin account
  if (user.role === 'ADMIN') {
    throw new AppError(403, 'Admin accounts cannot be blocked.', 'CANNOT_BLOCK_ADMIN');
  }

  if (user.isBlocked === input.isBlocked) {
    const state = input.isBlocked ? 'blocked' : 'active';
    throw new AppError(422, `User account is already ${state}.`, 'STATUS_UNCHANGED');
  }

  const updated = await prisma.user.update({
    where: { id },
    data:  { isBlocked: input.isBlocked },
    select: {
      id: true, name: true, email: true, phone: true, avatar: true,
      role: true, kycStatus: true, isBlocked: true, createdAt: true,
      _count: { select: { bookings: true } },
    },
  });

  // If blocking, also invalidate all their refresh tokens
  if (input.isBlocked) {
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
  }

  return toUserResponse(updated);
}

// ─── listKyc ──────────────────────────────────────────────────────────────

export async function listKyc(query: KycListQuery) {
  const where: Prisma.KycDocumentWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.search) {
    where.user = {
      OR: [
        { name:  { contains: query.search } },
        { email: { contains: query.search } },
      ],
    };
  }

  const skip = (query.page - 1) * query.limit;

  const [docs, total] = await Promise.all([
    prisma.kycDocument.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { submittedAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.kycDocument.count({ where }),
  ]);

  return {
    data: docs.map(toKycResponse),
    pagination: {
      total,
      page:      query.page,
      limit:     query.limit,
      pageCount: Math.ceil(total / query.limit),
    },
  };
}

// ─── reviewKyc ────────────────────────────────────────────────────────────

export async function reviewKyc(
  docId: number,
  reviewerId: number,
  input: KycReviewInput,
) {
  const doc = await prisma.kycDocument.findUnique({
    where: { id: docId },
    select: { id: true, userId: true, status: true },
  });

  if (!doc) throw new AppError(404, 'KYC document not found.', 'NOT_FOUND');

  if (doc.status !== 'PENDING') {
    throw new AppError(
      422,
      `This submission has already been ${doc.status.toLowerCase()}.`,
      'KYC_ALREADY_REVIEWED',
    );
  }

  // Update document and user kycStatus in a transaction so they stay in sync
  const [updatedDoc] = await prisma.$transaction([
    prisma.kycDocument.update({
      where: { id: docId },
      data: {
        status:       input.status,
        reviewedById: reviewerId,
        reviewNote:   input.reviewNote,
        reviewedAt:   new Date(),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.user.update({
      where: { id: doc.userId },
      data:  { kycStatus: input.status },
    }),
  ]);

  return toKycResponse(updatedDoc);
}
