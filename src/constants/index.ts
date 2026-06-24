import type { FuelType, Transmission, VehicleType } from "@/lib/types";

export const APP_NAME = "DriveLux";
export const APP_TAGLINE = "Premium Car Rentals On Demand";

export const SERVICE_FEE_RATE = 0.12;
export const TAX_RATE = 0.085;
export const SECURITY_DEPOSIT = 500;
export const MIN_DRIVER_AGE = 21;
export const PREMIUM_MIN_AGE = 25;
export const FREE_CANCEL_HOURS = 48;
export const EV_MIN_RETURN_CHARGE = 70;

export const PRICE_RANGE_MIN = 0;
export const PRICE_RANGE_MAX = 10000;
export const PRICE_RANGE_STEP = 50;
export const VEHICLES_PER_PAGE = 6;

export const VEHICLE_TYPES: VehicleType[] = [
  "sedan",
  "suv",
  "luxury",
  "electric",
  "convertible",
  "van",
];

export const FUEL_TYPES: FuelType[] = ["petrol", "diesel", "electric", "hybrid"];

export const TRANSMISSIONS: Transmission[] = ["automatic", "manual"];

export const SEAT_OPTIONS = [2, 4, 5, 7];

export const VEHICLE_CATEGORY_META: Record<
  VehicleType,
  { label: string; description: string; icon: string }
> = {
  sedan: {
    label: "Sedans",
    description: "Comfortable everyday cars for city and highway",
    icon: "🚗",
  },
  suv: {
    label: "SUVs",
    description: "Spacious rides built for families and adventure",
    icon: "🚙",
  },
  luxury: {
    label: "Luxury",
    description: "Premium vehicles for business and special occasions",
    icon: "💎",
  },
  electric: {
    label: "Electric",
    description: "Zero-emission future-ready vehicles",
    icon: "⚡",
  },
  convertible: {
    label: "Convertibles",
    description: "Open-top driving for scenic routes and weekends",
    icon: "🏎️",
  },
  van: {
    label: "Vans",
    description: "Maximum space for groups and cargo",
    icon: "🚐",
  },
};

export const BOOKING_STEPS = ["Trip Details", "Your Info", "License & Notes", "Summary"] as const;

export const BOOKING_ADDONS = [
  { id: "insurance", label: "Premium Insurance", price: 25, desc: "Zero deductible coverage" },
  { id: "gps", label: "GPS Navigation", price: 8, desc: "Lifetime maps included" },
  { id: "child", label: "Child Seat", price: 12, desc: "ISO-certified safety seat" },
  { id: "driver", label: "Additional Driver", price: 15, desc: "Per day, per driver" },
] as const;

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to high" },
  { value: "price-desc", label: "Price: High to low" },
  { value: "rating", label: "Top rated" },
] as const;

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/vehicles", label: "Vehicles" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;
