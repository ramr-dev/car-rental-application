import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  Headphones,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
  Car,
  Truck,
  Bus,
  Wind,
  Gem,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PublicLayout } from "@/layouts/PublicLayout";
import { SearchBar } from "@/components/vehicles/SearchBar";
import { VehicleCard, VehicleCardSkeleton } from "@/components/vehicles/VehicleCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { vehicleService } from "@/lib/api";
import { faqs, testimonials } from "@/lib/mock-data";
import { VEHICLE_TYPES, VEHICLE_CATEGORY_META } from "@/constants";
import type { VehicleType } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DriveLux — Premium Car Rentals On Demand" },
      {
        name: "description",
        content:
          "Premium car rentals reimagined. Book from sedans to supercars in minutes.",
      },
    ],
  }),
  component: LandingPage,
});

const CATEGORY_ICONS: Record<VehicleType, React.ElementType> = {
  sedan: Car,
  suv: Truck,
  luxury: Gem,
  electric: Zap,
  convertible: Wind,
  van: Bus,
};

function LandingPage() {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehicleService.list(),
  });
  const [email, setEmail] = useState("");

  const featured = vehicles?.slice(0, 4) ?? [];

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("You're on the list! We'll be in touch soon.");
    setEmail("");
  };

  return (
    <PublicLayout>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-40 top-40 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />

        <div className="container relative mx-auto px-4 pb-20 pt-16 lg:px-8 lg:pb-32 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5 rounded-full px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Now serving 50+ cities
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Drive something
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                extraordinary today.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              Premium vehicles, transparent pricing, and white-glove service. From daily
              drivers to dream cars — your next adventure starts here.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="shadow-glow">
                <Link to="/vehicles">
                  Browse Fleet <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/about">How it works</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-5xl">
            <SearchBar />
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {(
              [
                ["50K+", "Happy Drivers"],
                ["2,400+", "Premium Vehicles"],
                ["4.9★", "Average Rating"],
                ["24/7", "Customer Care"],
              ] as const
            ).map(([v, l]) => (
              <div key={l}>
                <p className="font-display text-2xl font-bold sm:text-3xl">{v}</p>
                <p className="mt-1 text-xs text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ─────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/20 py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {(
              [
                {
                  icon: ShieldCheck,
                  title: "Fully Insured",
                  desc: "Every rental includes comprehensive insurance and 24/7 roadside assistance.",
                },
                {
                  icon: Award,
                  title: "Premium Fleet",
                  desc: "Hand-picked vehicles, immaculately maintained, less than 2 years old on average.",
                },
                {
                  icon: Headphones,
                  title: "Concierge Support",
                  desc: "Real humans available around the clock to make your trip seamless.",
                },
              ] as const
            ).map((f) => (
              <Card key={f.title} className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse by Category ────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">
              Categories
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Find your perfect match
            </h2>
            <p className="mt-2 text-muted-foreground">
              Browse by vehicle category — from daily commuters to weekend escapes.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {VEHICLE_TYPES.map((type) => {
              const meta = VEHICLE_CATEGORY_META[type];
              const Icon = CATEGORY_ICONS[type];
              return (
                <Link
                  key={type}
                  to="/vehicles"
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{meta.label}</p>
                    <p className="mt-0.5 hidden text-xs text-muted-foreground lg:block">
                      {meta.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Vehicles ─────────────────────────────────────────── */}
      <section className="bg-muted/20 py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-3">
                Featured
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Pick from our premium fleet
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Carefully curated vehicles for every occasion and budget.
              </p>
            </div>
            <Button variant="outline" asChild className="hidden sm:inline-flex">
              <Link to="/vehicles">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <VehicleCardSkeleton key={i} />)
              : featured.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>

          <div className="mt-8 flex justify-center sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/vehicles">
                View all vehicles <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">
              Testimonials
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Trusted by drivers everywhere
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {t.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-muted/20 py-20">
        <div className="container mx-auto max-w-3xl px-4 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">
              FAQ
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Common questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto max-w-2xl px-4 text-center lg:px-8">
          <Badge variant="secondary" className="mb-3">
            Newsletter
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Stay in the driver's seat
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Get exclusive deals, new vehicle launches, and member perks delivered straight
            to your inbox. No spam — unsubscribe any time.
          </p>
          <form
            onSubmit={handleNewsletter}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sm:w-72"
              required
              aria-label="Email address for newsletter"
            />
            <Button type="submit" className="shadow-glow sm:shrink-0">
              Subscribe
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Join 12,000+ drivers already subscribed.
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-20 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center text-primary-foreground shadow-glow lg:p-16">
          <div className="relative z-10">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Ready for the open road?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
              Sign up today and get 15% off your first rental.
            </p>
            <Button size="lg" variant="secondary" asChild className="mt-8">
              <Link to="/register">Create account</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
