import type { Request, Response } from 'express';
import * as gpsService from './gps.service.js';

// ── POST /api/gps/update ──────────────────────────────────────────────────
// Receives GPS coordinates from a device or simulator.
// Authenticated via x-gps-api-key header (not JWT — devices don't have user accounts).

export async function update(req: Request, res: Response) {
  const apiKey = req.headers['x-gps-api-key'];
  if (apiKey !== gpsService.GPS_API_KEY) {
    res.status(401).json({ error: 'Invalid GPS API key' });
    return;
  }

  const { vehicleId, latitude, longitude } = req.body;
  await gpsService.updateLocation(vehicleId, latitude, longitude);
  res.json({ status: 'ok', vehicleId, latitude, longitude });
}

// ── GET /api/gps/locations ────────────────────────────────────────────────
// Returns all vehicle locations for the admin tracking map.
// Protected by requireAdmin middleware in routes.

export async function locations(_req: Request, res: Response) {
  const data = await gpsService.getAllLocations();
  res.json({ data, total: data.length });
}
