import { Link } from "@tanstack/react-router";
import { Fuel, Gauge, Heart, MapPin, Star, Users } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSavedStore } from "@/store/saved";
import { cn } from "@/lib/utils";

export function VehicleCard({ vehicle, variant = "grid" }: { vehicle: Vehicle; variant?: "grid" | "list" }) {
  const { toggleSave, isSaved } = useSavedStore();
  const saved = isSaved(vehicle.id); 
  console.log("VehicleCard render:", vehicle);

  if (variant === "list") {
    return (
      <Card className="group flex flex-col overflow-hidden border-border/60 transition-all hover:shadow-elevated md:flex-row">
        <div className="relative h-56 md:h-auto md:w-72 md:shrink-0 overflow-hidden bg-muted">
          <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave(vehicle.id); }}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 hover:bg-background border border-border text-muted-foreground transition-all hover:scale-110 active:scale-95 shadow-soft cursor-pointer"
            aria-label={saved ? "Remove from saved" : "Save vehicle"}
          >
          <Heart className={cn("h-4 w-4 transition-colors", saved ? "fill-destructive text-destructive" : "text-foreground")} />
          </button>
          {!vehicle.available && (
            <Badge variant="secondary" className="absolute left-3 top-3">Unavailable</Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{vehicle.brand} • {vehicle.year}</p>
              <h3 className="mt-1 font-display text-xl font-semibold">{vehicle.name}</h3>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-medium">{vehicle.rating}</span>
              <span className="text-muted-foreground">({vehicle.reviewCount})</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {vehicle.location}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Spec icon={<Users className="h-4 w-4" />} label={`${vehicle.seats} seats`} />
            <Spec icon={<Fuel className="h-4 w-4" />} label={vehicle.fuel} />
            <Spec icon={<Gauge className="h-4 w-4" />} label={vehicle.transmission} />
            <Spec icon={<Star className="h-4 w-4" />} label={vehicle.type} />
          </div>
          <div className="mt-auto flex items-end justify-between pt-5">
            <div>
              <span className="font-display text-2xl font-bold">${Math.round(vehicle.pricePerDay / 12)}</span>
              <span className="text-sm text-muted-foreground"> / hr</span>
            </div>
            <Button asChild>
              <Link to="/booking/$id" params={{ id: vehicle.id }}>
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group flex flex-col overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-elevated">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        <Badge className="absolute left-3 top-3 capitalize bg-background/90 text-foreground hover:bg-background/90 border border-border">
          {vehicle.type}
        </Badge>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave(vehicle.id); }}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 hover:bg-background border border-border text-muted-foreground transition-all hover:scale-110 active:scale-95 shadow-soft cursor-pointer"
          aria-label={saved ? "Remove from saved" : "Save vehicle"}
        >
          <Heart className={cn("h-4 w-4 transition-colors", saved ? "fill-destructive text-destructive" : "text-foreground")} />
        </button>
        {!vehicle.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Badge variant="secondary">Currently unavailable</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{vehicle.brand}</p>
            <h3 className="mt-1 truncate font-display text-lg font-semibold">{vehicle.name}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-medium">{vehicle.rating}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <Spec icon={<Users className="h-3.5 w-3.5" />} label={`${vehicle.seats}`} />
          <Spec icon={<Fuel className="h-3.5 w-3.5" />} label={vehicle.fuel} />
          <Spec icon={<Gauge className="h-3.5 w-3.5" />} label={vehicle.transmission.slice(0, 4)} />
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
          <div>
            <span className="font-display text-xl font-bold">${Math.round(vehicle.pricePerDay / 12)}</span>
            <span className="text-xs text-muted-foreground">/hr</span>
          </div>
          <Button size="sm" asChild>
            <Link to="/booking/$id" params={{ id: vehicle.id }}>
              Details
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 capitalize text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
  );
}

export function VehicleCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted" />
      </div>
    </Card>
  );
}
