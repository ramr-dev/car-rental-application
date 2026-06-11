// Re-export shim — existing imports from "@/lib/api" continue to work.
// New code should import directly from the sub-modules:
//   import { vehicleService } from "@/lib/api/vehicle.service"
//   import { bookingService } from "@/lib/api/booking.service"
//   import { userService }    from "@/lib/api/user.service"
//   import { api }            from "@/lib/api/client"
export { api } from "./api/client";
export { vehicleService } from "./api/vehicle.service";
export type { VehicleListParams, VehicleListResponse } from "./api/vehicle.service";
export { bookingService } from "./api/booking.service";
export type { BookingListParams, BookingListResponse } from "./api/booking.service";
export { userService } from "./api/user.service";
export type { UserListParams, UserListResponse, KycListParams, KycListResponse, SubmitKycPayload } from "./api/user.service";
export type { MyKycDocument } from "./types/user.types";
export { reviewService } from "./api/review.service";
