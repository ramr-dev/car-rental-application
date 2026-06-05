import type { BookingStatus, KycStatus } from "@/lib/types";

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

export function countRentalDays(startIso: string, endIso: string): number {
  return Math.max(
    1,
    Math.ceil((new Date(endIso).getTime() - new Date(startIso).getTime()) / 86_400_000),
  );
}

export function calcBookingTotal(
  pricePerDay: number,
  days: number,
  addonTotal = 0,
  feeRate = 0.12,
  taxRate = 0.085,
  deposit = 500,
): {
  subtotal: number;
  fees: number;
  addons: number;
  tax: number;
  deposit: number;
  total: number;
} {
  const subtotal = days * pricePerDay;
  const fees = Math.round(subtotal * feeRate);
  const tax = Math.round((subtotal + fees + addonTotal) * taxRate);
  return {
    subtotal,
    fees,
    addons: addonTotal,
    tax,
    deposit,
    total: subtotal + fees + addonTotal + tax,
  };
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
