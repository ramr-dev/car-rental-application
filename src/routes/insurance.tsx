import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, HeartHandshake, FileText, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance & Coverage — DriveLux" },
      {
        name: "description",
        content: "Explore DriveLux comprehensive protection options and rental insurance guidelines.",
      },
    ],
  }),
  component: InsurancePage,
});

const TIERS = [
  {
    name: "Standard Coverage",
    desc: "Basic coverage included with all bookings.",
    price: "Included",
    features: [
      "Third-party liability protection",
      "Roadside assistance support",
      "Standard deductible ($2,500 maximum out-of-pocket)",
    ],
  },
  {
    name: "Premium Protection",
    desc: "Complete peace of mind for luxury travel.",
    price: "+$45 / day",
    features: [
      "Zero deductible ($0 out-of-pocket for accidental scratches/dents)",
      "Full collision damage waiver (CDW)",
      "Tire & windshield damage waiver",
      "24/7 priority concierge support",
    ],
  },
];

function InsurancePage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge className="mb-4">Safe Travels</Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Insurance & Protection
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto">
            Travel with complete confidence. Every DriveLux booking includes verified third-party coverage, and you can upgrade to Premium Protection for zero deductible.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {TIERS.map((tier, idx) => (
            <Card key={idx} className="p-8 bg-card border-border flex flex-col justify-between hover:border-primary transition-all duration-200">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground text-xl">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.desc}</p>
                </div>
                <div className="text-2xl font-bold text-foreground">{tier.price}</div>
                <ul className="space-y-3">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex gap-2.5 items-start text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
