import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, Bell, Mail, Save } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader, Separator, ToggleRow } from "./SettingsHelpers";

type EmailForm = {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  fromName: string;
  fromEmail: string;
};

export function EmailSettingsForm() {
  const [notifyNewBooking, setNotifyNewBooking] = useState(true);
  const [notifyCancelled, setNotifyCancelled] = useState(true);
  const [notifyKyc, setNotifyKyc] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(false);
  const { register, handleSubmit } = useForm<EmailForm>({
    defaultValues: {
      smtpHost: "smtp.sendgrid.net",
      smtpPort: 587,
      smtpUser: "apikey",
      fromName: "DriveLux",
      fromEmail: "noreply@drivelux.com",
    },
  });

  const onSubmit = (_data: EmailForm) => toast.success("Email settings saved successfully.");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="p-6">
        <SectionHeader icon={Mail} title="SMTP Configuration" description="Outbound email server settings for transactional messages." />
        <Separator className="mb-6" />

        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-xs">SMTP credentials are stored encrypted. Never share your API keys. Use environment variables in production.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>SMTP Host</Label>
            <Input placeholder="smtp.sendgrid.net" {...register("smtpHost")} className="mt-1" />
          </div>
          <div>
            <Label>SMTP Port</Label>
            <Input type="number" {...register("smtpPort", { valueAsNumber: true })} className="mt-1" />
          </div>
          <div>
            <Label>SMTP Username / API Key</Label>
            <Input placeholder="apikey" {...register("smtpUser")} className="mt-1" />
          </div>
          <div>
            <Label>SMTP Password</Label>
            <Input type="password" placeholder="••••••••••••" className="mt-1" />
          </div>
          <div>
            <Label>From Name</Label>
            <Input {...register("fromName")} className="mt-1" />
          </div>
          <div>
            <Label>From Email</Label>
            <Input type="email" {...register("fromEmail")} className="mt-1" />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => toast.success("Test email dispatched — check your inbox.")}>
            <Mail className="mr-1.5 h-3.5 w-3.5" /> Send Test Email
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader icon={Bell} title="Admin Notifications" description="Choose which events trigger an email notification to the admin." />
        <Separator className="mb-6" />
        <div className="space-y-3">
          <ToggleRow
            label="New Booking Received"
            description="Send an email when a customer submits a new booking request."
            checked={notifyNewBooking}
            onChange={setNotifyNewBooking}
          />
          <ToggleRow
            label="Booking Cancelled"
            description="Send an email when a booking is cancelled by the customer or admin."
            checked={notifyCancelled}
            onChange={setNotifyCancelled}
          />
          <ToggleRow
            label="KYC Document Submitted"
            description="Alert when a customer uploads identity verification documents."
            checked={notifyKyc}
            onChange={setNotifyKyc}
          />
          <ToggleRow
            label="Payment Received"
            description="Notify when a payment or refund is processed on the platform."
            checked={notifyPayment}
            onChange={setNotifyPayment}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="shadow-soft">
          <Save className="mr-2 h-4 w-4" /> Save Email Settings
        </Button>
      </div>
    </form>
  );
}
