import { api } from "./client";
import type { Booking } from "@/lib/types/booking.types";
import type { CheckoutInput } from "./payment.service";

// ── Razorpay Order Response ────────────────────────────────────────────────

export interface RazorpayOrderResponse {
  orderId:      string;
  amount:       number;   // in paise (INR × 100)
  amountUSD:    number;   // original USD total for display
  currency:     string;   // "INR"
  keyId:        string;   // Razorpay publishable key
  vehicleName:  string;
  vehicleImage: string;
  duration:     string;
}

// ── Razorpay Verify Input ──────────────────────────────────────────────────

export interface RazorpayVerifyInput {
  razorpay_order_id:   string;
  razorpay_payment_id: string;
  razorpay_signature:  string;
}

// ── Service ────────────────────────────────────────────────────────────────

export const razorpayService = {
  /**
   * Creates a Razorpay order on the backend.
   * Returns orderId, amount (paise), keyId.
   */
  createOrder: async (input: CheckoutInput): Promise<RazorpayOrderResponse> => {
    const res = await api.post<RazorpayOrderResponse>("/razorpay/order", input);
    return res.data;
  },

  /**
   * Verifies the Razorpay payment HMAC signature and creates the booking.
   * Called after the Razorpay checkout popup completes successfully.
   */
  verify: async (input: RazorpayVerifyInput): Promise<Booking> => {
    const res = await api.post<Booking>("/razorpay/verify", input);
    return res.data;
  },
};

// ── Razorpay Script Loader ─────────────────────────────────────────────────

/**
 * Dynamically loads the Razorpay checkout.js script.
 * Returns true if loaded successfully.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Open Razorpay Checkout ─────────────────────────────────────────────────

export interface RazorpayCheckoutOptions {
  orderId:       string;
  amount:        number;   // paise
  currency:      string;
  keyId:         string;
  vehicleName:   string;
  vehicleImage:  string;
  customerName:  string;
  customerEmail: string;
  customerPhone: string;
  isDark:        boolean;
  onSuccess: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss: () => void;
}

export function openRazorpayCheckout(opts: RazorpayCheckoutOptions): void {
  const rzp = new (window as any).Razorpay({
    key:         opts.keyId,
    order_id:    opts.orderId,
    amount:      opts.amount,
    currency:    opts.currency,
    name:        "DriveLux",
    description: opts.vehicleName,
    image:       opts.vehicleImage,
    prefill: {
      name:    opts.customerName,
      email:   opts.customerEmail,
      contact: opts.customerPhone,
    },
    theme: {
      color: opts.isDark ? "#7c6ef7" : "#5c4be8",  // matches DriveLux primary
    },
    modal: {
      ondismiss: opts.onDismiss,
    },
    handler: opts.onSuccess,
  });
  rzp.open();
}
