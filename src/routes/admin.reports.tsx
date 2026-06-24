import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  CalendarRange,
  Car,
  Users,
  Wrench,
  BarChart3,
} from "lucide-react";
import { bookingService, vehicleService, userService } from "@/lib/api";
import { useChartStyles } from "@/hooks/useChartStyles";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({ component: AdminReports });

// ─── Static chart data ──────────────────────────────────────────────────────

const PRIMARY = "#6366f1";
const SUCCESS = "#10b981";
const WARNING = "#f59e0b";
const DESTRUCTIVE = "#ef4444";
const CHART3 = "#8b5cf6";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const revenueMonthly = MONTHS.map((month, i) => ({
  month,
  revenue: 30000 + Math.round(Math.sin(i / 2) * 12000 + i * 4500),
  costs: 12000 + Math.round(Math.cos(i / 3) * 4000 + i * 1200),
  profit: 0,
})).map((d) => ({ ...d, profit: d.revenue - d.costs }));

const bookingTrend = MONTHS.map((month, i) => ({
  month,
  new: 80 + Math.round(Math.sin(i / 1.5) * 30 + i * 8),
  completed: 60 + Math.round(Math.cos(i / 2) * 20 + i * 5),
  cancelled: 5 + Math.round(Math.random() * 8),
}));

const vehiclePerformance = [
  { name: "Tesla Model S", bookings: 38, revenue: 7182, utilization: 92 },
  { name: "BMW M4", bookings: 31, revenue: 7595, utilization: 78 },
  { name: "Range Rover Sport", bookings: 27, revenue: 5940, utilization: 72 },
  { name: "Porsche 911", bookings: 44, revenue: 14080, utilization: 95 },
  { name: "Toyota Camry", bookings: 62, revenue: 4030, utilization: 88 },
  { name: "Audi e-tron GT", bookings: 29, revenue: 6235, utilization: 74 },
];

const fleetUtilData = [
  { status: "Available", count: 42, color: SUCCESS },
  { status: "Booked", count: 31, color: PRIMARY },
  { status: "Maintenance", count: 12, color: WARNING },
  { status: "Unavailable", count: 7, color: DESTRUCTIVE },
];

const customerSegments = [
  { name: "Business Travel", value: 38, color: PRIMARY },
  { name: "Leisure", value: 32, color: SUCCESS },
  { name: "Special Events", value: 18, color: WARNING },
  { name: "Airport Transfer", value: 12, color: CHART3 },
];


