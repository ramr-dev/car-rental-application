import { z } from 'zod';

// POST /api/gps/update — receive GPS coordinates from device/simulator
export const gpsUpdateSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export type GpsUpdateInput = z.infer<typeof gpsUpdateSchema>;
