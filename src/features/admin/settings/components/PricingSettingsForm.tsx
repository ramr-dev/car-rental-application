import { useForm } from "react-hook-form";
import { CalendarRange, CreditCard, Percent, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader, Separator } from "./SettingsHelpers";
import { api } from "@/lib/api/client";
import { useEffect, useState } from "react";

type PricingForm = {
  depositPercent: number;
  serviceFeePercent: number;
  lateReturnFeePerHour: number;
  cancellationFeePercent: number;
  minRentalDays: number;
  maxRentalDays: number;
  taxPercent: number;
  damageProtectionFee: number;
};

export function PricingSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<PricingForm>({
    defaultValues: {
      depositPercent: 20,
      serviceFeePercent: 12,
      lateReturnFeePerHour: 25,
      cancellationFeePercent: 10,
      minRentalDays: 1,
      maxRentalDays: 90,
      taxPercent: 8.5,
      damageProtectionFee: 20,
    },
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get("/admin/config");
        reset({
          depositPercent: data.security_deposit_percent ?? 20,
          serviceFeePercent: (data.service_fee_rate ?? 0.12) * 100,
          lateReturnFeePerHour: data.late_return_fee_per_hour ?? 25,
          cancellationFeePercent: data.cancellation_fee_percent ?? 10,
          minRentalDays: data.min_rental_days ?? 1,
          maxRentalDays: data.max_rental_days ?? 90,
          taxPercent: (data.tax_rate ?? 0.085) * 100,
          damageProtectionFee: data.damage_protection_fee ?? 20,
        });
      } catch (err) {
        toast.error("Failed to load pricing settings from server.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [reset]);

  const onSubmit = async (data: PricingForm) => {
    setSaving(true);
    try {
      await api.patch("/admin/config", {
        security_deposit_percent: data.depositPercent,
        service_fee_rate: data.serviceFeePercent / 100,
        late_return_fee_per_hour: data.lateReturnFeePerHour,
        cancellation_fee_percent: data.cancellationFeePercent,
        min_rental_days: data.minRentalDays,
        max_rental_days: data.maxRentalDays,
        tax_rate: data.taxPercent / 100,
        damage_protection_fee: data.damageProtectionFee,
      });
      toast.success("Pricing settings saved successfully.");
    } catch (err) {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <div>
            <Label>Travel with Confidence Fee ($)</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input type="number" step="1" min="0" {...register("damageProtectionFee", { valueAsNumber: true })} className="pl-6" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Accidental damage protection cover price.</p>
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
        <Button type="submit" disabled={saving} className="shadow-soft">
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Save Pricing Settings</>
          )}
        </Button>
      </div>
    </form>
  );
}
