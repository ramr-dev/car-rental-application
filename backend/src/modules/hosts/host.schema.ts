import { z } from 'zod';

// ── Host Profile Submit ────────────────────────────────────────────────────
export const submitHostProfileSchema = z.object({
  panNumber:      z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Card format'),
  phone:          z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  bankAccountNum: z.string().min(9, 'Bank Account Number must be at least 9 digits').max(18, 'Invalid account number'),
  bankIfsc:       z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC Code format'),
  bankName:       z.string().min(2, 'Bank Name is required'),
  aadhaarFrontUrl:z.string().min(1, 'Aadhaar Front photo URL is required'),
  aadhaarBackUrl: z.string().min(1, 'Aadhaar Back photo URL is required'),
});

export type SubmitHostProfileInput = z.infer<typeof submitHostProfileSchema>;

// ── Host Vehicle Submit ────────────────────────────────────────────────────
export const hostSubmitVehicleSchema = z.object({
  name:               z.string().min(2, 'Name is required'),
  brand:              z.string().min(1, 'Brand is required'),
  model:              z.string().min(1, 'Model is required'),
  year:               z.number().int().min(2010).max(new Date().getFullYear() + 1),
  type:               z.enum(['SEDAN', 'SUV', 'LUXURY', 'ELECTRIC', 'CONVERTIBLE', 'VAN']),
  fuel:               z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID']),
  transmission:       z.enum(['AUTOMATIC', 'MANUAL']),
  seats:              z.number().int().min(2).max(10),
  pricePerDay:        z.number().positive('Price per day must be positive'),
  location:           z.string().min(2, 'Location is required'),
  image:              z.string().min(1, 'Main image URL is required'),
  images:             z.array(z.string().min(1)).min(1, 'At least 1 sub-image is required'),
  features:           z.array(z.string()),
  description:        z.string().min(10, 'Description must be at least 10 characters'),
  mileage:            z.string().min(1),
  engine:             z.string().min(1),
  topSpeed:           z.string().min(1),
  acceleration:       z.string().min(1),
  registrationNumber: z.string().min(4, 'Registration number is required'),
  rcUrl:              z.string().min(1, 'RC document copy is required'),
  insuranceUrl:       z.string().min(1, 'Insurance copy is required'),
});

export type HostSubmitVehicleInput = z.infer<typeof hostSubmitVehicleSchema>;

// ── Host Schedule Add ──────────────────────────────────────────────────────
export const addScheduleSchema = z.object({
  vehicleId: z.number().int().positive(),
  startDate: z.string().min(1),
  endDate:   z.string().min(1),
});

export type AddScheduleInput = z.infer<typeof addScheduleSchema>;

// ── Trip Checklist Submit ──────────────────────────────────────────────────
export const submitChecklistSchema = z.object({
  bookingId:       z.string().min(1),
  vehicleId:       z.number().int().positive(),
  type:            z.enum(['CHECK_IN', 'CHECK_OUT']),
  odometerReading: z.number().int().nonnegative('Odometer reading must be non-negative'),
  fuelLevel:       z.number().int().min(0).max(100, 'Fuel level must be between 0 and 100%'),
  damageNotes:     z.string().optional(),
  images:          z.array(z.string().min(1)).min(4, 'At least 4 photos (front, back, left, right) are required'),
});

export type SubmitChecklistInput = z.infer<typeof submitChecklistSchema>;
