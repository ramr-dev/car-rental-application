import { randomInt } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { getActiveForPricing, bestDiscount } from '../offers/offer.service.js';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import type {
  BookingListQuery,
  CreateBookingInput,
  UpdateStatusInput,
} from './booking.schema.js';

// ─── Constants ─────────────────────────────────────────────────────────────

const SERVICE_FEE_RATE  = 0.12;
const TAX_RATE          = 0.085;
const SECURITY_DEPOSIT  = 500;

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateBookingId(): string {
  return `BK-${randomInt(10_000_000, 99_999_999)}`;
}

function calcRentalHours(start: Date, end: Date): number {
  return Math.max(6, (end.getTime() - start.getTime()) / 3_600_000);
}

function calcPricing(pricePerDay: number, hours: number, discountPercent = 0) {
  if (hours < 12) {
    const subtotal   = round2((pricePerDay / 12) * hours);
    const serviceFee = round2(subtotal * SERVICE_FEE_RATE);
    const taxAmount  = round2((subtotal + serviceFee) * TAX_RATE);
    const totalPrice = round2(subtotal + serviceFee + taxAmount);
    return { subtotal, serviceFee, taxAmount, totalPrice, depositAmount: SECURITY_DEPOSIT };
  }

  const days         = Math.max(1, Math.ceil(hours / 24));
  const base         = round2(days * pricePerDay);
  const discountAmt  = round2(base * (discountPercent / 100));
  const subtotal     = round2(base - discountAmt);
  const serviceFee   = round2(subtotal * SERVICE_FEE_RATE);
  const taxAmount    = round2((subtotal + serviceFee) * TAX_RATE);
  const totalPrice   = round2(subtotal + serviceFee + taxAmount);
  return { subtotal, serviceFee, taxAmount, totalPrice, depositAmount: SECURITY_DEPOSIT };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Response mapper ───────────────────────────────────────────────────────

type BookingWithVehicle = Prisma.BookingGetPayload<{
  include: {
    vehicle: { select: { name: true; image: true; brand: true; year: true } };
    review: { select: { id: true } };
  };
}>;

function toBookingResponse(b: BookingWithVehicle) {
  return {
    id:                    b.id,
    userId:                String(b.userId),
    vehicleId:             String(b.vehicleId),
    vehicleName:           b.vehicle.name,
    vehicleImage:          b.vehicle.image,
    startDate:             b.startDate.toISOString().slice(0, 16),
    endDate:               b.endDate.toISOString().slice(0, 16),
    pickupLocation:        b.pickupLocation,
    dropoffLocation:       b.dropoffLocation,
    totalPrice:            Number(b.totalPrice),
    status:                b.status.toLowerCase() as Lowercase<typeof b.status>,
    customerName:          b.customerName   ?? undefined,
    customerEmail:         b.customerEmail  ?? undefined,
    customerPhone:         b.customerPhone  ?? undefined,
    licenseNumber:         b.licenseNumber  ?? undefined,
    licenseExpiry:         b.licenseExpiry?.toISOString().split('T')[0] ?? undefined,
    licenseCountry:        b.licenseCountry ?? undefined,
    notes:                 b.notes          ?? undefined,
    rentalDays:            b.rentalDays     ?? undefined,
    subtotal:              b.subtotal       ? Number(b.subtotal)      : undefined,
    serviceFee:            b.serviceFee     ? Number(b.serviceFee)    : undefined,
    taxAmount:             b.taxAmount      ? Number(b.taxAmount)     : undefined,
    depositAmount:         b.depositAmount  ? Number(b.depositAmount) : undefined,
    stripeSessionId:       b.stripeSessionId       ?? undefined,
    stripePaymentIntentId: b.stripePaymentIntentId ?? undefined,
    paymentStatus:         b.paymentStatus,
    paidAt:                b.paidAt?.toISOString() ?? undefined,
    createdAt:             b.createdAt.toISOString().split('T')[0],
    isReviewed:            !!b.review,
  };
}

const vehicleInclude = {
  vehicle: { select: { name: true, image: true, brand: true, year: true } },
  review: { select: { id: true } },
} as const;

// ─── list ──────────────────────────────────────────────────────────────────
// Admin sees all; customer sees only their own bookings.

export async function list(caller: JwtPayload, query: BookingListQuery) {
  const where: Prisma.BookingWhereInput = {};

  if (caller.role === 'HOST' && query.asHost) {
    where.vehicle = { hostId: caller.userId };
  } else if (caller.role !== 'ADMIN') {
    where.userId = caller.userId;
  }
  if (query.status) where.status = query.status;

  const skip = (query.page - 1) * query.limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: vehicleInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: bookings.map(toBookingResponse),
    pagination: {
      total,
      page:      query.page,
      limit:     query.limit,
      pageCount: Math.ceil(total / query.limit),
    },
  };
}

