import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  Star,
  Users,
  ArrowRight,
} from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { vehicleService } from "@/lib/api";
import { reviews, vehicles as allVehicles } from "@/lib/mock-data";
import { useBookingDraft } from "@/store/booking";
import { calcBookingTotal } from "@/utils/formatters";
import { useSavedStore } from "@/store/saved";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vehicles/$id")({
  component: VehicleDetails,
});

function VehicleDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { setDraft } = useBookingDraft();
  const { toggleSave, isSaved } = useSavedStore();
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => vehicleService.get(id),
  });
  const [activeImage, setActiveImage] = useState(0);
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({});
  const saved = vehicle ? isSaved(vehicle.id) : false;

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-10 lg:px-8">
          <div className="aspect-video animate-pulse rounded-2xl bg-muted" />
          <div className="mt-6 space-y-4">
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-10 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!vehicle) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center lg:px-8">
          <h1 className="font-display text-2xl font-bold">Vehicle not found</h1>
          <p className="mt-2 text-muted-foreground">
            This vehicle doesn't exist or has been removed.
          </p>
          <Button asChild className="mt-6">
            <Link to="/vehicles">Back to vehicles</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const days =
    range.from && range.to
      ? Math.max(
          1,
          Math.ceil(
            (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

  const { subtotal, fees, total } = calcBookingTotal(vehicle.pricePerDay, days);

  const handleBook = () => {
    setDraft({
      vehicleId: vehicle.id,
      startDate: range.from?.toISOString(),
      endDate: range.to?.toISOString(),
    });
    navigate({ to: "/booking/$id", params: { id: vehicle.id } });
  };

  const similarVehicles = allVehicles
    .filter((v) => v.type === vehicle.type && v.id !== vehicle.id)
    .slice(0, 3);

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <Link
          to="/vehicles"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to fleet
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_400px]">
          {/* ── Left column ─────────────────────────────────── */}
          <div>
            {/* Gallery */}
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <img
                src={vehicle.images[activeImage]}
                alt={vehicle.name}
                className="aspect-16/10 w-full object-cover"
              />
              {vehicle.images.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full shadow-soft"
                    onClick={() =>
                      setActiveImage(
                        (i) => (i - 1 + vehicle.images.length) % vehicle.images.length,
                      )
                    }
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full shadow-soft"
                    onClick={() =>
                      setActiveImage((i) => (i + 1) % vehicle.images.length)
                    }
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {vehicle.images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {vehicle.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`overflow-hidden rounded-lg border-2 transition-all ${
                      activeImage === i
                        ? "border-primary"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="aspect-4/3 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Header */}
            <div className="mt-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {vehicle.brand} • {vehicle.year} •{" "}
                  <Badge variant="secondary" className="ml-1 capitalize">
                    {vehicle.type}
                  </Badge>
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {vehicle.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="font-medium">{vehicle.rating}</span>
                    <span className="text-muted-foreground">
                      ({vehicle.reviewCount} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {vehicle.location}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0 shadow-soft cursor-pointer"
                onClick={() => toggleSave(vehicle.id)}
              >
                <Heart className={cn("h-4 w-4 transition-colors", saved ? "fill-destructive text-destructive" : "")} />
                {saved ? "Saved" : "Save"}
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Highlight icon={Users} label="Seats" value={`${vehicle.seats}`} />
              <Highlight icon={Fuel} label="Fuel" value={vehicle.fuel} />
              <Highlight icon={Gauge} label="Transmission" value={vehicle.transmission} />
              <Highlight icon={Star} label="Class" value={vehicle.type} />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="mt-10">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="specs">Specs</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <p className="leading-relaxed text-muted-foreground">{vehicle.description}</p>
              </TabsContent>

              <TabsContent value="features" className="mt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {vehicle.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success">
                        <Check className="h-3 w-3" />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(vehicle.specs).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between rounded-lg border border-border p-4"
                    >
                      <span className="text-sm capitalize text-muted-foreground">{k}</span>
                      <span className="text-sm font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6 space-y-4">
                {reviews.map((r) => (
                  <Card key={r.id} className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {r.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{r.user}</p>
                          <p className="text-xs text-muted-foreground">{r.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5" aria-label={`Rating: ${r.rating} of 5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < r.rating
                                ? "fill-warning text-warning"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Booking card ────────────────────────────────── */}
          <Card className="h-fit p-6 lg:sticky lg:top-24">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-display text-3xl font-bold">
                  ${vehicle.pricePerDay}
                </span>
                <span className="text-muted-foreground"> / day</span>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" /> Free cancel
              </Badge>
            </div>

            <Separator className="my-5" />

            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <CalendarIcon className="h-4 w-4" /> Select dates
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  optional preview
                </span>
              </p>
              <Calendar
                mode="range"
                selected={range as { from: Date; to?: Date }}
                onSelect={(v) => setRange(v ?? {})}
                numberOfMonths={1}
                className="pointer-events-auto rounded-lg border border-border p-3"
              />
            </div>

            {days > 0 && (
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    ${vehicle.pricePerDay} × {days} day{days > 1 ? "s" : ""}
                  </span>
                  <span>${subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service fees</span>
                  <span>${fees}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total}</span>
                </div>
              </div>
            )}

            <Button
              size="lg"
              className="mt-5 w-full shadow-soft"
              disabled={!vehicle.available}
              onClick={handleBook}
            >
              {vehicle.available ? "Book Now" : "Unavailable"}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              $500 refundable security deposit at pickup
            </p>
          </Card>
        </div>

        {/* ── Similar Vehicles ────────────────────────────────────────── */}
        {similarVehicles.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  Similar vehicles
                </h2>
                <p className="mt-1 text-sm text-muted-foreground capitalize">
                  More {vehicle.type}s you might like
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/vehicles">
                  View all <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similarVehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
}

function Highlight({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold capitalize">{value}</p>
      </div>
    </Card>
  );
}