function AdminReports() {
  const { data: bookings = [] } = useQuery({ queryKey: ["bookings"], queryFn: () => bookingService.list() });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => vehicleService.list() });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => userService.list() });
  const css = useChartStyles();

  const handleExportAll = () => {
    downloadCSV(revenueMonthly, "revenue_monthly_report.csv");
    setTimeout(() => downloadCSV(bookingTrend, "booking_volume_trend.csv"), 100);
    setTimeout(() => downloadCSV(vehiclePerformance, "vehicle_performance_report.csv"), 200);
    if (bookings.length > 0) {
      setTimeout(() => downloadCSV(
        bookings.map(b => ({
          id: b.id,
          customerName: b.customerName,
          vehicleName: b.vehicleName,
          startDate: b.startDate,
          endDate: b.endDate,
          totalPrice: b.totalPrice,
          status: b.status
        })),
        "all_bookings.csv"
      ), 300);
    }
    toast.success("All reports exported successfully!");
  };

  // Derived stats from real data
  const totalRevenue = bookings.filter((b) => b.status === "completed").reduce((s, b) => s + b.totalPrice, 0);
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const availableVehicles = vehicles.filter((v) => v.available).length;
  const customers = users.filter((u) => u.role === "user").length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Platform-wide performance data across revenue, bookings, vehicles, and customers.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportAll}>
          <Download className="mr-2 h-4 w-4" /> Export All Reports
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Revenue" value={totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : "$684K"} delta="+18.2%" icon={DollarSign} />
        <StatCard label="Total Bookings" value={String(bookings.length)} delta="+12%" icon={CalendarRange} />
        <StatCard label="Active Fleet" value={String(availableVehicles || vehicles.length)} delta="+8" icon={Car} />
        <StatCard label="Customers" value={String(customers || 1250)} delta="+124" icon={Users} />
        <StatCard label="Utilization" value="78%" delta="+4%" icon={BarChart3} />
      </div>

      {/* Tabbed reports */}
      <Tabs defaultValue="revenue">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="fleet">Fleet</TabsTrigger>
        </TabsList>

        {/* ── Revenue Tab ─────────────────────────────────────────── */}
        <TabsContent value="revenue" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Gross Revenue" value="$684K" delta="+22%" icon={DollarSign} />
            <StatCard label="Net Profit" value="$412K" delta="+18%" icon={TrendingUp} />
            <StatCard label="Avg. Order Value" value="$284" delta="+6%" icon={DollarSign} />
            <StatCard label="Refunds" value="$12.4K" delta="-3%" positive={false} icon={TrendingDown} />
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Revenue vs Costs</h3>
                <p className="text-sm text-muted-foreground">Monthly breakdown (Jan–Dec)</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadCSV(revenueMonthly, "revenue_monthly_report.csv")}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
              </Button>
            </div>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueMonthly}>
                  <defs>
                    <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SUCCESS} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={SUCCESS} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={css.grid} />
                  <XAxis dataKey="month" stroke={css.axis} fontSize={11} />
                  <YAxis stroke={css.axis} fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={css.tooltip} formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke={PRIMARY} strokeWidth={2.5} fill="url(#gradRev)" name="Revenue" />
                  <Area type="monotone" dataKey="profit" stroke={SUCCESS} strokeWidth={2.5} fill="url(#gradProfit)" name="Profit" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue by category */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold">Revenue by Vehicle Category</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { cat: "Luxury", rev: 220000 },
                    { cat: "SUV", rev: 178000 },
                    { cat: "Electric", rev: 145000 },
                    { cat: "Sedan", rev: 98000 },
                    { cat: "Convert.", rev: 72000 },
                    { cat: "Van", rev: 44000 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={css.grid} />
                    <XAxis dataKey="cat" stroke={css.axis} fontSize={11} />
                    <YAxis stroke={css.axis} fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={css.tooltip} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="rev" fill={PRIMARY} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold">Costs Breakdown</h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Vehicle Maintenance", pct: 28, color: WARNING },
                  { label: "Staff & Operations", pct: 22, color: PRIMARY },
                  { label: "Insurance", pct: 18, color: SUCCESS },
                  { label: "Fuel & Logistics", pct: 15, color: CHART3 },
                  { label: "Marketing", pct: 10, color: DESTRUCTIVE },
                  { label: "Other", pct: 7, color: "#94a3b8" },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${item.pct}%`, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Bookings Tab ─────────────────────────────────────────── */}
        <TabsContent value="bookings" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Bookings" value={String(bookings.length || 1248)} delta="+12%" icon={CalendarRange} />
            <StatCard label="Pending" value={String(pendingBookings || 42)} delta="+3" icon={CalendarRange} />
            <StatCard label="Completed" value={String(completedBookings || 890)} delta="+67" icon={CalendarRange} />
            <StatCard label="Cancellation Rate" value="4.2%" delta="-0.8%" icon={CalendarRange} />
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Booking Volume Trend</h3>
                <p className="text-sm text-muted-foreground">New, completed, and cancelled bookings</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadCSV(bookingTrend, "booking_volume_trend.csv")}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
              </Button>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={css.grid} />
                  <XAxis dataKey="month" stroke={css.axis} fontSize={11} />
                  <YAxis stroke={css.axis} fontSize={11} />
                  <Tooltip contentStyle={css.tooltip} />
                  <Legend />
                  <Bar dataKey="new" fill={PRIMARY} radius={[4, 4, 0, 0]} name="New" />
                  <Bar dataKey="completed" fill={SUCCESS} radius={[4, 4, 0, 0]} name="Completed" />
                  <Bar dataKey="cancelled" fill={DESTRUCTIVE} radius={[4, 4, 0, 0]} name="Cancelled" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent bookings table */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h3 className="font-display text-lg font-semibold">Recent Bookings</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCSV(
                    bookings.map((b) => ({
                      id: b.id,
                      customerName: b.customerName,
                      vehicleName: b.vehicleName,
                      startDate: b.startDate,
                      endDate: b.endDate,
                      totalPrice: b.totalPrice,
                      status: b.status,
                    })),
                    "recent_bookings.csv"
                  )
                }
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.slice(0, 8).map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.id}</TableCell>
                    <TableCell className="text-sm">{b.customerName ?? "—"}</TableCell>
                    <TableCell className="text-sm font-medium">{b.vehicleName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.startDate} → {b.endDate}</TableCell>
                    <TableCell className="font-semibold">${b.totalPrice}</TableCell>
                    <TableCell>
                      <Badge
                        className={`capitalize text-[10px] ${
                          b.status === "completed" ? "bg-success text-success-foreground" :
                          b.status === "confirmed" ? "bg-primary text-primary-foreground" :
                          b.status === "pending" ? "bg-warning text-warning-foreground" :
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── Vehicles Tab ─────────────────────────────────────────── */}
        <TabsContent value="vehicles" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Vehicles" value={String(vehicles.length || 88)} delta="+3" icon={Car} />
            <StatCard label="Available" value={String(availableVehicles || 62)} delta="-2" icon={Car} />
            <StatCard label="Avg. Daily Rate" value="$178" delta="+$12" icon={DollarSign} />
            <StatCard label="Avg. Utilization" value="78%" delta="+4%" icon={BarChart3} />
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Top Performing Vehicles</h3>
              <Button variant="outline" size="sm" onClick={() => downloadCSV(vehiclePerformance, "vehicle_performance_report.csv")}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
              </Button>
            </div>
            <div className="mt-4 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Total Bookings</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehiclePerformance.map((v) => (
                    <TableRow key={v.name}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell>{v.bookings}</TableCell>
                      <TableCell className="font-semibold">${v.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${v.utilization}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{v.utilization}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Customers Tab ────────────────────────────────────────── */}
        <TabsContent value="customers" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Customers" value={String(customers || 1250)} delta="+124" icon={Users} />
            <StatCard label="New This Month" value="148" delta="+12%" icon={Users} />
            <StatCard label="Repeat Customers" value="64%" delta="+5%" icon={Users} />
            <StatCard label="Verified (KYC)" value="82%" delta="+3%" icon={Users} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold">Customer Growth</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MONTHS.map((month, i) => ({
                    month,
                    customers: 800 + i * 42 + Math.round(Math.random() * 30),
                    new: 60 + Math.round(Math.sin(i) * 25) + i * 5,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={css.grid} />
                    <XAxis dataKey="month" stroke={css.axis} fontSize={11} />
                    <YAxis stroke={css.axis} fontSize={11} />
                    <Tooltip contentStyle={css.tooltip} />
                    <Legend />
                    <Line type="monotone" dataKey="customers" stroke={PRIMARY} strokeWidth={2.5} dot={false} name="Total" />
                    <Line type="monotone" dataKey="new" stroke={SUCCESS} strokeWidth={2} dot={false} name="New" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold">Customer Segments</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {customerSegments.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={css.tooltip} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ── Fleet Tab ────────────────────────────────────────────── */}
        <TabsContent value="fleet" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Fleet" value={String(vehicles.length || 92)} delta="+3" icon={Car} />
            <StatCard label="Available" value={String(availableVehicles || 42)} delta="−2 today" icon={Car} />
            <StatCard label="In Maintenance" value="12" delta="+2" positive={false} icon={Wrench} />
            <StatCard label="Fleet Utilization" value="78%" delta="+4%" icon={BarChart3} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold">Fleet Utilization Trend</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MONTHS.map((month, i) => ({
                    month,
                    utilization: 65 + Math.round(Math.sin(i / 1.5) * 10 + i * 0.8),
                  }))}>
                    <defs>
                      <linearGradient id="gradUtil" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SUCCESS} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={SUCCESS} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={css.grid} />
                    <XAxis dataKey="month" stroke={css.axis} fontSize={11} />
                    <YAxis domain={[50, 100]} stroke={css.axis} fontSize={11} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={css.tooltip} formatter={(v: number) => [`${v}%`, "Utilization"]} />
                    <Area type="monotone" dataKey="utilization" stroke={SUCCESS} strokeWidth={2.5} fill="url(#gradUtil)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold">Fleet Status</h3>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fleetUtilData}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {fleetUtilData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={css.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-2">
                {fleetUtilData.map((d) => (
                  <div key={d.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.status}</span>
                    </div>
                    <span className="font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function downloadCSV(data: Array<Record<string, any>>, filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          const valStr = val === null || val === undefined ? "" : String(val);
          if (valStr.includes(",") || valStr.includes('"') || valStr.includes("\n")) {
            return `"${valStr.replace(/"/g, '""')}"`;
          }
          return valStr;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
