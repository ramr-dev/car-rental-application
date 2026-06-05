import type { Vehicle, Booking, User } from "@/lib/types";
import { vehicles as baseVehicles, bookings as baseBookings } from "@/lib/mock-data";

export const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(raw);
};

const setStorageItem = <T>(key: string, value: T) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const getVehicles = (): Vehicle[] => getStorageItem("drivelux-db-vehicles", baseVehicles);
export const setVehicles = (list: Vehicle[]) => setStorageItem("drivelux-db-vehicles", list);

export const getBookings = (): Booking[] => getStorageItem("drivelux-db-bookings", baseBookings);
export const setBookings = (list: Booking[]) => setStorageItem("drivelux-db-bookings", list);

export const baseUsers: User[] = [
  { id: "u1", name: "Sarah Chen", email: "sarah@example.com", phone: "+1 (555) 123-4567", role: "user", kycStatus: "approved" },
  { id: "u2", name: "Marcus Johnson", email: "marcus@example.com", phone: "+1 (555) 765-4321", role: "user", kycStatus: "approved" },
  { id: "u3", name: "Elena Rossi", email: "elena@example.com", phone: "+39 333 456 7890", role: "user", kycStatus: "pending" },
  { id: "u4", name: "David Kim", email: "david@example.com", phone: "+1 (555) 987-6543", role: "user", kycStatus: "approved" },
  { id: "u5", name: "Maya Patel", email: "maya@example.com", phone: "+1 (555) 555-0199", role: "user", kycStatus: "not_started" },
  { id: "admin1", name: "DriveLux Admin", email: "admin@drivelux.com", phone: "+1 (555) 999-9999", role: "admin", kycStatus: "approved" },
];

export const getUsers = (): User[] => getStorageItem("drivelux-db-users", baseUsers);
export const setUsers = (list: User[]) => setStorageItem("drivelux-db-users", list);