// ─── getById ───────────────────────────────────────────────────────────────

export async function getById(id: string, caller: JwtPayload) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: vehicleInclude,
  });

  if (!booking) throw new AppError(404, 'Booking not found.', 'NOT_FOUND');

  // Customers can only view their own bookings
  if (caller.role !== 'ADMIN' && booking.userId !== caller.userId) {
    throw new AppError(403, 'You do not have access to this booking.', 'FORBIDDEN');
  }

  return toBookingResponse(booking);
}

// ─── create ────────────────────────────────────────────────────────────────

export async function create(input: CreateBookingInput, caller: JwtPayload) {
  // 1. Fetch vehicle and verify it exists and is available
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: input.vehicleId },
  });

  if (!vehicle) {
    throw new AppError(404, 'Vehicle not found.', 'NOT_FOUND');
  }
  if (!vehicle.available) {
    throw new AppError(409, 'This vehicle is currently unavailable.', 'VEHICLE_UNAVAILABLE');
  }

  const startDate = new Date(input.startDate);
  const endDate   = new Date(input.endDate);

  // 2. Check for overlapping bookings on the same vehicle
  const overlap = await prisma.booking.findFirst({
    where: {
      vehicleId: input.vehicleId,
      status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
      AND: [
        { startDate: { lte: endDate   } },
        { endDate:   { gte: startDate } },
      ],
    },
  });

  if (overlap) {
    throw new AppError(
      409,
      'This vehicle is already booked for part or all of the selected dates.',
      'DATE_CONFLICT',
    );
  }

  // 3. Calculate pricing using DB-driven offer discounts
  const hours        = calcRentalHours(startDate, endDate);
  const activeOffers = await getActiveForPricing();
  const days         = hours < 12 ? 0 : Math.max(1, Math.ceil(hours / 24));
  const discPct      = bestDiscount(days, activeOffers);
  const pricing      = calcPricing(Number(vehicle.pricePerDay), hours, discPct);

  // 4. Generate a unique booking ID (retry once on collision — extremely rare)
  let bookingId = generateBookingId();
  const collision = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (collision) bookingId = generateBookingId();

  // 5. Create booking
  const booking = await prisma.booking.create({
    data: {
      id:             bookingId,
      userId:         caller.userId,
      vehicleId:      input.vehicleId,
      startDate,
      endDate,
      pickupLocation:  input.pickupLocation,
      dropoffLocation: input.dropoffLocation ?? input.pickupLocation,
      totalPrice:     pricing.totalPrice,
      status:         'PENDING',
      customerName:   input.customerName,
      customerEmail:  input.customerEmail,
      customerPhone:  input.customerPhone,
      licenseNumber:  input.licenseNumber,
      licenseExpiry:  new Date(input.licenseExpiry),
      licenseCountry: input.licenseCountry,
      notes:          input.notes,
      rentalDays:     Math.ceil(hours), // stores rental hours in this field
      subtotal:       pricing.subtotal,
      serviceFee:     pricing.serviceFee,
      taxAmount:      pricing.taxAmount,
      depositAmount:  pricing.depositAmount,
    },
    include: vehicleInclude,
  });

  return toBookingResponse(booking);
}

// ─── updateStatus (admin) ─────────────────────────────────────────────────

// Valid admin-driven transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:   ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACTIVE',    'CANCELLED'],
  ACTIVE:    ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export async function updateStatus(id: string, input: UpdateStatusInput) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!booking) throw new AppError(404, 'Booking not found.', 'NOT_FOUND');

  const allowed = VALID_TRANSITIONS[booking.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw new AppError(
      422,
      `Cannot transition booking from ${booking.status} to ${input.status}.`,
      'INVALID_TRANSITION',
    );
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: input.status },
    include: vehicleInclude,
  });

  return toBookingResponse(updated);
}

// ─── cancel (customer) ────────────────────────────────────────────────────

export async function cancel(id: string, caller: JwtPayload) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });

  if (!booking) throw new AppError(404, 'Booking not found.', 'NOT_FOUND');

  // Ownership check
  if (booking.userId !== caller.userId) {
    throw new AppError(403, 'You do not have access to this booking.', 'FORBIDDEN');
  }

  // Customers can only cancel PENDING or CONFIRMED bookings
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw new AppError(
      422,
      `You can only cancel a booking that is pending or confirmed. Current status: ${booking.status.toLowerCase()}.`,
      'INVALID_STATUS',
    );
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: vehicleInclude,
  });

  return toBookingResponse(updated);
}
