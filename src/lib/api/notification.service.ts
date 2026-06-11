import { api } from './client';
import type { AdminNotification } from '@/lib/types/notification.types';

export const notificationService = {
  list: async (): Promise<AdminNotification[]> => {
    const res = await api.get<AdminNotification[]>('/admin/notifications');
    return res.data;
  },

  markRead: async (id: number): Promise<void> => {
    await api.patch(`/admin/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/admin/notifications/read-all');
  },
};
