import { api } from "./client";
import type { Booking } from "@/lib/types/booking.types";

export interface CheckoutInput {
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
}

export const paymentService = {
  // Legacy: Create a Stripe Checkout Session. Returns the hosted Stripe URL.
  createCheckout: async (input: CheckoutInput): Promise<{ url: string }> => {
    const res = await api.post<{ url: string }>("/payments/checkout", input);
    return res.data;
  },

  // Legacy: Verify a completed Checkout Session and create the booking.
  verifySession: async (sessionId: string): Promise<Booking> => {
    const res = await api.post<Booking>("/payments/verify", { sessionId });
    return res.data;
  },

  // Create a Stripe PaymentIntent for the custom Elements page.
  // Returns { clientSecret, paymentIntentId }.
  createIntent: async (input: CheckoutInput): Promise<{ clientSecret: string; paymentIntentId: string }> => {
    const res = await api.post<{ clientSecret: string; paymentIntentId: string }>("/payments/intent", input);
    return res.data;
  },

  // Verify a completed PaymentIntent and create the booking.
  confirmIntent: async (paymentIntentId: string): Promise<Booking> => {
    const res = await api.post<Booking>("/payments/confirm-intent", { paymentIntentId });
    return res.data;
  },

  // Get the currently active payment gateway from admin config.
  getActiveGateway: async (): Promise<'stripe' | 'razorpay'> => {
    const res = await api.get<{ gateway: 'stripe' | 'razorpay' }>("/payments/gateway");
    return res.data.gateway;
  },
};
