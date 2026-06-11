import { api } from './client';
import type { Review } from '@/lib/types/vehicle.types';

export const reviewService = {
  submitReview: async (bookingId: string, rating: number, comment?: string): Promise<any> => {
    const res = await api.post(`/reviews/bookings/${bookingId}`, { rating, comment });
    return res.data;
  },

  getVehicleReviews: async (vehicleId: string | number): Promise<Review[]> => {
    const res = await api.get<Review[]>(`/reviews/vehicles/${vehicleId}`);
    return res.data;
  },
};
