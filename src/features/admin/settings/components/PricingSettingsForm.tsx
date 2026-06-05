import { useForm } from "react-hook-form";
import { CalendarRange, CreditCard, Percent, Save } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader, Separator } from "./SettingsHelpers";

type PricingForm = {
  depositPercent: number;
  serviceFeePercent: number;
  lateReturnFeePerHour: number;
  cancellationFeePercent: number;
  minRentalDays: number;
  maxRentalDays: number;
  taxPercent: number;
};

export function PricingSettingsForm() {
  const { register, handleSubmit } = useForm<PricingForm>({
    defaultValues: {
      depositPercent: 20,
      serviceFeePercent: 8,
      lateReturnFeePerHour: 25,
      cancellationFeePercent: 10,
      minRentalDays: 1,
      maxRentalDays: 90,
      taxPercent: 8.5,
    },
  });

  const onSubmit = (_data: PricingForm) => toast.success("Pricing settings saved successfully.");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="p-6">
        <SectionHeader icon={CreditCard} title="Fee Structure" description="Configure platform fees applied to all bookings." />
        <Separator className="mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Service Fee (%)</Label>
            <div className="relative mt-1">
              <Input type="number" step="0.1" min="0" max="50" {...register("serviceFeePercent", { valueAsNumber: true })} className="pr-8" />
              <Percent className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Added to each booking subtotal.</p>
          </div>
          <div>
            <Label>Tax Rate (%)</Label>
            <div className="relative mt-1">
              <Input type="number" step="0.1" min="0" max="30" {...register("taxPercent", { valueAsNumber: true })} className="pr-8" />
              <Percent className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Applied after service fee.</p>
          </div>
          <div>
            <Label>Security Deposit (%)</Label>
            <div className="relative mt-1">
              <Input type="number" step="1" min="0" max="100" {...register("depositPercent", { valueAsNumber: true })} className="pr-8" />
              <Percent className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">% of total charge held as deposit.</p>
          </div>
          <div>
            <Label>Late Return Fee ($/hr)</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input type="number" step="1" min="0" {...register("lateReturnFeePerHour", { valueAsNumber: true })} className="pl-6" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Charged per hour past due return.</p>
          </div>
          <div>
            <Label>Cancellation Fee (%)</Label>
            <div className="relative mt-1">
              <Input type="number" step="1" min="0" max="100" {...register("cancellationFeePercent", { valueAsNumber: true })} className="pr-8" />
              <Percent className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">% of booking charged on cancellation.</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader icon={CalendarRange} title="Rental Duration Limits" description="Control the minimum and maximum rental period allowed." />
        <Separator className="mb-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Minimum Rental Days</Label>
            <Input type="number" min="1" {...register("minRentalDays", { valueAsNumber: true })} className="mt-1" />
          </div>
          <div>
            <Label>Maximum Rental Days</Label>
            <Input type="number" min="1" max="365" {...register("maxRentalDays", { valueAsNumber: true })} className="mt-1" />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="shadow-soft">
          <Save className="mr-2 h-4 w-4" /> Save Pricing Settings
        </Button>
      </div>
    </form>
  );
}
