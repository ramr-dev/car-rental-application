import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { vehicleService } from "@/lib/api/vehicle.service";
import { toast } from "sonner";
import type { Vehicle } from "@/lib/types/vehicle.types";
import {
  AddVehicleDialog,
  EditVehicleDialog,
  type VehicleFormVals,
} from "@/features/admin/vehicles/components/VehicleFormDialog";

export const Route = createFileRoute("/admin/vehicles")({ component: AdminVehicles });

function AdminVehicles() {
  const queryClient = useQueryClient();
  const { data: vehicles = [], isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: () => vehicleService.list() });

  const [q, setQ] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const filtered = vehicles.filter((v) =>
    `${v.name} ${v.brand} ${v.type}`.toLowerCase().includes(q.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehicleService.delete(id),
    onSuccess: () => {
      toast.success("Vehicle removed from the fleet.");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => toast.error("Failed to delete vehicle. Please try again."),
  });

  const createMutation = useMutation({
    mutationFn: (data: VehicleFormVals) =>
      vehicleService.create({
        name: data.name,
        brand: data.brand,
        model: data.model,
        year: Number(data.year),
        type: data.type,
        fuel: data.fuel,
        transmission: data.transmission,
        seats: Number(data.seats),
        pricePerDay: Number(data.pricePerDay),
        location: data.location,
        image: data.image,
        description: data.description,
        features: ["Premium Audio", "Heated Seats", "Apple CarPlay"],
        specs: {
          mileage: data.mileage || "N/A",
          engine: data.engine || "N/A",
          topSpeed: data.topSpeed || "N/A",
          acceleration: data.acceleration || "N/A",
        },
        images: [data.image],
      }),
    onSuccess: (newVehicle) => {
      toast.success(`${newVehicle.name} successfully added to the fleet!`);
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setIsAddOpen(false);
    },
    onError: () => toast.error("Failed to add vehicle. Check details and try again."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Vehicle> }) =>
      vehicleService.update(id, patch),
    onSuccess: (updated) => {
      toast.success(`${updated.name} successfully updated!`);
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setEditingVehicle(null);
    },
    onError: () => toast.error("Failed to update vehicle."),
  });

  const handleEditSubmit = (data: VehicleFormVals) => {
    if (!editingVehicle) return;
    updateMutation.mutate({
      id: editingVehicle.id,
      patch: {
        name: data.name,
        brand: data.brand,
        model: data.model,
        year: Number(data.year),
        type: data.type,
        fuel: data.fuel,
        transmission: data.transmission,
        seats: Number(data.seats),
        pricePerDay: Number(data.pricePerDay),
        location: data.location,
        image: data.image,
        description: data.description,
        specs: { mileage: data.mileage, engine: data.engine, topSpeed: data.topSpeed, acceleration: data.acceleration },
      },
    });
  };

  const toggleAvailability = (v: Vehicle) => {
    updateMutation.mutate({ id: v.id, patch: { available: !v.available } });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Vehicle Management</h1>
          <p className="mt-1 text-muted-foreground">{vehicles.length} vehicles registered in your fleet</p>
        </div>
        <Button className="shadow-soft cursor-pointer" onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      <Card className="mt-8 overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search fleet by brand, name or class…"
              className="pl-9"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price/Day</TableHead>
              <TableHead>Specs</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}><div className="h-10 animate-pulse rounded bg-muted" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No matching fleet vehicles found.
                </TableCell>
              </TableRow>
            ) : filtered.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={v.image} alt="" className="h-12 w-16 rounded-md object-cover border border-border" />
                    <div>
                      <p className="font-semibold text-sm leading-none mb-1">{v.name}</p>
                      <p className="text-xs text-muted-foreground mb-1">{v.brand} • {v.year}</p>
                      <p className="text-[10px]">
                        {v.host ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Hosted by: {v.host.name}</span>
                        ) : (
                          <span className="text-muted-foreground">Platform Owned</span>
                        )}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary" className="capitalize">{v.type}</Badge></TableCell>
                <TableCell className="font-semibold text-sm">${v.pricePerDay}</TableCell>
                <TableCell>
                  <div className="text-xs space-y-0.5 text-muted-foreground">
                    <p>{v.seats} seats • {v.fuel}</p>
                    <p className="font-mono text-[10px]">{v.transmission}</p>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{v.location}</TableCell>
                <TableCell>
                  <button
                    onClick={() => toggleAvailability(v)}
                    className="cursor-pointer"
                    title="Click to toggle availability"
                  >
                    <Badge
                      variant={v.available ? "default" : "secondary"}
                      className={v.available ? "bg-success text-success-foreground hover:bg-success/90 shadow-soft" : "hover:bg-muted"}
                    >
                      {v.available ? "Available" : "In use / Blocked"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 cursor-pointer" onClick={() => setEditingVehicle(v)}>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 cursor-pointer hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Remove "${v.name}" from the fleet? This cannot be undone.`)) {
                          deleteMutation.mutate(v.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AddVehicleDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
      />

      <EditVehicleDialog
        vehicle={editingVehicle}
        onOpenChange={(open) => !open && setEditingVehicle(null)}
        onSubmit={handleEditSubmit}
        isPending={updateMutation.isPending}
      />
    </div>
  );
}
