import type { Request, Response } from 'express';
import * as vehicleService from './vehicle.service.js';
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
