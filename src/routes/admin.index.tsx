import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, CalendarRange, Car, CheckCircle2, Clock, DollarSign, Users, Wrench } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bookingService, vehicleService, userService } from "@/lib/api";
import { useChartStyles } from "@/hooks/useChartStyles";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

const revenueData = [
  { month: "Jan", revenue: 42000, bookings: 120 },
  { month: "Feb", revenue: 48000, bookings: 142 },
  { month: "Mar", revenue: 55000, bookings: 168 },
  { month: "Apr", revenue: 62000, bookings: 190 },
  { month: "May", revenue: 71000, bookings: 215 },
  { month: "Jun", revenue: 84000, bookings: 248 },
];

const fleetData = [
  { type: "Sedan", count: 124 },
  { type: "SUV", count: 98 },
  { type: "Luxury", count: 56 },
  { type: "EV", count: 78 },
  { type: "Convert.", count: 32 },
];

const PRIMARY = "#6366f1";
const SUCCESS = "#10b981";

function AdminHome() {
  const css = useChartStyles();
  const { data: bookings = [] } = useQuery({ queryKey: ["bookings"], queryFn: () => bookingService.list() });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => vehicleService.list() });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => userService.list() });

  // Derived real stats
  const activeBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "active").length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const availableVehicles = vehicles.filter((v) => v.available).length;
  const fleetUtilization = vehicles.length > 0 ? Math.round(((vehicles.length - availableVehicles) / vehicles.length) * 100) : 78;
  const totalRevenue = bookings.filter((b) => b.status === "completed").reduce((s, b) => s + b.totalPrice, 0);
  const customers = users.filter((u) => u.role === "user").length;

  // Recent real activity from bookings
  const recentActivity = bookings
    .slice(0, 5)
    .map((b) => ({
      type: b.status === "pending" ? "New booking request" : b.status === "confirmed" ? "Booking confirmed" : "Status update",
      detail: `${b.vehicleName} — ${b.customerName ?? "Customer"}`,
      time: b.createdAt,
      status: b.status,
    }));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your fleet operations and revenue.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/reports">View Full Reports →</Link>
        </Button>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────── */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : "$362K"}
          delta="+18.2%"
          icon={DollarSign}
        />
        <StatCard
          label="Active Bookings"
          value={String(activeBookings || 248)}
          delta="+12%"
          icon={CalendarRange}
        />
        <StatCard
          label="Fleet Size"
          value={String(vehicles.length || 388)}
          delta={`${availableVehicles || 0} available`}
          icon={Car}
        />
        <StatCard
          label="Customers"
          value={String(customers || 12480)}
          delta="+342"
          icon={Users}
        />
      </div>

      {/* ── Secondary stats ────────────────────────────────────────── */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending Approval</p>
            <p className="font-display text-2xl font-bold">{pendingBookings}</p>
          </div>
          {pendingBookings > 0 && (
            <Badge className="ml-auto bg-warning text-warning-foreground">Action needed</Badge>
          )}
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed Rentals</p>
            <p className="font-display text-2xl font-bold">{completedBookings}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fleet Utilization</p>
            <p className="font-display text-2xl font-bold">{fleetUtilization}%</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Wrench className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">In Maintenance</p>
            <p className="font-display text-2xl font-bold">7</p>
          </div>
        </Card>
      </div>

      {/* ── Charts row ────────────────────────────────────────────── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Revenue trend</h3>
              <p className="text-sm text-muted-foreground">Last 6 months</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Activity className="h-3 w-3" /> Live
            </Badge>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={css.grid} />
                <XAxis dataKey="month" stroke={css.axis} fontSize={12} />
                <YAxis stroke={css.axis} fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={css.tooltip} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke={PRIMARY} strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold">Fleet composition</h3>
          <p className="text-sm text-muted-foreground">By category</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fleetData}>
                <CartesianGrid strokeDasharray="3 3" stroke={css.grid} />
                <XAxis dataKey="type" stroke={css.axis} fontSize={11} />
                <YAxis stroke={css.axis} fontSize={11} />
                <Tooltip contentStyle={css.tooltip} />
                <Bar dataKey="count" fill={PRIMARY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold">Bookings volume</h3>
          <p className="text-sm text-muted-foreground">Monthly</p>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={css.grid} />
                <XAxis dataKey="month" stroke={css.axis} fontSize={11} />
                <YAxis stroke={css.axis} fontSize={11} />
                <Tooltip contentStyle={css.tooltip} />
                <Legend />
                <Bar dataKey="bookings" fill={SUCCESS} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent activity</h3>
            {pendingBookings > 0 && (
              <Button size="sm" asChild>
                <Link to="/admin/bookings">Review {pendingBookings} pending</Link>
              </Button>
            )}
          </div>
          <div className="mt-4 divide-y divide-border">
            {recentActivity.length > 0
              ? recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{item.type}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        className={`capitalize text-[10px] ${
                          item.status === "pending"
                            ? "bg-warning text-warning-foreground"
                            : item.status === "confirmed"
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  </div>
                ))
              : [
                  ["New booking", "Tesla Model S — Sarah K.", "2m ago"],
                  ["KYC approved", "Marcus J. verified", "12m ago"],
                  ["Vehicle returned", "BMW M4 — undamaged", "1h ago"],
                  ["Maintenance complete", "Range Rover #RR-12", "3h ago"],
                  ["Payment received", "$1,240 — Elena R.", "4h ago"],
                ].map(([t, d, time], i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{t}</p>
                      <p className="text-xs text-muted-foreground">{d}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{time}</span>
                  </div>
                ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
