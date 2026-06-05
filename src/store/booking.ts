import { create } from "zustand";

interface BookingDraft {
  vehicleId?: string;
  // Step 1 — Trip details
  startDate?: string;
  endDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  // Step 2 — Personal info
  fullName?: string;
  email?: string;
  phone?: string;
  // Step 3 — License & notes
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseCountry?: string;
  notes?: string;
  // Legacy add-ons (preserved for backward compat)
  addons: string[];
}

interface BookingState {
  draft: BookingDraft;
  setDraft: (patch: Partial<BookingDraft>) => void;
  reset: () => void;
  // Clears trip/vehicle data but preserves personal info (name, email, phone)
  resetTrip: () => void;
}

export const useBookingDraft = create<BookingState>((set, get) => ({
  draft: { addons: [] },
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  reset: () => set({ draft: { addons: [] } }),
  resetTrip: () => {
    const { fullName, email, phone } = get().draft;
    set({ draft: { addons: [], fullName, email, phone } });
  },
}));
