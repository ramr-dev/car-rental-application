import { useForm, useWatch } from "react-hook-form";
import { useRef, useState } from "react";
import { ImagePlus, X, Loader2, AlertCircle } from "lucide-react";
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
import { vehicleService } from "@/lib/api/vehicle.service";
import { cn } from "@/lib/utils";
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

// ─── Image upload widget ──────────────────────────────────────────────────

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

function ImageUploadField({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const displaySrc = preview ?? (value || null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Image must be under 8 MB.");
      return;
    }
    setUploadError("");
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    try {
      const url = await vehicleService.uploadImage(file);
      onChange(url);
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
    } catch (err: any) {
      setUploadError(err?.response?.data?.error ?? "Upload failed. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange("");
    setPreview(null);
    setUploadError("");
  };

  return (
    <div className="space-y-2">
      <Label>Vehicle Image</Label>

      {displaySrc ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-border">
          <img
            src={displaySrc}
            alt="Vehicle preview"
            className="h-48 w-full object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-sm font-medium">Uploading…</span>
            </div>
          )}
          {!uploading && (
            <>
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 shadow backdrop-blur-sm transition hover:bg-destructive hover:text-white"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="absolute bottom-2 right-2 rounded-lg bg-background/80 px-3 py-1 text-xs font-medium shadow backdrop-blur-sm transition hover:bg-background"
              >
                Change image
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={cn(
            "flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-3",
            "rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors",
            "hover:border-primary/50 hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading image…</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ImagePlus className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload or drag & drop</p>
                <p className="mt-0.5 text-xs text-muted-foreground">JPEG, PNG or WebP · max 8 MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {uploadError && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {uploadError}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Shared form fields ───────────────────────────────────────────────────

function VehicleFormFields({
  register,
  setValue,
  control,
  defaultType,
  defaultFuel,
  defaultTransmission,
}: {
  register: ReturnType<typeof useForm<VehicleFormVals>>["register"];
  setValue: ReturnType<typeof useForm<VehicleFormVals>>["setValue"];
  control: ReturnType<typeof useForm<VehicleFormVals>>["control"];
  defaultType?: VehicleType;
  defaultFuel?: FuelType;
  defaultTransmission?: Transmission;
}) {
  const imageValue = useWatch({ control, name: "image" });

  return (
    <div className="space-y-4">
      {/* Row 1 — identity */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Brand</Label>
          <Input placeholder="Tesla" className="mt-1" {...register("brand", { required: true })} />
        </div>
        <div>
          <Label>Model</Label>
          <Input placeholder="Model X" className="mt-1" {...register("model", { required: true })} />
        </div>
        <div>
          <Label>Display Name</Label>
          <Input placeholder="Tesla Model X Plaid" className="mt-1" {...register("name", { required: true })} />
        </div>
        <div>
          <Label>Year</Label>
          <Input type="number" className="mt-1" {...register("year", { required: true })} />
        </div>
        <div>
          <Label>Seats</Label>
          <Input type="number" className="mt-1" {...register("seats", { required: true })} />
        </div>
        <div>
          <Label>Base Rate — per 12 hrs ($)</Label>
          <Input type="number" className="mt-1" {...register("pricePerDay", { required: true })} />
        </div>
      </div>

      {/* Row 2 — category selects */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Category</Label>
          <Select defaultValue={defaultType ?? "sedan"} onValueChange={(v) => setValue("type", v as VehicleType)}>
            <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Fuel</Label>
          <Select defaultValue={defaultFuel ?? "petrol"} onValueChange={(v) => setValue("fuel", v as FuelType)}>
            <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FUEL_TYPES.map((f) => (
                <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Transmission</Label>
          <Select defaultValue={defaultTransmission ?? "automatic"} onValueChange={(v) => setValue("transmission", v as Transmission)}>
            <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRANSMISSIONS.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location */}
      <div>
        <Label>Location</Label>
        <Input placeholder="Los Angeles, CA" className="mt-1" {...register("location", { required: true })} />
      </div>

      {/* Image upload */}
      <ImageUploadField
        value={imageValue ?? ""}
        onChange={(url) => setValue("image", url)}
      />

      {/* Specs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div><Label>Mileage / Range</Label><Input placeholder="400 mi range" className="mt-1" {...register("mileage")} /></div>
        <div><Label>Engine</Label><Input placeholder="Dual-Motor EV" className="mt-1" {...register("engine")} /></div>
        <div><Label>Top Speed</Label><Input placeholder="155 mph" className="mt-1" {...register("topSpeed")} /></div>
        <div><Label>0–60 mph</Label><Input placeholder="2.5s 0-60" className="mt-1" {...register("acceleration")} /></div>
      </div>

      {/* Description */}
      <div>
        <Label>Description</Label>
        <textarea
          className="mt-1 h-20 w-full resize-none rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
          placeholder="Describe this vehicle's key features…"
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
  const { register, handleSubmit, reset, setValue, control } = useForm<VehicleFormVals>({
    defaultValues: {
      type: "sedan",
      fuel: "petrol",
      transmission: "automatic",
      seats: 5,
      pricePerDay: 80,
      year: 2024,
      image: "",
    },
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
          <VehicleFormFields register={register} setValue={setValue} control={control} />
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" className="shadow-glow" disabled={isPending}>
              {isPending ? "Creating…" : "Commission Vehicle"}
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
  const { register, handleSubmit, setValue, control } = useForm<VehicleFormVals>({
    defaultValues: vehicle
      ? {
          name:         vehicle.name,
          brand:        vehicle.brand,
          model:        vehicle.model,
          year:         vehicle.year,
          type:         vehicle.type,
          fuel:         vehicle.fuel,
          transmission: vehicle.transmission,
          seats:        vehicle.seats,
          pricePerDay:  vehicle.pricePerDay,
          location:     vehicle.location,
          image:        vehicle.image ?? "",
          description:  vehicle.description ?? "",
          mileage:      vehicle.specs?.mileage ?? "",
          engine:       vehicle.specs?.engine ?? "",
          topSpeed:     vehicle.specs?.topSpeed ?? "",
          acceleration: vehicle.specs?.acceleration ?? "",
        }
      : undefined,
  });

  if (!vehicle) return null;

  return (
    <Dialog open={vehicle !== null} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Edit vehicle</DialogTitle>
          <DialogDescription>
            #{vehicle.id.toUpperCase()} — {vehicle.name}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => {
            if (!data.type)         data.type         = vehicle.type;
            if (!data.fuel)         data.fuel         = vehicle.fuel;
            if (!data.transmission) data.transmission = vehicle.transmission;
            onSubmit(data);
          })}
          className="space-y-4"
        >
          <VehicleFormFields
            register={register}
            setValue={setValue}
            control={control}
            defaultType={vehicle.type}
            defaultFuel={vehicle.fuel}
            defaultTransmission={vehicle.transmission}
          />
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
