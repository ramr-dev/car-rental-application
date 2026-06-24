import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BookingDraft {
  vehicleId?: string;
  step?: number;
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

export const useBookingDraft = create<BookingState>()(
  persist(
    (set, get) => ({
      draft: { addons: [], step: 0 },
      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      reset: () => set({ draft: { addons: [], step: 0 } }),
      resetTrip: () => {
        const { fullName, email, phone } = get().draft;
        set({ draft: { addons: [], step: 0, fullName, email, phone } });
      },
    }),
    {
      name: "drivelux-booking-draft",
    },
  ),
);
