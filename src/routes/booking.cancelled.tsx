import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/booking/cancelled")({
  component: BookingCancelledPage,
  validateSearch: (search: Record<string, unknown>) => ({
    vehicle_id: (search.vehicle_id as string) ?? "",
  }),
});

function BookingCancelledPage() {
  const { vehicle_id: vehicleId } = Route.useSearch();

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <XCircle className="h-10 w-10" />
        </div>

        <h1 className="mt-6 font-display text-3xl font-bold">Payment Cancelled</h1>
        <p className="mt-3 text-muted-foreground">
          You cancelled the payment. No charge has been made and no booking was created.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your booking details have not been saved. You can try again at any time.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {vehicleId ? (
            <Button asChild size="lg" className="shadow-glow">
              <Link to="/booking/$id" params={{ id: vehicleId }}>
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </Link>
            </Button>
          ) : null}
          <Button variant="outline" asChild size="lg">
            <a href="/vehicles">
              <ArrowLeft className="mr-2 h-4 w-4" /> Browse Vehicles
            </a>
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
