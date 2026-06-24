import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type {
  SubmitHostProfileInput,
  HostSubmitVehicleInput,
  AddScheduleInput,
  SubmitChecklistInput,
} from './host.schema.js';

// ─── submitProfile ─────────────────────────────────────────────────────────
export async function submitProfile(userId: number, input: SubmitHostProfileInput) {
  const existing = await prisma.hostProfile.findUnique({ where: { userId } });
  if (existing) {
    throw new AppError(409, 'You have already submitted a host profile application.', 'PROFILE_EXISTS');
  }

  // Create profile and update user status
  const [profile] = await prisma.$transaction([
    prisma.hostProfile.create({
      data: {
        userId,
        panNumber:      input.panNumber,
        bankAccountNum: input.bankAccountNum,
        bankIfsc:       input.bankIfsc,
        bankName:       input.bankName,
        aadhaarFrontUrl:input.aadhaarFrontUrl,
        aadhaarBackUrl: input.aadhaarBackUrl,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        hostStatus: 'PENDING_KYC',
        ...(input.phone ? { phone: input.phone } : {}),
      },
    }),
  ]);

  return profile;
}

// ─── getProfile ────────────────────────────────────────────────────────────
export async function getProfile(userId: number) {
  const profile = await prisma.hostProfile.findUnique({ where: { userId } });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hostStatus: true, role: true },
  });

  return {
    profile: profile || null,
    hostStatus: user?.hostStatus ?? 'NOT_A_HOST',
    role: user?.role ?? 'CUSTOMER',
  };
}

// ─── submitVehicle ─────────────────────────────────────────────────────────
export async function submitVehicle(userId: number, input: HostSubmitVehicleInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.hostStatus !== 'VERIFIED') {
    throw new AppError(403, 'Only verified hosts can list vehicles on the platform.', 'UNAUTHORIZED_HOST');
  }

  // Create vehicle associated with host, isApproved: false (requires admin audit)
  const vehicle = await prisma.vehicle.create({
    data: {
      name:               input.name,
      brand:              input.brand,
      model:              input.model,
      year:               input.year,
      type:               input.type,
      fuel:               input.fuel,
      transmission:       input.transmission,
      seats:              input.seats,
      pricePerDay:        input.pricePerDay,
      location:           input.location,
      image:              input.image,
      images:             input.images,
      features:           input.features,
      available:          false, // inactive until admin approves
      description:        input.description,
      mileage:            input.mileage,
      engine:             input.engine,
      topSpeed:           input.topSpeed,
      acceleration:       input.acceleration,
      hostId:             userId,
      isApproved:         false,
      registrationNumber: input.registrationNumber,
      rcUrl:              input.rcUrl,
      insuranceUrl:       input.insuranceUrl,
    },
  });

  return vehicle;
}

// ─── listVehicles ──────────────────────────────────────────────────────────
export async function listVehicles(userId: number) {
  const list = await prisma.vehicle.findMany({
    where: { hostId: userId },
    orderBy: { createdAt: 'desc' },
  });

  // Map JSON strings back to arrays
  return list.map(v => ({
    ...v,
    pricePerDay: Number(v.pricePerDay),
    images: typeof v.images === 'string' ? JSON.parse(v.images) : v.images,
    features: typeof v.features === 'string' ? JSON.parse(v.features) : v.features,
  }));
}

// ─── addSchedule ───────────────────────────────────────────────────────────
export async function addSchedule(userId: number, input: AddScheduleInput) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: input.vehicleId, hostId: userId },
  });
  if (!vehicle) {
    throw new AppError(404, 'Vehicle not found or does not belong to you.', 'NOT_FOUND');
  }

  const schedule = await prisma.hostSchedule.create({
    data: {
      vehicleId: input.vehicleId,
      startDate: new Date(input.startDate),
      endDate:   new Date(input.endDate),
    },
  });

  return schedule;
}

// ─── getSchedules ──────────────────────────────────────────────────────────
export async function getSchedules(userId: number, vehicleId: number) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, hostId: userId },
  });
  if (!vehicle) {
    throw new AppError(404, 'Vehicle not found or does not belong to you.', 'NOT_FOUND');
  }

  return prisma.hostSchedule.findMany({
    where: { vehicleId },
    orderBy: { startDate: 'asc' },
  });
}

// ─── getStats ──────────────────────────────────────────────────────────────
export async function getStats(userId: number) {
  const earnings = await prisma.hostEarning.findMany({
    where: { hostId: userId },
  });

  const gross = earnings.reduce((sum, e) => sum + Number(e.grossAmount), 0);
  const net = earnings.reduce((sum, e) => sum + Number(e.netEarnings), 0);
  const commission = earnings.reduce((sum, e) => sum + Number(e.platformCommission), 0);

  const totalTrips = await prisma.booking.count({
    where: {
      vehicle: { hostId: userId },
      status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] },
    },
  });

  const activeListings = await prisma.vehicle.count({
    where: { hostId: userId, available: true, isApproved: true },
  });

  return {
    grossEarnings: gross,
    netEarnings:   net,
    platformCommission: commission,
    totalTrips,
    activeListings,
  };
}

// ─── submitChecklist ───────────────────────────────────────────────────────
export async function submitChecklist(userId: number, input: SubmitChecklistInput) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { vehicle: true },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found.', 'NOT_FOUND');
  }

  if (booking.vehicle.hostId !== userId) {
    throw new AppError(403, 'You are not authorized to log a checklist for this booking.', 'FORBIDDEN');
  }

  // Create the checklist record
  const checklist = await prisma.tripChecklist.create({
    data: {
      bookingId:       input.bookingId,
      vehicleId:       input.vehicleId,
      type:            input.type,
      odometerReading: input.odometerReading,
      fuelLevel:       input.fuelLevel,
      damageNotes:     input.damageNotes || null,
      images:          JSON.stringify(input.images),
    },
  });

  // If this is a check-in checklist, automatically mark booking as ACTIVE
  if (input.type === 'CHECK_IN' && booking.status === 'CONFIRMED') {
    await prisma.booking.update({
      where: { id: input.bookingId },
      data: { status: 'ACTIVE' },
    });
  }

  // If this is a check-out checklist, automatically mark booking as COMPLETED
  if (input.type === 'CHECK_OUT' && booking.status === 'ACTIVE') {
    await prisma.booking.update({
      where: { id: input.bookingId },
      data: { status: 'COMPLETED' },
    });
  }

  return checklist;
}

// ─── listPayouts ───────────────────────────────────────────────────────────
export async function listPayouts(userId: number) {
  return prisma.hostPayout.findMany({
    where: { hostId: userId },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── createHostEarningIfP2P ────────────────────────────────────────────────
// Triggers when a booking becomes paid. Sets up host earnings ledger automatically.
// Platform Commission is FIXED at 15%. Host gets 85%.
export async function createHostEarningIfP2P(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vehicle: true },
  });

  if (!booking || !booking.vehicle.hostId) return;

  const gross = Number(booking.totalPrice);
  const commission = gross * 0.15; // 15% Platform fee
  const net = gross * 0.85;       // 85% Host payout

  // Insert earning record idempotently
  const existing = await prisma.hostEarning.findUnique({ where: { bookingId } });
  if (existing) return;

  await prisma.hostEarning.create({
    data: {
      bookingId,
      hostId:             booking.vehicle.hostId,
      grossAmount:        gross,
      platformCommission: commission,
      netEarnings:        net,
    },
  });
}
