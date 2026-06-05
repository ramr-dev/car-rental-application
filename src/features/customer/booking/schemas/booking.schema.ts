import { z } from "zod";

export const step0Schema = z.object({
  pickupLocation: z.string().min(3, "Pickup location required"),
  dropoffLocation: z.string().optional(),
  startDate: z.string().min(1, "Pickup date required"),
  endDate: z.string().min(1, "Return date required"),
});

export const step1Schema = z.object({
  fullName: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone number required"),
});

export const step2Schema = z.object({
  licenseNumber: z.string().min(4, "License number required"),
  licenseExpiry: z.string().min(1, "Expiry date required"),
  licenseCountry: z.string().min(2, "Issuing country required"),
  notes: z.string().optional(),
});

export type Step0Form = z.infer<typeof step0Schema>;
export type Step1Form = z.infer<typeof step1Schema>;
export type Step2Form = z.infer<typeof step2Schema>;
