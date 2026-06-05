import { api } from "./client";
import type { Booking, BookingStatus } from "@/lib/types";

export interface BookingListParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface BookingListResponse {
  data: Booking[];
  pagination: { total: number; page: number; limit: number; pageCount: number };
}

export const bookingService = {
  // Returns the flat array — maintains backward compatibility with all callers.
  list: async (params?: BookingListParams): Promise<Booking[]> => {
    const res = await api.get<BookingListResponse>("/bookings", {
      params: { limit: 100, ...params },
    });
    return res.data.data;
  },

  listPaginated: async (params?: BookingListParams): Promise<BookingListResponse> => {
    const res = await api.get<BookingListResponse>("/bookings", { params });
    return res.data;
  },

  get: async (id: string): Promise<Booking | undefined> => {
    try {
      const res = await api.get<Booking>(`/bookings/${id}`);
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return undefined;
      throw err;
    }
  },

  // Accepts the full Omit<Booking, "id"|"createdAt"|"status"> shape from booking.$id.tsx
  // but only forwards the fields the backend actually needs.
  create: async (input: Omit<Booking, "id" | "createdAt" | "status">): Promise<Booking> => {
    const res = await api.post<Booking>("/bookings", {
      vehicleId:       Number(input.vehicleId), // backend expects integer
      startDate:       input.startDate,
      endDate:         input.endDate,
      pickupLocation:  input.pickupLocation,
      dropoffLocation: input.dropoffLocation,
      customerName:    input.customerName,
      customerEmail:   input.customerEmail,
      customerPhone:   input.customerPhone,
      licenseNumber:   input.licenseNumber,
      licenseExpiry:   input.licenseExpiry,
      licenseCountry:  input.licenseCountry,
      notes:           input.notes,
    });
    return res.data;
  },

  // Admin: advance booking through the status workflow.
  // Backend requires uppercase status and admin JWT.
  updateStatus: async (id: string, status: BookingStatus): Promise<Booking> => {
    const res = await api.patch<Booking>(`/bookings/${id}/status`, {
      status: status.toUpperCase(),
    });
    return res.data;
  },

  // Customer: cancel own PENDING or CONFIRMED booking.
  cancel: async (id: string): Promise<Booking> => {
    const res = await api.patch<Booking>(`/bookings/${id}/cancel`);
    return res.data;
  },
};
