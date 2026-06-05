import { CalendarDays, MapPin, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function SearchBar() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  return (
    <Card className="grid gap-3 border-border/60 p-3 shadow-elevated md:grid-cols-[1.4fr_1fr_1fr_auto] md:p-2">
      <Field icon={<MapPin className="h-4 w-4" />} label="Location">
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or airport" className="border-0 px-0 shadow-none focus-visible:ring-0" />
      </Field>
      <Field icon={<CalendarDays className="h-4 w-4" />} label="Pick-up">
        <Input type="date" value={pickup} onChange={(e) => setPickup(e.target.value)} className="border-0 px-0 shadow-none focus-visible:ring-0" />
      </Field>
      <Field icon={<CalendarDays className="h-4 w-4" />} label="Drop-off">
        <Input type="date" value={dropoff} onChange={(e) => setDropoff(e.target.value)} className="border-0 px-0 shadow-none focus-visible:ring-0" />
      </Field>
      <Button size="lg" className="h-full min-h-12 px-6 shadow-glow" onClick={() => navigate({ to: "/vehicles" })}>
        <Search className="mr-2 h-4 w-4" /> Search
      </Button>
    </Card>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50">
      <div className="mt-1 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  );
}
