import { api } from "./client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface VehicleLocation {
  id: number;
  name: string;
  brand: string;
  model: string;
  latitude: number;
  longitude: number;
  lastSeen: string;
  status: "online" | "offline";
}

export interface GpsLocationsResponse {
  data: VehicleLocation[];
  total: number;
}

// ── GPS API Service ────────────────────────────────────────────────────────

export const gpsService = {
  /** Fetch all vehicle GPS locations (admin only) */
  getLocations: async (): Promise<VehicleLocation[]> => {
    const res = await api.get<GpsLocationsResponse>("/gps/locations");
    return res.data.data;
  },
};
