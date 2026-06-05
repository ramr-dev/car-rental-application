import type { Request, Response } from 'express';
import path from 'path';
import * as userService from './user.service.js';
import type { UpdateProfileInput, ChangePasswordInput, SubmitKycInput } from './user.schema.js';

// GET /api/users/me
export async function getMe(req: Request, res: Response): Promise<void> {
  const profile = await userService.getMe(req.user!.userId);
  res.json(profile);
}

// PATCH /api/users/me
export async function updateMe(req: Request, res: Response): Promise<void> {
  const input   = req.body as UpdateProfileInput;
  const profile = await userService.updateMe(req.user!.userId, input);
  res.json(profile);
}

// PATCH /api/users/me/password
export async function changePassword(req: Request, res: Response): Promise<void> {
  const input = req.body as ChangePasswordInput;
  await userService.changePassword(req.user!.userId, input);
  res.json({ message: 'Password updated. All other sessions have been signed out.' });
}

// POST /api/users/kyc/upload
export async function uploadKycFile(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(422).json({ error: 'No file uploaded.' });
    return;
  }
  const url = `/uploads/kyc/${path.basename(file.path)}`;
  res.json({ url });
}

// GET /api/users/kyc
export async function getMyKyc(req: Request, res: Response): Promise<void> {
  const result = await userService.getMyKyc(req.user!.userId);
  res.json(result);
}

// DELETE /api/users/kyc/:id
export async function deleteKyc(req: Request, res: Response): Promise<void> {
  const docId = Number(req.params.id);
  await userService.deleteKyc(req.user!.userId, docId);
  res.status(204).send();
}

// POST /api/users/kyc
export async function submitKyc(req: Request, res: Response): Promise<void> {
  const input = req.body as SubmitKycInput;
  const doc   = await userService.submitKyc(req.user!.userId, input);
  res.status(201).json(doc);
}
