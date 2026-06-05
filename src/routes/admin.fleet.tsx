import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Users, Wrench, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { vehicleService } from "@/lib/api/vehicle.service";
import type { Vehicle } from "@/lib/types/vehicle.types";
import {
  FleetStatusDialog,
  FleetMaintenanceDialog,
  FleetDamageDialog,
  FleetAssignDialog,
  FLEET_STATUS_COLORS,
  type FleetStatus,
  type MaintenanceFormVals,
  type DamageFormVals,
  type AssignFormVals,
} from "@/features/admin/fleet/components/FleetDialogs";

export const Route = createFileRoute("/admin/fleet")({ component: AdminFleet });

type ActiveDialog = "status" | "service" | "damage" | "assign" | null;

function AdminFleet() {
  const queryClient = useQueryClient();
  const { data: vehicles = [], isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: () => vehicleService.list() });

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Vehicle> }) =>
      vehicleService.update(id, patch),
    onSuccess: (updated) => {
      toast.success(`${updated.name} status updated!`);
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => toast.error("Failed to update vehicle status."),
  });

  const closeDialog = () => { setSelectedVehicle(null); setActiveDialog(null); };
  const openDialog = (v: Vehicle, dialog: ActiveDialog) => { setSelectedVehicle(v); setActiveDialog(dialog); };

  const getVehicleStatus = (v: Vehicle, index: number): FleetStatus => {
    if (v.available) return "available";
    const sub: FleetStatus[] = ["rented", "maintenance", "damage"];
    return sub[index % sub.length];
  };

  const stats = vehicles.reduce(
    (acc, v, i) => {
      const s = getVehicleStatus(v, i);
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<FleetStatus, number>,
  );

  const handleStatusChange = (status: FleetStatus) => {
    if (!selectedVehicle) return;
    updateMutation.mutate({ id: selectedVehicle.id, patch: { available: status === "available" } });
    closeDialog();
  };

  const handleMaintenance = (_data: MaintenanceFormVals) => {
    if (!selectedVehicle) return;
    toast.success(`Service scheduled for ${selectedVehicle.name}!`);
    updateMutation.mutate({ id: selectedVehicle.id, patch: { available: false } });
  };

  const handleDamage = (data: DamageFormVals) => {
    if (!selectedVehicle) return;
    toast.success(`Damage report logged for ${selectedVehicle.name}. Severity: ${data.severity.toUpperCase()}`);
    updateMutation.mutate({ id: selectedVehicle.id, patch: { available: false } });
  };

  const handleAssign = (data: AssignFormVals) => {
    if (!selectedVehicle) return;
    toast.success(`${selectedVehicle.name} assigned to ${data.customerName}!`);
    updateMutation.mutate({ id: selectedVehicle.id, patch: { available: false } });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Fleet Management</h1>
        <p className="mt-1 text-muted-foreground">
          Real-time control, diagnostics and status of every premium asset in operation.
        </p>
      </div>

      <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Available", key: "available" as FleetStatus, icon: CheckCircle2 },
          { label: "Rented", key: "rented" as FleetStatus, icon: Users },
          { label: "Maintenance", key: "maintenance" as FleetStatus, icon: Wrench },
          { label: "Damage Logged", key: "damage" as FleetStatus, icon: AlertTriangle },
        ].map(({ label, key, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${FLEET_STATUS_COLORS[key]}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 font-display text-3xl font-bold">{isLoading ? "..." : (stats[key] ?? 0)}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-80 animate-pulse bg-muted rounded-xl" />
          ))
        ) : vehicles.map((v, i) => {
          const status = getVehicleStatus(v, i);
          return (
            <Card key={v.id} className="overflow-hidden group hover:shadow-soft transition-all duration-300">
              <div className="relative overflow-hidden bg-muted aspect-video">
                <img
                  src={v.image}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <Badge className={`absolute right-3 top-3 capitalize border ${FLEET_STATUS_COLORS[status]}`}>
                  {status}
                </Badge>
              </div>
              <div className="p-5">
                <h3 className="font-display font-bold text-lg leading-tight mb-1">{v.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">ID: #{v.id.toUpperCase()} • {v.location}</p>

                <div className="mt-4 space-y-2 text-xs border-b border-border/40 pb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Odometer:</span>
                    <span className="font-medium">{(22450 + i * 2820).toLocaleString()} mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Health:</span>
                    <span className={`font-semibold ${status === "damage" ? "text-destructive" : "text-success"}`}>
                      {status === "damage" ? "Service Required" : "Excellent"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => openDialog(v, "status")}>
                    <SlidersHorizontal className="h-3.5 w-3.5 mr-1" /> Status
                  </Button>
                  <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => openDialog(v, "assign")}>
                    <Users className="h-3.5 w-3.5 mr-1" /> Assign
                  </Button>
                  <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => openDialog(v, "service")}>
                    <Wrench className="h-3.5 w-3.5 mr-1" /> Service
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer hover:bg-destructive/10 text-destructive border-destructive/20"
                    onClick={() => openDialog(v, "damage")}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Damage
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedVehicle && activeDialog === "status" && (
        <FleetStatusDialog
          vehicle={selectedVehicle}
          open
          onClose={closeDialog}
          onStatusChange={handleStatusChange}
        />
      )}
      {selectedVehicle && activeDialog === "service" && (
        <FleetMaintenanceDialog
          vehicle={selectedVehicle}
          open
          onClose={closeDialog}
          onSubmit={handleMaintenance}
        />
      )}
      {selectedVehicle && activeDialog === "damage" && (
        <FleetDamageDialog
          vehicle={selectedVehicle}
          open
          onClose={closeDialog}
          onSubmit={handleDamage}
        />
      )}
      {selectedVehicle && activeDialog === "assign" && (
        <FleetAssignDialog
          vehicle={selectedVehicle}
          open
          onClose={closeDialog}
          onSubmit={handleAssign}
        />
      )}
    </div>
  );
}
