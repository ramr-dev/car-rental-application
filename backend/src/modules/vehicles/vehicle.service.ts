import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import type {
  VehicleListQuery,
  CreateVehicleInput,
  UpdateVehicleInput,
} from './vehicle.schema.js';

// ─── Response mapper ───────────────────────────────────────────────────────
// Converts the Prisma Vehicle row into the shape the frontend expects:
//   - id as string
//   - specs nested { mileage, engine, topSpeed, acceleration }
//   - Decimal pricePerDay → number
//   - type/fuel/transmission lowercased to match frontend enums

type PrismaVehicle = Prisma.VehicleGetPayload<Record<string, never>>;

function toVehicleResponse(v: PrismaVehicle) {
  return {
    id:           String(v.id),
    name:         v.name,
    brand:        v.brand,
    model:        v.model,
    year:         v.year,
    type:         v.type.toLowerCase() as Lowercase<typeof v.type>,
    fuel:         v.fuel.toLowerCase() as Lowercase<typeof v.fuel>,
    transmission: v.transmission.toLowerCase() as Lowercase<typeof v.transmission>,
    seats:        v.seats,
    pricePerDay:  Number(v.pricePerDay),
    rating:       v.rating,
    reviewCount:  v.reviewCount,
    location:     v.location,
    image:        v.image,
    images:       v.images as string[],
    features:     v.features as string[],
    available:    v.available,
    description:  v.description,
    specs: {
      mileage:      v.mileage,
      engine:       v.engine,
      topSpeed:     v.topSpeed,
      acceleration: v.acceleration,
    },
  };
}

// ─── list ──────────────────────────────────────────────────────────────────

export async function list(query: VehicleListQuery) {
  const where: Prisma.VehicleWhereInput = {};

  if (query.search) {
    where.OR = [
      { name:  { contains: query.search } },
      { brand: { contains: query.search } },
      { model: { contains: query.search } },
    ];
  }
  if (query.type)         where.type         = query.type;
  if (query.fuel)         where.fuel         = query.fuel;
  if (query.transmission) where.transmission = query.transmission;
  if (query.minSeats)     where.seats        = { gte: query.minSeats };
  if (query.available !== undefined) where.available = query.available;

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.pricePerDay = {
      ...(query.minPrice !== undefined && { gte: query.minPrice }),
      ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
    };
  }

  const orderBy: Prisma.VehicleOrderByWithRelationInput =
    query.sort === 'price_asc'  ? { pricePerDay: 'asc'  } :
    query.sort === 'price_desc' ? { pricePerDay: 'desc' } :
    query.sort === 'rating'     ? { rating: 'desc'       } :
                                  { createdAt: 'desc'    };

  const skip = (query.page - 1) * query.limit;

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({ where, orderBy, skip, take: query.limit }),
    prisma.vehicle.count({ where }),
  ]);

  return {
    data: vehicles.map(toVehicleResponse),
    pagination: {
      total,
      page:      query.page,
      limit:     query.limit,
      pageCount: Math.ceil(total / query.limit),
    },
  };
}

// ─── getById ───────────────────────────────────────────────────────────────

export async function getById(id: number) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new AppError(404, 'Vehicle not found.', 'NOT_FOUND');
  return toVehicleResponse(vehicle);
}

// ─── create ────────────────────────────────────────────────────────────────

export async function create(input: CreateVehicleInput) {
  const vehicle = await prisma.vehicle.create({
    data: {
      name:         input.name,
      brand:        input.brand,
      model:        input.model,
      year:         input.year,
      type:         input.type,
      fuel:         input.fuel,
      transmission: input.transmission,
      seats:        input.seats,
      pricePerDay:  input.pricePerDay,
      location:     input.location,
      image:        input.image,
      images:       input.images,
      features:     input.features,
      available:    true,
      description:  input.description,
      mileage:      input.specs.mileage,
      engine:       input.specs.engine,
      topSpeed:     input.specs.topSpeed,
      acceleration: input.specs.acceleration,
    },
  });

  return toVehicleResponse(vehicle);
}

// ─── update ────────────────────────────────────────────────────────────────

export async function update(id: number, input: UpdateVehicleInput) {
  const exists = await prisma.vehicle.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new AppError(404, 'Vehicle not found.', 'NOT_FOUND');

  const { specs, ...rest } = input;

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      ...rest,
      ...(specs && {
        mileage:      specs.mileage,
        engine:       specs.engine,
        topSpeed:     specs.topSpeed,
        acceleration: specs.acceleration,
      }),
    },
  });

  return toVehicleResponse(vehicle);
}

// ─── remove ────────────────────────────────────────────────────────────────

export async function remove(id: number) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id }, select: { id: true } });
  if (!vehicle) throw new AppError(404, 'Vehicle not found.', 'NOT_FOUND');

  // Guard: do not delete a vehicle that has active bookings
  const activeBookings = await prisma.booking.count({
    where: {
      vehicleId: id,
      status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
    },
  });
  if (activeBookings > 0) {
    throw new AppError(
      409,
      `Cannot delete this vehicle — it has ${activeBookings} active booking(s). Cancel them first.`,
      'HAS_ACTIVE_BOOKINGS',
    );
  }

  await prisma.vehicle.delete({ where: { id } });
}
