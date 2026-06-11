import { api } from './client';
import type { Offer } from '@/lib/types/offer.types';

type CreateOfferPayload = Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateOfferPayload = Partial<CreateOfferPayload>;

export const offerService = {
  listActive: async (): Promise<Offer[]> => {
    const res = await api.get<Offer[]>('/offers');
    return res.data;
  },

  listAll: async (): Promise<Offer[]> => {
    const res = await api.get<Offer[]>('/offers/all');
    return res.data;
  },

  create: async (data: CreateOfferPayload): Promise<Offer> => {
    const res = await api.post<Offer>('/offers', data);
    return res.data;
  },

  update: async (id: number, data: UpdateOfferPayload): Promise<Offer> => {
    const res = await api.put<Offer>(`/offers/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/offers/${id}`);
  },

  toggleActive: async (id: number): Promise<Offer> => {
    const res = await api.patch<Offer>(`/offers/${id}/toggle`);
    return res.data;
  },
};
