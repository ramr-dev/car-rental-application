import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check, X, FileText, Eye, Search, Download,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { userService } from "@/lib/api";
import type { KycDocument } from "@/lib/types";

export const Route = createFileRoute("/admin/kyc")({ component: AdminKyc });

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") ?? "";

function AdminKyc() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["kyc-docs", debouncedSearch],
    queryFn: () => userService.listKyc({ search: debouncedSearch || undefined }),
  });

  const kycMutation = useMutation({
    mutationFn: ({ id, status, reviewNote }: { id: number; status: "approved" | "rejected"; reviewNote?: string }) =>
      userService.reviewKyc(id, status, reviewNote),
    onSuccess: (_updated, variables) => {
      toast.success(`KYC submission ${variables.status} successfully.`);
      queryClient.invalidateQueries({ queryKey: ["kyc-docs"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelectedDoc(null);
      setRejectionReason("");
      setShowRejectConfirm(false);
    },
    onError: () => {
      toast.error("Failed to update verification status. Please try again.");
    },
  });

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => setDebouncedSearch(value), 400);
    setSearchTimer(t);
  }

  function openRejectFlow(doc: KycDocument) {
    setSelectedDoc(doc);
    setRejectionReason("");
    setShowRejectConfirm(true);
  }

  function confirmReject() {
    if (!selectedDoc) return;
    kycMutation.mutate({
      id:         selectedDoc.id,
      status:     "rejected",
      reviewNote: rejectionReason.trim() || undefined,
    });
  }

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-success text-success-foreground shadow-glow";
      case "rejected": return "bg-destructive text-destructive-foreground";
      case "pending":  return "bg-warning text-warning-foreground animate-pulse";
      default:         return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">KYC Approvals</h1>
        <p className="mt-1 text-muted-foreground">Review, audit and verify customer identity document submissions.</p>
      </div>

      {/* Search */}
      <div className="mt-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <Tabs defaultValue="pending" className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">Pending review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All customers</TabsTrigger>
        </TabsList>

        {(["pending", "approved", "rejected", "all"] as const).map((tab) => {
          const filtered = tab === "all" ? docs : docs.filter((d) => d.status === tab);

          return (
            <TabsContent key={tab} value={tab} className="mt-6">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Doc Type</TableHead>
                      <TableHead>Doc Number</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <div className="h-10 animate-pulse rounded bg-muted" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          No identity submissions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                                  {r.userName.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm">{r.userName}</p>
                                <p className="text-xs text-muted-foreground">{r.userEmail}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-mono">{r.documentType.replace(/_/g, " ")}</TableCell>
                          <TableCell className="text-sm">{r.documentNumber}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(r.submittedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={`capitalize rounded-full ${getBadgeColor(r.status)}`}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => { setSelectedDoc(r); setShowRejectConfirm(false); }}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" /> Audit
                              </Button>
                              {r.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="hover:bg-destructive/10 text-destructive border-destructive/20 cursor-pointer"
                                    onClick={() => openRejectFlow(r)}
                                    disabled={kycMutation.isPending}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-success hover:bg-success/90 text-success-foreground cursor-pointer shadow-soft"
                                    onClick={() => kycMutation.mutate({ id: r.id, status: "approved" })}
                                    disabled={kycMutation.isPending}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Audit dialog */}
      <Dialog
        open={selectedDoc !== null && !showRejectConfirm}
        onOpenChange={(open) => { if (!open) setSelectedDoc(null); }}
      >
        {selectedDoc && (
          <DialogContent className="max-w-2xl sm:rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold flex items-center justify-between pr-6">
                <span>Compliance audit folder</span>
                <Badge className={`capitalize rounded-full ${getBadgeColor(selectedDoc.status)}`}>
                  {selectedDoc.status}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold">
                Auditor view for customer {selectedDoc.userName} &lt;{selectedDoc.userEmail}&gt;
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-1">
              {/* Metadata */}
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div><span className="text-muted-foreground text-xs">Document type</span><p className="font-medium">{selectedDoc.documentType.replace(/_/g, " ")}</p></div>
                <div><span className="text-muted-foreground text-xs">Document number</span><p className="font-medium font-mono">{selectedDoc.documentNumber}</p></div>
                <div><span className="text-muted-foreground text-xs">Expiry date</span><p className="font-medium">{selectedDoc.expiryDate}</p></div>
                <div><span className="text-muted-foreground text-xs">Country</span><p className="font-medium">{selectedDoc.country}</p></div>
                <div><span className="text-muted-foreground text-xs">Submitted</span><p className="font-medium">{new Date(selectedDoc.submittedAt).toLocaleString()}</p></div>
                {selectedDoc.reviewedAt && (
                  <div><span className="text-muted-foreground text-xs">Reviewed</span><p className="font-medium">{new Date(selectedDoc.reviewedAt).toLocaleString()}</p></div>
                )}
              </div>

              {/* Review note (if rejected) */}
              {selectedDoc.reviewNote && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs font-semibold text-destructive mb-1">Rejection reason</p>
                  <p className="text-sm">{selectedDoc.reviewNote}</p>
                </div>
              )}

              {/* Document file previews */}
              <KycFilePreviews filePath={selectedDoc.filePath} />
            </div>

            <DialogFooter className="mt-4 gap-2 flex-col sm:flex-row">
              <Button variant="ghost" onClick={() => setSelectedDoc(null)}>Close folder</Button>
              {selectedDoc.status === "pending" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={kycMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" /> Reject submission
                  </Button>
                  <Button
                    className="bg-success hover:bg-success/90 text-success-foreground shadow-glow"
                    onClick={() => kycMutation.mutate({ id: selectedDoc.id, status: "approved" })}
                    disabled={kycMutation.isPending}
                  >
                    <Check className="mr-2 h-4 w-4" /> Verify Customer
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Rejection reason dialog */}
      <Dialog
        open={showRejectConfirm}
        onOpenChange={(open) => {
          if (!open) { setShowRejectConfirm(false); setRejectionReason(""); }
        }}
      >
        <DialogContent className="max-w-md sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject KYC Submission</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection so the customer knows how to resubmit correctly.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <Label htmlFor="rejection-reason" className="text-sm font-medium">
              Rejection reason <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g. Document image is blurry. Please resubmit a clear photo."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{rejectionReason.length}/500</p>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="ghost" onClick={() => setShowRejectConfirm(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={kycMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              {kycMutation.isPending ? "Rejecting…" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── File preview helper ────────────────────────────────────────────────────

function KycFilePreviews({ filePath }: { filePath: string }) {
  let paths: Record<string, string> = {};
  try {
    const parsed = JSON.parse(filePath);
    if (typeof parsed === "object" && parsed !== null) {
      paths = parsed;
    } else {
      paths = { document: filePath };
    }
  } catch {
    paths = { document: filePath };
  }

  const validEntries = Object.entries(paths).filter(([, url]) => url && url !== "null");
  if (validEntries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        No document files available to preview.
      </div>
    );
  }

  const labels: Record<string, string> = {
    license:  "Driving License",
    passport: "Passport / National ID",
    selfie:   "Selfie Photo",
    document: "Document",
  };

  return (
    <div className="rounded-xl border border-border p-4 bg-muted/40 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document Scans Preview</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {validEntries.map(([key, url]) => {
          const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
          const isPdf   = url.toLowerCase().endsWith(".pdf");
          return (
            <div key={key} className="rounded-lg border border-border overflow-hidden bg-white dark:bg-card">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                <p className="text-xs font-semibold">{labels[key] ?? key}</p>
                <a href={fullUrl} target="_blank" rel="noopener noreferrer" download>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    <Download className="h-3 w-3 mr-1" /> Download
                  </Button>
                </a>
              </div>
              {isPdf ? (
                <div className="p-6 flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-primary" />
                  <p className="text-xs text-muted-foreground">PDF Document</p>
                  <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Open PDF
                    </Button>
                  </a>
                </div>
              ) : (
                <img
                  src={fullUrl}
                  alt={labels[key] ?? key}
                  className="w-full h-40 object-contain bg-muted/10"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

