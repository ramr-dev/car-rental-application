export interface AdminNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  bookingId: string | null;
  isRead: boolean;
  createdAt: string;
}
