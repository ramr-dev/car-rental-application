import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, ShieldAlert, MapPin, Calendar, Receipt, Ban, CreditCard, CheckCircle2, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/EmptyState";
import { bookingService, reviewService } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/store/auth";
import type { Booking } from "@/lib/types";

export const Route = createFileRoute("/dashboard/bookings")({ component: BookingsPage });

function BookingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: allBookings = [], isLoading } = useQuery({ queryKey: ["bookings"], queryFn: () => bookingService.list() });

  // Show only bookings that belong to the currently logged-in user.
  // Match by userId (new bookings) or customerEmail (legacy mock data).
  const bookings = allBookings.filter(
    (b) => b.userId === user?.id || b.customerEmail === user?.email,
  );

  const tabs = ["all", "confirmed", "pending", "completed", "cancelled"] as const;

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingService.cancel(id),
    onSuccess: (updated) => {
      toast.success(`Booking ${updated.id} successfully cancelled`);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      if (selectedBooking?.id === updated.id) {
        setSelectedBooking(updated);
      }
    },
    onError: () => {
      toast.error("Failed to cancel booking. Please try again.");
    }
  });

  const submitReviewMutation = useMutation({
    mutationFn: () => {
      if (!reviewingBooking) throw new Error("No booking selected");
      return reviewService.submitReview(reviewingBooking.id, reviewRating, reviewComment);
    },
    onSuccess: () => {
      toast.success("Thank you for your feedback! Your review has been submitted.");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setReviewingBooking(null);
      setReviewRating(5);
      setReviewComment("");
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.error || "Failed to submit review. Please try again.";
      toast.error(errMsg);
    }
  });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">My Bookings</h1>
      <p className="mt-1 text-muted-foreground">Manage all your rentals in one place.</p>

      <Tabs defaultValue="all" className="mt-8">
        <TabsList>{tabs.map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}</TabsList>
        {tabs.map((t) => {
          const filtered = t === "all" ? bookings : bookings.filter((b) => b.status === t);
          return (
            <TabsContent key={t} value={t} className="mt-6">
              {isLoading ? (
                <SkeletonList />
              ) : filtered.length === 0 ? (
                <EmptyState title="No bookings yet" description="When you book a vehicle it'll show up here." icon={CalendarRange} />
              ) : (
                <div className="space-y-3">
                  {filtered.map((b) => (
                    <BookingRow 
                      key={b.id} 
                      b={b} 
                      onViewDetails={() => setSelectedBooking(b)} 
                      onCancel={() => cancelMutation.mutate(b.id)}
                      isCancelling={cancelMutation.isPending && cancelMutation.variables === b.id}
                      onWriteReview={() => setReviewingBooking(b)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Booking Details Modal Dialog */}
      <Dialog open={selectedBooking !== null} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        {selectedBooking && (
          <DialogContent className="max-w-xl sm:rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold flex items-center justify-between pr-6">
                <span>Booking details</span>
                <Badge variant={selectedBooking.status === "confirmed" ? "default" : selectedBooking.status === "completed" ? "secondary" : "outline"} className="capitalize">
                  {selectedBooking.status}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs font-mono">Reference Ref #{selectedBooking.id}</DialogDescription>
            </DialogHeader>

            <div className="mt-2 space-y-5 overflow-y-auto max-h-[60vh] pr-1">
              {/* Timeline Status */}
              <div className="rounded-xl bg-muted/40 p-4 border border-border/60">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Trip Progress</p>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-success-foreground text-xs font-bold">✓</div>
                  </div>
                  <div className="h-px flex-1 bg-success" />
                  <div className="flex flex-col items-center">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${selectedBooking.status !== "cancelled" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {selectedBooking.status === "completed" ? "✓" : "2"}
                    </div>
                  </div>
                  <div className={`h-px flex-1 ${selectedBooking.status === "completed" ? "bg-success" : "bg-border"}`} />
                  <div className="flex flex-col items-center">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${selectedBooking.status === "completed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>3</div>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-medium px-1">
                  <span>Reserved</span>
                  <span>Ready for Pickup</span>
                  <span>Completed</span>
                </div>
              </div>

              {/* KYC status Alert */}
              {user?.kycStatus !== "approved" && selectedBooking.status === "confirmed" && (
                <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm flex gap-3 text-warning-foreground items-start">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
                  <div>
                    <p className="font-semibold text-xs">KYC Verification Required</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Please upload your documents in the KYC Verification page to ensure seamless pickup.</p>
                  </div>
                </div>
              )}

              {/* Vehicle & Date breakdown */}
              <div className="flex items-start gap-4">
                <img src={selectedBooking.vehicleImage} alt="" className="h-20 w-28 rounded-lg object-cover border border-border" />
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-base leading-tight">{selectedBooking.vehicleName}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {selectedBooking.startDate.replace("T", " ")} → {selectedBooking.endDate.replace("T", " ")}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {selectedBooking.pickupLocation} → {selectedBooking.dropoffLocation}</p>
                </div>
              </div>

              {/* Checkin QR Code Placeholder */}
              {selectedBooking.status === "confirmed" && (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-44 bg-white border border-border flex items-center justify-center rounded shadow-soft mb-2 p-1 overflow-hidden">
                    <div className="flex gap-0.5 items-end h-full w-full justify-center">
                      <div className="h-full w-1 bg-foreground" />
                      <div className="h-full w-0.5 bg-foreground" />
                      <div className="h-full w-1.5 bg-foreground" />
                      <div className="h-full w-0.5 bg-foreground" />
                      <div className="h-full w-1 bg-foreground" />
                      <div className="h-full w-2 bg-foreground" />
                      <div className="h-full w-0.5 bg-foreground" />
                      <div className="h-full w-1.5 bg-foreground" />
                      <div className="h-full w-1 bg-foreground" />
                      <div className="h-full w-0.5 bg-foreground" />
                      <div className="h-full w-1.5 bg-foreground" />
                      <div className="h-full w-2 bg-foreground" />
                      <div className="h-full w-0.5 bg-foreground" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold">Pickup Boarding Pass</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Scan this barcode at DriveLux desk for express pickup key collection.</p>
                </div>
              )}

              {/* Payment Status */}
              {selectedBooking.paymentStatus && (
                <div className={`rounded-xl border p-3 flex items-center gap-3 text-sm ${selectedBooking.paymentStatus === "paid" ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
                  {selectedBooking.paymentStatus === "paid"
                    ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    : <CreditCard className="h-4 w-4 text-warning shrink-0" />
                  }
                  <div>
                    <p className="font-medium text-xs capitalize">{selectedBooking.paymentStatus === "paid" ? "Payment Verified" : "Payment Pending"}</p>
                    {selectedBooking.paidAt && (
                      <p className="text-[10px] text-muted-foreground">Paid on {new Date(selectedBooking.paidAt).toLocaleString()}</p>
                    )}
                  </div>
                  <span className="ml-auto font-display font-bold">${selectedBooking.totalPrice.toLocaleString()}</span>
                </div>
              )}

              {/* Financial Summary */}
              <div className="rounded-xl border border-border p-4 bg-muted/10 space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5" /> Price breakdown</p>
                <div className="space-y-1.5 text-xs">
                  {selectedBooking.subtotal != null
                    ? <>
                        <div className="flex justify-between"><span className="text-muted-foreground">Rental subtotal</span><span className="font-medium">${selectedBooking.subtotal?.toLocaleString()}</span></div>
                        {selectedBooking.serviceFee != null && <div className="flex justify-between"><span className="text-muted-foreground">Service fee (12%)</span><span className="font-medium">${selectedBooking.serviceFee?.toLocaleString()}</span></div>}
                        {selectedBooking.taxAmount != null && <div className="flex justify-between"><span className="text-muted-foreground">Tax (8.5%)</span><span className="font-medium">${selectedBooking.taxAmount?.toLocaleString()}</span></div>}
                      </>
                    : <div className="flex justify-between"><span className="text-muted-foreground">Rental cost</span><span className="font-medium">${selectedBooking.totalPrice - 50}</span></div>
                  }
                  <div className="flex justify-between border-t border-border pt-2 font-semibold text-sm"><span>Total Charged</span><span>${selectedBooking.totalPrice.toLocaleString()}</span></div>
                </div>
                <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/40">A refundable $500 security deposit hold is processed at time of pickup.</p>
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2 flex-col sm:flex-row">
              <Button variant="outline" onClick={() => setSelectedBooking(null)}>Close details</Button>
              {selectedBooking.status === "completed" && !selectedBooking.isReviewed && (
                <Button onClick={() => { setSelectedBooking(null); setReviewingBooking(selectedBooking); }}>
                  Write a Review
                </Button>
              )}
              {selectedBooking.status === "confirmed" && (
                <Button 
                  variant="destructive"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate(selectedBooking.id)}
                >
                  <Ban className="mr-2 h-4 w-4" /> Cancel reservation
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Review Dialog Modal */}
      <Dialog open={reviewingBooking !== null} onOpenChange={(open) => !open && setReviewingBooking(null)}>
        {reviewingBooking && (
          <DialogContent className="max-w-md sm:rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Write a Review</DialogTitle>
              <DialogDescription>
                Share your experience driving the {reviewingBooking.vehicleName}. Your review helps others make better choices!
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <span className="text-sm font-medium text-muted-foreground">Tap stars to rate</span>
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewRating(i + 1)}
                      className="text-muted-foreground hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                      aria-label={`Rate ${i + 1} stars`}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          i < reviewRating ? "fill-warning text-warning" : "text-muted"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="review-comment">Review comment (optional)</Label>
                <Textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What did you like or dislike about the car? How was the service?"
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={() => setReviewingBooking(null)}>Cancel</Button>
              <Button
                disabled={submitReviewMutation.isPending}
                onClick={() => submitReviewMutation.mutate()}
              >
                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function BookingRow({ 
  b, 
  onViewDetails, 
  onCancel, 
  isCancelling,
  onWriteReview
}: { 
  b: Booking; 
  onViewDetails: () => void; 
  onCancel: () => void; 
  isCancelling: boolean;
  onWriteReview: () => void;
}) {
  return (
    <Card className="grid gap-4 p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
      <img src={b.vehicleImage} alt="" className="h-24 w-full rounded-lg object-cover sm:w-30" />
      <div>
        <div className="flex items-center gap-2">
          <p className="font-display font-semibold">{b.vehicleName}</p>
          <Badge variant={b.status === "confirmed" ? "default" : b.status === "completed" ? "secondary" : "outline"} className="capitalize">{b.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{b.startDate.replace("T", " ")} → {b.endDate.replace("T", " ")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{b.pickupLocation} → {b.dropoffLocation}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Ref #{b.id}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="font-display text-lg font-bold">${b.totalPrice}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onViewDetails}>Details</Button>
          {b.status === "completed" && !b.isReviewed && (
            <Button size="sm" onClick={onWriteReview}>Write Review</Button>
          )}
          {b.status === "confirmed" && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-destructive hover:bg-destructive/10" 
              onClick={onCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
    </div>
  );
}
