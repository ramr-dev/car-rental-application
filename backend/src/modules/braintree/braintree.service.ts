import braintree from 'braintree';
import { randomInt } from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.middleware.js';
import { getActiveForPricing, bestDiscount } from '../offers/offer.service.js';
import { createBookingPaidNotification } from '../notifications/notification.service.js';
import { twilioService } from '../../services/twilio.service.js';
import type { BraintreeCheckoutInput } from './braintree.schema.js';
import { createHostEarningIfP2P } from '../hosts/host.service.js';

// ─── Braintree gateway client ─────────────────────────────────────────────

const gateway = new braintree.BraintreeGateway({
  environment:
    env.NODE_ENV === 'production'
      ? braintree.Environment.Production
      : braintree.Environment.Sandbox,
  merchantId: env.BRAINTREE_MERCHANT_ID,
  publicKey:  env.BRAINTREE_PUBLIC_KEY,
  privateKey: env.BRAINTREE_PRIVATE_KEY,
});

// ─── Pricing helpers (mirrors razorpay.service.ts exactly) ────────────────

const SERVICE_FEE_RATE = 0.12;
const TAX_RATE         = 0.085;

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

function generateBookingId(): string {
  return `BK-${randomInt(10_000_000, 99_999_999)}`;
}

// ─── Response mapper ──────────────────────────────────────────────────────

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
  const num = (v: any) =>
    v && typeof v === 'object' && 'toNumber' in v ? v.toNumber() : Number(v);
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

// ─── getClientToken ───────────────────────────────────────────────────────
// Generates a Braintree client token for the frontend Drop-in UI.

export async function getClientToken(): Promise<{ clientToken: string }> {
  const response = await gateway.clientToken.generate({});
  return { clientToken: response.clientToken };
}

// ─── checkout ─────────────────────────────────────────────────────────────
// Charges the customer using the payment nonce and creates the booking.
// Idempotent: if a booking already exists for this transaction, return it.

export async function checkout(
  input: BraintreeCheckoutInput,
  userId: number,
) {
  // 1. Validate vehicle
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) throw new AppError(404, 'Vehicle not found.', 'NOT_FOUND');
  if (!vehicle.available)
    throw new AppError(409, 'This vehicle is currently unavailable.', 'VEHICLE_UNAVAILABLE');

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
  if (overlap)
    throw new AppError(
      409,
      'This vehicle is already booked for part or all of the selected dates.',
      'DATE_CONFLICT',
    );

  // 3. Calculate pricing (USD)
  const hours      = calcRentalHours(startDate, endDate);
  const addonTotal = input.hasDamageProtection ? 200 : 0;
  const pricing    = await pricingWithOffers(Number(vehicle.pricePerDay), hours, addonTotal);
  const amount     = pricing.totalPrice.toFixed(2); // Braintree expects string

  // 4. Submit transaction to Braintree
  const result = await gateway.transaction.sale({
    amount,
    paymentMethodNonce: input.paymentMethodNonce,
    options: { submitForSettlement: true },
    customer: {
      firstName: input.customerName.split(' ')[0] ?? input.customerName,
      lastName:  input.customerName.split(' ').slice(1).join(' ') || undefined,
      email:     input.customerEmail,
      phone:     input.customerPhone,
    },
    orderId: `bt_${userId}_${Date.now()}`,
  });

  if (!result.success) {
    const message =
      result.transaction?.processorResponseText ??
      result.message ??
      'Payment was declined. Please try a different payment method.';
    throw new AppError(402, message, 'BRAINTREE_TRANSACTION_FAILED');
  }

  const transactionId = result.transaction.id;

  // 5. Idempotency — check if booking already exists for this transaction
  const existing = await prisma.booking.findFirst({
    where:   { stripePaymentIntentId: `bt_${transactionId}` },
    include: { vehicle: { select: { name: true, image: true, brand: true, year: true } } },
  });
  if (existing) return toBookingResponse(existing);

  // 6. Generate unique booking ID
  let bookingId = generateBookingId();
  const collision = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (collision) bookingId = generateBookingId();

  let finalNotes = input.notes || null;
  if (input.hasDamageProtection) {
    finalNotes = finalNotes ? `[Accidental Damage Protection Selected]\n${finalNotes}` : `[Accidental Damage Protection Selected]`;
  }

  // 7. Create booking — store Braintree transaction ID in stripePaymentIntentId
  //    prefixed with "bt_" so it never collides with Stripe or Razorpay IDs.
  const booking = await prisma.booking.create({
    data: {
      id:             bookingId,
      userId,
      vehicleId:      input.vehicleId,
      startDate,
      endDate,
      pickupLocation:        input.pickupLocation,
      dropoffLocation:       input.dropoffLocation || input.pickupLocation,
      totalPrice:            pricing.totalPrice,
      status:                'CONFIRMED',
      customerName:          input.customerName,
      customerEmail:         input.customerEmail,
      customerPhone:         input.customerPhone,
      licenseNumber:         input.licenseNumber,
      licenseExpiry:         new Date(input.licenseExpiry),
      licenseCountry:        input.licenseCountry,
      notes:                 finalNotes,
      rentalDays:            Math.ceil(hours),
      subtotal:              pricing.subtotal,
      serviceFee:            pricing.serviceFee,
      taxAmount:             pricing.taxAmount,
      depositAmount:         500,
      stripeSessionId:       `bt_order_${bookingId}`,
      stripePaymentIntentId: `bt_${transactionId}`,
      paymentStatus:         'paid',
      paidAt:                new Date(),
    },
    include: {
      vehicle: { select: { name: true, image: true, brand: true, year: true } },
    },
  });

  // 8. Fire-and-forget notifications
  createBookingPaidNotification(
    booking.id,
    booking.customerName,
    booking.vehicle.name,
    pricing.totalPrice,
  ).catch(() => {});

  createHostEarningIfP2P(booking.id).catch(() => {});

  if (booking.customerPhone) {
    twilioService
      .sendBookingConfirmationSMS(
        {
          customerName: booking.customerName || 'Customer',
          bookingId:    booking.id,
          vehicleName:  booking.vehicle.name,
          startDate:    booking.startDate,
          endDate:      booking.endDate,
        },
        booking.customerPhone,
      )
      .catch((err) => {
        console.error(`❌ SMS confirmation failed for booking ${booking.id}:`, err);
      });
  }

  return toBookingResponse(booking);
}
