import { useState } from "react";
import { useForm } from "react-hook-form";
import { Clock, Save, Shield } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader, Separator, ToggleRow } from "./SettingsHelpers";

type BookingForm = {
  maxAdvanceBookingDays: number;
  minNoticeHours: number;
  maxActiveBookingsPerCustomer: number;
};

export function BookingRulesForm() {
  const [requireKyc, setRequireKyc] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [allowSameDay, setAllowSameDay] = useState(false);
  const { register, handleSubmit } = useForm<BookingForm>({
    defaultValues: { maxAdvanceBookingDays: 180, minNoticeHours: 24, maxActiveBookingsPerCustomer: 3 },
  });

  const onSubmit = (_data: BookingForm) => toast.success("Booking rules saved successfully.");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="p-6">
        <SectionHeader icon={Shield} title="Booking Requirements" description="Control what is required for a customer to complete a booking." />
        <Separator className="mb-6" />
        <div className="space-y-3">
          <ToggleRow
            label="Require KYC Verification"
            description="Customers must have approved identity documents before booking."
            checked={requireKyc}
            onChange={setRequireKyc}
          />
          <ToggleRow
            label="Auto-Confirm Bookings"
            description="Automatically approve all incoming bookings without admin review."
            checked={autoConfirm}
            onChange={setAutoConfirm}
          />
          <ToggleRow
            label="Allow Same-Day Bookings"
            description="Customers can book a vehicle for pickup today."
            checked={allowSameDay}
            onChange={setAllowSameDay}
          />
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader icon={Clock} title="Scheduling Rules" description="Set time constraints for booking windows and notice periods." />
        <Separator className="mb-6" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Max Advance Booking (days)</Label>
            <Input type="number" min="1" {...register("maxAdvanceBookingDays", { valueAsNumber: true })} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">How far ahead customers can book.</p>
          </div>
          <div>
            <Label>Min Notice Period (hours)</Label>
            <Input type="number" min="0" {...register("minNoticeHours", { valueAsNumber: true })} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">Lead time required before pickup.</p>
          </div>
          <div>
            <Label>Max Active Bookings / Customer</Label>
            <Input type="number" min="1" {...register("maxActiveBookingsPerCustomer", { valueAsNumber: true })} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">Concurrent booking limit per user.</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="shadow-soft">
          <Save className="mr-2 h-4 w-4" /> Save Booking Rules
        </Button>
      </div>
    </form>
  );
}
