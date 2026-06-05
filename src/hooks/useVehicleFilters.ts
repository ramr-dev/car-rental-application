import { useMemo, useState } from "react";
import type { Vehicle } from "@/lib/types";
import {
  PRICE_RANGE_MAX,
  PRICE_RANGE_MIN,
  VEHICLES_PER_PAGE,
} from "@/constants";
import { useDebounce } from "./useDebounce";

export type SortOption = "recommended" | "price-asc" | "price-desc" | "rating";

export interface VehicleFilters {
  search: string;
  sort: SortOption;
  price: [number, number];
  types: string[];
  fuels: string[];
  transmissions: string[];
  minSeats: number | null;
}

export function applyFilters(vehicles: Vehicle[], filters: VehicleFilters, debouncedSearch: string) {
  let list = [...vehicles];

  if (debouncedSearch) {
    const q = debouncedSearch.toLowerCase();
    list = list.filter((v) => `${v.name} ${v.brand} ${v.model}`.toLowerCase().includes(q));
  }

  list = list.filter(
    (v) => v.pricePerDay >= filters.price[0] && v.pricePerDay <= filters.price[1],
  );

  if (filters.types.length) list = list.filter((v) => filters.types.includes(v.type));
  if (filters.fuels.length) list = list.filter((v) => filters.fuels.includes(v.fuel));
  if (filters.transmissions.length)
    list = list.filter((v) => filters.transmissions.includes(v.transmission));
  if (filters.minSeats) list = list.filter((v) => v.seats >= filters.minSeats!);

  if (filters.sort === "price-asc") list.sort((a, b) => a.pricePerDay - b.pricePerDay);
  else if (filters.sort === "price-desc") list.sort((a, b) => b.pricePerDay - a.pricePerDay);
  else if (filters.sort === "rating") list.sort((a, b) => b.rating - a.rating);

  return list;
}

function toggleItem(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

const INITIAL_FILTERS: VehicleFilters = {
  search: "",
  sort: "recommended",
  price: [PRICE_RANGE_MIN, PRICE_RANGE_MAX],
  types: [],
  fuels: [],
  transmissions: [],
  minSeats: null,
};

export function useVehicleFilters(data: Vehicle[] | undefined) {
  const [filters, setFilters] = useState<VehicleFilters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filters.search);

  const set = <K extends keyof VehicleFilters>(key: K, value: VehicleFilters[K]) =>
    setFilters((prev) => {
      setPage(1);
      return { ...prev, [key]: value };
    });

  const toggleType = (v: string) => set("types", toggleItem(filters.types, v));
  const toggleFuel = (v: string) => set("fuels", toggleItem(filters.fuels, v));
  const toggleTransmission = (v: string) =>
    set("transmissions", toggleItem(filters.transmissions, v));

  const reset = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const filtered = useMemo(
    () => applyFilters(data ?? [], filters, debouncedSearch),
    [data, filters, debouncedSearch],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / VEHICLES_PER_PAGE));
  const paginated = filtered.slice((page - 1) * VEHICLES_PER_PAGE, page * VEHICLES_PER_PAGE);

  return {
    filters,
    set,
    toggleType,
    toggleFuel,
    toggleTransmission,
    reset,
    filtered,
    paginated,
    page,
    pageCount,
    setPage,
  };
}
