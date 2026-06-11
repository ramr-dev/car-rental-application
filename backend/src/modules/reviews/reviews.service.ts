import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { CreateReviewInput } from './reviews.schema.js';

export async function submitReview(bookingId: string, callerId: number, input: CreateReviewInput) {
  // 1. Fetch booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found.', 'NOT_FOUND');
  }

  // 2. Validate ownership
  if (booking.userId !== callerId) {
    throw new AppError(403, 'You do not have permission to review this booking.', 'FORBIDDEN');
  }

  // 3. Verify booking is completed
  if (booking.status !== 'COMPLETED') {
    throw new AppError(400, 'Only completed bookings can be rated.', 'BAD_REQUEST');
  }

  // 4. Check if review already exists
  const existingReview = await prisma.review.findUnique({
    where: { bookingId },
  });

  if (existingReview) {
    throw new AppError(400, 'You have already reviewed this booking.', 'BAD_REQUEST');
  }

  // 5. Create review and update vehicle stats in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        rating: input.rating,
        comment: input.comment || null,
        userId: callerId,
        vehicleId: booking.vehicleId,
        bookingId: bookingId,
      },
    });

    // Recalculate average rating and count
    const stats = await tx.review.aggregate({
      where: { vehicleId: booking.vehicleId },
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating = stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0;
    const reviewCount = stats._count.id;

    await tx.vehicle.update({
      where: { id: booking.vehicleId },
      data: {
        rating: averageRating,
        reviewCount: reviewCount,
      },
    });

    return review;
  });

  return result;
}

export async function getVehicleReviews(vehicleId: number) {
  const reviews = await prisma.review.findMany({
    where: { vehicleId },
    include: {
      user: {
        select: {
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reviews.map((r) => ({
    id: String(r.id),
    user: r.user.name,
    avatar: r.user.avatar || r.user.name.slice(0, 2).toUpperCase(),
    rating: r.rating,
    date: r.createdAt.toISOString().split('T')[0],
    comment: r.comment || '',
  }));
}
