import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ArrowLeftRight, UserX, BookOpen, Calendar, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { userService, bookingService } from "@/lib/api";
import { toast } from "sonner";
import type { User } from "@/lib/types";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  confirmed: "bg-success text-success-foreground",
  active: "bg-primary text-primary-foreground",
  completed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

function CustomerBookingsDialog({
  user,
  open,
  onClose,
}: {
  user: User;
  open: boolean;
  onClose: () => void;
}) {
  const { data: allBookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => bookingService.list(),
    enabled: open,
  });

  const bookings = allBookings.filter(
    (b) =>
      b.customerName?.toLowerCase() === user.name.toLowerCase() ||
      b.customerEmail?.toLowerCase() === user.email.toLowerCase(),
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Booking History
          </DialogTitle>
          <DialogDescription>
            All rental bookings for {user.name} ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {user.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Badge className="ml-auto capitalize" variant="secondary">
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="mt-2 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))
          ) : bookings.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p className="text-sm">No bookings found for this customer.</p>
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="flex items-start gap-3 rounded-xl border border-border p-4"
              >
                <img
                  src={b.vehicleImage}
                  alt=""
                  className="h-14 w-20 shrink-0 rounded-lg object-cover border border-border"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-display font-semibold text-sm">{b.vehicleName}</p>
                    <Badge
                      className={`capitalize text-[10px] px-2 py-0.5 ${STATUS_COLORS[b.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {b.status}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {b.startDate} → {b.endDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {b.pickupLocation}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">Ref #{b.id}</span>
                    <span className="font-display font-bold text-sm">${b.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminUsers() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({ queryKey: ["users"], queryFn: () => userService.list() });

  const [q, setQ] = useState("");
  const [bookingHistoryUser, setBookingHistoryUser] = useState<User | null>(null);

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "user" | "admin" }) =>
      userService.updateRole(id, role),
    onSuccess: (updated) => {
      toast.success(`Access permissions for ${updated.name} updated to ${updated.role.toUpperCase()}`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      toast.error("Failed to update user permissions.");
    },
  });

  const banMutation = useMutation({
    mutationFn: ({ id, isBlocked }: { id: string; isBlocked: boolean }) =>
      userService.blockUser(id, isBlocked),
    onSuccess: (updated) => {
      toast.success(
        updated.isBlocked
          ? `${updated.name}'s account has been suspended.`
          : `${updated.name}'s account has been reinstated.`,
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      toast.error("Failed to update account status.");
    },
  });

  const filtered = users.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()),
  );

  const getKycBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success text-success-foreground border-success/20";
      case "pending":
        return "bg-warning text-warning-foreground border-warning/20 animate-pulse";
      case "rejected":
        return "bg-destructive text-destructive-foreground border-destructive/20";
      case "not_started":
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-muted-foreground">
            Manage accounts, verify customer licenses and update role permissions.
          </p>
        </div>
        <div className="relative w-full max-w-xs sm:w-auto">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-8 h-8 text-xs w-full sm:w-64"
          />
        </div>
      </div>

      <Card className="mt-8 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Contact Phone</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-10 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No matching user accounts registered.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                          {u.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{u.id.toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm font-mono">{u.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`capitalize rounded-full text-[10px] ${getKycBadgeColor(u.kycStatus)}`}
                    >
                      {u.kycStatus.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.role === "admin" ? "default" : "secondary"}
                      className="capitalize rounded"
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs cursor-pointer"
                        onClick={() => setBookingHistoryUser(u)}
                        title="View booking history"
                      >
                        <BookOpen className="h-3.5 w-3.5 mr-1" /> Bookings
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs cursor-pointer shadow-soft"
                        onClick={() =>
                          roleMutation.mutate({ id: u.id, role: u.role === "admin" ? "user" : "admin" })
                        }
                        disabled={roleMutation.isPending}
                        title="Toggle customer role"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5 mr-1" /> Toggle Role
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-destructive/10 text-destructive border-destructive/20 h-8 cursor-pointer"
                        onClick={() => banMutation.mutate({ id: u.id, isBlocked: !u.isBlocked })}
                        disabled={banMutation.isPending}
                        title={u.isBlocked ? "Reinstate account" : "Suspend account"}
                      >
                        <UserX className="h-3.5 w-3.5 mr-1" /> {u.isBlocked ? "Unsuspend" : "Suspend"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {bookingHistoryUser && (
        <CustomerBookingsDialog
          user={bookingHistoryUser}
          open={bookingHistoryUser !== null}
          onClose={() => setBookingHistoryUser(null)}
        />
      )}
    </div>
  );
}
