import type { Request, Response } from 'express';
import * as bookingService from './booking.service.js';
import type {
  BookingIdParam,
  BookingListQuery,
  CreateBookingInput,
  UpdateStatusInput,
} from './booking.schema.js';

// GET /api/bookings
export async function list(req: Request, res: Response): Promise<void> {
  const query  = req.query as unknown as BookingListQuery;
  const result = await bookingService.list(req.user!, query);
  res.json(result);
}

// GET /api/bookings/:id
export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as BookingIdParam;
  const booking = await bookingService.getById(id, req.user!);
  res.json(booking);
}

// POST /api/bookings
export async function create(req: Request, res: Response): Promise<void> {
  const input   = req.body as CreateBookingInput;
  const booking = await bookingService.create(input, req.user!);
  res.status(201).json(booking);
}

// PATCH /api/bookings/:id/status
export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as BookingIdParam;
  const input  = req.body as UpdateStatusInput;
  const booking = await bookingService.updateStatus(id, input);
  res.json(booking);
}

// PATCH /api/bookings/:id/cancel
export async function cancel(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as BookingIdParam;
  const booking = await bookingService.cancel(id, req.user!);
  res.json(booking);
}
