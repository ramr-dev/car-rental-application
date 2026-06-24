import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Check, X, FileText, Eye, Search, Landmark, CreditCard,
  Loader2, AlertCircle, ShieldCheck, UserCheck, CalendarClock,
  Car, FileCheck, DollarSign
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { hostService } from "@/lib/api/host.service";
import { userService } from "@/lib/api/user.service";

export const Route = createFileRoute("/admin/hosts")({
  component: AdminHostsPage,
});

function AdminHostsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profiles");

  // Selection states
  const [selectedHost, setSelectedHost] = useState<any | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);

  // Modal open states
  const [showHostModal, setShowHostModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Review states
  const [rejectionReason, setRejectionReason] = useState("");
  const [showHostRejectForm, setShowHostRejectForm] = useState(false);
  const [payoutRefNum, setPayoutRefNum] = useState("");

  // Queries
  const { data: pendingHosts = [], isLoading: loadingHosts } = useQuery({
    queryKey: ["admin-pending-hosts"],
    queryFn: () => hostService.listPendingHosts(),
  });

  const { data: pendingVehicles = [], isLoading: loadingVehicles } = useQuery({
    queryKey: ["admin-pending-vehicles"],
    queryFn: () => hostService.listPendingVehicles(),
  });

  const { data: pendingPayouts = [], isLoading: loadingPayouts } = useQuery({
    queryKey: ["admin-pending-payouts"],
    queryFn: () => hostService.listPendingPayouts(),
  });

  const { data: verifiedHosts = [], isLoading: loadingVerified } = useQuery({
    queryKey: ["admin-verified-hosts"],
    queryFn: () => userService.list({ role: "HOST" }),
  });

  // Mutations
  const verifyHostMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: 'VERIFIED' | 'REJECTED' }) =>
      hostService.verifyHost(userId, status),
    onSuccess: (data, variables) => {
      toast.success(`Host application ${variables.status.toLowerCase()} successfully.`);
      queryClient.invalidateQueries({ queryKey: ["admin-pending-hosts"] });
      setShowHostModal(false);
      setShowHostRejectForm(false);
      setSelectedHost(null);
      setRejectionReason("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? "Failed to verify host.";
      toast.error(msg);
    }
  });

  const approveVehicleMutation = useMutation({
    mutationFn: ({ vehicleId, approve }: { vehicleId: number; approve: boolean }) =>
      hostService.approveVehicle(vehicleId, approve),
    onSuccess: (data, variables) => {
      toast.success(`Vehicle listing ${variables.approve ? 'approved' : 'rejected'} successfully.`);
      queryClient.invalidateQueries({ queryKey: ["admin-pending-vehicles"] });
      setShowVehicleModal(false);
      setSelectedVehicle(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? "Failed to verify vehicle.";
      toast.error(msg);
    }
  });

  const processPayoutMutation = useMutation({
    mutationFn: ({ hostId, referenceNum }: { hostId: number; referenceNum?: string }) =>
      hostService.processPayout(hostId, referenceNum),
    onSuccess: () => {
      toast.success("Payout marked as PAID successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-payouts"] });
      setShowPayoutModal(false);
      setSelectedPayout(null);
      setPayoutRefNum("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? "Failed to process payout.";
      toast.error(msg);
    }
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Host Approvals Desk</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verify host KYC documents, audit newly listed vehicles, and process payout releases.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border w-full justify-start p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="profiles" className="flex items-center gap-2 py-2 px-3">
            <UserCheck className="h-4 w-4" /> Pending Hosts ({pendingHosts.length})
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2 py-2 px-3">
            <Car className="h-4 w-4" /> Vehicle Audits ({pendingVehicles.length})
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2 py-2 px-3">
            <DollarSign className="h-4 w-4" /> Payout releases ({pendingPayouts.length})
          </TabsTrigger>
          <TabsTrigger value="verified" className="flex items-center gap-2 py-2 px-3">
            <ShieldCheck className="h-4 w-4" /> Verified Hosts ({verifiedHosts.length})
          </TabsTrigger>
        </TabsList>

        {/* PENDING HOST PROFILES TAB */}
        <TabsContent value="profiles">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold font-display">Pending Host Approvals Queue</CardTitle>
              <CardDescription>Review tax records (PAN Card) and Aadhaar identity document uploads.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHosts ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading submissions...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>PAN Number</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingHosts.map((h: any) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-semibold">{h.name}</TableCell>
                          <TableCell className="text-xs">{h.email}</TableCell>
                          <TableCell className="text-xs">{h.phone ?? "—"}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold uppercase">{h.hostProfile?.panNumber ?? "—"}</TableCell>
                          <TableCell className="text-xs">
                            {new Date(h.createdAt).toLocaleDateString([], { dateStyle: "short" })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                              setSelectedHost(h);
                              setShowHostModal(true);
                            }}>
                              <Eye className="h-3.5 w-3.5 mr-1" /> View KYC Files
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {pendingHosts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground italic">
                            No pending host profiles to verify.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* VEHICLE AUDITS TAB */}
        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold font-display">Pending Vehicle Listing Audits</CardTitle>
              <CardDescription>Verify registration plate numbers, RC documents and insurance coverage.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVehicles ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading vehicle audits...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle Name</TableHead>
                        <TableHead>Host Owner</TableHead>
                        <TableHead>Daily Rate</TableHead>
                        <TableHead>Plate Number</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingVehicles.map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-semibold">{v.brand} {v.model} ({v.year})</TableCell>
                          <TableCell className="text-xs">
                            {v.host?.name}
                            <br />
                            <span className="text-[10px] text-muted-foreground">{v.host?.email}</span>
                          </TableCell>
                          <TableCell className="font-medium text-primary">₹{v.pricePerDay} / day</TableCell>
                          <TableCell className="font-mono text-xs font-semibold uppercase">{v.registrationNumber ?? "—"}</TableCell>
                          <TableCell className="text-xs">{v.location}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                              setSelectedVehicle(v);
                              setShowVehicleModal(true);
                            }}>
                              <Eye className="h-3.5 w-3.5 mr-1" /> Audit Files
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {pendingVehicles.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground italic">
                            No vehicles awaiting audit.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYOUTS RELEASE TAB */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold font-display">Accrued Weekly Host Earnings</CardTitle>
              <CardDescription>Process direct bank payouts for hosts with completed P2P trips.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayouts ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading earnings ledgers...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Host Name</TableHead>
                        <TableHead>Bank Route details</TableHead>
                        <TableHead>Completed Trips</TableHead>
                        <TableHead>Net Amount Due</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayouts.map((p: any) => (
                        <TableRow key={p.hostId}>
                          <TableCell className="font-semibold">
                            {p.hostName}
                            <br />
                            <span className="text-[10px] text-muted-foreground">{p.hostEmail}</span>
                          </TableCell>
                          <TableCell className="text-xs space-y-0.5">
                            <div className="flex items-center gap-1"><Landmark className="h-3 w-3 shrink-0 text-muted-foreground" /> {p.bankName}</div>
                            <div>A/C: <span className="font-mono">{p.bankAccountNum}</span></div>
                            <div>IFSC: <span className="font-mono uppercase">{p.bankIfsc}</span></div>
                          </TableCell>
                          <TableCell className="text-xs font-semibold">{p.earningsIds?.length} bookings</TableCell>
                          <TableCell className="font-bold text-emerald-600">₹{p.amountToPay.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
                              setSelectedPayout(p);
                              setShowPayoutModal(true);
                            }}>
                              <CreditCard className="h-3.5 w-3.5 mr-1" /> Mark Paid
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {pendingPayouts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground italic">
                            No accrued unpaid host earnings.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* VERIFIED HOSTS LIST TAB */}
        <TabsContent value="verified">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold font-display">Verified Hosts Registry</CardTitle>
              <CardDescription>View all approved hosts and their payout bank details.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVerified ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading host registry...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Host Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>PAN Number</TableHead>
                        <TableHead>Bank Details</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verifiedHosts.map((h: any) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-semibold">{h.name}</TableCell>
                          <TableCell className="text-xs">{h.email}</TableCell>
                          <TableCell className="text-xs">{h.phone ?? "—"}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold uppercase">{h.hostProfile?.panNumber ?? "—"}</TableCell>
                          <TableCell className="text-xs space-y-0.5">
                            {h.hostProfile ? (
                              <>
                                <div className="flex items-center gap-1 font-semibold"><Landmark className="h-3 w-3 text-muted-foreground" /> {h.hostProfile.bankName}</div>
                                <div>A/C: <span className="font-mono">{h.hostProfile.bankAccountNum}</span></div>
                                <div>IFSC: <span className="font-mono uppercase">{h.hostProfile.bankIfsc}</span></div>
                              </>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                              setSelectedHost(h);
                              setShowHostModal(true);
                            }}>
                              <Eye className="h-3.5 w-3.5 mr-1" /> View Profile Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {verifiedHosts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground italic">
                            No verified hosts registered on the platform yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* HOST PROFILE VERIFICATION DIALOG */}
      <Dialog open={showHostModal} onOpenChange={setShowHostModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Review Host Identity files</DialogTitle>
            <DialogDescription>
              Validate owner tax PAN entries, Aadhaar identity cards, and bank details.
            </DialogDescription>
          </DialogHeader>

          {selectedHost && (
            <div className="space-y-6 py-4">
              
              <div className="grid gap-4 sm:grid-cols-2 text-xs border-b pb-4">
                <div>
                  <span className="text-muted-foreground font-medium">Owner Full Name:</span>
                  <p className="font-bold text-sm mt-0.5">{selectedHost.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Email / Contact:</span>
                  <p className="font-semibold text-sm mt-0.5">{selectedHost.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">PAN Card Number:</span>
                  <p className="font-mono font-bold text-sm text-primary uppercase mt-0.5">{selectedHost.hostProfile?.panNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Bank Routing:</span>
                  <p className="font-medium text-xs mt-0.5">
                    {selectedHost.hostProfile?.bankName} (A/C: {selectedHost.hostProfile?.bankAccountNum})
                    <br />
                    IFSC: <span className="font-mono uppercase">{selectedHost.hostProfile?.bankIfsc}</span>
                  </p>
                </div>
              </div>

              {/* Aadhaar Documents Display */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Aadhaar Front View:</span>
                  <div className="rounded-xl border overflow-hidden bg-muted/20 h-48 flex items-center justify-center">
                    <img
                      src={selectedHost.hostProfile?.aadhaarFrontUrl}
                      alt="Aadhaar Front"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Aadhaar Back View:</span>
                  <div className="rounded-xl border overflow-hidden bg-muted/20 h-48 flex items-center justify-center">
                    <img
                      src={selectedHost.hostProfile?.aadhaarBackUrl}
                      alt="Aadhaar Back"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Rejection Note form block */}
              {showHostRejectForm && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3">
                  <Label htmlFor="reviewNote" className="text-destructive font-semibold text-xs">Specify Rejection Reason (sent to Host):</Label>
                  <Textarea
                    id="reviewNote"
                    placeholder="e.g. Blurry photo copy uploaded / Bank IFSC code is incorrect..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}

            </div>
          )}

          <DialogFooter className="flex flex-wrap gap-2">
            {!showHostRejectForm ? (
              <>
                <Button variant="ghost" onClick={() => setShowHostModal(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => setShowHostRejectForm(true)}>Reject KYC</Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={verifyHostMutation.isPending}
                  onClick={() => verifyHostMutation.mutate({ userId: selectedHost.id, status: 'VERIFIED' })}
                >
                  {verifyHostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />} Approve Host
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setShowHostRejectForm(false)}>Back</Button>
                <Button
                  variant="destructive"
                  disabled={verifyHostMutation.isPending || !rejectionReason.trim()}
                  onClick={() => verifyHostMutation.mutate({ userId: selectedHost.id, status: 'REJECTED' })}
                >
                  {verifyHostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <X className="h-4 w-4 mr-1" />} Confirm Rejection
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VEHICLE AUDIT DIALOG */}
      <Dialog open={showVehicleModal} onOpenChange={setShowVehicleModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Audit Vehicle Documents</DialogTitle>
            <DialogDescription>
              Validate vehicle registration information and verify legal ownership.
            </DialogDescription>
          </DialogHeader>

          {selectedVehicle && (
            <div className="space-y-6 py-4">
              
              <div className="grid gap-4 sm:grid-cols-2 text-xs border-b pb-4">
                <div>
                  <span className="text-muted-foreground font-medium">Vehicle Name:</span>
                  <p className="font-bold text-sm mt-0.5">{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Owner Host:</span>
                  <p className="font-semibold text-sm mt-0.5">{selectedVehicle.host?.name} ({selectedVehicle.host?.email})</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Registration Number:</span>
                  <p className="font-mono font-bold text-sm text-primary uppercase mt-0.5">{selectedVehicle.registrationNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Price rate / location:</span>
                  <p className="font-semibold text-sm mt-0.5">₹{selectedVehicle.pricePerDay}/day · {selectedVehicle.location}</p>
                </div>
              </div>

              {/* Main Photo & RC & Insurance display */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Vehicle main photo:</span>
                  <div className="rounded-xl border overflow-hidden bg-muted/20 h-40 flex items-center justify-center">
                    <img
                      src={selectedVehicle.image}
                      alt="Car Main"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">RC Certificate document:</span>
                  <div className="rounded-xl border overflow-hidden bg-muted/20 h-40 flex items-center justify-center">
                    <img
                      src={selectedVehicle.rcUrl}
                      alt="RC document"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Insurance copy:</span>
                  <div className="rounded-xl border overflow-hidden bg-muted/20 h-40 flex items-center justify-center">
                    <img
                      src={selectedVehicle.insuranceUrl}
                      alt="Insurance Policy"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          <DialogFooter className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setShowVehicleModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => approveVehicleMutation.mutate({ vehicleId: selectedVehicle.id, approve: false })}>
              Reject Listing
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={approveVehicleMutation.isPending}
              onClick={() => approveVehicleMutation.mutate({ vehicleId: selectedVehicle.id, approve: true })}
            >
              {approveVehicleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />} Approve & List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PROCESS PAYOUT DIALOG */}
      <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Process Payout Release</DialogTitle>
            <DialogDescription>
              Mark accrued earnings as paid after completing a bank wire transfer.
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4 py-3">
              <div className="p-4 rounded-xl border bg-emerald-500/5 text-xs space-y-2">
                <div className="flex justify-between font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  <span>Transfer Amount:</span>
                  <span>₹{selectedPayout.amountToPay.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 mt-1 space-y-1 text-muted-foreground">
                  <div className="flex justify-between"><span>Host Owner:</span><span className="font-semibold text-foreground">{selectedPayout.hostName}</span></div>
                  <div className="flex justify-between"><span>Bank Name:</span><span className="font-semibold text-foreground">{selectedPayout.bankName}</span></div>
                  <div className="flex justify-between"><span>Account Number:</span><span className="font-mono font-semibold text-foreground">{selectedPayout.bankAccountNum}</span></div>
                  <div className="flex justify-between"><span>IFSC Code:</span><span className="font-mono font-semibold text-foreground uppercase">{selectedPayout.bankIfsc}</span></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ref">Bank Transfer Transaction Reference ID (optional)</Label>
                <Input
                  id="ref"
                  placeholder="e.g. TXN1002345892"
                  value={payoutRefNum}
                  onChange={(e) => setPayoutRefNum(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutModal(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={processPayoutMutation.isPending}
              onClick={() => processPayoutMutation.mutate({ hostId: selectedPayout.hostId, referenceNum: payoutRefNum.trim() || undefined })}
            >
              {processPayoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileCheck className="h-4 w-4 mr-1" />} Confirm Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
