import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
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
  Wallet,
  Smartphone,
  Building2,
  Globe,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { vehicleService } from "@/lib/api/vehicle.service";
import { paymentService } from "@/lib/api/payment.service";
import { offerService } from "@/lib/api/offer.service";
import { braintreeService } from "@/lib/api/braintree.service";
import {
  razorpayService,
  loadRazorpayScript,
  openRazorpayCheckout,
} from "@/lib/api/razorpay.service";
import { useBookingDraft } from "@/store/booking";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import { SECURITY_DEPOSIT, TAX_RATE, SERVICE_FEE_RATE } from "@/constants";
import { calcBookingTotal } from "@/utils/formatters";
import { api } from "@/lib/api/client";
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
        ".Label": { color: "#a0a6be", fontSize: "13px" },
        ".Tab": {
          backgroundColor: "#252844",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#a0a6be",
        },
        ".Tab:hover": { backgroundColor: "#2e3356", color: "#f0f2f8" },
        ".Tab--selected": {
          backgroundColor: "#2e3356",
          border: "1px solid #7c6ef7",
          color: "#f0f2f8",
        },
        ".Block": {
          backgroundColor: "#252844",
          border: "1px solid rgba(255,255,255,0.08)",
        },
        ".Error": { color: "#f87171" },
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
        ".Input": { border: "1px solid #e8ebf0", boxShadow: "none" },
        ".Input:focus": {
          border: "1px solid #5c4be8",
          boxShadow: "0 0 0 2px rgba(92,75,232,0.15)",
        },
      },
    };
}

// ─── Date/time formatter ──────────────────────────────────────────────────

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

// ─── Gateway indicator badge ──────────────────────────────────────────────

function GatewayBadge({ gateway }: { gateway: 'stripe' | 'razorpay' | 'braintree' | null }) {
  if (gateway === 'razorpay') {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Smartphone className="h-3.5 w-3.5 text-green-500" /> UPI (GPay, PhonePe, Paytm)
        </span>
        <span className="flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-green-500" /> All Debit / Credit Cards
        </span>
        <span className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-green-500" /> Net Banking
        </span>
        <span className="flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5 text-green-500" /> Wallets
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-green-500" /> Secured by Razorpay
        </span>
      </div>
    );
  }
  if (gateway === 'braintree') {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-emerald-500" /> Visa / Mastercard / Amex
        </span>
        <span className="flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-emerald-500" /> Debit Cards
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> 3D Secure
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-emerald-500" /> Secured by Braintree
        </span>
      </div>
    );
  }
  return (
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
  );
}

// ─── Razorpay checkout form ───────────────────────────────────────────────

