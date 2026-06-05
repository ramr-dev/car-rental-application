import { Link, useRouterState } from "@tanstack/react-router";
import {
  CarFront,
  CreditCard,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
  BarChart3,
  Bell,
  CalendarRange,
  Heart,
  DollarSign,
  UserCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const userLinks = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/bookings", label: "My Bookings", icon: CalendarRange },
  { to: "/dashboard/saved", label: "Saved Vehicles", icon: Heart },
  { to: "/dashboard/profile", label: "Profile", icon: Settings },
  { to: "/dashboard/kyc", label: "KYC Verification", icon: ShieldCheck },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/vehicles", label: "Vehicles", icon: CarFront },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarRange },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/fleet", label: "Fleet", icon: Wrench },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { to: "/admin/kyc", label: "KYC Approvals", icon: ShieldCheck },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/profile", label: "My Profile", icon: UserCircle },
];

function NavLinks({
  scope,
  onNavigate,
}: {
  scope: "user" | "admin";
  onNavigate?: () => void;
}) {
  const links = scope === "admin" ? adminLinks : userLinks;
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      <div className="mb-6 px-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {scope === "admin" ? "Admin Panel" : "Account"}
        </p>
      </div>
      <nav className="space-y-1">
        {links.map((l) => {
          const active = l.exact ? path === l.to : path.startsWith(l.to);
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function DashboardSidebar({ scope }: { scope: "user" | "admin" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────── */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border bg-sidebar p-4 lg:block">
        <NavLinks scope={scope} />
      </aside>

      {/* ── Mobile trigger (shown in the main layout via the Sheet) ─── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-5 right-5 z-40 rounded-full shadow-elevated lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-4">
          <SheetHeader className="mb-2">
            <SheetTitle className="sr-only">
              {scope === "admin" ? "Admin navigation" : "Account navigation"}
            </SheetTitle>
          </SheetHeader>
          <NavLinks scope={scope} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
