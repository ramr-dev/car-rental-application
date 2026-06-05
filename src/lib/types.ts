// Re-export shim — existing imports from "@/lib/types" continue to work.
// New code should import from the domain-specific sub-modules:
//   import type { Vehicle } from "@/lib/types/vehicle.types"
//   import type { Booking } from "@/lib/types/booking.types"
//   import type { User }    from "@/lib/types/user.types"
export * from "./types/index";
