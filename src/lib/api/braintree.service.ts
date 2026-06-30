import { api } from "./client";
import type { Booking } from "@/lib/types/booking.types";

// Shared booking details sent during Braintree checkout
export interface BraintreeCheckoutInput {
  paymentMethodNonce: string;
  vehicleId: number;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseCountry: string;
  notes?: string;
  hasDamageProtection?: boolean;
}

export const braintreeService = {
  /**
   * Fetches a Braintree client token from the backend.
   * Used to initialise the Drop-in UI.
   */
  getClientToken: async (): Promise<string> => {
    const res = await api.get<{ clientToken: string }>("/braintree/client-token");
    return res.data.clientToken;
  },

  /**
   * Submits the payment nonce + booking details to the backend.
   * Backend charges the card and creates the booking record.
   */
  checkout: async (input: BraintreeCheckoutInput): Promise<Booking> => {
    const res = await api.post<Booking>("/braintree/checkout", input);
    return res.data;
  },
};
