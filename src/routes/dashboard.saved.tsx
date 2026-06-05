import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Car } from "lucide-react";
import { useSavedStore } from "@/store/saved";
import { vehicles as allVehicles } from "@/lib/mock-data";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/saved")({
  component: DashboardSavedPage,
});

function DashboardSavedPage() {
  const { savedIds } = useSavedStore();

  const savedVehicles = allVehicles.filter((v) => savedIds.includes(v.id));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Saved Vehicles</h1>
          <p className="mt-1 text-muted-foreground">
            Your collection of shortlisted premium rentals ({savedVehicles.length})
          </p>
        </div>
        {savedVehicles.length > 0 && (
          <Button asChild variant="outline">
            <Link to="/vehicles">Browse more fleet</Link>
          </Button>
        )}
      </div>

      <div className="mt-8">
        {savedVehicles.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
            <EmptyState
              title="No saved vehicles yet"
              description="Browse our fleet and tap the heart icon on any vehicle to add it to your shortlist."
              icon={Heart}
            />
            <Button asChild className="mt-6 shadow-glow">
              <Link to="/vehicles">Explore fleet</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} variant="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
