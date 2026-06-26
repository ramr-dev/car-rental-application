import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Heart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — DriveLux" },
      {
        name: "description",
        content: "Join the DriveLux team and build the future of urban premium mobility.",
      },
    ],
  }),
  component: CareersPage,
});

const JOBS = [
  {
    title: "Senior Full Stack Engineer",
    dept: "Engineering",
    location: "San Francisco, CA (Hybrid)",
    type: "Full-Time",
  },
  {
    title: "Operations Coordinator",
    dept: "Fleet Operations",
    location: "London, UK (On-site)",
    type: "Full-Time",
  },
  {
    title: "Customer Success Lead",
    dept: "Customer Experience",
    location: "Remote (US / Canada)",
    type: "Full-Time",
  },
];

function CareersPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge className="mb-4">We are hiring!</Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Join the DriveLux Team
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto">
            We are building a world where booking a premium supercar is as simple as hailing a ride. Help us shape the future of urban mobility.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Heart, title: "Our Culture", desc: "Collaborative, ambitious, and focused on making premium services simple." },
            { icon: Sparkles, title: "Great Perks", desc: "Comprehensive insurance, hybrid workspaces, and rental credits." },
            { icon: Briefcase, title: "Impactful Work", desc: "Work on advanced tools like live GPS mapping and AI-assisted support." },
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

        <div className="mt-16 space-y-6">
          <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
            Open Positions
          </h2>
          {JOBS.map((job, idx) => (
            <Card key={idx} className="p-6 bg-card border-border flex flex-wrap items-center justify-between gap-4 hover:border-primary transition-all duration-200">
              <div className="space-y-1">
                <h3 className="font-bold text-foreground">{job.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{job.dept}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{job.type}</Badge>
                <Button size="sm">Apply Now</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
