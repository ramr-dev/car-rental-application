import type { Request, Response } from 'express';
import * as vehicleService from './vehicle.service.js';
import { env } from '../../config/env.js';
import type {
  VehicleListQuery,
  VehicleIdParam,
  CreateVehicleInput,
  UpdateVehicleInput,
} from './vehicle.schema.js';

// GET /api/vehicles
export async function list(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as VehicleListQuery;
  const result = await vehicleService.list(query);
  res.json(result);
}

// GET /api/vehicles/:id
export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as VehicleIdParam;
  const vehicle = await vehicleService.getById(id);
  res.json(vehicle);
}

// POST /api/vehicles
export async function create(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateVehicleInput;
  const vehicle = await vehicleService.create(input);
  res.status(201).json(vehicle);
}

// PATCH /api/vehicles/:id
export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as VehicleIdParam;
  const input = req.body as UpdateVehicleInput;
  const vehicle = await vehicleService.update(id, input);
  res.json(vehicle);
}

// DELETE /api/vehicles/:id
export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as VehicleIdParam;
  await vehicleService.remove(id);
  res.status(204).send();
}

// GET /api/vehicles/:id/booked-dates
export async function getBookedRanges(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as VehicleIdParam;
  const ranges = await vehicleService.getBookedRanges(id);
  res.json({ ranges });
}

// POST /api/vehicles/upload-image
export async function uploadImage(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No image file provided.' });
    return;
  }
  // Build the public URL using the server's base origin
  const baseUrl = env.CORS_ORIGIN.replace(/\/$/, '');
  // Static files are served from port 3001 (the backend), not the frontend origin
  const backendBase = `${req.protocol}://${req.get('host')}`;
  const url = `${backendBase}/uploads/vehicles/${file.filename}`;
  res.status(201).json({ url });
}
