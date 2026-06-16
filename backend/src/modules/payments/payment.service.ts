import Stripe from 'stripe';
import { randomInt } from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { getActiveForPricing, bestDiscount } from '../offers/offer.service.js';
import { createBookingPaidNotification } from '../notifications/notification.service.js';
import type { CreateCheckoutInput, CreateIntentInput, VerifyIntentInput } from './payment.schema.js';
import { twilioService } from '../../services/twilio.service.js';

// ─── Stripe client ─────────────────────────────────────────────────────────

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// ─── Pricing helpers (mirrors booking.service.ts) ─────────────────────────

const SERVICE_FEE_RATE = 0.12;
const TAX_RATE         = 0.085;

function calcRentalHours(start: Date, end: Date): number {
  return Math.max(6, (end.getTime() - start.getTime()) / 3_600_000);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcPricing(pricePerDay: number, hours: number, discountPercent = 0) {
  if (hours < 12) {
    const subtotal   = round2((pricePerDay / 12) * hours);
    const serviceFee = round2(subtotal * SERVICE_FEE_RATE);
    const taxAmount  = round2((subtotal + serviceFee) * TAX_RATE);
    const totalPrice = round2(subtotal + serviceFee + taxAmount);
    return { subtotal, serviceFee, taxAmount, totalPrice };
  }

  const days        = Math.max(1, Math.ceil(hours / 24));
  const base        = round2(days * pricePerDay);
  const discountAmt = round2(base * (discountPercent / 100));
  const subtotal    = round2(base - discountAmt);
  const serviceFee  = round2(subtotal * SERVICE_FEE_RATE);
  const taxAmount   = round2((subtotal + serviceFee) * TAX_RATE);
  const totalPrice  = round2(subtotal + serviceFee + taxAmount);
  return { subtotal, serviceFee, taxAmount, totalPrice };
}

async function pricingWithOffers(pricePerDay: number, hours: number) {
  const activeOffers = await getActiveForPricing();
  const days         = hours < 12 ? 0 : Math.max(1, Math.ceil(hours / 24));
  const discPct      = bestDiscount(days, activeOffers);
  return calcPricing(pricePerDay, hours, discPct);
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

// ─── Response mapper ───────────────────────────────────────────────────────

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

// ─── createCheckoutSession ─────────────────────────────────────────────────

export async function createCheckoutSession(
  input: CreateCheckoutInput,
  userId: number,
) {
  // 1. Validate vehicle exists and is available
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) throw new AppError(404, 'Vehicle not found.', 'NOT_FOUND');
  if (!vehicle.available) throw new AppError(409, 'This vehicle is currently unavailable.', 'VEHICLE_UNAVAILABLE');

  const startDate = new Date(input.startDate);
  const endDate   = new Date(input.endDate);

  // 2. Check date overlap with existing bookings
  const overlap = await prisma.booking.findFirst({
    where: {
      vehicleId: input.vehicleId,
      status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
      AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
    },
  });
  if (overlap) {
    throw new AppError(
      409,
      'This vehicle is already booked for part or all of the selected dates.',
      'DATE_CONFLICT',
    );
  }

  // 3. Calculate price server-side (hourly: pricePerDay = 12-hour base rate)
  const hours   = calcRentalHours(startDate, endDate);
  const pricing = await pricingWithOffers(Number(vehicle.pricePerDay), hours);

  // 4. Build Stripe metadata (max 500 chars per value)
  const metadata: Record<string, string> = {
    userId:          String(userId),
    vehicleId:       String(input.vehicleId),
    startDate:       input.startDate,
    endDate:         input.endDate,
    pickupLocation:  input.pickupLocation.slice(0, 490),
    dropoffLocation: (input.dropoffLocation ?? input.pickupLocation).slice(0, 490),
    customerName:    input.customerName.slice(0, 490),
    customerEmail:   input.customerEmail.slice(0, 490),
    customerPhone:   input.customerPhone.slice(0, 490),
    licenseNumber:   input.licenseNumber.slice(0, 490),
    licenseExpiry:   input.licenseExpiry,
    licenseCountry:  input.licenseCountry.slice(0, 490),
    rentalDays:      String(Math.ceil(hours)), // stores rental hours
    subtotal:        String(pricing.subtotal),
    serviceFee:      String(pricing.serviceFee),
    taxAmount:       String(pricing.taxAmount),
  };
  if (input.notes) metadata.notes = input.notes.slice(0, 490);

  // 5. Create Checkout Session (charge the rental total; deposit is at pickup)
  const amountCents = Math.round(pricing.totalPrice * 100);

  const session = await stripe.checkout.sessions.create({
    mode:         'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency:     'usd',
          unit_amount:  amountCents,
          product_data: {
            name:        `${vehicle.name} — ${rentalDurationLabel(hours)}`,
            description: `${input.startDate} → ${input.endDate} · Pickup: ${input.pickupLocation}`,
            images:      [vehicle.image].filter((u) => u.startsWith('http')),
          },
        },
        quantity: 1,
      },
    ],
    metadata,
    customer_email:  input.customerEmail,
    success_url:     `${env.CORS_ORIGIN}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:      `${env.CORS_ORIGIN}/booking/cancelled?vehicle_id=${input.vehicleId}`,
    expires_at:      Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
  });

  return { url: session.url! };
}

// ─── verifyAndCreate ───────────────────────────────────────────────────────

export async function verifyAndCreate(sessionId: string, userId: number) {
  // 1. Idempotency — if booking already created for this session, return it
  const existing = await prisma.booking.findUnique({
    where:   { stripeSessionId: sessionId },
    include: { vehicle: { select: { name: true, image: true, brand: true, year: true } } },
  });
  if (existing) return toBookingResponse(existing);

  // 2. Retrieve session from Stripe
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });
  } catch {
    throw new AppError(400, 'Invalid or expired Stripe session.', 'INVALID_SESSION');
  }

  // 3. Verify payment
  if (session.payment_status !== 'paid') {
    throw new AppError(402, 'Payment has not been completed.', 'PAYMENT_NOT_COMPLETED');
  }

  // 4. Verify session belongs to this user
  const meta = session.metadata ?? {};
  if (String(meta.userId) !== String(userId)) {
    throw new AppError(403, 'Session does not belong to this user.', 'FORBIDDEN');
  }

  // 5. Extract booking data from metadata
  const vehicleId  = Number(meta.vehicleId);
  const startDate  = new Date(meta.startDate);
  const endDate    = new Date(meta.endDate);

  // 6. Validate vehicle still available (re-check overlap)
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
    throw new AppError(
      409,
      'This vehicle was booked by someone else while your payment was processing. Please contact support for a refund.',
      'DATE_CONFLICT_POST_PAYMENT',
    );
  }

  // 7. Re-calculate price server-side and verify Stripe charged the right amount
  const hours    = calcRentalHours(startDate, endDate);
  const pricing  = await pricingWithOffers(Number(vehicle.pricePerDay), hours);
  const expected = Math.round(pricing.totalPrice * 100);
  const charged  = session.amount_total ?? 0;

  if (Math.abs(charged - expected) > 1) {
    throw new AppError(
      422,
      'Payment amount does not match the booking total. Please contact support.',
      'AMOUNT_MISMATCH',
    );
  }

  // 8. Extract PaymentIntent ID
  const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
  const paymentIntentId = paymentIntent?.id ?? null;

  // 9. Generate unique booking ID
  let bookingId = generateBookingId();
  const collision = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (collision) bookingId = generateBookingId();

  // 10. Create the booking
  const booking = await prisma.booking.create({
    data: {
      id:             bookingId,
      userId,
      vehicleId,
      startDate,
      endDate,
      pickupLocation:        meta.pickupLocation,
      dropoffLocation:       meta.dropoffLocation || meta.pickupLocation,
      totalPrice:            pricing.totalPrice,
      status:                'CONFIRMED',
      customerName:          meta.customerName,
      customerEmail:         meta.customerEmail,
      customerPhone:         meta.customerPhone,
      licenseNumber:         meta.licenseNumber,
      licenseExpiry:         new Date(meta.licenseExpiry),
      licenseCountry:        meta.licenseCountry,
      notes:                 meta.notes || null,
      rentalDays:            Math.ceil(hours), // stores rental hours
      subtotal:              pricing.subtotal,
      serviceFee:            pricing.serviceFee,
      taxAmount:             pricing.taxAmount,
      depositAmount:         500,
      stripeSessionId:       sessionId,
      stripePaymentIntentId: paymentIntentId,
      paymentStatus:         'paid',
      paidAt:                new Date(),
    },
    include: {
      vehicle: { select: { name: true, image: true, brand: true, year: true } },
    },
  });

  // Fire-and-forget: notification failure must not affect booking confirmation
  createBookingPaidNotification(
    booking.id,
    booking.customerName,
    booking.vehicle.name,
    pricing.totalPrice,
  ).catch(() => {});

  // Send Twilio SMS confirmation gracefully
  if (booking.customerPhone) {
    twilioService.sendBookingConfirmationSMS({
      customerName: booking.customerName || 'Customer',
      bookingId: booking.id,
      vehicleName: booking.vehicle.name,
      startDate: booking.startDate,
      endDate: booking.endDate,
    }, booking.customerPhone).catch(err => {
      console.error(`❌ SMS confirmation failed for booking ${booking.id}:`, err);
    });
  }

  return toBookingResponse(booking);
}

// ─── createPaymentIntent ───────────────────────────────────────────────────
// Used by the custom payment page (Stripe Elements). Returns a clientSecret.

export async function createPaymentIntent(
  input: CreateIntentInput,
  userId: number,
) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) throw new AppError(404, 'Vehicle not found.', 'NOT_FOUND');
  if (!vehicle.available) throw new AppError(409, 'This vehicle is currently unavailable.', 'VEHICLE_UNAVAILABLE');

  const startDate = new Date(input.startDate);
  const endDate   = new Date(input.endDate);

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

  const hours   = calcRentalHours(startDate, endDate);
  const pricing = await pricingWithOffers(Number(vehicle.pricePerDay), hours);

  const metadata: Record<string, string> = {
    userId:          String(userId),
    vehicleId:       String(input.vehicleId),
    startDate:       input.startDate,
    endDate:         input.endDate,
    pickupLocation:  input.pickupLocation.slice(0, 490),
    dropoffLocation: (input.dropoffLocation ?? input.pickupLocation).slice(0, 490),
    customerName:    input.customerName.slice(0, 490),
    customerEmail:   input.customerEmail.slice(0, 490),
    customerPhone:   input.customerPhone.slice(0, 490),
    licenseNumber:   input.licenseNumber.slice(0, 490),
    licenseExpiry:   input.licenseExpiry,
    licenseCountry:  input.licenseCountry.slice(0, 490),
    rentalDays:      String(Math.ceil(hours)), // stores rental hours
    subtotal:        String(pricing.subtotal),
    serviceFee:      String(pricing.serviceFee),
    taxAmount:       String(pricing.taxAmount),
  };
  if (input.notes) metadata.notes = input.notes.slice(0, 490);

  const amountCents = Math.round(pricing.totalPrice * 100);

  const intent = await stripe.paymentIntents.create({
    amount:               amountCents,
    currency:             'usd',
    payment_method_types: ['card'],
    metadata,
    receipt_email:        input.customerEmail,
    description:          `${vehicle.name} — ${rentalDurationLabel(hours)} (${input.startDate} → ${input.endDate})`,
  });

  return { clientSecret: intent.client_secret!, paymentIntentId: intent.id };
}

// ─── verifyAndCreateFromIntent ─────────────────────────────────────────────
// Called after stripe.confirmPayment() redirects back. Creates the booking.

export async function verifyAndCreateFromIntent(
  input: VerifyIntentInput,
  userId: number,
) {
  const existing = await prisma.booking.findFirst({
    where:   { stripePaymentIntentId: input.paymentIntentId },
    include: { vehicle: { select: { name: true, image: true, brand: true, year: true } } },
  });
  if (existing) return toBookingResponse(existing);

  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
  } catch {
    throw new AppError(400, 'Invalid payment intent.', 'INVALID_INTENT');
  }

  if (intent.status !== 'succeeded') {
    throw new AppError(402, 'Payment has not been completed.', 'PAYMENT_NOT_COMPLETED');
  }

  const meta = intent.metadata ?? {};
  if (String(meta.userId) !== String(userId)) {
    throw new AppError(403, 'Payment does not belong to this user.', 'FORBIDDEN');
  }

  const vehicleId  = Number(meta.vehicleId);
  const startDate  = new Date(meta.startDate);
  const endDate    = new Date(meta.endDate);

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
    throw new AppError(
      409,
      'This vehicle was booked by someone else while your payment was processing. Please contact support for a refund.',
      'DATE_CONFLICT_POST_PAYMENT',
    );
  }

  const hours    = calcRentalHours(startDate, endDate);
  const pricing  = await pricingWithOffers(Number(vehicle.pricePerDay), hours);
  const expected = Math.round(pricing.totalPrice * 100);
  const charged  = intent.amount_received ?? 0;

  if (Math.abs(charged - expected) > 1) {
    throw new AppError(422, 'Payment amount does not match the booking total. Please contact support.', 'AMOUNT_MISMATCH');
  }

  let bookingId = generateBookingId();
  const collision = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (collision) bookingId = generateBookingId();

  const booking = await prisma.booking.create({
    data: {
      id:             bookingId,
      userId,
      vehicleId,
      startDate,
      endDate,
      pickupLocation:        meta.pickupLocation,
      dropoffLocation:       meta.dropoffLocation || meta.pickupLocation,
      totalPrice:            pricing.totalPrice,
      status:                'CONFIRMED',
      customerName:          meta.customerName,
      customerEmail:         meta.customerEmail,
      customerPhone:         meta.customerPhone,
      licenseNumber:         meta.licenseNumber,
      licenseExpiry:         new Date(meta.licenseExpiry),
      licenseCountry:        meta.licenseCountry,
      notes:                 meta.notes || null,
      rentalDays:            Math.ceil(hours), // stores rental hours
      subtotal:              pricing.subtotal,
      serviceFee:            pricing.serviceFee,
      taxAmount:             pricing.taxAmount,
      depositAmount:         500,
      stripePaymentIntentId: intent.id,
      paymentStatus:         'paid',
      paidAt:                new Date(),
    },
    include: {
      vehicle: { select: { name: true, image: true, brand: true, year: true } },
    },
  });

  // Fire-and-forget: notification failure must not affect booking confirmation
  createBookingPaidNotification(
    booking.id,
    booking.customerName,
    booking.vehicle.name,
    pricing.totalPrice,
  ).catch(() => {});

  // Send Twilio SMS confirmation gracefully
  if (booking.customerPhone) {
    twilioService.sendBookingConfirmationSMS({
      customerName: booking.customerName || 'Customer',
      bookingId: booking.id,
      vehicleName: booking.vehicle.name,
      startDate: booking.startDate,
      endDate: booking.endDate,
    }, booking.customerPhone).catch(err => {
      console.error(`❌ SMS confirmation failed for booking ${booking.id}:`, err);
    });
  }

  return toBookingResponse(booking);
}
