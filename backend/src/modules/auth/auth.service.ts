import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { generateTokenPair } from '../../lib/tokens.js';
import { AppError } from '../../middleware/error.middleware.js';
import { env } from '../../config/env.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';
import type { UserRole } from '@prisma/client';

// ─── Response shape ────────────────────────────────────────────────────────
// Maps Prisma's CUSTOMER/ADMIN enums and snake_case DB fields to the camelCase
// shape the frontend expects. Applied to every auth response so Phase 8
// integration requires no additional mapping.

function toUserResponse(user: {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  kycStatus: string;
  hostStatus: string;
}) {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    avatar: user.avatar ?? undefined,
    role: user.role === 'ADMIN' ? 'admin' : user.role === 'HOST' ? 'host' : 'user',
    kycStatus: user.kycStatus.toLowerCase().replace('_', '_') as
      | 'not_started'
      | 'pending'
      | 'approved'
      | 'rejected',
    hostStatus: user.hostStatus,
  } as const;
}

// ─── Shared: store refresh token ───────────────────────────────────────────

async function storeRefreshToken(
  userId: number,
  token: string,
  expiresAt: Date,
): Promise<void> {
  await prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  });
}

// ─── register ─────────────────────────────────────────────────────────────

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, 'An account with this email already exists.', 'EMAIL_TAKEN');
  }

  const hashedPassword = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      phone: input.phone,
    },
  });

  const tokens = generateTokenPair(user.id, user.role);
  await storeRefreshToken(user.id, tokens.refreshToken, tokens.refreshTokenExpiresAt);

  return {
    user: toUserResponse(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// ─── login ─────────────────────────────────────────────────────────────────

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Use the same error for both "not found" and "wrong password" to avoid
  // leaking whether an email address is registered.
  if (!user) {
    throw new AppError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  const passwordMatch = await bcrypt.compare(input.password, user.password);
  if (!passwordMatch) {
    throw new AppError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  if (user.isBlocked) {
    throw new AppError(403, 'Your account has been suspended. Contact support.', 'ACCOUNT_SUSPENDED');
  }

  const tokens = generateTokenPair(user.id, user.role);
  await storeRefreshToken(user.id, tokens.refreshToken, tokens.refreshTokenExpiresAt);

  return {
    user: toUserResponse(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// ─── adminLogin ────────────────────────────────────────────────────────────

export async function adminLogin(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new AppError(401, 'Invalid admin credentials.', 'INVALID_CREDENTIALS');
  }

  const passwordMatch = await bcrypt.compare(input.password, user.password);
  if (!passwordMatch) {
    throw new AppError(401, 'Invalid admin credentials.', 'INVALID_CREDENTIALS');
  }

  if (user.role !== 'ADMIN') {
    throw new AppError(403, 'This account does not have admin access.', 'FORBIDDEN');
  }

  if (user.isBlocked) {
    throw new AppError(403, 'This admin account has been suspended.', 'ACCOUNT_SUSPENDED');
  }

  const tokens = generateTokenPair(user.id, user.role);
  await storeRefreshToken(user.id, tokens.refreshToken, tokens.refreshTokenExpiresAt);

  return {
    user: toUserResponse(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// ─── refresh ───────────────────────────────────────────────────────────────
// Rotates the refresh token: old one is deleted, new pair is issued.
// This limits the window a stolen refresh token stays valid.

export async function refresh(token: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!stored) {
    throw new AppError(401, 'Invalid refresh token.', 'INVALID_TOKEN');
  }

  if (stored.expiresAt < new Date()) {
    // Clean up expired token before rejecting
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new AppError(401, 'Refresh token has expired. Please log in again.', 'TOKEN_EXPIRED');
  }

  if (stored.user.isBlocked) {
    throw new AppError(403, 'Your account has been suspended.', 'ACCOUNT_SUSPENDED');
  }

  // Delete old token (rotation)
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  // Issue new pair
  const tokens = generateTokenPair(stored.user.id, stored.user.role);
  await storeRefreshToken(stored.user.id, tokens.refreshToken, tokens.refreshTokenExpiresAt);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// ─── logout ────────────────────────────────────────────────────────────────
// Invalidates a single refresh token. The access token expires on its own
// (15 min TTL) — we don't maintain an access token blocklist.

export async function logout(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } });
  // deleteMany so we never throw 404 on an already-expired/deleted token
}
