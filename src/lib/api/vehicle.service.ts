import { api } from "./client";
import type { Vehicle, Review } from "@/lib/types";

export interface VehicleListParams {
  search?: string;
  type?: string;
  fuel?: string;
  transmission?: string;
  minSeats?: number;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  sort?: "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  limit?: number;
}

export interface VehicleListResponse {
  data: Vehicle[];
  pagination: { total: number; page: number; limit: number; pageCount: number };
}

// Backend expects uppercase enums; frontend types are lowercase.
function toApiPayload(v: Partial<Vehicle>): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...v };
  if (v.type)         payload.type         = v.type.toUpperCase();
  if (v.fuel)         payload.fuel         = v.fuel.toUpperCase();
  if (v.transmission) payload.transmission = v.transmission.toUpperCase();
  return payload;
}

export const vehicleService = {
  // Returns the flat array — all callers treat list() as Vehicle[].
  // Fetches up to 200 so client-side filtering in vehicles.tsx continues to work.
  list: async (params?: VehicleListParams): Promise<Vehicle[]> => {
    const res = await api.get<VehicleListResponse>("/vehicles", {
      params: { limit: 200, ...params },
    });
    return res.data.data;
  },

  // Full paginated response — use when you need pagination metadata.
  listPaginated: async (params?: VehicleListParams): Promise<VehicleListResponse> => {
    const res = await api.get<VehicleListResponse>("/vehicles", { params });
    return res.data;
  },

  get: async (id: string): Promise<Vehicle | undefined> => {
    try {
      const res = await api.get<Vehicle>(`/vehicles/${id}`);
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return undefined;
      throw err;
    }
  },

  // Reviews are not yet implemented on the backend.
  reviews: async (_id: string): Promise<Review[]> => [],

  create: async (
    vehicle: Omit<Vehicle, "id" | "rating" | "reviewCount" | "available">,
  ): Promise<Vehicle> => {
    const res = await api.post<Vehicle>("/vehicles", toApiPayload(vehicle));
    return res.data;
  },

  update: async (id: string, patch: Partial<Vehicle>): Promise<Vehicle> => {
    const res = await api.patch<Vehicle>(`/vehicles/${id}`, toApiPayload(patch));
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },
};
