import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { CreateOfferInput, UpdateOfferInput } from './offer.schema.js';

// ─── Response mapper ───────────────────────────────────────────────────────

function toOfferResponse(o: {
  id: number;
  title: string;
  description: string;
  discountPercent: { toNumber(): number } | number;
  minDays: number;
  maxDays: number | null;
  isActive: boolean;
  badgeColor: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id:              o.id,
    title:           o.title,
    description:     o.description,
    discountPercent: Number(o.discountPercent),
    minDays:         o.minDays,
    maxDays:         o.maxDays,
    isActive:        o.isActive,
    badgeColor:      o.badgeColor,
    createdAt:       o.createdAt.toISOString(),
    updatedAt:       o.updatedAt.toISOString(),
  };
}

// ─── CRUD ──────────────────────────────────────────────────────────────────

export async function listAll() {
  const offers = await prisma.offer.findMany({ orderBy: { minDays: 'asc' } });
  return offers.map(toOfferResponse);
}

export async function listActive() {
  const offers = await prisma.offer.findMany({
    where: { isActive: true },
    orderBy: { minDays: 'asc' },
  });
  return offers.map(toOfferResponse);
}

export async function create(input: CreateOfferInput) {
  const offer = await prisma.offer.create({
    data: {
      title:           input.title,
      description:     input.description ?? '',
      discountPercent: input.discountPercent,
      minDays:         input.minDays,
      maxDays:         input.maxDays ?? null,
      isActive:        input.isActive ?? true,
      badgeColor:      input.badgeColor ?? 'primary',
    },
  });
  return toOfferResponse(offer);
}

export async function update(id: number, input: UpdateOfferInput) {
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Offer not found.', 'NOT_FOUND');

  const offer = await prisma.offer.update({
    where: { id },
    data: {
      ...(input.title           !== undefined && { title:           input.title }),
      ...(input.description     !== undefined && { description:     input.description }),
      ...(input.discountPercent !== undefined && { discountPercent: input.discountPercent }),
      ...(input.minDays         !== undefined && { minDays:         input.minDays }),
      ...(input.maxDays         !== undefined && { maxDays:         input.maxDays }),
      ...(input.isActive        !== undefined && { isActive:        input.isActive }),
      ...(input.badgeColor      !== undefined && { badgeColor:      input.badgeColor }),
    },
  });
  return toOfferResponse(offer);
}

export async function remove(id: number) {
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Offer not found.', 'NOT_FOUND');
  await prisma.offer.delete({ where: { id } });
}

export async function toggleActive(id: number) {
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Offer not found.', 'NOT_FOUND');
  const offer = await prisma.offer.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  return toOfferResponse(offer);
}

// ─── Pricing helpers ───────────────────────────────────────────────────────

export async function getActiveForPricing(): Promise<{
  discountPercent: number;
  minDays: number;
  maxDays: number | null;
}[]> {
  const offers = await prisma.offer.findMany({ where: { isActive: true } });
  return offers.map(o => ({
    discountPercent: Number(o.discountPercent),
    minDays:         o.minDays,
    maxDays:         o.maxDays,
  }));
}

export function bestDiscount(
  days: number,
  offers: { discountPercent: number; minDays: number; maxDays: number | null }[],
): number {
  if (days <= 0) return 0;
  return offers
    .filter(o => days >= o.minDays && (o.maxDays === null || days <= o.maxDays))
    .reduce((best, o) => (o.discountPercent > best ? o.discountPercent : best), 0);
}
