import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/StatCard";
import { bookingService } from "@/lib/api/booking.service";
import type { Booking } from "@/lib/types/booking.types";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

// ─── Types ─────────────────────────────────────────────────────────────────

type PaymentStatus = "succeeded" | "pending" | "refunded";

interface Payment {
  id: string;
  bookingId: string;
  customer: string;
  email: string;
  method: string;
  amount: number;
  status: PaymentStatus;
  date: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  "Visa •• 4242",
  "MC •• 8821",
  "PayPal",
  "Apple Pay",
  "Amex •• 0001",
  "Google Pay",
];

function hashIndex(str: string, len: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % len;
  return h;
}

function bookingToPaymentStatus(booking: Booking): PaymentStatus | null {
  if (booking.status === "pending") return "pending";
  if (booking.status === "confirmed" || booking.status === "active" || booking.status === "completed") return "succeeded";
  if (booking.status === "cancelled") return "refunded";
  return null;
}

function derivePayments(bookings: Booking[]): Payment[] {
  return bookings
    .map((b): Payment | null => {
      const status = bookingToPaymentStatus(b);
      if (!status) return null;
      return {
        id: `PAY-${b.id}`,
        bookingId: b.id,
        customer: b.customerName ?? "—",
        email: b.customerEmail ?? "—",
        method: PAYMENT_METHODS[hashIndex(b.id, PAYMENT_METHODS.length)],
        amount: b.totalPrice,
        status,
        date: b.createdAt,
      };
    })
    .filter((p): p is Payment => p !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Badge styles ──────────────────────────────────────────────────────────

const STATUS_STYLE: Record<PaymentStatus, string> = {
  succeeded: "bg-success text-success-foreground border-success/20",
  pending: "bg-warning text-warning-foreground border-warning/20",
  refunded: "bg-muted text-muted-foreground border-border",
};

const STATUS_ICON: Record<PaymentStatus, React.ElementType> = {
  succeeded: CheckCircle2,
  pending: Clock,
  refunded: ArrowDownLeft,
};

// ─── Page ──────────────────────────────────────────────────────────────────

function AdminPayments() {
  const queryClient = useQueryClient();
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => bookingService.list(),
  });

  const [q, setQ] = useState("");

  const payments = derivePayments(bookings);

  const refundMutation = useMutation({
    mutationFn: (bookingId: string) => bookingService.updateStatus(bookingId, "cancelled"),
    onSuccess: (_, bookingId) => {
      toast.success(`Refund issued for booking ${bookingId}.`);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: () => toast.error("Failed to issue refund. Please try again."),
  });

  // Summary stats
  const totalRevenue = payments
    .filter((p) => p.status === "succeeded")
    .reduce((s, p) => s + p.amount, 0);
  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const refundedTotal = payments
    .filter((p) => p.status === "refunded")
    .reduce((s, p) => s + p.amount, 0);
  const successRate =
    payments.length > 0
      ? Math.round((payments.filter((p) => p.status === "succeeded").length / payments.length) * 100)
      : 0;

  const tabs: Array<{ key: "all" | PaymentStatus; label: string }> = [
    { key: "all", label: "All" },
    { key: "succeeded", label: "Succeeded" },
    { key: "pending", label: "Pending" },
    { key: "refunded", label: "Refunded" },
  ];

  const filterPayments = (list: Payment[], tab: "all" | PaymentStatus) => {
    const byStatus = tab === "all" ? list : list.filter((p) => p.status === tab);
    if (!q.trim()) return byStatus;
    const lower = q.toLowerCase();
    return byStatus.filter(
      (p) =>
        p.id.toLowerCase().includes(lower) ||
        p.customer.toLowerCase().includes(lower) ||
        p.email.toLowerCase().includes(lower) ||
        p.bookingId.toLowerCase().includes(lower),
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Payments</h1>
          <p className="mt-1 text-muted-foreground">
            All transactions derived from booking activity.
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          delta="+18.2%"
          icon={DollarSign}
        />
        <StatCard
          label="Pending Payments"
          value={String(pendingCount)}
          delta={pendingCount > 0 ? "Awaiting confirmation" : "All clear"}
          icon={Clock}
          positive={pendingCount === 0}
        />
        <StatCard
          label="Total Refunded"
          value={`$${refundedTotal.toLocaleString()}`}
          delta={`${payments.filter((p) => p.status === "refunded").length} transactions`}
          icon={RefreshCw}
          positive={false}
        />
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          delta="Of all transactions"
          icon={CreditCard}
        />
      </div>

      {/* Table */}
      <Tabs defaultValue="all">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-2">
          <TabsList>
            {tabs.map(({ key, label }) => {
              const count = key === "all" ? payments.length : payments.filter((p) => p.status === key).length;
              return (
                <TabsTrigger key={key} value={key} className="capitalize text-xs px-3">
                  {label}
                  {count > 0 && (
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by ID, customer, or booking…"
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {tabs.map(({ key }) => {
          const rows = filterPayments(payments, key);
          return (
            <TabsContent key={key} value={key} className="mt-4">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={8}>
                            <div className="h-10 animate-pulse rounded bg-muted" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                          {q ? "No payments match your search." : "No payments in this category."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((p) => {
                        const StatusIcon = STATUS_ICON[p.status];
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-xs font-semibold">{p.id}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{p.customer}</p>
                                <p className="text-xs text-muted-foreground">{p.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {p.bookingId}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {p.method}
                            </TableCell>
                            <TableCell className="font-semibold">
                              ${p.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`capitalize text-[10px] border px-2 py-0.5 flex w-fit items-center gap-1 ${STATUS_STYLE[p.status]}`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {p.date}
                            </TableCell>
                            <TableCell className="text-right">
                              {p.status === "succeeded" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
                                  disabled={refundMutation.isPending}
                                  onClick={() => {
                                    if (confirm(`Issue a refund of $${p.amount.toLocaleString()} for booking ${p.bookingId}?`)) {
                                      refundMutation.mutate(p.bookingId);
                                    }
                                  }}
                                >
                                  <XCircle className="mr-1 h-3 w-3" /> Refund
                                </Button>
                              )}
                              {p.status === "refunded" && (
                                <span className="text-xs text-muted-foreground">Refunded</span>
                              )}
                              {p.status === "pending" && (
                                <span className="text-xs text-warning">Awaiting</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
