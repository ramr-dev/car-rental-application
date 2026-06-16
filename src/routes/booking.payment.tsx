import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  ArrowLeft,
  Calendar,
  Car,
  CreditCard,
  Lock,
  MapPin,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { vehicleService } from "@/lib/api/vehicle.service";
import { paymentService } from "@/lib/api/payment.service";
import { offerService } from "@/lib/api/offer.service";
import { useBookingDraft } from "@/store/booking";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import { SECURITY_DEPOSIT, TAX_RATE, SERVICE_FEE_RATE } from "@/constants";
import { calcBookingTotal } from "@/utils/formatters";
import type { StripeElementsOptions } from "@stripe/stripe-js";

export const Route = createFileRoute("/booking/payment")({
  component: BookingPaymentPage,
});

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
);

// ─── Stripe appearance per theme ──────────────────────────────────────────

function getStripeAppearance(isDark: boolean): StripeElementsOptions["appearance"] {
  return isDark
    ? {
      theme: "night",
      variables: {
        colorPrimary: "#7c6ef7",
        colorBackground: "#1c2133",
        colorText: "#f0f2f8",
        colorDanger: "#f87171",
        colorTextSecondary: "#a0a6be",
        colorTextPlaceholder: "#616880",
        colorIconTab: "#a0a6be",
        colorIconTabSelected: "#7c6ef7",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        borderRadius: "10px",
        spacingUnit: "4px",
      },
      rules: {
        ".Input": {
          backgroundColor: "#252844",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "#f0f2f8",
          boxShadow: "none",
        },
        ".Input:focus": {
          border: "1px solid #7c6ef7",
          boxShadow: "0 0 0 2px rgba(124,110,247,0.25)",
        },
        ".Label": {
          color: "#a0a6be",
          fontSize: "13px",
        },
        ".Tab": {
          backgroundColor: "#252844",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#a0a6be",
        },
        ".Tab:hover": {
          backgroundColor: "#2e3356",
          color: "#f0f2f8",
        },
        ".Tab--selected": {
          backgroundColor: "#2e3356",
          border: "1px solid #7c6ef7",
          color: "#f0f2f8",
        },
        ".Block": {
          backgroundColor: "#252844",
          border: "1px solid rgba(255,255,255,0.08)",
        },
        ".Error": {
          color: "#f87171",
        },
      },
    }
    : {
      theme: "stripe",
      variables: {
        colorPrimary: "#5c4be8",
        colorBackground: "#ffffff",
        colorText: "#1a1a2e",
        colorDanger: "#e05c5c",
        colorTextSecondary: "#6b7280",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        borderRadius: "10px",
        spacingUnit: "4px",
      },
      rules: {
        ".Input": {
          border: "1px solid #e8ebf0",
          boxShadow: "none",
        },
        ".Input:focus": {
          border: "1px solid #5c4be8",
          boxShadow: "0 0 0 2px rgba(92,75,232,0.15)",
        },
      },
    };
}

// ─── Page wrapper — fetches clientSecret and mounts Elements ──────────────

