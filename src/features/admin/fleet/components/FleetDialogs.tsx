import { useForm } from "react-hook-form";
import { Wrench, ShieldAlert, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Vehicle } from "@/lib/types/vehicle.types";

export const FLEET_STATUSES = ["available", "rented", "maintenance", "damage"] as const;
export type FleetStatus = (typeof FLEET_STATUSES)[number];

export const FLEET_STATUS_COLORS: Record<FleetStatus, string> = {
  available: "bg-success/10 text-success border-success/20",
  rented: "bg-primary/10 text-primary border-primary/20",
  maintenance: "bg-warning/10 text-warning border-warning/20",
  damage: "bg-destructive/10 text-destructive border-destructive/20",
};

// ─── Shared types ──────────────────────────────────────────────────────────

export type MaintenanceFormVals = {
  serviceType: string;
  technician: string;
  date: string;
  odometer: number;
  notes: string;
};

export type DamageFormVals = {
  severity: "low" | "medium" | "high";
  estimateCost: number;
  notes: string;
};

export type AssignFormVals = {
  customerName: string;
  pickupDate: string;
  returnDate: string;
};

// ─── Status Dialog ─────────────────────────────────────────────────────────

interface StatusDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onClose: () => void;
  onStatusChange: (status: FleetStatus) => void;
}

export function FleetStatusDialog({ vehicle, open, onClose, onStatusChange }: StatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Update fleet status</DialogTitle>
          <DialogDescription>Modify availability for: {vehicle.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Label>Select new operational status</Label>
          <Select onValueChange={(val) => onStatusChange(val as FleetStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose new status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available (Active catalog)</SelectItem>
              <SelectItem value="rented">Rented out (Active trip)</SelectItem>
              <SelectItem value="maintenance">Maintenance (Offline)</SelectItem>
              <SelectItem value="damage">Damage Logged (Repair required)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Maintenance Dialog ────────────────────────────────────────────────────

interface MaintenanceDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MaintenanceFormVals) => void;
}

export function FleetMaintenanceDialog({ vehicle, open, onClose, onSubmit }: MaintenanceDialogProps) {
  const { register, handleSubmit, reset } = useForm<MaintenanceFormVals>();

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold flex items-center gap-1.5">
            <Wrench className="h-5 w-5 text-primary" /> Schedule Maintenance
          </DialogTitle>
          <DialogDescription>
            Book a service check or regular maintenance for {vehicle.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => { onSubmit(data); handleClose(); })} className="space-y-4 mt-2">
          <div>
            <Label>Service Type</Label>
            <Input placeholder="Oil change & Engine filter" {...register("serviceType", { required: true })} />
          </div>
          <div className="grid gap-3 grid-cols-2">
            <div>
              <Label>Odometer (mi)</Label>
              <Input type="number" placeholder="25000" {...register("odometer", { required: true })} />
            </div>
            <div>
              <Label>Service Date</Label>
              <Input type="date" {...register("date", { required: true })} />
            </div>
          </div>
          <div>
            <Label>Assigned Technician</Label>
            <Input placeholder="DriveLux Garage Dept" {...register("technician", { required: true })} />
          </div>
          <div>
            <Label>Service Notes</Label>
            <textarea
              className="w-full border border-input bg-background rounded-lg p-2.5 text-xs h-16 focus:ring-1 focus:ring-primary outline-none mt-1"
              placeholder="Add specific checks..."
              {...register("notes")}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" className="shadow-soft">Schedule service</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Damage Report Dialog ──────────────────────────────────────────────────

interface DamageDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DamageFormVals) => void;
}

export function FleetDamageDialog({ vehicle, open, onClose, onSubmit }: DamageDialogProps) {
  const { register, handleSubmit, reset, setValue } = useForm<DamageFormVals>({ defaultValues: { severity: "medium" } });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold flex items-center gap-1.5">
            <ShieldAlert className="h-5 w-5 text-destructive" /> Log Damage Report
          </DialogTitle>
          <DialogDescription>
            Log physical damages or mechanical errors on {vehicle.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => { onSubmit(data); handleClose(); })} className="space-y-4 mt-2">
          <div className="grid gap-3 grid-cols-2">
            <div>
              <Label>Damage Severity</Label>
              <Select defaultValue="medium" onValueChange={(val) => setValue("severity", val as DamageFormVals["severity"])}>
                <SelectTrigger className="w-full mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Cosmetic)</SelectItem>
                  <SelectItem value="medium">Medium (Requires fix)</SelectItem>
                  <SelectItem value="high">High (Undriveable)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Repair Estimate ($)</Label>
              <Input type="number" placeholder="500" {...register("estimateCost", { required: true })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Damage details & notes</Label>
            <textarea
              className="w-full border border-input bg-background rounded-lg p-2.5 text-xs h-20 focus:ring-1 focus:ring-primary outline-none mt-1"
              placeholder="Describe the scratch, dent or system failure..."
              {...register("notes", { required: true })}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="destructive">Log damage report</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign Driver Dialog ──────────────────────────────────────────────────

interface AssignDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AssignFormVals) => void;
}

export function FleetAssignDialog({ vehicle, open, onClose, onSubmit }: AssignDialogProps) {
  const { register, handleSubmit, reset } = useForm<AssignFormVals>();

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold flex items-center gap-1.5">
            <ClipboardList className="h-5 w-5 text-primary" /> Assign Driver
          </DialogTitle>
          <DialogDescription>
            Record a custom rental assignment for {vehicle.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => { onSubmit(data); handleClose(); })} className="space-y-4 mt-2">
          <div>
            <Label>Driver / Customer Name</Label>
            <Input placeholder="John Doe" {...register("customerName", { required: true })} />
          </div>
          <div className="grid gap-3 grid-cols-2">
            <div>
              <Label>Pickup Date</Label>
              <Input type="date" {...register("pickupDate", { required: true })} />
            </div>
            <div>
              <Label>Expected Return Date</Label>
              <Input type="date" {...register("returnDate", { required: true })} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit">Confirm assignment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
