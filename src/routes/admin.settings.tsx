import { createFileRoute } from "@tanstack/react-router";
import { Building2, CalendarRange, Mail, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettingsForm } from "@/features/admin/settings/components/GeneralSettingsForm";
import { PricingSettingsForm } from "@/features/admin/settings/components/PricingSettingsForm";
import { BookingRulesForm } from "@/features/admin/settings/components/BookingRulesForm";
import { EmailSettingsForm } from "@/features/admin/settings/components/EmailSettingsForm";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Configure platform-wide behaviour, pricing rules, and notifications.
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Badge variant="outline" className="text-xs">All changes are saved per-tab</Badge>
        <Badge variant="secondary" className="text-xs">Backend integration pending</Badge>
      </div>

      <Tabs defaultValue="general" className="mt-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general"><Building2 className="mr-1.5 h-3.5 w-3.5" /> General</TabsTrigger>
          <TabsTrigger value="pricing"><Mail className="mr-1.5 h-3.5 w-3.5" /> Pricing</TabsTrigger>
          <TabsTrigger value="booking"><CalendarRange className="mr-1.5 h-3.5 w-3.5" /> Booking Rules</TabsTrigger>
          <TabsTrigger value="email"><Mail className="mr-1.5 h-3.5 w-3.5" /> Email</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="general"><GeneralSettingsForm /></TabsContent>
          <TabsContent value="pricing"><PricingSettingsForm /></TabsContent>
          <TabsContent value="booking"><BookingRulesForm /></TabsContent>
          <TabsContent value="email"><EmailSettingsForm /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
