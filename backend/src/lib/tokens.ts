import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload } from '../middleware/auth.middleware.js';

// ─── Access token ──────────────────────────────────────────────────────────
// Short-lived JWT sent in Authorization header for every API request.
// Payload: { userId, role }

export function generateAccessToken(userId: number, role: 'CUSTOMER' | 'ADMIN'): string {
  return jwt.sign(
    { userId, role } satisfies JwtPayload,
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any },
  );
}

// ─── Refresh token ─────────────────────────────────────────────────────────
// Long-lived opaque 64-char hex string stored in the `refresh_tokens` table.
// Never contains user data — it's only a lookup key.

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex'); // 64 hex chars
}

// ─── Refresh token expiry ──────────────────────────────────────────────────
// Parses "7d", "24h", "60m", etc. into a future Date for DB storage.

export function refreshTokenExpiresAt(): Date {
  const raw = env.JWT_REFRESH_EXPIRES_IN; // e.g. "7d"
  const match = raw.match(/^(\d+)(s|m|h|d)$/);
  if (!match) throw new Error(`Invalid JWT_REFRESH_EXPIRES_IN: "${raw}"`);

  const value = parseInt(match[1]!, 10);
  const unit = match[2]!;
  const msMap: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return new Date(Date.now() + value * (msMap[unit] ?? 0));
}

// ─── Token pair ────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export function generateTokenPair(userId: number, role: 'CUSTOMER' | 'ADMIN'): TokenPair {
  return {
    accessToken: generateAccessToken(userId, role),
    refreshToken: generateRefreshToken(),
    refreshTokenExpiresAt: refreshTokenExpiresAt(),
  };
}
