import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle,
  Download,
  Eye,
  Play,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { bookingService } from "@/lib/api";
import { toast } from "sonner";
import type { Booking, BookingStatus } from "@/lib/types";
import { BookingDetailsDialog } from "@/features/admin/bookings/components/BookingDetailsDialog";

export const Route = createFileRoute("/admin/bookings")({ component: AdminBookings });

const STATUS_BADGE: Record<BookingStatus, string> = {
  pending: "bg-warning text-warning-foreground border-warning/30",
  confirmed: "bg-success text-success-foreground border-success/30",
  active: "bg-primary text-primary-foreground border-primary/30",
  completed: "bg-secondary text-secondary-foreground border-border",
  cancelled: "bg-destructive text-destructive-foreground border-destructive/30",
};

function AdminBookings() {
  const queryClient = useQueryClient();
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => bookingService.list(),
  });

  const [q, setQ] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const tabs = ["all", "pending", "confirmed", "active", "completed", "cancelled"] as const;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      bookingService.updateStatus(id, status),
    onSuccess: (updated, variables) => {
      toast.success(
        `Booking ${updated.id} ${
          variables.status === "confirmed" ? "approved" :
          variables.status === "cancelled" ? "rejected" :
          `marked as ${variables.status}`
        }.`,
      );
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: () => {
      toast.error("Failed to update booking status. Please try again.");
    },
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Booking Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage and transition customer rental reservations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge className="bg-warning text-warning-foreground">
              {pendingCount} pending review
            </Badge>
          )}
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-2">
          <TabsList className="h-9">
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t} className="relative capitalize text-xs px-3">
                {t}
                {t === "pending" && pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[9px] font-bold text-warning-foreground">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search reference, customer, or vehicle…"
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {tabs.map((tab) => {
          const byTab = tab === "all" ? bookings : bookings.filter((b) => b.status === tab);
          const filtered = byTab.filter((b) =>
            `${b.id} ${b.vehicleName} ${b.pickupLocation} ${b.customerName ?? ""} ${b.customerEmail ?? ""}`
              .toLowerCase()
              .includes(q.toLowerCase()),
          );

          return (
            <TabsContent key={tab} value={tab} className="mt-4">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={7}>
                              <div className="h-10 animate-pulse rounded bg-muted" />
                            </TableCell>
                          </TableRow>
                        ))
                      : filtered.length === 0
                      ? (
                          <TableRow>
                            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                              No bookings found.
                            </TableCell>
                          </TableRow>
                        )
                      : filtered.map((b) => (
                          <TableRow key={b.id} className="group">
                            <TableCell className="font-mono text-xs font-semibold">
                              {b.id}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">
                                  {b.customerName ?? "—"}
                                </p>
                                {b.customerEmail && (
                                  <p className="text-xs text-muted-foreground">
                                    {b.customerEmail}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={b.vehicleImage}
                                  alt=""
                                  className="h-9 w-14 rounded object-cover border border-border"
                                />
                                <p className="text-sm font-medium">{b.vehicleName}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <p>{b.startDate.replace("T", " ")}</p>
                              <p>→ {b.endDate.replace("T", " ")}</p>
                            </TableCell>
                            <TableCell className="font-semibold text-sm">
                              ${b.totalPrice.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`capitalize rounded-full text-[10px] border px-2 py-0.5 ${STATUS_BADGE[b.status]}`}
                              >
                                {b.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5">
                                {/* View details — always visible */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-xs"
                                  onClick={() => setSelectedBooking(b)}
                                  title="View booking details"
                                >
                                  <Eye className="mr-1 h-3.5 w-3.5" /> Details
                                </Button>

                                {/* Approve / Reject — pending */}
                                {b.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10"
                                      onClick={() =>
                                        updateStatusMutation.mutate({ id: b.id, status: "cancelled" })
                                      }
                                      disabled={updateStatusMutation.isPending}
                                      title="Reject booking"
                                    >
                                      <Ban className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-8 bg-success text-success-foreground hover:bg-success/90 shadow-soft"
                                      onClick={() =>
                                        updateStatusMutation.mutate({ id: b.id, status: "confirmed" })
                                      }
                                      disabled={updateStatusMutation.isPending}
                                      title="Approve & confirm"
                                    >
                                      <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                                    </Button>
                                  </>
                                )}

                                {b.status === "confirmed" && (
                                  <Button
                                    size="sm"
                                    className="h-8"
                                    onClick={() =>
                                      updateStatusMutation.mutate({ id: b.id, status: "active" })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                    title="Mark as in progress"
                                  >
                                    <Play className="mr-1 h-3.5 w-3.5 fill-current" /> Dispatch
                                  </Button>
                                )}

                                {b.status === "active" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-success/20 text-success hover:bg-success/10"
                                    onClick={() =>
                                      updateStatusMutation.mutate({ id: b.id, status: "completed" })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                    title="Mark as completed"
                                  >
                                    <RefreshCw className="mr-1 h-3.5 w-3.5" /> Complete
                                  </Button>
                                )}

                                {b.status === "completed" && (
                                  <span className="px-2 py-1 text-xs text-muted-foreground">
                                    Archived
                                  </span>
                                )}
                                {b.status === "cancelled" && (
                                  <span className="px-2 py-1 text-xs text-destructive">
                                    Rejected
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Booking details dialog */}
      {selectedBooking && (
        <BookingDetailsDialog
          booking={selectedBooking}
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={(id, status) =>
            updateStatusMutation.mutate({ id, status })
          }
          isPending={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
}
