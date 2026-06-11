import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Grid3x3, List, Search, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { z } from "zod";
import { PublicLayout } from "@/layouts/PublicLayout";
import { FilterGroup } from "@/components/vehicles/FilterGroup";
import { VehicleCard, VehicleCardSkeleton } from "@/components/vehicles/VehicleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/common/EmptyState";
import { vehicleService } from "@/lib/api";
import {
  VEHICLE_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
  SEAT_OPTIONS,
  SORT_OPTIONS,
  PRICE_RANGE_MIN,
  PRICE_RANGE_MAX,
  PRICE_RANGE_STEP,
  VEHICLES_PER_PAGE,
} from "@/constants";
import { applyFilters } from "@/hooks/useVehicleFilters";
import type { SortOption } from "@/hooks/useVehicleFilters";
import { useDebounce } from "@/hooks/useDebounce";

// ─── URL search schema ─────────────────────────────────────────────────────
// All filter state lives in the URL — filters survive navigation and are shareable.

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  sort: z.string().optional().catch("recommended"),
  minPrice: z.coerce.number().optional().catch(PRICE_RANGE_MIN),
  maxPrice: z.coerce.number().optional().catch(PRICE_RANGE_MAX),
  // Arrays encoded as comma-separated strings: "sedan,suv"
  types: z.string().optional().catch(""),
  fuels: z.string().optional().catch(""),
  tx: z.string().optional().catch(""),
  seats: z.coerce.number().nullable().optional().catch(null),
  page: z.coerce.number().optional().catch(1),
  view: z.enum(["grid", "list"]).optional().catch("grid"),
});

type VehicleSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/vehicles")({
  validateSearch: (search: Record<string, unknown>): VehicleSearch =>
    searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Browse Vehicles — DriveLux" },
      { name: "description", content: "Browse our full fleet of premium rental vehicles." },
    ],
  }),
  component: VehiclesPage,
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseList(s: string): string[] {
  return s ? s.split(",").filter(Boolean) : [];
}

function toggleInList(list: string[], value: string): string {
  const arr = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  return arr.join(",");
}

// ─── Page component ────────────────────────────────────────────────────────

function VehiclesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: () => vehicleService.list() });
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  // Fallback defaults for optional search params to satisfy TypeScript
  const q = search.q ?? "";
  const sort = search.sort ?? "recommended";
  const minPrice = search.minPrice ?? PRICE_RANGE_MIN;
  const maxPrice = search.maxPrice ?? PRICE_RANGE_MAX;
  const page = search.page ?? 1;
  const view = search.view ?? "grid";
  const seats = search.seats ?? null;

  // Helper: update one or more search params and reset page to 1
  const set = (updates: Partial<VehicleSearch> & { page?: number }) =>
    navigate({ search: (prev) => ({ ...prev, ...updates }) });

  const resetFilters = () =>
    navigate({
      search: {
        q: "", sort: "recommended",
        minPrice: PRICE_RANGE_MIN, maxPrice: PRICE_RANGE_MAX,
        types: "", fuels: "", tx: "", seats: null, page: 1, view: view,
      },
    });

  // Parse comma-separated arrays from URL
  const types = parseList(search.types ?? "");
  const fuels = parseList(search.fuels ?? "");
  const transmissions = parseList(search.tx ?? "");

  // Debounce the search query so we don't fire on every keystroke
  const debouncedQ = useDebounce(q);

  // Apply all filters (pure function imported from hook)
  const filtered = useMemo(
    () =>
      applyFilters(
        data ?? [],
        {
          search: debouncedQ,
          sort: sort as SortOption,
          price: [minPrice, maxPrice],
          types,
          fuels,
          transmissions,
          minSeats: seats,
        },
        debouncedQ,
      ),
    [data, debouncedQ, sort, minPrice, maxPrice, types, fuels, transmissions, seats],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / VEHICLES_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const paginated = filtered.slice((currentPage - 1) * VEHICLES_PER_PAGE, currentPage * VEHICLES_PER_PAGE);

  const hasActiveFilters =
    q || types.length || fuels.length || transmissions.length ||
    seats || minPrice > PRICE_RANGE_MIN || maxPrice < PRICE_RANGE_MAX;

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider">Price per day</Label>
        <div className="mt-4">
          <Slider
            value={[minPrice, maxPrice]}
            onValueChange={([min, max]) => set({ minPrice: min, maxPrice: max, page: 1 })}
            min={PRICE_RANGE_MIN}
            max={PRICE_RANGE_MAX}
            step={PRICE_RANGE_STEP}
          />
          <div className="mt-2 flex justify-between text-sm text-muted-foreground">
            <span>${minPrice}</span>
            <span>${maxPrice}</span>
          </div>
        </div>
      </div>

      <FilterGroup
        label="Vehicle Type"
        options={VEHICLE_TYPES}
        selected={types}
        onToggle={(v) => set({ types: toggleInList(types, v), page: 1 })}
      />
      <FilterGroup
        label="Fuel"
        options={FUEL_TYPES}
        selected={fuels}
        onToggle={(v) => set({ fuels: toggleInList(fuels, v), page: 1 })}
      />
      <FilterGroup
        label="Transmission"
        options={TRANSMISSIONS}
        selected={transmissions}
        onToggle={(v) => set({ tx: toggleInList(transmissions, v), page: 1 })}
      />

      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider">Min Seats</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {SEAT_OPTIONS.map((n) => (
            <Button
              key={n}
              size="sm"
              variant={seats === n ? "default" : "outline"}
              onClick={() => set({ seats: seats === n ? null : n, page: 1 })}
            >
              {n}+
            </Button>
          ))}
        </div>
      </div>

      <Button
        variant="ghost"
        className="w-full"
        onClick={resetFilters}
        disabled={!hasActiveFilters}
      >
        Reset filters
      </Button>
    </div>
  );

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-10 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Browse our fleet</h1>
          <p className="mt-1 text-muted-foreground">
            {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""} available
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="ml-2 text-xs text-primary underline underline-offset-2 hover:no-underline"
              >
                Clear filters
              </button>
            )}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Desktop filter sidebar */}
          <Card className="hidden h-fit p-6 lg:block">{filterPanel}</Card>

          <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => set({ q: e.target.value, page: 1 })}
                  placeholder="Search by name or brand…"
                  className="pl-10"
                  aria-label="Search vehicles"
                />
              </div>

              {/* Mobile filter sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {[types.length > 0, fuels.length > 0, transmissions.length > 0, !!seats].filter(Boolean).length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">{filterPanel}</div>
                </SheetContent>
              </Sheet>

              <Select
                value={sort}
                onValueChange={(v) => set({ sort: v, page: 1 })}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex rounded-lg border border-border p-0.5">
                <Button
                  size="icon"
                  variant={view === "grid" ? "secondary" : "ghost"}
                  className="h-8 w-8"
                  onClick={() => set({ view: "grid" })}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={view === "list" ? "secondary" : "ghost"}
                  className="h-8 w-8"
                  onClick={() => set({ view: "list" })}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="mt-6">
              {isLoading ? (
                <div className={view === "grid" ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <VehicleCardSkeleton key={i} />
                  ))}
                </div>
              ) : paginated.length === 0 ? (
                <EmptyState
                  title="No vehicles found"
                  description="Try adjusting your filters or search query."
                />
              ) : (
                <div className={view === "grid" ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
                  {paginated.map((v) => (
                    <VehicleCard key={v.id} vehicle={v} variant={view} />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <nav
                className="mt-10 flex items-center justify-center gap-2"
                aria-label="Pagination"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => set({ page: currentPage - 1 })}
                >
                  Previous
                </Button>
                {Array.from({ length: pageCount }).map((_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    onClick={() => set({ page: i + 1 })}
                    aria-current={currentPage === i + 1 ? "page" : undefined}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pageCount}
                  onClick={() => set({ page: currentPage + 1 })}
                >
                  Next
                </Button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
