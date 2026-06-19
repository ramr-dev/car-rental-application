import { prisma } from '../../lib/prisma.js';

// ── GPS API Key ────────────────────────────────────────────────────────────
// Shared secret between GPS devices/simulator and this server.
// In production, move this to an environment variable.
export const GPS_API_KEY = 'drivelux-gps-secret-2026';

// Threshold in minutes — devices not seen within this window are "offline"
const OFFLINE_THRESHOLD_MINUTES = 2;

// ── Types ──────────────────────────────────────────────────────────────────

export interface VehicleLocation {
  id: number;
  name: string;
  brand: string;
  model: string;
  latitude: number;
  longitude: number;
  lastSeen: string;
  status: 'online' | 'offline';
}

// ── Service functions ──────────────────────────────────────────────────────

/**
 * Update a vehicle's GPS coordinates (overwrite pattern — no history, no bloat).
 * Only updates latitude, longitude, and gps_last_seen timestamp.
 */
export async function updateLocation(vehicleId: number, latitude: number, longitude: number) {
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      latitude,
      longitude,
      gpsLastSeen: new Date(),
    },
  });
}

/**
 * Get all vehicles that have GPS data (latitude is not null).
 * Calculates online/offline status based on gps_last_seen timestamp.
 */
export async function getAllLocations(): Promise<VehicleLocation[]> {
  const vehicles = await prisma.vehicle.findMany({
    where: { latitude: { not: null } },
    select: {
      id: true,
      name: true,
      brand: true,
      model: true,
      latitude: true,
      longitude: true,
      gpsLastSeen: true,
    },
  });

  const now = new Date();

  return vehicles.map((v) => {
    const lastSeen = v.gpsLastSeen ?? new Date(0);
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMin = diffMs / 1000 / 60;

    return {
      id: v.id,
      name: v.name,
      brand: v.brand,
      model: v.model,
      latitude: Number(v.latitude),
      longitude: Number(v.longitude),
      lastSeen: lastSeen.toISOString(),
      status: diffMin <= OFFLINE_THRESHOLD_MINUTES ? 'online' : 'offline',
    };
  });
}
