import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehicleService } from "@/lib/api";
import type { Vehicle } from "@/lib/types";

export function useVehiclesQuery() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehicleService.list(),
  });
}

export function useVehicleQuery(id: string) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => vehicleService.get(id),
    enabled: !!id,
  });
}

export function useCreateVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vehicleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Vehicle> }) =>
      vehicleService.update(id, patch),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", updated.id] });
    },
  });
}
