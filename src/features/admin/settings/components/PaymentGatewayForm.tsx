import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Smartphone,
  Globe,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── API helpers ─────────────────────────────────────────────────────────────

async function fetchGateway(): Promise<"stripe" | "razorpay" | "braintree"> {
  const res = await api.get<{ gateway: "stripe" | "razorpay" | "braintree" }>("/admin/config/gateway");
  return res.data.gateway;
}

async function saveGateway(gateway: "stripe" | "razorpay" | "braintree"): Promise<void> {
  await api.patch("/admin/config/gateway", { gateway });
}

// ── Gateway option data ─────────────────────────────────────────────────────

const GATEWAYS = [
  {
    id:          "stripe" as const,
    name:        "Stripe",
    description: "Best for international payments — Visa, Mastercard, Amex.",
    methods:     ["Visa / Mastercard / Amex", "Apple Pay / Google Pay", "Bank debits (SEPA, ACH)", "3D Secure supported"],
    badge:       "International",
    badgeClass:  "border-violet-500/40 bg-violet-500/10 text-violet-500",
    icon:        CreditCard,
    colorClass:  "text-violet-500",
    borderActive:"border-violet-500",
    bg:          "bg-violet-500/5",
    note:        "Currently in use for USD payments. UPI not supported.",
  },
  {
    id:          "razorpay" as const,
    name:        "Razorpay",
    description: "Best for Indian customers — UPI, cards, net banking, wallets.",
    methods:     ["UPI (GPay, PhonePe, Paytm)", "Debit / Credit Cards (incl. RuPay)", "Net Banking (100+ banks)", "Paytm / Mobikwik Wallets"],
    badge:       "UPI Supported 🇮🇳",
    badgeClass:  "border-blue-500/40 bg-blue-500/10 text-blue-500",
    icon:        Smartphone,
    colorClass:  "text-blue-500",
    borderActive:"border-blue-500",
    bg:          "bg-blue-500/5",
    note:        "Charges in INR. Conversion applied at checkout (~₹83/USD).",
  },
  {
    id:          "braintree" as const,
    name:        "Braintree",
    description: "Accept credit cards, PayPal, and digital wallets via Drop-in UI.",
    methods:     ["Credit / Debit Cards", "PayPal Wallet", "Google Pay / Apple Pay", "Advanced Fraud Protection"],
    badge:       "🌐 Braintree",
    badgeClass:  "border-sky-500/40 bg-sky-500/10 text-sky-600",
    icon:        Globe,
    colorClass:  "text-sky-500",
    borderActive:"border-sky-500",
    bg:          "bg-sky-500/5",
    note:        "Charges in USD. Utilises secure client token flow.",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

export function PaymentGatewayForm() {
  const queryClient = useQueryClient();

  const { data: activeGateway, isLoading, isError } = useQuery({
    queryKey: ["admin-gateway"],
    queryFn:  fetchGateway,
    staleTime: 30_000,
  });

  const [selected, setSelected] = useState<"stripe" | "razorpay" | "braintree" | null>(null);
  const pending = selected ?? activeGateway ?? "stripe";

  const { mutate: applyGateway, isPending: isSaving } = useMutation({
    mutationFn: saveGateway,
    onSuccess: (_, gateway) => {
      queryClient.setQueryData(["admin-gateway"], gateway);
      queryClient.invalidateQueries({ queryKey: ["active-gateway"] });
      const label = gateway === "razorpay" ? "Razorpay" : gateway === "braintree" ? "Braintree" : "Stripe";
      toast.success(`✅ Active gateway switched to ${label}.`);
      setSelected(null);
    },
    onError: () => {
      toast.error("Failed to update gateway. Please try again.");
    },
  });

  const isDirty = selected !== null && selected !== activeGateway;

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading gateway configuration…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span>Failed to load gateway configuration. Please refresh.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-semibold">Payment Gateway</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the active payment gateway for all new bookings. Changes take effect immediately — no redeploy needed.
        </p>
      </div>

      {/* Current status banner */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
        <span>
          Currently active:{" "}
          <strong>
            {activeGateway === "razorpay"
              ? "Razorpay (UPI + Cards)"
              : activeGateway === "braintree"
              ? "Braintree (Cards/PayPal)"
              : "Stripe (International)"}
          </strong>
        </span>
        <Badge
          variant="outline"
          className={
            activeGateway === "razorpay"
              ? "ml-auto border-blue-500/40 bg-blue-500/10 text-blue-500"
              : activeGateway === "braintree"
              ? "ml-auto border-sky-500/40 bg-sky-500/10 text-sky-600"
              : "ml-auto border-violet-500/40 bg-violet-500/10 text-violet-500"
          }
        >
          {activeGateway === "razorpay"
            ? "🇮🇳 UPI Enabled"
            : activeGateway === "braintree"
            ? "🌐 Braintree Active"
            : "💳 International"}
        </Badge>
      </div>

      {/* Gateway selection cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {GATEWAYS.map((gw) => {
          const Icon = gw.icon;
          const isActive = activeGateway === gw.id;
          const isSelected = pending === gw.id;

          return (
            <button
              key={gw.id}
              id={`gateway-option-${gw.id}`}
              type="button"
              onClick={() => setSelected(gw.id)}
              className={[
                "relative rounded-2xl border-2 p-5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? `${gw.borderActive} ${gw.bg}`
                  : "border-border hover:border-border/80 hover:bg-muted/30",
              ].join(" ")}
            >
              {/* Active chip */}
              {isActive && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  ACTIVE
                </span>
              )}

              {/* Radio dot */}
              <div
                className={[
                  "mb-4 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                  isSelected ? `${gw.borderActive} bg-current` : "border-muted-foreground/30",
                ].join(" ")}
              >
                {isSelected && (
                  <div className={`h-2 w-2 rounded-full bg-current ${gw.colorClass}`} />
                )}
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    gw.bg,
                  ].join(" ")}
                >
                  <Icon className={`h-5 w-5 ${gw.colorClass}`} />
                </div>
                <div>
                  <p className="font-semibold font-display">{gw.name}</p>
                  <Badge variant="outline" className={`text-[10px] ${gw.badgeClass}`}>
                    {gw.badge}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{gw.description}</p>

              <ul className="space-y-1.5">
                {gw.methods.map((method) => (
                  <li key={method} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${gw.colorClass}`} />
                    {method}
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-[11px] text-muted-foreground/70 italic">{gw.note}</p>
            </button>
          );
        })}
      </div>

      {/* Warning for Razorpay — test keys reminder */}
      {pending === "razorpay" && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Razorpay Test Mode Active</p>
            <p className="mt-0.5 text-xs opacity-80">
              Using sandbox keys. No real money will be charged. Replace{" "}
              <code className="font-mono bg-yellow-500/10 px-1 py-0.5 rounded">RAZORPAY_KEY_ID</code> and{" "}
              <code className="font-mono bg-yellow-500/10 px-1 py-0.5 rounded">RAZORPAY_KEY_SECRET</code>{" "}
              in <code className="font-mono bg-yellow-500/10 px-1 py-0.5 rounded">backend/.env</code> with your live keys when ready.
            </p>
          </div>
        </div>
      )}

      {/* Warning for Braintree — test keys reminder */}
      {pending === "braintree" && (
        <div className="flex items-start gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-sm text-sky-700 dark:text-sky-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Braintree Sandbox Mode Active</p>
            <p className="mt-0.5 text-xs opacity-80">
              Using sandbox keys. No real money will be charged. Replace{" "}
              <code className="font-mono bg-sky-500/10 px-1 py-0.5 rounded">BRAINTREE_MERCHANT_ID</code>,{" "}
              <code className="font-mono bg-sky-500/10 px-1 py-0.5 rounded">BRAINTREE_PUBLIC_KEY</code>, and{" "}
              <code className="font-mono bg-sky-500/10 px-1 py-0.5 rounded">BRAINTREE_PRIVATE_KEY</code>{" "}
              in <code className="font-mono bg-sky-500/10 px-1 py-0.5 rounded">backend/.env</code> with your live keys when ready.
            </p>
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          id="save-gateway-btn"
          onClick={() => applyGateway(pending)}
          disabled={!isDirty || isSaving}
          className="min-w-[160px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Switching…
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Switch to{" "}
              {pending === "razorpay"
                ? "Razorpay"
                : pending === "braintree"
                ? "Braintree"
                : "Stripe"}
            </>
          )}
        </Button>
        {isDirty && (
          <span className="text-xs text-muted-foreground">
            Unsaved change: will switch from <strong>{activeGateway}</strong> to <strong>{pending}</strong>
          </span>
        )}
      </div>

    </div>
  );
}
