import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Check, Car, MapPin, Calendar, CreditCard, AlertCircle, Loader2, Home,
} from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { paymentService } from "@/lib/api/payment.service";
import { useAuth } from "@/store/auth";
import { useBookingDraft } from "@/store/booking";
import { formatRentalDuration } from "@/utils/formatters";
import type { Booking } from "@/lib/types/booking.types";

export const Route = createFileRoute("/booking/success")({
  component: BookingSuccessPage,
  validateSearch: (search: Record<string, unknown>) => ({
    session_id:     (search.session_id as string)     ?? "",
    payment_intent: (search.payment_intent as string) ?? "",
    razorpay:       (search.razorpay as string)        ?? "",
  }),
});

function BookingSuccessPage() {
  const { session_id: sessionId, payment_intent: paymentIntentId, razorpay: isRazorpay } = Route.useSearch();
  const { user } = useAuth();
  const { resetTrip } = useBookingDraft();
  const navigate = useNavigate();

  // Wait for client-side Zustand rehydration before checking auth.
  // Without this, SSR renders user=null and immediately redirects to /login.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const [booking, setBooking]   = useState<Booking | null>(null);
  const [error,   setError]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!hydrated) return;

    if (!user) { navigate({ to: "/login" }); return; }

    // ── Razorpay flow: booking already verified on payment page ──────────────
    // Just fetch the user's most recent confirmed booking to display.
    if (isRazorpay === '1') {
      if (verifiedRef.current) return;
      verifiedRef.current = true;
      import('@/lib/api/client').then(({ api }) =>
        api.get<{ data: Booking[] }>('/bookings?limit=1&status=CONFIRMED')
          .then((res) => {
            const latest = (res.data as any)?.data?.[0] ?? null;
            setBooking(latest);
            resetTrip();
            setLoading(false);
          })
          .catch(() => {
            // Show generic success even without booking details
            setLoading(false);
          })
      );
      return;
    }

    if (!sessionId && !paymentIntentId) {
      setError("No payment session found. Please try booking again.");
      setLoading(false);
      return;
    }

    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verify = paymentIntentId
      ? paymentService.confirmIntent(paymentIntentId)
      : paymentService.verifySession(sessionId);

    verify
      .then((b) => {
        setBooking(b);
        resetTrip(); // keep fullName / email / phone for next booking
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.data?.error ?? "Payment verification failed. Please contact support.";
        setError(msg);
        setLoading(false);
      });
  }, [hydrated, sessionId, paymentIntentId, isRazorpay, user, navigate, resetTrip]);

  if (!hydrated || loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying your payment and confirming your booking…</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !booking) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold">Verification Failed</h1>
          <p className="mt-3 text-muted-foreground">{error}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/dashboard/bookings">My Bookings</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" /> Go Home
              </Link>
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const rentalHours = booking.rentalDays ?? 12; // rentalDays field now stores hours

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-2xl px-4 py-16 lg:px-8">

        {/* ── Success header ───────────────────────────────────────────── */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success ring-4 ring-success/20">
            <Check className="h-10 w-10" strokeWidth={2.5} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold">Booking Confirmed!</h1>
          <p className="mt-3 text-muted-foreground">
            Your payment was successful. A receipt has been sent to{" "}
            <span className="font-medium text-foreground">{booking.customerEmail}</span>.
          </p>
        </div>

        {/* ── Booking card ─────────────────────────────────────────────── */}
        <Card className="mt-10 overflow-hidden">
          <div className="flex items-center gap-4 border-b border-border bg-muted/30 p-6">
            <img
              src={booking.vehicleImage}
              alt={booking.vehicleName}
              className="h-20 w-28 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-display text-xl font-semibold truncate">{booking.vehicleName}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">Ref: {booking.id}</p>
            </div>
            <Badge className="bg-success text-success-foreground shadow-glow capitalize shrink-0">
              {booking.status}
            </Badge>
          </div>

          <div className="divide-y divide-border">
            <BookingInfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="Trip dates"
              value={`${booking.startDate.replace("T", " ")} → ${booking.endDate.replace("T", " ")} (${formatRentalDuration(rentalHours)})`}
            />
            <BookingInfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Pickup"
              value={booking.pickupLocation}
            />
            <BookingInfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Drop-off"
              value={booking.dropoffLocation}
            />
            <BookingInfoRow
              icon={<Car className="h-4 w-4" />}
              label="Customer"
              value={`${booking.customerName} · ${booking.customerEmail}`}
            />
            <BookingInfoRow
              icon={<CreditCard className="h-4 w-4" />}
              label="Amount paid"
              value={`$${booking.totalPrice.toLocaleString()}`}
              highlight
            />
            {booking.paidAt && (
              <BookingInfoRow
                icon={<Check className="h-4 w-4" />}
                label="Payment date"
                value={new Date(booking.paidAt).toLocaleString()}
              />
            )}
          </div>
        </Card>

        {/* ── Price breakdown ──────────────────────────────────────────── */}
        {booking.subtotal != null && (
          <Card className="mt-4 p-5 space-y-2 text-sm">
            <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Price breakdown
            </p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rental ({formatRentalDuration(rentalHours)})</span>
              <span>${booking.subtotal?.toLocaleString()}</span>
            </div>
            {booking.serviceFee != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service fee (12%)</span>
                <span>${booking.serviceFee?.toLocaleString()}</span>
              </div>
            )}
            {booking.taxAmount != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (8.5%)</span>
                <span>${booking.taxAmount?.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-display font-bold">
              <span>Total charged</span>
              <span>${booking.totalPrice.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
              A $500 refundable security deposit will be held at vehicle pickup.
            </p>
          </Card>
        )}

        {/* ── What happens next ────────────────────────────────────────── */}
        <div className="mt-6 rounded-xl border border-success/30 bg-success/5 p-5 text-sm">
          <p className="font-semibold text-card-foreground">What happens next?</p>
          <ol className="mt-2 space-y-1.5 text-muted-foreground list-none">
            <li>1. Your booking is confirmed — no further action needed.</li>
            <li>2. Show your driver's license and booking reference at pickup.</li>
            <li>3. A $500 security deposit will be held at vehicle collection.</li>
          </ol>
        </div>

        {/* ── Action buttons ───────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="shadow-glow">
            <Link to="/dashboard/bookings">
              <Car className="mr-2 h-4 w-4" /> View My Bookings
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>

      </div>
    </PublicLayout>
  );
}

function BookingInfoRow({
  icon, label, value, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-6 py-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${highlight ? "text-success font-semibold" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
