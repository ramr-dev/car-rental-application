import { api } from "./client";
import type { Vehicle } from "@/lib/types/vehicle.types";

export interface HostProfile {
  panNumber: string;
  phone?: string;
  bankAccountNum: string;
  bankIfsc: string;
  bankName: string;
  aadhaarFrontUrl: string;
  aadhaarBackUrl: string;
}

export interface HostStats {
  grossEarnings: number;
  netEarnings: number;
  platformCommission: number;
  totalTrips: number;
  activeListings: number;
}

export interface TripChecklistInput {
  bookingId: string;
  vehicleId: number;
  type: 'CHECK_IN' | 'CHECK_OUT';
  odometerReading: number;
  fuelLevel: number;
  damageNotes?: string;
  images: string[];
}

export interface HostSubmitVehicleInput {
  name: string;
  brand: string;
  model: string;
  year: number;
  type: 'SEDAN' | 'SUV' | 'LUXURY' | 'ELECTRIC' | 'CONVERTIBLE' | 'VAN';
  fuel: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  transmission: 'AUTOMATIC' | 'MANUAL';
  seats: number;
  pricePerDay: number;
  location: string;
  image: string;
  images: string[];
  features: string[];
  description: string;
  mileage: string;
  engine: string;
  topSpeed: string;
  acceleration: string;
  registrationNumber: string;
  rcUrl: string;
  insuranceUrl: string;
}

export const hostService = {
  // Onboarding
  submitProfile: async (profile: HostProfile): Promise<any> => {
    const res = await api.post("/hosts/verify", profile);
    return res.data;
  },

  getProfile: async (): Promise<{ hostStatus: string; role: string; profile: any }> => {
    const res = await api.get<{ hostStatus: string; role: string; profile: any }>("/hosts/profile");
    return res.data;
  },

  // Vehicle Management
  submitVehicle: async (vehicle: HostSubmitVehicleInput): Promise<Vehicle> => {
    const res = await api.post<Vehicle>("/hosts/vehicles", vehicle);
    return res.data;
  },

  listVehicles: async (): Promise<Vehicle[]> => {
    const res = await api.get<Vehicle[]>("/hosts/vehicles");
    return res.data;
  },

  // Schedules
  addSchedule: async (schedule: { vehicleId: number; startDate: string; endDate: string }): Promise<any> => {
    const res = await api.post("/hosts/schedules", schedule);
    return res.data;
  },

  getSchedules: async (vehicleId: number): Promise<any[]> => {
    const res = await api.get<any[]>(`/hosts/schedules/${vehicleId}`);
    return res.data;
  },

  // Stats
  getStats: async (): Promise<HostStats> => {
    const res = await api.get<HostStats>("/hosts/stats");
    return res.data;
  },

  // Checklists
  submitChecklist: async (checklist: TripChecklistInput): Promise<any> => {
    const res = await api.post("/hosts/checklists", checklist);
    return res.data;
  },

  // Payouts
  listPayouts: async (): Promise<any[]> => {
    const res = await api.get<any[]>("/hosts/payouts");
    return res.data;
  },

  // Admin Verification & Payout Management
  listPendingHosts: async (): Promise<any[]> => {
    const res = await api.get<any[]>("/admin/hosts/pending");
    return res.data;
  },

  verifyHost: async (userId: number, status: 'VERIFIED' | 'REJECTED'): Promise<any> => {
    const res = await api.patch(`/admin/hosts/${userId}/verify`, { status });
    return res.data;
  },

  listPendingVehicles: async (): Promise<any[]> => {
    const res = await api.get<any[]>("/admin/vehicles/pending");
    return res.data;
  },

  approveVehicle: async (vehicleId: number, approve: boolean): Promise<any> => {
    const res = await api.patch(`/admin/vehicles/${vehicleId}/approve`, { approve });
    return res.data;
  },

  listPendingPayouts: async (): Promise<any[]> => {
    const res = await api.get<any[]>("/admin/payouts/pending");
    return res.data;
  },

  processPayout: async (hostId: number, referenceNum?: string): Promise<any> => {
    const res = await api.post("/admin/payouts/process", { hostId, referenceNum });
    return res.data;
  },
};