function RazorpayCheckoutForm({
  totalAmount,
  draft,
  vehicle,
  isDark,
}: {
  totalAmount: number;
  draft: any;
  vehicle: any;
  isDark: boolean;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRazorpayPay = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setErrorMessage("Failed to load payment system. Please check your connection and try again.");
      setIsProcessing(false);
      return;
    }

    let orderData: any;
    try {
      orderData = await razorpayService.createOrder({
        vehicleId:       Number(vehicle.id),
        startDate:       draft.startDate,
        endDate:         draft.endDate,
        pickupLocation:  draft.pickupLocation,
        dropoffLocation: draft.dropoffLocation || draft.pickupLocation,
        customerName:    draft.fullName ?? "",
        customerEmail:   draft.email ?? "",
        customerPhone:   draft.phone ?? "",
        licenseNumber:   draft.licenseNumber ?? "",
        licenseExpiry:   draft.licenseExpiry ?? "",
        licenseCountry:  draft.licenseCountry ?? "",
        notes:           draft.notes,
        hasDamageProtection: draft.addons?.includes("damage_protection"),
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Failed to create payment order. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
      setIsProcessing(false);
      return;
    }

    openRazorpayCheckout({
      orderId:       orderData.orderId,
      amount:        orderData.amount,
      currency:      orderData.currency,
      keyId:         orderData.keyId,
      vehicleName:   orderData.vehicleName,
      vehicleImage:  orderData.vehicleImage,
      customerName:  draft.fullName ?? "",
      customerEmail: draft.email ?? "",
      customerPhone: draft.phone ?? "",
      isDark,
      onDismiss: () => {
        setIsProcessing(false);
        toast.info("Payment cancelled.");
      },
      onSuccess: async (response) => {
        try {
          await razorpayService.verify({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          });
          toast.success("Payment successful! Booking confirmed.");
          window.location.href = "/booking/success?razorpay=1";
        } catch (err: any) {
          const msg = err?.response?.data?.error ?? "Payment succeeded but booking creation failed. Please contact support.";
          setErrorMessage(msg);
          toast.error(msg);
          setIsProcessing(false);
        }
      },
    });
  };

  return (
    <Card className="p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Payment Details
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay securely via UPI, cards, net banking, or wallets — powered by Razorpay.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accepted Payment Methods</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Smartphone, label: "UPI", sub: "GPay, PhonePe, Paytm" },
            { icon: CreditCard, label: "Cards", sub: "Visa, Master, RuPay" },
            { icon: Building2,  label: "Net Banking", sub: "100+ banks" },
            { icon: Wallet,     label: "Wallets", sub: "Paytm, Mobikwik" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{sub}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Clicking "Pay Now" opens the Razorpay secure checkout popup.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <Button
        id="razorpay-pay-btn"
        size="lg"
        className="w-full shadow-glow"
        onClick={handleRazorpayPay}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening Razorpay…
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Pay ₹{Math.round(totalAmount * 83).toLocaleString("en-IN")} (${totalAmount.toFixed(2)}) securely
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By completing this payment you agree to our rental terms and cancellation policy.
      </p>
    </Card>
  );
}

// ─── Braintree Drop-in checkout form ─────────────────────────────────────

function BraintreeCheckoutForm({
  totalAmount,
  draft,
  vehicle,
  isDark,
}: {
  totalAmount: number;
  draft: any;
  vehicle: any;
  isDark: boolean;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDropInReady, setIsDropInReady] = useState(false);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const dropinInstanceRef = useRef<any>(null);
  const dropinContainerRef = useRef<HTMLDivElement>(null);

  // Fetch client token on mount
  useEffect(() => {
    braintreeService.getClientToken()
      .then(setClientToken)
      .catch(() => setErrorMessage("Failed to initialise payment. Please refresh."));
  }, []);

  // Initialise Braintree Drop-in once token is available
  useEffect(() => {
    if (!clientToken || !dropinContainerRef.current) return;

    let active = true;
    let instance: any = null;

    // Clear any previous elements to avoid "already has a Drop-in" errors
    dropinContainerRef.current.innerHTML = "";
    setIsDropInReady(false);

    // @ts-ignore
    import("braintree-web-drop-in").then((dropin) => {
      if (!active) return;

      // Double-check container is still empty and present
      if (!dropinContainerRef.current) return;
      dropinContainerRef.current.innerHTML = "";

      try {
        dropin.default.create(
          {
            authorization: clientToken,
            container: dropinContainerRef.current!,
            card: {
              cardholderName: { required: true },
              overrides: {
                styles: {
                  input: {
                    "font-size": "14px",
                    "font-family": "Inter, sans-serif",
                    color: isDark ? "#ffffff" : "#000000",
                  },
                  ":focus": {
                    color: isDark ? "#ffffff" : "#000000",
                  },
                  ".valid": {
                    color: isDark ? "#ffffff" : "#000000",
                  },
                },
              },
            },
          },
          (err: any, dropinInstance: any) => {
            if (!active) {
              if (dropinInstance) {
                dropinInstance.teardown().catch(() => {});
              }
              return;
            }
            if (err) {
              setErrorMessage("Failed to load payment form. Please refresh.");
              return;
            }
            instance = dropinInstance;
            dropinInstanceRef.current = dropinInstance;
            setIsDropInReady(true);
          },
        );
      } catch (createErr) {
        console.error("Braintree create error:", createErr);
        setErrorMessage("Failed to load payment form. Please refresh.");
      }
    });

    return () => {
      active = false;
      dropinInstanceRef.current = null;
      if (instance) {
        instance.teardown().catch(() => {});
      }
    };
  }, [clientToken, isDark]);

  const handlePay = async () => {
    if (!dropinInstanceRef.current) return;
    setIsProcessing(true);
    setErrorMessage(null);

    dropinInstanceRef.current.requestPaymentMethod(async (err: any, payload: any) => {
      if (err) {
        setErrorMessage(err.message ?? "Please enter valid card details.");
        setIsProcessing(false);
        return;
      }

      try {
        await braintreeService.checkout({
          paymentMethodNonce: payload.nonce,
          vehicleId:       Number(vehicle.id),
          startDate:       draft.startDate,
          endDate:         draft.endDate,
          pickupLocation:  draft.pickupLocation,
          dropoffLocation: draft.dropoffLocation || draft.pickupLocation,
          customerName:    draft.fullName ?? "",
          customerEmail:   draft.email ?? "",
          customerPhone:   draft.phone ?? "",
          licenseNumber:   draft.licenseNumber ?? "",
          licenseExpiry:   draft.licenseExpiry ?? "",
          licenseCountry:  draft.licenseCountry ?? "",
          notes:           draft.notes,
          hasDamageProtection: draft.addons?.includes("damage_protection"),
        });
        toast.success("Payment successful! Booking confirmed.");
        window.location.href = "/booking/success?braintree=1";
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ??
          "Payment failed. Please try again or use a different card.";
        setErrorMessage(msg);
        toast.error(msg);
        setIsProcessing(false);
      }
    });
  };

  return (
    <Card className="p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5 text-emerald-500" />
          Pay with Card
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay securely using any major credit or debit card — powered by Braintree.
        </p>
      </div>

      {/* Accepted payment methods */}
      <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accepted Payment Methods</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: CreditCard, label: "Visa",       sub: "Credit / Debit" },
            { icon: CreditCard, label: "Mastercard", sub: "Credit / Debit" },
            { icon: CreditCard, label: "Amex",       sub: "Credit card" },
            { icon: ShieldCheck, label: "3D Secure", sub: "Fraud protection" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 text-center transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
            >
              <Icon className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Drop-in container */}
      {!clientToken ? (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          <span className="text-sm text-muted-foreground">Loading payment form…</span>
        </div>
      ) : (
        <div
          id="braintree-dropin-container"
          ref={dropinContainerRef}
          className="rounded-xl overflow-hidden"
        />
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <Button
        id="braintree-pay-btn"
        size="lg"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-glow"
        onClick={handlePay}
        disabled={!isDropInReady || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing payment…
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Pay ${totalAmount.toFixed(2)} securely
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Total: <span className="font-semibold text-foreground">${totalAmount.toFixed(2)}</span> USD ·
        By completing this payment you agree to our rental terms.
      </p>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

function BookingPaymentPage() {
  const { draft } = useBookingDraft();
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  // Detect active gateway (stripe | razorpay | braintree)
  const { data: activeGateway, isLoading: gatewayLoading } = useQuery({
    queryKey: ["active-gateway"],
    queryFn: paymentService.getActiveGateway,
    staleTime: 30_000,
    retry: 1,
  });

  const { data: config = {
    damage_protection_fee: 20,
    security_deposit_percent: 20,
    tax_rate: 0.085,
    service_fee_rate: 0.12,
  } } = useQuery({
    queryKey: ["app-config"],
    queryFn: async () => {
      const { data } = await api.get("/config");
      return data;
    },
    staleTime: 5 * 60_000,
  });

  const gateway = activeGateway ?? "stripe";

  // Stripe state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);

  const createIntent = useCallback(async () => {
    if (!vehicle || !draft.startDate || !draft.endDate || !draft.pickupLocation) return;
    setIntentLoading(true);
    setIntentError(null);
    try {
      const { clientSecret: cs } = await paymentService.createIntent({
        vehicleId:       Number(vehicle.id),
        startDate:       draft.startDate,
        endDate:         draft.endDate,
        pickupLocation:  draft.pickupLocation,
        dropoffLocation: draft.dropoffLocation || draft.pickupLocation,
        customerName:    draft.fullName ?? "",
        customerEmail:   draft.email ?? "",
        customerPhone:   draft.phone ?? "",
        licenseNumber:   draft.licenseNumber ?? "",
        licenseExpiry:   draft.licenseExpiry ?? "",
        licenseCountry:  draft.licenseCountry ?? "",
        notes:           draft.notes,
        hasDamageProtection: draft.addons?.includes("damage_protection"),
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
    if (!hasMounted) return;

    const raw = localStorage.getItem("drivelux-auth");
    const storedUser = raw ? JSON.parse(raw)?.state?.user : null;

    if (!storedUser && !user) {
      navigate({ to: "/login" });
      return;
    }

    if (!vehicleId || !draft.startDate) {
      window.location.href = "/vehicles";
      return;
    }
  }, [hasMounted, user, vehicleId, draft.startDate, navigate]);

  // Only create Stripe intent if Stripe is the active gateway
  useEffect(() => {
    if (gateway === "stripe" && vehicle && !clientSecret && !intentLoading && !intentError) {
      createIntent();
    }
  }, [gateway, vehicle, clientSecret, intentLoading, intentError, createIntent]);

  if (!hasMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!vehicleId || !draft.startDate) return null;

  const rentalHours =
    draft.startDate && draft.endDate
      ? Math.max(6, (new Date(draft.endDate).getTime() - new Date(draft.startDate).getTime()) / 3_600_000)
      : 12;

  const damageProtectionFee = config.damage_protection_fee ?? 20;
  const serviceFeeRate = config.service_fee_rate ?? 0.12;
  const taxRate = config.tax_rate ?? 0.085;
  const subtotalBeforeDiscount = vehicle ? Math.round(Math.max(1, Math.ceil(rentalHours / 24)) * vehicle.pricePerDay) : 0;
  const depositAmount = config.security_deposit_percent 
    ? Math.round(subtotalBeforeDiscount * (config.security_deposit_percent / 100))
    : 500;

  const pricing = vehicle
    ? calcBookingTotal(
        vehicle.pricePerDay,
        rentalHours,
        draft.addons?.includes("damage_protection") ? damageProtectionFee : 0,
        serviceFeeRate,
        taxRate,
        depositAmount,
        activeOffers
      )
    : null;

  const isLoading = vehicleLoading || gatewayLoading || (gateway === "stripe" && intentLoading);

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
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="font-display text-3xl font-bold">Complete Payment</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your payment is processed securely via{" "}
                  <span className="font-medium text-foreground">
                    {gateway === "razorpay" ? "Razorpay" : gateway === "braintree" ? "Braintree" : "Stripe"}
                  </span>.
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  gateway === "razorpay"
                    ? "border-blue-500/40 bg-blue-500/10 text-blue-500"
                    : gateway === "braintree"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-primary/40 bg-primary/10 text-primary"
                }
              >
                {gateway === "razorpay" ? "🇮🇳 UPI + Cards" : gateway === "braintree" ? "🌐 International" : "💳 International Cards"}
              </Badge>
            </div>

            {/* Loading state */}
            {isLoading ? (
              <Card className="flex min-h-[320px] items-center justify-center p-8">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Setting up secure payment…</p>
                </div>
              </Card>
            ) : gateway === "razorpay" ? (
              /* ── Razorpay form ─────────────────────────────────────── */
              <RazorpayCheckoutForm
                totalAmount={pricing?.total ?? 0}
                draft={draft}
                vehicle={vehicle}
                isDark={isDark}
              />
            ) : gateway === "braintree" ? (
              /* ── Braintree Drop-in ─────────────────────────────────── */
              <BraintreeCheckoutForm
                totalAmount={pricing?.total ?? 0}
                draft={draft}
                vehicle={vehicle}
                isDark={isDark}
              />
            ) : intentError ? (
              /* ── Stripe error state ────────────────────────────────── */
              <Card className="p-8 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-display font-semibold">Unable to initialize payment</p>
                  <p className="mt-1 text-sm text-muted-foreground">{intentError}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={createIntent}>Try again</Button>
                  <Button variant="outline" asChild>
                    <Link to="/booking/$id" params={{ id: vehicleId }}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to booking
                    </Link>
                  </Button>
                </div>
              </Card>
            ) : clientSecret ? (
              /* ── Stripe Elements form ──────────────────────────────── */
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: getStripeAppearance(isDark) }}
              >
                <CheckoutForm totalAmount={pricing?.total ?? 0} />
              </Elements>
            ) : null}

            {/* Security badges */}
            <GatewayBadge gateway={gateway} />
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
                          {draft.addons?.includes("damage_protection") && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Damage Protection</span>
                              <span>${damageProtectionFee}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service fee ({Math.round(serviceFeeRate * 100)}%)</span>
                            <span>${pricing.fees}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax ({Math.round(taxRate * 100)}%)</span>
                            <span>${pricing.tax}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-display font-bold">
                            <span>Total charged now</span>
                            <span className="text-primary">${pricing.total}</span>
                          </div>
                          {gateway === "razorpay" && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Approx. in INR</span>
                              <span>≈ ₹{Math.round(pricing.total * 83).toLocaleString("en-IN")}</span>
                            </div>
                          )}
                          {gateway === "braintree" && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Currency</span>
                              <span>USD (no conversion)</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            + ${pricing.deposit.toLocaleString()} refundable deposit at pickup
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

// ─── Stripe inner form ────────────────────────────────────────────────────

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
          id="stripe-pay-btn"
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
