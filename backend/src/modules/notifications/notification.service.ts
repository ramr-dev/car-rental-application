import { prisma } from '../../lib/prisma.js';

// ─── Called by payment service after a booking is paid ────────────────────

export async function createBookingPaidNotification(
  bookingId: string,
  customerName: string | null,
  vehicleName: string,
  totalPrice: number,
): Promise<void> {
  const name = customerName ?? 'A customer';
  await prisma.adminNotification.create({
    data: {
      type:      'booking_paid',
      title:     'New Booking Confirmed',
      body:      `${name} paid $${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${vehicleName}. Ref: ${bookingId}.`,
      bookingId,
    },
  });
}

// ─── Admin queries ─────────────────────────────────────────────────────────

export async function listNotifications(limit = 30) {
  const rows = await prisma.adminNotification.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map((n) => ({
    id:        n.id,
    type:      n.type,
    title:     n.title,
    body:      n.body,
    bookingId: n.bookingId,
    isRead:    n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function markRead(id: number) {
  await prisma.adminNotification.update({
    where: { id },
    data:  { isRead: true },
  });
}

export async function markAllRead() {
  await prisma.adminNotification.updateMany({
    where: { isRead: false },
    data:  { isRead: true },
  });
}
