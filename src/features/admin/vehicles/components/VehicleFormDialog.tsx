import { useForm } from "react-hook-form";
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
import { VEHICLE_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/constants";
import type { Vehicle, VehicleType, FuelType, Transmission } from "@/lib/types/vehicle.types";

export type VehicleFormVals = {
  name: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  fuel: FuelType;
  transmission: Transmission;
  seats: number;
  pricePerDay: number;
  location: string;
  image: string;
  description: string;
  mileage: string;
  engine: string;
  topSpeed: string;
  acceleration: string;
};

function VehicleFormFields({
  register,
  setValue,
  defaultType,
  defaultFuel,
  defaultTransmission,
}: {
  register: ReturnType<typeof useForm<VehicleFormVals>>["register"];
  setValue: ReturnType<typeof useForm<VehicleFormVals>>["setValue"];
  defaultType?: VehicleType;
  defaultFuel?: FuelType;
  defaultTransmission?: Transmission;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Brand</Label>
          <Input placeholder="Tesla" {...register("brand", { required: true })} />
        </div>
        <div>
          <Label>Model</Label>
          <Input placeholder="Model X" {...register("model", { required: true })} />
        </div>
        <div>
          <Label>Vehicle Display Name</Label>
          <Input placeholder="Tesla Model X Plaid" {...register("name", { required: true })} />
        </div>
        <div>
          <Label>Year</Label>
          <Input type="number" {...register("year", { required: true })} />
        </div>
        <div>
          <Label>Seats</Label>
          <Input type="number" {...register("seats", { required: true })} />
        </div>
        <div>
          <Label>Price per Day ($)</Label>
          <Input type="number" {...register("pricePerDay", { required: true })} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Category</Label>
          <Select
            defaultValue={defaultType ?? "sedan"}
            onValueChange={(val) => setValue("type", val as VehicleType)}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Fuel System</Label>
          <Select
            defaultValue={defaultFuel ?? "petrol"}
            onValueChange={(val) => setValue("fuel", val as FuelType)}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FUEL_TYPES.map((f) => (
                <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Transmission</Label>
          <Select
            defaultValue={defaultTransmission ?? "automatic"}
            onValueChange={(val) => setValue("transmission", val as Transmission)}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSMISSIONS.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Location</Label>
          <Input placeholder="Los Angeles, CA" {...register("location", { required: true })} />
        </div>
        <div>
          <Label>Image URL</Label>
          <Input placeholder="https://images.unsplash.com/..." {...register("image")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div><Label>Mileage / Range</Label><Input placeholder="400 mi range" {...register("mileage")} /></div>
        <div><Label>Engine / Power</Label><Input placeholder="Dual-Motor EV" {...register("engine")} /></div>
        <div><Label>Top Speed</Label><Input placeholder="155 mph" {...register("topSpeed")} /></div>
        <div><Label>Acceleration</Label><Input placeholder="2.5s 0-60" {...register("acceleration")} /></div>
      </div>

      <div>
        <Label>Description</Label>
        <textarea
          className="w-full border border-input bg-background rounded-lg p-2.5 text-sm h-20 focus:ring-1 focus:ring-primary outline-none mt-1"
          placeholder="Describe this vehicle's key features..."
          {...register("description", { required: true })}
        />
      </div>
    </div>
  );
}

// ─── Add Vehicle Dialog ────────────────────────────────────────────────────

interface AddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: VehicleFormVals) => void;
  isPending: boolean;
}

export function AddVehicleDialog({ open, onOpenChange, onSubmit, isPending }: AddProps) {
  const { register, handleSubmit, reset, setValue } = useForm<VehicleFormVals>({
    defaultValues: { type: "sedan", fuel: "petrol", transmission: "automatic", seats: 5, pricePerDay: 80, year: 2024 },
  });

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Add new vehicle</DialogTitle>
          <DialogDescription>Add a premium car to DriveLux's rentable inventory.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <VehicleFormFields register={register} setValue={setValue} />
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" className="shadow-glow" disabled={isPending}>
              {isPending ? "Creating..." : "Commission Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Vehicle Dialog ───────────────────────────────────────────────────

interface EditProps {
  vehicle: Vehicle | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: VehicleFormVals) => void;
  isPending: boolean;
}

export function EditVehicleDialog({ vehicle, onOpenChange, onSubmit, isPending }: EditProps) {
  const { register, handleSubmit, setValue } = useForm<VehicleFormVals>();

  if (!vehicle) return null;

  return (
    <Dialog open={vehicle !== null} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Edit vehicle specifications</DialogTitle>
          <DialogDescription>
            Adjust fleet values for #{vehicle.id.toUpperCase()} ({vehicle.name})
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => {
            setValue("type", vehicle.type);
            setValue("fuel", vehicle.fuel);
            setValue("transmission", vehicle.transmission);
            onSubmit(data);
          })}
          className="space-y-4"
        >
          <VehicleFormFields
            register={register}
            setValue={setValue}
            defaultType={vehicle.type}
            defaultFuel={vehicle.fuel}
            defaultTransmission={vehicle.transmission}
          />
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
