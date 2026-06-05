import { useState } from "react";
import { useForm } from "react-hook-form";
import { Building2, Globe, Save } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader, Separator } from "./SettingsHelpers";

type GeneralForm = {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
  logoUrl: string;
};

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
];

const CURRENCIES = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "AED", label: "UAE Dirham (AED)" },
  { value: "SGD", label: "Singapore Dollar (SGD)" },
];

export function GeneralSettingsForm() {
  const [timezone, setTimezone] = useState("America/New_York");
  const [currency, setCurrency] = useState("USD");
  const { register, handleSubmit } = useForm<GeneralForm>({
    defaultValues: {
      companyName: "DriveLux Premium Rentals",
      contactEmail: "hello@drivelux.com",
      contactPhone: "+1 (800) 555-0199",
      address: "150 Luxury Drive, Beverly Hills, CA 90210",
      website: "https://drivelux.com",
      logoUrl: "",
    },
  });

  const onSubmit = (_data: GeneralForm) => toast.success("General settings saved successfully.");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="p-6">
        <SectionHeader icon={Building2} title="Company Information" description="Your brand identity shown across the platform and customer emails." />
        <Separator className="mb-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Company Name</Label>
            <Input {...register("companyName", { required: true })} className="mt-1" />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input type="email" {...register("contactEmail", { required: true })} className="mt-1" />
          </div>
          <div>
            <Label>Contact Phone</Label>
            <Input {...register("contactPhone")} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label>Business Address</Label>
            <Input {...register("address")} className="mt-1" />
          </div>
          <div>
            <Label>Website URL</Label>
            <Input {...register("website")} className="mt-1" />
          </div>
          <div>
            <Label>Logo URL</Label>
            <Input placeholder="https://cdn.example.com/logo.png" {...register("logoUrl")} className="mt-1" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader icon={Globe} title="Locale & Currency" description="Set your operating timezone and display currency." />
        <Separator className="mb-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="shadow-soft">
          <Save className="mr-2 h-4 w-4" /> Save General Settings
        </Button>
      </div>
    </form>
  );
}
