import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Eye, Lock, FileText } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — DriveLux" },
      {
        name: "description",
        content: "DriveLux privacy policy. Learn how we secure and protect your personal information.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Last updated: June 25, 2026. Learn how we handle and protect your personal data.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Eye, title: "Transparency", desc: "We are clear about what data we collect and why." },
            { icon: Lock, title: "Security First", desc: "Your personal data is encrypted and securely stored." },
            { icon: ShieldCheck, title: "Control", desc: "You decide how your information is used and shared." },
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
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              1. Information We Collect
            </h2>
            <p className="text-sm text-muted-foreground">
              We collect information to provide a better car rental experience. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li><strong>Account details:</strong> Name, email address, password, and contact details.</li>
              <li><strong>KYC Documents:</strong> Driver's license scans, expiry dates, and issuing country for identity verification.</li>
              <li><strong>Payment details:</strong> Transaction history, Stripe/Razorpay receipt numbers, and billing credentials (we do not store raw card numbers).</li>
              <li><strong>Telemetry:</strong> Rented vehicle GPS tracking location during active reservations.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. How We Use Your Data</h2>
            <p className="text-sm text-muted-foreground">
              Your personal and travel data is used solely for service delivery:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>To verify driver eligibility and compliance via KYC audit.</li>
              <li>To coordinate vehicle delivery and pickup with hosts.</li>
              <li>To handle billing transactions and fraud prevention.</li>
              <li>To simulate and monitor car routes for active reservation safety.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. Cookie Policy & Tracking</h2>
            <p className="text-sm text-muted-foreground">
              We use cookies to maintain your login session, save dark/light mode preferences, and analyze platform traffic. You can disable cookies in your browser settings, though some platform features may cease to function correctly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Contact Information</h2>
            <p className="text-sm text-muted-foreground">
              If you have any questions about this Privacy Policy or how we handle your personal data, please contact us at <a href="mailto:privacy@drivelux.com" className="text-primary hover:underline">privacy@drivelux.com</a>.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
