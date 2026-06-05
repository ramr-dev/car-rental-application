import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "@/lib/api";
import type { BookingStatus } from "@/lib/types";

export function useBookingsQuery() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: () => bookingService.list(),
  });
}

export function useBookingQuery(id: string) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => bookingService.get(id),
    enabled: !!id,
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useUpdateBookingStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      bookingService.updateStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", updated.id] });
    },
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingService.cancel(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", updated.id] });
    },
  });
}
