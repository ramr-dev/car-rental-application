import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/ui/card";
import { Scale, ShieldAlert, BadgeCheck, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — DriveLux" },
      {
        name: "description",
        content: "DriveLux terms of service. Review terms, rental agreements, and guest obligations.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Please read these terms and conditions carefully before booking a vehicle.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Scale, title: "Legality", desc: "You must be of legal age and possess a valid driver's license." },
            { icon: ShieldAlert, title: "Liability", desc: "Understand your financial liability, deposits, and coverage limits." },
            { icon: BadgeCheck, title: "Fair Use", desc: "Vehicles must be used responsibly and in accordance with terms." },
          ].map((item, idx) => (
            <Card key={idx} className="p-6 bg-card border-border flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground">{item.desc}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12 space-y-8 text-foreground/90 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. User Eligibility & KYC Requirements</h2>
            <p className="text-sm text-muted-foreground">
              To rent a vehicle on DriveLux, you must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Be at least 21 years old (25 years old for select high-end supercar tiers).</li>
              <li>Provide a valid driver's license through our customer KYC upload panel.</li>
              <li>Pass our identity and compliance audit review. We reserve the right to deny service if credentials are suspicious or invalid.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. Rental Booking, Cancellations, and Refunds</h2>
            <p className="text-sm text-muted-foreground">
              Reservations are bound by the following policies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li><strong>Cancellations:</strong> Free cancellation is available up to 48 hours prior to the scheduled pickup time. Cancellations inside 48 hours will incur a fee equivalent to one day's rental.</li>
              <li><strong>Refunds:</strong> Processed back to the original payment method (Stripe, Razorpay, or Braintree/PayPal) within 5–10 business days.</li>
              <li><strong>Security Deposits:</strong> A refundable security deposit is held at booking time and released within 48 hours of vehicle return, pending inspection.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. Prohibited Vehicle Uses</h2>
            <p className="text-sm text-muted-foreground">
              Rented vehicles must NOT be used for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Street racing, track events, stunts, or off-road driving.</li>
              <li>Commercial delivery services or towing other trailers.</li>
              <li>Transporting illegal items, hazardous substances, or pets without host approval.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. GPS Monitoring & Tracking</h2>
            <p className="text-sm text-muted-foreground">
              To ensure safety and vehicle protection, all DriveLux vehicles are equipped with active GPS tracking systems. By renting a vehicle, you consent to real-time location mapping during the duration of your booking.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
