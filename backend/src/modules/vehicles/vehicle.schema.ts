import { z } from 'zod';

// ─── Enums matching Prisma (uppercase) ────────────────────────────────────

const vehicleTypeEnum = z.enum(['SEDAN', 'SUV', 'LUXURY', 'ELECTRIC', 'CONVERTIBLE', 'VAN']);
const fuelTypeEnum = z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID']);
const transmissionEnum = z.enum(['AUTOMATIC', 'MANUAL']);

// ─── List / filter query ───────────────────────────────────────────────────

export const vehicleListQuerySchema = z.object({
  search:       z.string().trim().optional(),
  type:         vehicleTypeEnum.optional(),
  fuel:         fuelTypeEnum.optional(),
  transmission: transmissionEnum.optional(),
  minSeats:     z.coerce.number().int().min(1).optional(),
  minPrice:     z.coerce.number().min(0).optional(),
  maxPrice:     z.coerce.number().min(0).optional(),
  available:    z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  sort:         z.enum(['price_asc', 'price_desc', 'rating', 'newest']).default('newest'),
  page:         z.coerce.number().int().min(1).default(1),
  limit:        z.coerce.number().int().min(1).max(200).default(12),
});

// ─── ID param ─────────────────────────────────────────────────────────────

export const vehicleIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Vehicle ID must be a positive integer'),
});

// ─── Specs sub-object ─────────────────────────────────────────────────────

const specsSchema = z.object({
  mileage:      z.string().min(1).max(50),
  engine:       z.string().min(1).max(100),
  topSpeed:     z.string().min(1).max(50),
  acceleration: z.string().min(1).max(50),
});

// ─── Create ───────────────────────────────────────────────────────────────

export const createVehicleSchema = z.object({
  name:         z.string().min(2).max(255).trim(),
  brand:        z.string().min(1).max(100).trim(),
  model:        z.string().min(1).max(100).trim(),
  year:         z.number().int().min(1990).max(2030),
  type:         vehicleTypeEnum,
  fuel:         fuelTypeEnum,
  transmission: transmissionEnum,
  seats:        z.number().int().min(1).max(20),
  pricePerDay:  z.number().positive('Price per day must be positive'),
  location:     z.string().min(1).max(255).trim(),
  image:        z.string().url('Image must be a valid URL'),
  images:       z.array(z.string().url()).min(1, 'At least one image is required'),
  features:     z.array(z.string().min(1)).min(1, 'At least one feature is required'),
  description:  z.string().min(10).max(2000).trim(),
  specs:        specsSchema,
});

// ─── Update — all fields optional ─────────────────────────────────────────

export const updateVehicleSchema = createVehicleSchema
  .partial()
  .extend({
    available: z.boolean().optional(),
  });

export type VehicleListQuery  = z.infer<typeof vehicleListQuerySchema>;
export type VehicleIdParam    = z.infer<typeof vehicleIdParamSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
