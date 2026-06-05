import type { Request, Response } from 'express';
import * as authService from './auth.service.js';
import type { RegisterInput, LoginInput, RefreshInput, LogoutInput } from './auth.schema.js';

// ── register ──────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password, phone? }

export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;
  const result = await authService.register(input);
  res.status(201).json(result);
}

// ── login ─────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const result = await authService.login(input);
  res.json(result);
}

// ── adminLogin ────────────────────────────────────────────────────────────
// POST /api/auth/admin/login
// Body: { email, password }
// Rejects with 403 if the account does not have the ADMIN role.

export async function adminLogin(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const result = await authService.adminLogin(input);
  res.json(result);
}

// ── refresh ───────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Body: { refreshToken }
// Returns a new access + refresh token pair (old refresh token is rotated out).

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as RefreshInput;
  const result = await authService.refresh(refreshToken);
  res.json(result);
}

// ── logout ────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// Body: { refreshToken }
// Invalidates the provided refresh token. Access token expires on its own TTL.

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as LogoutInput;
  await authService.logout(refreshToken);
  res.json({ message: 'Logged out successfully.' });
}
