import type { Request, Response } from 'express';
import * as service from './offer.service.js';
import type { CreateOfferInput, UpdateOfferInput } from './offer.schema.js';

export async function getAllOffers(_req: Request, res: Response) {
  const offers = await service.listAll();
  res.json(offers);
}

export async function getActiveOffers(_req: Request, res: Response) {
  const offers = await service.listActive();
  res.json(offers);
}

export async function createOffer(req: Request, res: Response) {
  const offer = await service.create(req.body as CreateOfferInput);
  res.status(201).json(offer);
}

export async function updateOffer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const offer = await service.update(id, req.body as UpdateOfferInput);
  res.json(offer);
}

export async function deleteOffer(req: Request, res: Response) {
  const id = Number(req.params.id);
  await service.remove(id);
  res.status(204).end();
}

export async function toggleOffer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const offer = await service.toggleActive(id);
  res.json(offer);
}
