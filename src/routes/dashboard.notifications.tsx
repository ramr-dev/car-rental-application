import { createFileRoute } from "@tanstack/react-router";
import { Bell, Calendar, CreditCard, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/notifications")({ component: NotificationsPage });

const NOTIFS = [
  { icon: Calendar, color: "bg-primary/10 text-primary", title: "Booking confirmed", desc: "Your Tesla Model S Plaid is ready for pickup on Jun 15.", time: "2h ago", unread: true },
  { icon: CreditCard, color: "bg-success/10 text-success", title: "Payment received", desc: "$945 charged to card ending in 4242.", time: "1d ago", unread: true },
  { icon: Gift, color: "bg-warning/10 text-warning-foreground", title: "Loyalty perk unlocked", desc: "Free upgrade available on your next booking.", time: "3d ago", unread: false },
  { icon: Bell, color: "bg-accent text-accent-foreground", title: "Trip reminder", desc: "Don't forget to upload your driver's license before pickup.", time: "1w ago", unread: false },
];

function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Notifications</h1>
      <p className="mt-1 text-muted-foreground">Stay updated on your bookings and account.</p>

      <Card className="mt-8 divide-y divide-border">
        {NOTIFS.map((n, i) => {
          const Icon = n.icon;
          return (
            <div key={i} className={`flex items-start gap-4 p-5 ${n.unread ? "bg-accent/20" : ""}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${n.color}`}><Icon className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{n.title}</p>
                  {n.unread && <Badge variant="default" className="h-5 px-1.5 text-[10px]">New</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.desc}</p>
                <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
