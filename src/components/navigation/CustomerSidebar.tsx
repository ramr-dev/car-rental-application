import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarRange,
  Heart,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/bookings", label: "My Bookings", icon: CalendarRange },
  { to: "/dashboard/saved", label: "Saved Vehicles", icon: Heart },
  { to: "/dashboard/profile", label: "Profile", icon: Settings },
  { to: "/dashboard/kyc", label: "KYC Verification", icon: ShieldCheck },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      <div className="mb-6 px-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Account
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

export function CustomerSidebar() {
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
            <SheetTitle className="sr-only">Account navigation</SheetTitle>
          </SheetHeader>
          <NavLinks onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
