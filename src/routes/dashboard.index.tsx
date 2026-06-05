import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, Car, CreditCard, Star } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { bookingService } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { getBookingStatusVariant } from "@/utils/formatters";

export const Route = createFileRoute("/dashboard/")({ component: DashboardHome });

function DashboardHome() {
  const { user } = useAuth();
  const { data: allBookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => bookingService.list(),
  });

  // Only show this user's bookings — match by userId or customerEmail.
  const bookings = allBookings.filter(
    (b) => b.userId === user?.id || b.customerEmail === user?.email,
  );

  const activeCount = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "active",
  ).length;
  const totalSpent = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const totalTrips = bookings.filter((b) => b.status === "completed").length;

  const upcoming = bookings
    .filter((b) => b.status === "confirmed" || b.status === "pending")
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's what's happening with your rentals.
          </p>
        </div>
        <Button asChild>
          <Link to="/vehicles">Book a vehicle</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-20" />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Active Bookings"
              value={String(activeCount)}
              delta={activeCount > 0 ? `${activeCount} in progress` : "None active"}
              icon={CalendarRange}
            />
            <StatCard
              label="Total Trips"
              value={String(totalTrips)}
              delta={totalTrips > 0 ? "Completed" : "No trips yet"}
              icon={Car}
            />
            <StatCard
              label="Total Spent"
              value={totalSpent > 0 ? `$${totalSpent.toLocaleString()}` : "$0"}
              delta="Completed bookings"
              icon={CreditCard}
            />
            <StatCard label="Member Rating" value="4.9" icon={Star} />
          </>
        )}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Upcoming bookings</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/bookings">View all</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <Skeleton className="h-20 w-32 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </Card>
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No upcoming bookings.</p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/vehicles">Browse fleet</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => (
              <Card
                key={b.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              >
                <img
                  src={b.vehicleImage}
                  alt=""
                  className="h-20 w-32 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-display font-semibold">{b.vehicleName}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.startDate} → {b.endDate}
                  </p>
                  <p className="text-xs text-muted-foreground">{b.pickupLocation}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={getBookingStatusVariant(b.status)} className="capitalize">
                    {b.status}
                  </Badge>
                  <span className="font-display font-semibold">${b.totalPrice}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
