import { Link } from "@tanstack/react-router";
import { Car } from "lucide-react";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-10 sm:px-12 lg:px-16">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow">
            <Car className="h-5 w-5" />
          </span>
          DriveLux
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-hero lg:block">
        <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=80&auto=format&fit=crop" alt="" className="h-full w-full object-cover opacity-60 mix-blend-overlay" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-primary-foreground">
          <p className="font-display text-2xl font-semibold leading-tight">"DriveLux turned a routine business trip into something I actually look forward to."</p>
          <p className="mt-4 text-sm opacity-90">— Jonathan Reyes, Executive</p>
        </div>
      </div>
    </div>
  );
}
