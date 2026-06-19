import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarRange,
  CarFront,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  MapPin,
  Menu,
  Settings,
  ShieldCheck,
  Tag,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/vehicles", label: "Vehicles", icon: CarFront },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarRange },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/fleet", label: "Fleet", icon: Wrench },
  { to: "/admin/tracking", label: "Live Tracking", icon: MapPin },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/kyc", label: "KYC Approvals", icon: ShieldCheck },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/offers", label: "Offers", icon: Tag },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/profile", label: "My Profile", icon: UserCircle },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      <div className="mb-6 px-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin Panel
        </p>
      </div>
      <nav className="space-y-1">
        {links.map((l) => {
          const active = "exact" in l ? path === l.to : path.startsWith(l.to);
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

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border bg-sidebar p-4 lg:block">
        <NavLinks />
      </aside>

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
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          </SheetHeader>
          <NavLinks onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
