import type { BookingStatus, KycStatus } from "@/lib/types";
import type { OfferTier } from "@/lib/types/offer.types";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} → ${formatDate(end)}`;
}

export function countRentalHours(startIso: string, endIso: string): number {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3_600_000;
}

export function countRentalDays(startIso: string, endIso: string): number {
  return Math.max(1, Math.ceil(countRentalHours(startIso, endIso) / 24));
}

function bestOffer(days: number, offers: OfferTier[]): OfferTier | null {
  if (days <= 0) return null;
  return (
    offers
      .filter(o => days >= o.minDays && (o.maxDays === null || days <= o.maxDays))
      .sort((a, b) => b.discountPercent - a.discountPercent)[0] ?? null
  );
}

/**
 * pricePerDay — daily base rate (also equals the 12-hour rate for hourly bookings).
 * hours       — actual rental duration in hours (minimum 6).
 * offers      — active OfferTiers fetched from the backend; pass [] for no discounts.
 *
 * Pricing rules:
 *  < 12 hrs  → hourly:  subtotal = hours × (pricePerDay / 12)
 *  ≥ 12 hrs  → daily:   subtotal = ceil(hours/24) × pricePerDay
 *              Best matching active offer discount applied to base subtotal.
 */
export function calcBookingTotal(
  pricePerDay: number,
  hours: number,
  addonTotal = 0,
  feeRate = 0.12,
  taxRate = 0.085,
  deposit = 500,
  offers: OfferTier[] = [],
): {
  subtotal: number;
  discount: number;
  appliedOffer: OfferTier | null;
  fees: number;
  addons: number;
  tax: number;
  deposit: number;
  total: number;
  isHourly: boolean;
  days: number;
} {
  let baseSubtotal: number;
  let discount = 0;
  let appliedOffer: OfferTier | null = null;
  let isHourly = false;
  let days = 0;

  if (hours < 12) {
    isHourly = true;
    baseSubtotal = Math.round((pricePerDay / 12) * hours);
  } else {
    days = Math.max(1, Math.ceil(hours / 24));
    baseSubtotal = Math.round(days * pricePerDay);
    appliedOffer = bestOffer(days, offers);
    if (appliedOffer) {
      discount = Math.round(baseSubtotal * (appliedOffer.discountPercent / 100));
    }
  }

  const subtotal = baseSubtotal - discount;
  const fees     = Math.round(subtotal * feeRate);
  const tax      = Math.round((subtotal + fees + addonTotal) * taxRate);
  return {
    subtotal,
    discount,
    appliedOffer,
    fees,
    addons: addonTotal,
    tax,
    deposit,
    total: subtotal + fees + addonTotal + tax,
    isHourly,
    days,
  };
}

export function formatRentalDuration(hours: number): string {
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  const days = Math.ceil(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const BOOKING_STATUS_VARIANT: Record<
  BookingStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  confirmed: "default",
  active: "default",
  pending: "outline",
  completed: "secondary",
  cancelled: "destructive",
};

export function getBookingStatusVariant(
  status: BookingStatus,
): "default" | "secondary" | "outline" | "destructive" {
  return BOOKING_STATUS_VARIANT[status] ?? "outline";
}

const KYC_STATUS_LABEL: Record<KycStatus, string> = {
  not_started: "Not started",
  pending: "Pending review",
  approved: "Verified",
  rejected: "Rejected",
};

export function getKycStatusLabel(status: KycStatus): string {
  return KYC_STATUS_LABEL[status];
}

export function isDeltaPositive(delta: string): boolean {
  return !delta.startsWith("-");
}
