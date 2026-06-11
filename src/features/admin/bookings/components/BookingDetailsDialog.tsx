import {
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  Play,
  RefreshCw,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Booking, BookingStatus } from "@/lib/types/booking.types";
import { formatRentalDuration } from "@/utils/formatters";

const STATUS_BADGE: Record<BookingStatus, string> = {
  pending: "bg-warning text-warning-foreground border-warning/30",
  confirmed: "bg-success text-success-foreground border-success/30",
  active: "bg-primary text-primary-foreground border-primary/30",
  completed: "bg-secondary text-secondary-foreground border-border",
  cancelled: "bg-destructive text-destructive-foreground border-destructive/30",
};

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

interface Props {
  booking: Booking;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
  isPending: boolean;
}

export function BookingDetailsDialog({ booking, open, onClose, onStatusChange, isPending }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Booking #{booking.id}
          </DialogTitle>
          <DialogDescription>
            Full booking details and customer information.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Badge className={`capitalize border px-3 py-1 ${STATUS_BADGE[booking.status]}`}>
            {booking.status}
          </Badge>
          <span className="text-xs text-muted-foreground">Created {booking.createdAt}</span>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border p-4">
          <img
            src={booking.vehicleImage}
            alt={booking.vehicleName}
            className="h-16 w-24 rounded-lg object-cover"
          />
          <div>
            <p className="font-display font-semibold">{booking.vehicleName}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Vehicle ID: {booking.vehicleId}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-display text-2xl font-bold">${booking.totalPrice.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total charge</p>
          </div>
        </div>

        <div>
          <h4 className="mb-3 font-semibold">Trip Details</h4>
          <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
            <DetailItem icon={<Calendar className="h-4 w-4" />} label="Pickup Date" value={booking.startDate} />
            <DetailItem icon={<Calendar className="h-4 w-4" />} label="Return Date" value={booking.endDate} />
            <DetailItem icon={<MapPin className="h-4 w-4" />} label="Pickup Location" value={booking.pickupLocation} />
            <DetailItem icon={<MapPin className="h-4 w-4" />} label="Drop-off Location" value={booking.dropoffLocation} />
            {booking.rentalDays && (
              <DetailItem
                icon={<Clock className="h-4 w-4" />}
                label="Duration"
                value={formatRentalDuration(booking.rentalDays)}
              />
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-3 font-semibold">Customer Information</h4>
          <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
            <DetailItem icon={<User className="h-4 w-4" />} label="Full Name" value={booking.customerName ?? "Not provided"} />
            <DetailItem icon={<Mail className="h-4 w-4" />} label="Email" value={booking.customerEmail ?? "Not provided"} />
            <DetailItem icon={<Phone className="h-4 w-4" />} label="Phone" value={booking.customerPhone ?? "Not provided"} />
            <DetailItem icon={<FileText className="h-4 w-4" />} label="License Number" value={booking.licenseNumber ?? "Not provided"} />
            {booking.licenseExpiry && (
              <DetailItem icon={<Calendar className="h-4 w-4" />} label="License Expiry" value={booking.licenseExpiry} />
            )}
            {booking.licenseCountry && (
              <DetailItem icon={<MapPin className="h-4 w-4" />} label="Issuing Country" value={booking.licenseCountry} />
            )}
          </div>
        </div>

        {booking.notes && (
          <div>
            <h4 className="mb-2 font-semibold">Customer Notes</h4>
            <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{booking.notes}</p>
          </div>
        )}

        {/* Payment Information */}
        <div>
          <h4 className="mb-3 font-semibold">Payment Information</h4>
          <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
            <DetailItem
              icon={<CreditCard className="h-4 w-4" />}
              label="Payment Status"
              value={booking.paymentStatus ? booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1) : "N/A"}
            />
            {booking.paidAt && (
              <DetailItem
                icon={<Calendar className="h-4 w-4" />}
                label="Paid At"
                value={new Date(booking.paidAt).toLocaleString()}
              />
            )}
            {booking.stripePaymentIntentId && (
              <DetailItem
                icon={<CreditCard className="h-4 w-4" />}
                label="Payment Intent"
                value={booking.stripePaymentIntentId}
              />
            )}
            {booking.stripeSessionId && (
              <DetailItem
                icon={<CreditCard className="h-4 w-4" />}
                label="Stripe Session"
                value={booking.stripeSessionId.slice(0, 30) + "…"}
              />
            )}
          </div>
        </div>

        {(booking.subtotal || booking.serviceFee || booking.taxAmount) && (
          <div>
            <h4 className="mb-3 font-semibold">Price Breakdown</h4>
            <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
              {booking.subtotal && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rental subtotal</span>
                  <span>${booking.subtotal.toLocaleString()}</span>
                </div>
              )}
              {booking.serviceFee && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service fee (12%)</span>
                  <span>${booking.serviceFee.toLocaleString()}</span>
                </div>
              )}
              {booking.taxAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8.5%)</span>
                  <span>${booking.taxAmount.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-display font-bold">
                <span>Total charged</span>
                <span>${booking.totalPrice.toLocaleString()}</span>
              </div>
              {booking.depositAmount && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Security deposit (refundable — at pickup)</span>
                  <span>${booking.depositAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {booking.status === "pending" && (
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
              disabled={isPending}
              onClick={() => { onStatusChange(booking.id, "cancelled"); onClose(); }}
            >
              <X className="mr-2 h-4 w-4" /> Reject Request
            </Button>
            <Button
              className="flex-1 bg-success text-success-foreground hover:bg-success/90 shadow-soft"
              disabled={isPending}
              onClick={() => { onStatusChange(booking.id, "confirmed"); onClose(); }}
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Approve & Confirm
            </Button>
          </div>
        )}
        {booking.status === "confirmed" && (
          <Button
            className="w-full"
            disabled={isPending}
            onClick={() => { onStatusChange(booking.id, "active"); onClose(); }}
          >
            <Play className="mr-2 h-4 w-4 fill-current" /> Mark as In Progress
          </Button>
        )}
        {booking.status === "active" && (
          <Button
            variant="outline"
            className="w-full border-success/30 text-success hover:bg-success/10"
            disabled={isPending}
            onClick={() => { onStatusChange(booking.id, "completed"); onClose(); }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Mark as Completed
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
