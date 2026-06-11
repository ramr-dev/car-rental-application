import type { Request, Response } from 'express';
import * as service from './notification.service.js';

export async function list(_req: Request, res: Response) {
  const notifications = await service.listNotifications();
  res.json(notifications);
}

export async function markOneRead(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid id.' });
    return;
  }
  await service.markRead(id);
  res.status(204).end();
}

export async function markAllRead(_req: Request, res: Response) {
  await service.markAllRead();
  res.status(204).end();
}
