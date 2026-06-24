import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

// ─── listPendingHosts ──────────────────────────────────────────────────────
export async function listPendingHosts() {
  return prisma.user.findMany({
    where: { hostStatus: 'PENDING_KYC' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      hostStatus: true,
      hostProfile: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── verifyHost ────────────────────────────────────────────────────────────
export async function verifyHost(
  userId: number,
  status: 'VERIFIED' | 'REJECTED'
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, hostStatus: true },
  });

  if (!user) throw new AppError(404, 'User not found.', 'NOT_FOUND');

  // Transaction: update status, and if verified, update role to HOST
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        hostStatus: status,
        role: status === 'VERIFIED' ? 'HOST' : 'CUSTOMER',
      },
      select: { id: true, name: true, email: true, role: true, hostStatus: true },
    }),
  ]);

  return updatedUser;
}

// ─── listPendingVehicles ───────────────────────────────────────────────────
export async function listPendingVehicles() {
  return prisma.vehicle.findMany({
    where: { isApproved: false },
    include: {
      host: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── approveVehicle ────────────────────────────────────────────────────────
export async function approveVehicle(vehicleId: number, approve: boolean) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new AppError(404, 'Vehicle not found.', 'NOT_FOUND');

  const updated = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      isApproved: approve,
      available:  approve, // set active if approved
    },
  });

  return updated;
}

// ─── listPendingPayouts ────────────────────────────────────────────────────
// Aggregates unpaid host earnings into lists ready for payouts
export async function listPendingPayouts() {
  const earnings = await prisma.hostEarning.findMany({
    where: { payoutId: null },
    include: {
      booking: {
        select: {
          id: true,
          totalPrice: true,
          customerName: true,
          vehicle: { select: { name: true } },
        },
      },
      payout: true,
    },
  });

  // Group by host to aggregate payout amounts
  const hostGroupMap: Record<number, {
    hostId: number;
    hostName: string;
    hostEmail: string;
    bankAccountNum: string;
    bankIfsc: string;
    bankName: string;
    earningsIds: number[];
    amountToPay: number;
  }> = {};

  for (const e of earnings) {
    if (!hostGroupMap[e.hostId]) {
      const host = await prisma.user.findUnique({
        where: { id: e.hostId },
        include: { hostProfile: true },
      });

      hostGroupMap[e.hostId] = {
        hostId: e.hostId,
        hostName: host?.name ?? 'Unknown',
        hostEmail: host?.email ?? 'Unknown',
        bankAccountNum: host?.hostProfile?.bankAccountNum ?? '—',
        bankIfsc: host?.hostProfile?.bankIfsc ?? '—',
        bankName: host?.hostProfile?.bankName ?? '—',
        earningsIds: [],
        amountToPay: 0,
      };
    }

    hostGroupMap[e.hostId].earningsIds.push(e.id);
    hostGroupMap[e.hostId].amountToPay += Number(e.netEarnings);
  }

  return Object.values(hostGroupMap);
}

// ─── processPayout ─────────────────────────────────────────────────────────
// Performs weekly batch payout release for a given host, marking all accrued earnings as paid.
export async function processPayout(hostId: number, referenceNum?: string) {
  const unpaid = await prisma.hostEarning.findMany({
    where: { hostId, payoutId: null },
  });

  if (unpaid.length === 0) {
    throw new AppError(400, 'No unpaid earnings found for this host.', 'NO_EARNINGS');
  }

  const totalAmount = unpaid.reduce((sum, e) => sum + Number(e.netEarnings), 0);

  // 1. Create HostPayout record
  const payout = await prisma.hostPayout.create({
    data: {
      hostId,
      amount:       totalAmount,
      status:       'PAID',
      referenceNum: referenceNum || `PAY-REF-${Date.now()}`,
      paidAt:       new Date(),
    },
  });

  // 2. Link unpaid earnings to this payout ID
  await prisma.hostEarning.updateMany({
    where: {
      hostId,
      payoutId: null,
    },
    data: {
      payoutId: payout.id,
    },
  });

  return payout;
}
