import Razorpay from 'razorpay';
import crypto from 'crypto';
import { randomInt } from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { getActiveForPricing, bestDiscount } from '../offers/offer.service.js';
import { createBookingPaidNotification } from '../notifications/notification.service.js';
import { twilioService } from '../../services/twilio.service.js';
import type { CreateRazorpayOrderInput, VerifyRazorpayInput } from './razorpay.schema.js';
import { createHostEarningIfP2P } from '../hosts/host.service.js';

// ─── Razorpay client ───────────────────────────────────────────────────────

const razorpay = new Razorpay({
  key_id:     env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

// ─── Pricing helpers (mirrors payment.service.ts) ─────────────────────────

const SERVICE_FEE_RATE = 0.12;
const TAX_RATE         = 0.085;
const USD_TO_INR       = 83; // Approximate conversion; use a real FX API in production

function calcRentalHours(start: Date, end: Date): number {
  return Math.max(6, (end.getTime() - start.getTime()) / 3_600_000);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcPricing(pricePerDay: number, hours: number, discountPercent = 0, addonTotal = 0) {
  if (hours < 12) {
    const subtotal   = round2((pricePerDay / 12) * hours);
    const serviceFee = round2(subtotal * SERVICE_FEE_RATE);
    const taxAmount  = round2((subtotal + serviceFee + addonTotal) * TAX_RATE);
    const totalPrice = round2(subtotal + serviceFee + addonTotal + taxAmount);
    return { subtotal, serviceFee, taxAmount, totalPrice };
  }

  const days        = Math.max(1, Math.ceil(hours / 24));
  const base        = round2(days * pricePerDay);
  const discountAmt = round2(base * (discountPercent / 100));
  const subtotal    = round2(base - discountAmt);
  const serviceFee  = round2(subtotal * SERVICE_FEE_RATE);
  const taxAmount   = round2((subtotal + serviceFee + addonTotal) * TAX_RATE);
  const totalPrice  = round2(subtotal + serviceFee + addonTotal + taxAmount);
  return { subtotal, serviceFee, taxAmount, totalPrice };
}

async function pricingWithOffers(pricePerDay: number, hours: number, addonTotal = 0) {
  const activeOffers = await getActiveForPricing();
  const days         = hours < 12 ? 0 : Math.max(1, Math.ceil(hours / 24));
  const discPct      = bestDiscount(days, activeOffers);
  return calcPricing(pricePerDay, hours, discPct, addonTotal);
}

function rentalDurationLabel(hours: number): string {
  if (hours < 12) {
    const h = Math.ceil(hours);
    return `${h} hr${h !== 1 ? 's' : ''}`;
  }
  const days = Math.max(1, Math.ceil(hours / 24));
  return `${days} day${days !== 1 ? 's' : ''}`;
}

function generateBookingId(): string {
  return `BK-${randomInt(10_000_000, 99_999_999)}`;
}

// ─── Response mapper (mirrors payment.service.ts) ─────────────────────────

function toBookingResponse(b: {
  id: string; userId: number; vehicleId: number;
  startDate: Date; endDate: Date;
  pickupLocation: string; dropoffLocation: string;
  totalPrice: { toNumber(): number } | number;
  status: string;
  customerName: string | null; customerEmail: string | null;
  customerPhone: string | null; licenseNumber: string | null;
  licenseExpiry: Date | null; licenseCountry: string | null;
  notes: string | null; rentalDays: number | null;
  subtotal: { toNumber(): number } | null;
  serviceFee: { toNumber(): number } | null;
  taxAmount: { toNumber(): number } | null;
  depositAmount: { toNumber(): number } | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  paymentStatus: string;
  paidAt: Date | null;
  createdAt: Date;
  vehicle: { name: string; image: string; brand: string; year: number };
}) {
  const num = (v: any) => (v && typeof v === 'object' && 'toNumber' in v ? v.toNumber() : Number(v));
  return {
    id:                    b.id,
    userId:                String(b.userId),
    vehicleId:             String(b.vehicleId),
    vehicleName:           b.vehicle.name,
    vehicleImage:          b.vehicle.image,
    startDate:             b.startDate.toISOString().split('T')[0],
    endDate:               b.endDate.toISOString().split('T')[0],
    pickupLocation:        b.pickupLocation,
    dropoffLocation:       b.dropoffLocation,
    totalPrice:            num(b.totalPrice),
    status:                b.status.toLowerCase() as string,
    customerName:          b.customerName  ?? undefined,
    customerEmail:         b.customerEmail ?? undefined,
    customerPhone:         b.customerPhone ?? undefined,
    licenseNumber:         b.licenseNumber ?? undefined,
    licenseExpiry:         b.licenseExpiry?.toISOString().split('T')[0] ?? undefined,
    licenseCountry:        b.licenseCountry ?? undefined,
    notes:                 b.notes ?? undefined,
    rentalDays:            b.rentalDays ?? undefined,
    subtotal:              b.subtotal    ? num(b.subtotal)    : undefined,
    serviceFee:            b.serviceFee  ? num(b.serviceFee)  : undefined,
    taxAmount:             b.taxAmount   ? num(b.taxAmount)   : undefined,
    depositAmount:         b.depositAmount ? num(b.depositAmount) : undefined,
    stripeSessionId:       b.stripeSessionId       ?? undefined,
    stripePaymentIntentId: b.stripePaymentIntentId ?? undefined,
    paymentStatus:         b.paymentStatus,
    paidAt:                b.paidAt?.toISOString() ?? undefined,
    createdAt:             b.createdAt.toISOString().split('T')[0],
  };
}

// ─── createOrder ───────────────────────────────────────────────────────────
// Creates a Razorpay order and returns { orderId, amount, currency, keyId }
// Amount is in paise (INR × 100).

export async function createOrder(
  input: CreateRazorpayOrderInput,
  userId: number,
) {
  // 1. Validate vehicle
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) throw new AppError(404, 'Vehicle not found.', 'NOT_FOUND');
  if (!vehicle.available) throw new AppError(409, 'This vehicle is currently unavailable.', 'VEHICLE_UNAVAILABLE');

  const startDate = new Date(input.startDate);
  const endDate   = new Date(input.endDate);

  // 2. Check date overlap
  const overlap = await prisma.booking.findFirst({
    where: {
      vehicleId: input.vehicleId,
      status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
      AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
    },
  });
  if (overlap) {
    throw new AppError(409, 'This vehicle is already booked for part or all of the selected dates.', 'DATE_CONFLICT');
  }

  // 3. Calculate pricing
  const hours   = calcRentalHours(startDate, endDate);
  const addonTotal = input.hasDamageProtection ? 200 : 0;
  const pricing = await pricingWithOffers(Number(vehicle.pricePerDay), hours, addonTotal);

  // 4. Convert USD → INR (paise)
  const amountINR   = Math.round(pricing.totalPrice * USD_TO_INR);
  const amountPaise = amountINR * 100;

  // 5. Create Razorpay order
  const order = await razorpay.orders.create({
    amount:   amountPaise,
    currency: 'INR',
    notes: {
      userId:          String(userId),
      vehicleId:       String(input.vehicleId),
      startDate:       input.startDate,
      endDate:         input.endDate,
      pickupLocation:  input.pickupLocation.slice(0, 254),
      dropoffLocation: (input.dropoffLocation ?? input.pickupLocation).slice(0, 254),
      customerName:    input.customerName.slice(0, 254),
      customerEmail:   input.customerEmail.slice(0, 254),
      customerPhone:   input.customerPhone.slice(0, 254),
      licenseNumber:   input.licenseNumber.slice(0, 254),
      licenseExpiry:   input.licenseExpiry,
      licenseCountry:  input.licenseCountry.slice(0, 254),
      rentalDays:      String(Math.ceil(hours)),
      subtotal:        String(pricing.subtotal),
      serviceFee:      String(pricing.serviceFee),
      taxAmount:       String(pricing.taxAmount),
      totalUSD:        String(pricing.totalPrice),
      hasDamageProtection: String(!!input.hasDamageProtection),
      ...(input.notes ? { notes: input.notes.slice(0, 254) } : {}),
    },
  });

  return {
    orderId:     order.id,
    amount:      amountPaise,
    amountUSD:   pricing.totalPrice,
    currency:    'INR',
    keyId:       env.RAZORPAY_KEY_ID,
    vehicleName: vehicle.name,
    vehicleImage: vehicle.image,
    duration:    rentalDurationLabel(hours),
  };
}

// ─── verifyAndCreate ───────────────────────────────────────────────────────
// Verifies Razorpay payment signature via HMAC-SHA256, then creates booking.

export async function verifyAndCreate(
  input: VerifyRazorpayInput,
  userId: number,
) {
  // 1. Idempotency — if booking already exists for this order, return it
  const existing = await prisma.booking.findUnique({
    where:   { stripeSessionId: input.razorpay_order_id },
    include: { vehicle: { select: { name: true, image: true, brand: true, year: true } } },
  });
  if (existing) return toBookingResponse(existing);

  // 2. Verify HMAC signature: SHA256(order_id + "|" + payment_id, key_secret)
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== input.razorpay_signature) {
    throw new AppError(400, 'Invalid payment signature. Payment verification failed.', 'INVALID_SIGNATURE');
  }

  // 3. Fetch order details from Razorpay to get the notes/metadata
  let order: any;
  try {
    order = await razorpay.orders.fetch(input.razorpay_order_id);
  } catch {
    throw new AppError(400, 'Could not retrieve Razorpay order details.', 'ORDER_FETCH_FAILED');
  }

  if (order.status !== 'paid') {
    throw new AppError(402, 'Payment has not been completed.', 'PAYMENT_NOT_COMPLETED');
  }

  const notes = order.notes ?? {};

  // 4. Verify this order belongs to the authenticated user
  if (String(notes.userId) !== String(userId)) {
    throw new AppError(403, 'Payment does not belong to this user.', 'FORBIDDEN');
  }

  // 5. Extract booking data from order notes
  const vehicleId  = Number(notes.vehicleId);
  const startDate  = new Date(notes.startDate);
  const endDate    = new Date(notes.endDate);

  // 6. Validate vehicle still available
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new AppError(404, 'Vehicle not found.', 'NOT_FOUND');

  const overlap = await prisma.booking.findFirst({
    where: {
      vehicleId,
      status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
      AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
    },
  });
  if (overlap) {
    throw new AppError(409, 'This vehicle was booked by someone else while your payment was processing. Please contact support for a refund.', 'DATE_CONFLICT_POST_PAYMENT');
  }

  // 7. Re-calculate pricing
  const hasDamageProtection = notes.hasDamageProtection === 'true';
  const hours   = calcRentalHours(startDate, endDate);
  const addonTotal = hasDamageProtection ? 200 : 0;
  const pricing = await pricingWithOffers(Number(vehicle.pricePerDay), hours, addonTotal);

  // 8. Generate unique booking ID
  let bookingId = generateBookingId();
  const collision = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (collision) bookingId = generateBookingId();

  let finalNotes = notes.notes || null;
  if (hasDamageProtection) {
    finalNotes = finalNotes ? `[Accidental Damage Protection Selected]\n${finalNotes}` : `[Accidental Damage Protection Selected]`;
  }

  // 9. Create the booking — store razorpay_order_id in stripeSessionId field,
  //    and razorpay_payment_id in stripePaymentIntentId field for traceability.
  const booking = await prisma.booking.create({
    data: {
      id:             bookingId,
      userId,
      vehicleId,
      startDate,
      endDate,
      pickupLocation:        notes.pickupLocation,
      dropoffLocation:       notes.dropoffLocation || notes.pickupLocation,
      totalPrice:            pricing.totalPrice,
      status:                'CONFIRMED',
      customerName:          notes.customerName,
      customerEmail:         notes.customerEmail,
      customerPhone:         notes.customerPhone,
      licenseNumber:         notes.licenseNumber,
      licenseExpiry:         new Date(notes.licenseExpiry),
      licenseCountry:        notes.licenseCountry,
      notes:                 finalNotes,
      rentalDays:            Math.ceil(hours),
      subtotal:              pricing.subtotal,
      serviceFee:            pricing.serviceFee,
      taxAmount:             pricing.taxAmount,
      depositAmount:         500,
      stripeSessionId:       input.razorpay_order_id,
      stripePaymentIntentId: input.razorpay_payment_id,
      paymentStatus:         'paid',
      paidAt:                new Date(),
    },
    include: {
      vehicle: { select: { name: true, image: true, brand: true, year: true } },
    },
  });

  // 10. Fire-and-forget notifications
  createBookingPaidNotification(
    booking.id,
    booking.customerName,
    booking.vehicle.name,
    pricing.totalPrice,
  ).catch(() => {});

  createHostEarningIfP2P(booking.id).catch(() => {});

  if (booking.customerPhone) {
    twilioService.sendBookingConfirmationSMS({
      customerName: booking.customerName || 'Customer',
      bookingId:    booking.id,
      vehicleName:  booking.vehicle.name,
      startDate:    booking.startDate,
      endDate:      booking.endDate,
    }, booking.customerPhone).catch(err => {
      console.error(`❌ SMS confirmation failed for booking ${booking.id}:`, err);
    });
  }

  return toBookingResponse(booking);
}
