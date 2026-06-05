export const API_BASE_URL = "/api";

// Auth Endpoint paths
export const API_AUTH_LOGIN = "/auth/login";
export const API_AUTH_REGISTER = "/auth/register";
export const API_AUTH_VERIFY_OTP = "/auth/verify-otp";
export const API_AUTH_FORGOT_PASSWORD = "/auth/forgot-password";
export const API_AUTH_RESET_PASSWORD = "/auth/reset-password";
export const API_AUTH_ME = "/auth/me";

// Vehicles Endpoint paths
export const API_VEHICLES_LIST = "/vehicles";
export const API_VEHICLES_GET = (id: string) => `/vehicles/${id}`;
export const API_VEHICLES_REVIEWS = (id: string) => `/vehicles/${id}/reviews`;

// Bookings Endpoint paths
export const API_BOOKINGS_LIST = "/bookings";
export const API_BOOKINGS_CREATE = "/bookings";
export const API_BOOKINGS_GET = (id: string) => `/bookings/${id}`;
export const API_BOOKINGS_CANCEL = (id: string) => `/bookings/${id}/cancel`;

// Admin Endpoint paths
export const API_ADMIN_USERS = "/admin/users";
export const API_ADMIN_USER_ROLE = (id: string) => `/admin/users/${id}/role`;
export const API_ADMIN_KYC_AUDIT = (email: string) => `/admin/kyc/${email}/status`;
export const API_ADMIN_VEHICLE_CREATE = "/admin/vehicles";
export const API_ADMIN_VEHICLE_UPDATE = (id: string) => `/admin/vehicles/${id}`;
export const API_ADMIN_ANALYTICS_REVENUE = "/admin/analytics/revenue";
export const API_ADMIN_FLEET_STATUS = "/admin/fleet/status";
