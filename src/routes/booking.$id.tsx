import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CalendarDays,
  Car,
  Check,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { vehicleService } from "@/lib/api/vehicle.service";
import { useBookingDraft } from "@/store/booking";
import { BOOKING_STEPS, SECURITY_DEPOSIT, TAX_RATE, SERVICE_FEE_RATE } from "@/constants";
import { calcBookingTotal } from "@/utils/formatters";
import {
  step0Schema,
  step1Schema,
  step2Schema,
  type Step0Form,
  type Step1Form,
  type Step2Form,
} from "@/features/customer/booking/schemas/booking.schema";
import {
  SummaryRow,
  PriceRow,
} from "@/features/customer/booking/components/BookingHelpers";

export const Route = createFileRoute("/booking/$id")({
  component: BookingPage,
});

// ─── Main component ────────────────────────────────────────────────────────

function BookingPage() {
  const { id } = Route.useParams();
  const { draft, setDraft } = useBookingDraft();
  const navigate = useNavigate();
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => vehicleService.get(id),
  });

  const [step, setStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const step0Form = useForm<Step0Form>({
    resolver: zodResolver(step0Schema),
    defaultValues: {
      pickupLocation: draft.pickupLocation ?? "",
      dropoffLocation: draft.dropoffLocation ?? "",
      startDate: draft.startDate?.slice(0, 10) ?? "",
      endDate: draft.endDate?.slice(0, 10) ?? "",
    },
  });

  const step1Form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: draft.fullName ?? "",
      email: draft.email ?? "",
      phone: draft.phone ?? "",
    },
  });

  const step2Form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      licenseNumber: draft.licenseNumber ?? "",
      licenseExpiry: draft.licenseExpiry ?? "",
      licenseCountry: draft.licenseCountry ?? "",
      notes: draft.notes ?? "",
    },
  });

  const handleProceedToPayment = () => {
    if (!vehicle) return;
    setDraft({ vehicleId: String(vehicle.id) });
    navigate({ to: "/booking/payment" });
  };

  // ─── Loading state ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Vehicle not found</h1>
          <Button asChild className="mt-6">
            <Link to="/vehicles">Browse fleet</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  // ─── Derived values ─────────────────────────────────────────────────────

  const days =
    draft.startDate && draft.endDate
      ? Math.max(
          1,
          Math.ceil(
            (new Date(draft.endDate).getTime() - new Date(draft.startDate).getTime()) /
              86_400_000,
          ),
        )
      : 1;

  const pricing = calcBookingTotal(vehicle.pricePerDay, days, 0, SERVICE_FEE_RATE, TAX_RATE, SECURITY_DEPOSIT);

  // ─── Step advance handlers ───────────────────────────────────────────────

  const handleStep0 = step0Form.handleSubmit((data) => {
    setDraft({
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      startDate: data.startDate,
      endDate: data.endDate,
    });
    setStep(1);
  });

  const handleStep1 = step1Form.handleSubmit((data) => {
    setDraft({ fullName: data.fullName, email: data.email, phone: data.phone });
    setStep(2);
  });

  const handleStep2 = step2Form.handleSubmit((data) => {
    setDraft({
      licenseNumber: data.licenseNumber,
      licenseExpiry: data.licenseExpiry,
      licenseCountry: data.licenseCountry,
      notes: data.notes,
    });
    setStep(3);
  });

  const prev = () => setStep((s) => Math.max(0, s - 1));

  // ─── Booking form ────────────────────────────────────────────────────────

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-10 lg:px-8">

        {/* ── Stepper ──────────────────────────────────────────────────── */}
        <nav aria-label="Booking steps" className="mb-10">
          <ol className="flex items-center gap-0">
            {BOOKING_STEPS.map((label, i) => (
              <li key={label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      i < step
                        ? "bg-success text-success-foreground"
                        : i === step
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "bg-muted text-muted-foreground"
                    }`}
                    aria-current={i === step ? "step" : undefined}
                  >
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={`hidden text-xs font-medium sm:block ${
                      i === step ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < BOOKING_STEPS.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 transition-all ${
                      i < step ? "bg-success" : "bg-border"
                    }`}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* ── Step panels ──────────────────────────────────────────────── */}
          <div>

            {/* ── Step 0: Trip Details ──────────────────────────────────── */}
            {step === 0 && (
              <Card className="p-6 lg:p-8">
                <h2 className="font-display text-2xl font-semibold">
                  <CalendarDays className="mr-2 inline h-6 w-6 text-primary" />
                  Trip Details
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Where and when would you like the vehicle?
                </p>

                <form id="step0-form" onSubmit={handleStep0} className="mt-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Pickup Date *</Label>
                      <Input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        {...step0Form.register("startDate")}
                      />
                      {step0Form.formState.errors.startDate && (
                        <p className="mt-1 text-xs text-destructive">
                          {step0Form.formState.errors.startDate.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Return Date *</Label>
                      <Input
                        type="date"
                        min={step0Form.watch("startDate") || new Date().toISOString().slice(0, 10)}
                        {...step0Form.register("endDate")}
                      />
                      {step0Form.formState.errors.endDate && (
                        <p className="mt-1 text-xs text-destructive">
                          {step0Form.formState.errors.endDate.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Pickup Location *</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="e.g. JFK Airport, Terminal 4"
                        {...step0Form.register("pickupLocation")}
                      />
                    </div>
                    {step0Form.formState.errors.pickupLocation && (
                      <p className="mt-1 text-xs text-destructive">
                        {step0Form.formState.errors.pickupLocation.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Drop-off Location</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Leave blank if same as pickup"
                        {...step0Form.register("dropoffLocation")}
                      />
                    </div>
                  </div>
                </form>

                <div className="mt-8 flex justify-end">
                  <Button form="step0-form" type="submit" size="lg">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* ── Step 1: Personal Info ─────────────────────────────────── */}
            {step === 1 && (
              <Card className="p-6 lg:p-8">
                <h2 className="font-display text-2xl font-semibold">
                  <User className="mr-2 inline h-6 w-6 text-primary" />
                  Your Information
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll use this to contact you about your booking.
                </p>

                <form id="step1-form" onSubmit={handleStep1} className="mt-6 space-y-5">
                  <div>
                    <Label>Full Name *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Jane Smith"
                        autoComplete="name"
                        {...step1Form.register("fullName")}
                      />
                    </div>
                    {step1Form.formState.errors.fullName && (
                      <p className="mt-1 text-xs text-destructive">
                        {step1Form.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Email Address *</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        className="pl-9"
                        placeholder="jane@example.com"
                        autoComplete="email"
                        {...step1Form.register("email")}
                      />
                    </div>
                    {step1Form.formState.errors.email && (
                      <p className="mt-1 text-xs text-destructive">
                        {step1Form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Phone Number *</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="tel"
                        className="pl-9"
                        placeholder="+1 (555) 000-0000"
                        autoComplete="tel"
                        {...step1Form.register("phone")}
                      />
                    </div>
                    {step1Form.formState.errors.phone && (
                      <p className="mt-1 text-xs text-destructive">
                        {step1Form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                </form>

                <div className="mt-8 flex justify-between gap-3">
                  <Button variant="outline" onClick={prev}>Back</Button>
                  <Button form="step1-form" type="submit" size="lg">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* ── Step 2: License & Notes ───────────────────────────────── */}
            {step === 2 && (
              <Card className="p-6 lg:p-8">
                <h2 className="font-display text-2xl font-semibold">
                  <FileText className="mr-2 inline h-6 w-6 text-primary" />
                  License & Notes
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Driver's license information for the primary driver.
                </p>

                <form id="step2-form" onSubmit={handleStep2} className="mt-6 space-y-5">
                  <div>
                    <Label>Driver's License Number *</Label>
                    <Input
                      placeholder="e.g. D1234567"
                      className="mt-1 font-mono tracking-wide"
                      {...step2Form.register("licenseNumber")}
                    />
                    {step2Form.formState.errors.licenseNumber && (
                      <p className="mt-1 text-xs text-destructive">
                        {step2Form.formState.errors.licenseNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>License Expiry Date *</Label>
                      <Input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        className="mt-1"
                        {...step2Form.register("licenseExpiry")}
                      />
                      {step2Form.formState.errors.licenseExpiry && (
                        <p className="mt-1 text-xs text-destructive">
                          {step2Form.formState.errors.licenseExpiry.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Issuing Country / State *</Label>
                      <Input
                        placeholder="e.g. California, USA"
                        className="mt-1"
                        {...step2Form.register("licenseCountry")}
                      />
                      {step2Form.formState.errors.licenseCountry && (
                        <p className="mt-1 text-xs text-destructive">
                          {step2Form.formState.errors.licenseCountry.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Additional Notes</Label>
                    <Textarea
                      placeholder="Any special requests, accessibility needs, or extra information for our team…"
                      rows={4}
                      className="mt-1 resize-none"
                      {...step2Form.register("notes")}
                    />
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-sm">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-muted-foreground">
                      Your license information is securely stored and only used to verify your
                      identity at pickup.
                    </p>
                  </div>
                </form>

                <div className="mt-8 flex justify-between gap-3">
                  <Button variant="outline" onClick={prev}>Back</Button>
                  <Button form="step2-form" type="submit" size="lg">
                    Review Summary <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {/* ── Step 3: Summary ───────────────────────────────────────── */}
            {step === 3 && (
              <Card className="p-6 lg:p-8">
                <h2 className="font-display text-2xl font-semibold">
                  <ShieldCheck className="mr-2 inline h-6 w-6 text-primary" />
                  Booking Summary
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review all details before submitting your request.
                </p>

                {/* Trip overview */}
                <div className="mt-6 space-y-0 divide-y divide-border rounded-xl border border-border overflow-hidden">
                  <SummaryRow icon={<Car className="h-4 w-4" />} label="Vehicle" value={vehicle.name} />
                  <SummaryRow icon={<MapPin className="h-4 w-4" />} label="Pickup" value={`${draft.pickupLocation || "—"} · ${draft.startDate || "—"}`} />
                  <SummaryRow icon={<MapPin className="h-4 w-4" />} label="Drop-off" value={`${draft.dropoffLocation || draft.pickupLocation || "—"} · ${draft.endDate || "—"}`} />
                  <SummaryRow icon={<CalendarDays className="h-4 w-4" />} label="Duration" value={`${days} day${days !== 1 ? "s" : ""}`} />
                  <SummaryRow icon={<User className="h-4 w-4" />} label="Customer" value={`${draft.fullName || "—"} · ${draft.phone || "—"}`} />
                  <SummaryRow icon={<Mail className="h-4 w-4" />} label="Email" value={draft.email || "—"} />
                  <SummaryRow icon={<FileText className="h-4 w-4" />} label="License" value={`${draft.licenseNumber || "—"} · ${draft.licenseCountry || "—"}`} />
                </div>

                {/* Price breakdown */}
                <div className="mt-6 space-y-3">
                  <h3 className="font-display text-lg font-semibold">Price Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <PriceRow label={`Daily rate ($${vehicle.pricePerDay} × ${days} day${days !== 1 ? "s" : ""})`} amount={pricing.subtotal} />
                    <PriceRow label={`Service fee (${Math.round(SERVICE_FEE_RATE * 100)}%)`} amount={pricing.fees} />
                    <PriceRow label={`Tax (${Math.round(TAX_RATE * 100)}%)`} amount={pricing.tax} />
                    <Separator />
                    <PriceRow label="Subtotal" amount={pricing.total} />
                    <PriceRow label={`Security deposit (refundable)`} amount={SECURITY_DEPOSIT} muted />
                    <Separator />
                    <div className="flex justify-between font-display text-base font-bold">
                      <span>Total due at pickup</span>
                      <span>${(pricing.total + SECURITY_DEPOSIT).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 hover:bg-muted/40">
                  <Checkbox
                    checked={termsAccepted}
                    onCheckedChange={(v) => setTermsAccepted(!!v)}
                    className="mt-0.5"
                  />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    I confirm all the information provided is accurate. I agree to the{" "}
                    <span className="font-medium text-foreground">rental terms</span>,{" "}
                    <span className="font-medium text-foreground">cancellation policy</span>, and
                    understand that a $500 refundable security deposit will be held at vehicle
                    pickup.
                  </p>
                </label>

                <div className="mt-8 flex justify-between gap-3">
                  <Button variant="outline" onClick={prev}>Back</Button>
                  <Button
                    size="lg"
                    className="shadow-glow"
                    disabled={!termsAccepted}
                    onClick={handleProceedToPayment}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Proceed to Payment
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* ── Vehicle card sidebar ──────────────────────────────────────── */}
          <div className="space-y-4">
            <Card className="overflow-hidden lg:sticky lg:top-24">
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

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily rate</span>
                    <span className="font-semibold">${vehicle.pricePerDay}</span>
                  </div>
                  {days > 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{days} days</span>
                      <span className="font-semibold">${pricing.subtotal}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service fee</span>
                    <span>${pricing.fees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${pricing.tax}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-display font-bold">
                    <span>Rental total</span>
                    <span>${pricing.total}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>+ Security deposit</span>
                    <span>${SECURITY_DEPOSIT} refundable</span>
                  </div>
                </div>

                {draft.startDate && draft.endDate && (
                  <div className="mt-4 rounded-lg bg-success/10 p-3 text-xs text-success">
                    <p className="font-medium">
                      {draft.startDate} → {draft.endDate}
                    </p>
                    <p className="text-success/70">{days} day{days !== 1 ? "s" : ""} rental</p>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <p className="font-medium">Free cancellation</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Cancel up to 48 hours before pickup for a full refund.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