function fmtDT(dt: string | undefined): string {
  if (!dt) return "—";
  const tIdx = dt.indexOf("T");
  if (tIdx === -1) return dt;
  const datePart = dt.slice(0, tIdx);
  const timePart = dt.slice(tIdx + 1, tIdx + 6);
  const [h, m] = timePart.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${datePart} ${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function BookingPaymentPage() {
  const { draft } = useBookingDraft();
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const vehicleId = draft.vehicleId;

  const { data: vehicle, isLoading: vehicleLoading } = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: () => vehicleService.get(vehicleId!),
    enabled: !!vehicleId,
  });

  const { data: activeOffers = [] } = useQuery({
    queryKey: ["offers"],
    queryFn: offerService.listActive,
    staleTime: 5 * 60_000,
  });

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);

  const createIntent = useCallback(async () => {
    if (!vehicle || !draft.startDate || !draft.endDate || !draft.pickupLocation) return;
    setIntentLoading(true);
    setIntentError(null);
    try {
      const { clientSecret: cs } = await paymentService.createIntent({
        vehicleId: Number(vehicle.id),
        startDate: draft.startDate,
        endDate: draft.endDate,
        pickupLocation: draft.pickupLocation,
        dropoffLocation: draft.dropoffLocation || draft.pickupLocation,
        customerName: draft.fullName ?? "",
        customerEmail: draft.email ?? "",
        customerPhone: draft.phone ?? "",
        licenseNumber: draft.licenseNumber ?? "",
        licenseExpiry: draft.licenseExpiry ?? "",
        licenseCountry: draft.licenseCountry ?? "",
        notes: draft.notes,
      });
      setClientSecret(cs);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Failed to initialize payment. Please go back and try again.";
      setIntentError(msg);
      toast.error(msg);
    } finally {
      setIntentLoading(false);
    }
  }, [vehicle, draft]);

  useEffect(() => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (!vehicleId || !draft.startDate) { window.location.href = "/vehicles"; return; }
  }, [user, vehicleId, draft.startDate, navigate]);

  useEffect(() => {
    if (vehicle && !clientSecret && !intentLoading && !intentError) {
      createIntent();
    }
  }, [vehicle, clientSecret, intentLoading, intentError, createIntent]);

  if (!vehicleId || !draft.startDate) return null;

  const rentalHours =
    draft.startDate && draft.endDate
      ? Math.max(6, (new Date(draft.endDate).getTime() - new Date(draft.startDate).getTime()) / 3_600_000)
      : 12;

  const pricing = vehicle
    ? calcBookingTotal(vehicle.pricePerDay, rentalHours, 0, SERVICE_FEE_RATE, TAX_RATE, SECURITY_DEPOSIT, activeOffers)
    : null;

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-5xl px-4 py-10 lg:px-8">

        {/* Back link */}
        <Link
          to="/booking/$id"
          params={{ id: vehicleId }}
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to booking summary
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* ── Left: Payment form ──────────────────────────────────────── */}
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-bold">Complete Payment</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your payment is processed securely via Stripe.
              </p>
            </div>

            {vehicleLoading || intentLoading ? (
              <Card className="flex min-h-[320px] items-center justify-center p-8">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Setting up secure payment…</p>
                </div>
              </Card>
            ) : intentError ? (
              <Card className="p-8 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-display font-semibold">Unable to initialize payment</p>
                  <p className="mt-1 text-sm text-muted-foreground">{intentError}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={createIntent}>
                    Try again
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/booking/$id" params={{ id: vehicleId }}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to booking
                    </Link>
                  </Button>
                </div>
              </Card>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: getStripeAppearance(isDark),
                }}
              >
                <CheckoutForm totalAmount={pricing?.total ?? 0} />
              </Elements>
            ) : null}

            {/* Security badges */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-success" /> 256-bit SSL
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-success" /> Powered by Stripe
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-success" /> No card data stored
              </span>
            </div>
          </div>

          {/* ── Right: Order summary ────────────────────────────────────── */}
          <div>
            <div className="space-y-4 lg:sticky lg:top-24">
              {vehicleLoading ? (
                <Card className="p-6">
                  <div className="h-40 animate-pulse rounded-lg bg-muted" />
                </Card>
              ) : vehicle ? (
                <Card className="overflow-hidden">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="aspect-video w-full object-cover"
                  />
                  <div className="p-5">
                    <h3 className="font-display text-lg font-semibold">{vehicle.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.brand} · {vehicle.year} · {vehicle.type}
                    </p>

                    <Separator className="my-4" />

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2.5">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Trip dates</p>
                          <p className="font-medium">{fmtDT(draft.startDate)}</p>
                          <p className="font-medium">→ {fmtDT(draft.endDate)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {pricing
                              ? pricing.isHourly
                                ? `${Math.round(rentalHours)} hrs billed`
                                : `${pricing.days} day${pricing.days !== 1 ? "s" : ""} billed`
                              : `${Math.round(rentalHours)} hrs billed`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pickup</p>
                          <p className="font-medium">{draft.pickupLocation}</p>
                        </div>
                      </div>
                      {draft.dropoffLocation && draft.dropoffLocation !== draft.pickupLocation && (
                        <div className="flex items-start gap-2.5">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Drop-off</p>
                            <p className="font-medium">{draft.dropoffLocation}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2.5">
                        <Car className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Customer</p>
                          <p className="font-medium">{draft.fullName}</p>
                        </div>
                      </div>
                    </div>

                    {pricing && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-2 text-sm">
                          {pricing.isHourly ? (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                ${Math.round(vehicle.pricePerDay / 12)}/hr × {Math.round(rentalHours)} hrs
                              </span>
                              <span>${pricing.subtotal}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  ${vehicle.pricePerDay.toLocaleString()}/day × {pricing.days} day{pricing.days !== 1 ? "s" : ""}
                                </span>
                                <span>${pricing.subtotal + pricing.discount}</span>
                              </div>
                              {pricing.appliedOffer && (
                                <div className="flex justify-between text-success">
                                  <span>
                                    {pricing.appliedOffer.title} ({pricing.appliedOffer.discountPercent}% off)
                                  </span>
                                  <span>-${pricing.discount.toLocaleString()}</span>
                                </div>
                              )}
                            </>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service fee (12%)</span>
                            <span>${pricing.fees}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax (8.5%)</span>
                            <span>${pricing.tax}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-display font-bold">
                            <span>Total charged now</span>
                            <span className="text-primary">${pricing.total}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            + $500 refundable deposit at pickup
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              ) : null}
            </div>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}

// ─── Inner form — lives inside Elements context ───────────────────────────

function CheckoutForm({ totalAmount }: { totalAmount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/success`,
      },
    });

    // Only reaches here on immediate error — success redirects automatically
    if (error) {
      const msg =
        error.type === "card_error" || error.type === "validation_error"
          ? (error.message ?? "Your card was declined.")
          : "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 lg:p-8 space-y-6">
        <div>
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Details
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All major cards accepted. Your details are encrypted and never stored.
          </p>
        </div>

        <div className="rounded-xl border border-border p-4">
          <PaymentElement options={{ layout: "tabs" }} />
        </div>

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full shadow-glow"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing payment…
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Pay ${totalAmount.toLocaleString()} securely
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By completing this payment you agree to our rental terms and cancellation policy.
        </p>
      </Card>
    </form>
  );
}
