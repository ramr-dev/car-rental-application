import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  Globe,
  Heart,
  Sparkles,
  ShieldCheck,
  Zap,
  Star,
  Leaf,
} from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/about")({ component: AboutPage });

const TEAM = [
  {
    name: "Priya Sharma",
    role: "CEO & Co-Founder",
    bio: "Former VP at Hertz. Passionate about reimagining urban mobility.",
    initials: "PS",
  },
  {
    name: "Marcus Cole",
    role: "CTO & Co-Founder",
    bio: "Previously led engineering at Lyft. Obsessed with developer experience.",
    initials: "MC",
  },
  {
    name: "Elena Rossi",
    role: "Head of Fleet",
    bio: "15 years sourcing and maintaining premium vehicles across Europe and the US.",
    initials: "ER",
  },
  {
    name: "David Kim",
    role: "Head of Customer Experience",
    bio: "Built support teams at Airbnb and Apple. Believes every trip matters.",
    initials: "DK",
  },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Trust First",
    desc: "Every vehicle is inspected. Every driver is verified. Every rental is insured.",
  },
  {
    icon: Zap,
    title: "Frictionless",
    desc: "Book in under 3 minutes. No hidden fees, no paperwork, no hassle.",
  },
  {
    icon: Leaf,
    title: "Sustainable",
    desc: "30% of our fleet is electric or hybrid. We're aiming for 100% by 2030.",
  },
  {
    icon: Heart,
    title: "Human-Centered",
    desc: "Real support from real people — available every hour of every day.",
  },
];

const TIMELINE = [
  { year: "2020", label: "Founded", detail: "Started with 12 cars in San Francisco." },
  {
    year: "2021",
    label: "Series A",
    detail: "Raised $14M. Expanded to 8 cities across the US.",
  },
  {
    year: "2022",
    label: "1K Fleet",
    detail: "Reached 1,000 vehicles. Launched our EV-first initiative.",
  },
  {
    year: "2023",
    label: "International",
    detail: "Opened in London, Dubai, and Toronto.",
  },
  {
    year: "2024",
    label: "50K Drivers",
    detail: "Crossed 50,000 happy customers and a 4.9-star average.",
  },
  {
    year: "2025",
    label: "Today",
    detail: "2,400+ vehicles across 50+ cities. Growing every week.",
  },
];

function AboutPage() {
  return (
    <PublicLayout>
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="container relative mx-auto px-4 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              About DriveLux
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Premium mobility for modern lives.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              We built DriveLux because renting a car shouldn't feel like a transaction —
              it should feel like the first chapter of your trip. We're on a mission to
              make every journey exceptional.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/20 py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {(
              [
                { icon: Sparkles, title: "2020", label: "Founded" },
                { icon: Globe, title: "50+", label: "Cities worldwide" },
                { icon: Heart, title: "50K+", label: "Happy drivers" },
                { icon: Award, title: "4.9★", label: "Average rating" },
              ] as const
            ).map((s) => (
              <Card key={s.label} className="p-6 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-display text-2xl font-bold">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ─────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                Our Mission
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Every trip is a story worth telling.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                We started DriveLux because we believed the car rental industry had been
                broken for decades — hidden fees, aging fleets, and impersonal service.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Our answer: a curated fleet of premium vehicles, a booking flow you can
                complete in minutes, and a support team that actually picks up the phone.
                We've served over 50,000 drivers across 50 cities — and we're just getting
                started.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-3xl">
              <img
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop"
                alt="Premium fleet"
                className="w-full object-cover aspect-4/3"
              />
              <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-border/20" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ──────────────────────────────────────────── */}
      <section className="bg-muted/20 py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">
              Our Values
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              What we stand for
            </h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <Card key={v.title} className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">
              Our Journey
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              From startup to scale
            </h2>
          </div>

          <div className="relative mx-auto mt-14 max-w-3xl">
            <div className="absolute left-6 top-0 h-full w-px bg-border md:left-1/2" />
            <div className="space-y-10">
              {TIMELINE.map((item, i) => (
                <div
                  key={item.year}
                  className={`relative flex gap-6 md:gap-0 ${
                    i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div className="flex flex-col items-center md:hidden">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background font-display text-sm font-bold text-primary">
                      {item.year.slice(2)}
                    </div>
                    <div className="mt-2 flex-1 w-px bg-border" />
                  </div>

                  <div
                    className={`flex-1 pb-2 ${
                      i % 2 === 0
                        ? "md:pr-12 md:text-right"
                        : "md:pl-12 md:text-left"
                    }`}
                  >
                    <p className="font-display text-sm font-semibold text-primary">
                      {item.year}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold">{item.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </div>

                  <div className="absolute left-6 hidden -translate-x-1/2 md:left-1/2 md:flex">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background font-display text-sm font-bold text-primary shadow-soft">
                      {item.year.slice(2)}
                    </div>
                  </div>

                  <div className="hidden flex-1 md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ────────────────────────────────────────────── */}
      <section className="bg-muted/20 py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">
              The Team
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Built by people who love to drive
            </h2>
            <p className="mt-3 text-muted-foreground">
              We come from Hertz, Lyft, Airbnb, and Apple — united by the belief that
              travel should be effortless.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member) => (
              <Card key={member.name} className="p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-hero font-display text-xl font-bold text-primary-foreground shadow-glow">
                  {member.initials}
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{member.name}</h3>
                <p className="text-xs font-medium text-primary">{member.role}</p>
                <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof bar ────────────────────────────────── */}
      <section className="border-y border-border py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-warning text-warning" />
              ))}
            </div>
            <p className="font-display text-lg font-semibold">Rated 4.9 / 5</p>
            <p className="text-sm text-muted-foreground">
              Based on 12,000+ verified reviews across Google, Trustpilot, and the App
              Store.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
