export type BookingStatus = "pending" | "confirmed" | "active" | "completed" | "cancelled";

export interface Booking {
  id: string;
  userId?: string;
  vehicleId: string;
  vehicleName: string;
  vehicleImage: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseCountry?: string;
  notes?: string;
  rentalDays?: number;
  subtotal?: number;
  serviceFee?: number;
  taxAmount?: number;
  depositAmount?: number;
  // Payment fields (populated after Stripe verification)
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentStatus?: string;
  paidAt?: string;
}
