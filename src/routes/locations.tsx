import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Shield, Star } from "lucide-react";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: "Locations — DriveLux" },
      {
        name: "description",
        content: "Explore DriveLux premium rental locations worldwide.",
      },
    ],
  }),
  component: LocationsPage,
});

const LOCATIONS = [
  { city: "San Francisco", region: "California, USA", address: "100 Market St, Financial District", rating: 4.9, activeCars: 85 },
  { city: "New York City", region: "New York, USA", address: "450 Lexington Ave, Midtown East", rating: 4.8, activeCars: 120 },
  { city: "London", region: "Greater London, UK", address: "Park Ln, Mayfair", rating: 4.9, activeCars: 95 },
  { city: "Dubai", region: "Dubai Marina, UAE", address: "Sheikh Zayed Rd, Downtown", rating: 4.9, activeCars: 150 },
];

function LocationsPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge className="mb-4">Global Network</Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Our Locations
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto">
            DriveLux is active in major financial and luxury capitals. Book your premium vehicle for airport handoffs or city delivery.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {LOCATIONS.map((loc, idx) => (
            <Card key={idx} className="p-6 bg-card border-border flex flex-col justify-between gap-6 hover:border-primary transition-all duration-200">
              <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-foreground text-lg">{loc.city}</h3>
                  <p className="text-xs text-muted-foreground">{loc.region}</p>
                  <p className="text-sm text-muted-foreground font-mono">{loc.address}</p>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4.5 w-4.5 fill-warning text-warning" />
                  <strong className="text-foreground">{loc.rating}</strong> (Audited)
                </span>
                <span>
                  <strong>{loc.activeCars}</strong> Vehicles available
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
