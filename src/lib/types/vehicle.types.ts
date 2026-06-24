export type VehicleType = "sedan" | "suv" | "luxury" | "electric" | "convertible" | "van";
export type FuelType = "petrol" | "diesel" | "electric" | "hybrid";
export type Transmission = "automatic" | "manual";

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  fuel: FuelType;
  transmission: Transmission;
  seats: number;
  pricePerDay: number;
  rating: number;
  reviewCount: number;
  location: string;
  image: string;
  images: string[];
  features: string[];
  available: boolean;
  description: string;
  specs: {
    mileage: string;
    engine: string;
    topSpeed: string;
    acceleration: string;
  };
  latitude?: number | null;
  longitude?: number | null;
  gpsLastSeen?: string | null;
  host?: {
    id: string;
    name: string;
    email: string;
  } | null;
  isApproved?: boolean;
  registrationNumber?: string | null;
  rcUrl?: string | null;
  insuranceUrl?: string | null;
}

export interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
}
