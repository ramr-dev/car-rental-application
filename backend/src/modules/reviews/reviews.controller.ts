import type { Request, Response } from 'express';
import * as service from './reviews.service.js';
import type { CreateReviewInput } from './reviews.schema.js';

export async function createReview(req: Request, res: Response) {
  const { bookingId } = req.params as { bookingId: string };
  const callerId = req.user!.userId;
  
  const review = await service.submitReview(bookingId, callerId, req.body as CreateReviewInput);
  
  res.status(201).json(review);
}

export async function getVehicleReviews(req: Request, res: Response) {
  const vehicleId = Number(req.params.vehicleId);
  
  const reviews = await service.getVehicleReviews(vehicleId);
  
  res.json(reviews);
}
