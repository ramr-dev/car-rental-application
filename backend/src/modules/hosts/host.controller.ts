import type { Request, Response } from 'express';
import * as hostService from './host.service.js';
import type {
  SubmitHostProfileInput,
  HostSubmitVehicleInput,
  AddScheduleInput,
  SubmitChecklistInput,
} from './host.schema.js';

// POST /api/hosts/verify
export async function submitProfile(req: Request, res: Response): Promise<void> {
  const input = req.body as SubmitHostProfileInput;
  const result = await hostService.submitProfile(req.user!.userId, input);
  res.status(201).json(result);
}

// GET /api/hosts/profile
export async function getProfile(req: Request, res: Response): Promise<void> {
  const result = await hostService.getProfile(req.user!.userId);
  res.json(result);
}

// POST /api/hosts/vehicles
export async function submitVehicle(req: Request, res: Response): Promise<void> {
  const input = req.body as HostSubmitVehicleInput;
  const result = await hostService.submitVehicle(req.user!.userId, input);
  res.status(201).json(result);
}

// GET /api/hosts/vehicles
export async function listVehicles(req: Request, res: Response): Promise<void> {
  const result = await hostService.listVehicles(req.user!.userId);
  res.json(result);
}

// POST /api/hosts/schedules
export async function addSchedule(req: Request, res: Response): Promise<void> {
  const input = req.body as AddScheduleInput;
  const result = await hostService.addSchedule(req.user!.userId, input);
  res.status(201).json(result);
}

// GET /api/hosts/schedules/:vehicleId
export async function getSchedules(req: Request, res: Response): Promise<void> {
  const vehicleId = Number(req.params.vehicleId);
  const result = await hostService.getSchedules(req.user!.userId, vehicleId);
  res.json(result);
}

// GET /api/hosts/stats
export async function getStats(req: Request, res: Response): Promise<void> {
  const result = await hostService.getStats(req.user!.userId);
  res.json(result);
}

// POST /api/hosts/checklists
export async function submitChecklist(req: Request, res: Response): Promise<void> {
  const input = req.body as SubmitChecklistInput;
  const result = await hostService.submitChecklist(req.user!.userId, input);
  res.status(201).json(result);
}

// GET /api/hosts/payouts
export async function listPayouts(req: Request, res: Response): Promise<void> {
  const result = await hostService.listPayouts(req.user!.userId);
  res.json(result);
}
