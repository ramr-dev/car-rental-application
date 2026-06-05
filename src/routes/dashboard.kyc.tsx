import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera, Check, FileText, Upload, ShieldAlert, ShieldCheck,
  X, Download, Loader2, Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/auth";
import { userService } from "@/lib/api";
import type { SubmitKycPayload } from "@/lib/api/user.service";

export const Route = createFileRoute("/dashboard/kyc")({ component: KycPage });

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") ?? "";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

const SLOTS = [
  { id: "license",  title: "Driving License",       desc: "Front and back of your valid license", icon: FileText },
  { id: "passport", title: "Passport / National ID", desc: "Government-issued photo ID",           icon: FileText },
  { id: "selfie",   title: "Selfie Verification",    desc: "A clear photo of your face",           icon: Camera  },
] as const;

type SlotId = (typeof SLOTS)[number]["id"];

interface SlotState {
  uploading: boolean;
  url: string | null;
  mimeType: string | null;
}

function KycPage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();

  const [slots, setSlots] = useState<Record<SlotId, SlotState>>({
    license:  { uploading: false, url: null, mimeType: null },
    passport: { uploading: false, url: null, mimeType: null },
    selfie:   { uploading: false, url: null, mimeType: null },
  });

  const [docFields, setDocFields] = useState({
    documentType: "DRIVERS_LICENSE" as SubmitKycPayload["documentType"],
    documentNumber: "",
    expiryDate: "",
    country: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileRefs = {
    license:  useRef<HTMLInputElement>(null),
    passport: useRef<HTMLInputElement>(null),
    selfie:   useRef<HTMLInputElement>(null),
  };

  // Fetch the user's existing KYC submissions
  const { data: existingDocs = [] } = useQuery({
    queryKey: ["my-kyc"],
    queryFn: () => userService.getMyKyc(),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.deleteKyc(id),
    onSuccess: () => {
      toast.success("KYC submission removed.");
      queryClient.invalidateQueries({ queryKey: ["my-kyc"] });
      if (user) setUser({ ...user, kycStatus: "not_started" });
    },
    onError: () => toast.error("Failed to remove submission."),
  });

  const kycStatus = user?.kycStatus ?? "not_started";
  const allUploaded = SLOTS.every((s) => slots[s.id].url !== null);
  const docFieldsValid =
    docFields.documentNumber.trim().length >= 4 &&
    docFields.expiryDate.length > 0 &&
    docFields.country.trim().length >= 2;

  async function handleFileChange(slotId: SlotId, file: File | undefined) {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG and PDF files are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File must be under 10 MB.");
      return;
    }

    setSlots((prev) => ({
      ...prev,
      [slotId]: { uploading: true, url: null, mimeType: null },
    }));

    try {
      const { url } = await userService.uploadKycFile(file);
      setSlots((prev) => ({
        ...prev,
        [slotId]: { uploading: false, url, mimeType: file.type },
      }));
      toast.success("File uploaded successfully.");
    } catch {
      setSlots((prev) => ({
        ...prev,
        [slotId]: { uploading: false, url: null, mimeType: null },
      }));
      toast.error("Upload failed. Please try again.");
    }
  }

  function clearSlot(slotId: SlotId) {
    setSlots((prev) => ({
      ...prev,
      [slotId]: { uploading: false, url: null, mimeType: null },
    }));
    if (fileRefs[slotId].current) fileRefs[slotId].current!.value = "";
  }

  async function handleSubmit() {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const filePaths = JSON.stringify({
        license:  slots.license.url,
        passport: slots.passport.url,
        selfie:   slots.selfie.url,
      });
      await userService.submitKyc({
        documentType:   docFields.documentType,
        documentNumber: docFields.documentNumber.trim(),
        expiryDate:     docFields.expiryDate,
        country:        docFields.country.trim(),
        filePath:       filePaths,
      });
      setUser({ ...user, kycStatus: "pending" });
      queryClient.invalidateQueries({ queryKey: ["my-kyc"] });
      toast.success("Identity documents submitted for review! We will verify them shortly.");
    } catch (err: any) {
      const message = err?.response?.data?.error ?? "Failed to submit documents. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const getTimelineSteps = () => {
    switch (kycStatus) {
      case "approved":
        return [
          { label: "Documents uploaded",   status: "done",    date: "Completed"           },
          { label: "Compliance review",     status: "done",    date: "Approved"            },
          { label: "Account unlocked",      status: "done",    date: "Verified"            },
        ];
      case "rejected":
        return [
          { label: "Documents uploaded",   status: "done",    date: "Completed"           },
          { label: "Compliance review",     status: "rejected",date: "Rejected"            },
          { label: "Documents invalid",     status: "pending", date: "Re-upload required"  },
        ];
      case "pending":
        return [
          { label: "Documents uploaded",   status: "done",    date: "Just now"            },
          { label: "Compliance review",     status: "current", date: "Under verification"  },
          { label: "Account unlocked",      status: "pending", date: "Expected within 24h" },
        ];
      default:
        return [
          { label: "Documents uploaded",   status: "pending", date: "Awaiting files"      },
          { label: "Compliance review",     status: "pending", date: "—"                   },
          { label: "Account unlocked",      status: "pending", date: "—"                   },
        ];
    }
  };

  const badgeConfig = {
    not_started: { label: "Not Started",     className: "bg-muted text-muted-foreground"                     },
    pending:     { label: "In Review",        className: "bg-warning text-warning-foreground animate-pulse"   },
    approved:    { label: "Verified Profile", className: "bg-success text-success-foreground shadow-glow"     },
    rejected:    { label: "Rejected",         className: "bg-destructive text-destructive-foreground"         },
  };

  const badge = badgeConfig[kycStatus];
  const steps = getTimelineSteps();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">KYC Verification</h1>
          <p className="mt-1 text-muted-foreground">Complete identity verification to unlock premium luxury rentals.</p>
        </div>
        <Badge className={`gap-1.5 px-3 py-1 font-semibold text-xs rounded-full ${badge.className}`}>
          {kycStatus === "approved" ? <ShieldCheck className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
          {badge.label}
        </Badge>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {kycStatus === "approved" ? (
            <Card className="p-8 text-center bg-success/5 border-success/30 flex flex-col items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="font-display text-xl font-bold">Verification Successful!</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Your credentials have been verified by our compliance team. You now have full access to reserve any vehicle in our luxury fleet.
              </p>
              <Button asChild className="mt-6 shadow-glow">
                <a href="/vehicles">Rent a vehicle now</a>
              </Button>
            </Card>
          ) : kycStatus === "pending" ? (
            <>
              <Card className="p-8 text-center bg-warning/5 border-warning/30 flex flex-col items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-warning/10 text-warning flex items-center justify-center mb-4 animate-pulse">
                  <Upload className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-bold">Verification In Progress</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  Your documents have been submitted and are currently being audited. This usually takes less than 24 hours. We'll notify you by email once verified.
                </p>
              </Card>

              {existingDocs.length > 0 && (
                <Card className="p-6">
                  <p className="font-semibold text-sm mb-4">Submitted documents</p>
                  {existingDocs.map((doc) => {
                    let paths: Record<string, string> = {};
                    try { paths = JSON.parse(doc.filePath); } catch { paths = { document: doc.filePath }; }
                    return (
                      <div key={doc.id} className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 text-sm">
                          <div><span className="text-muted-foreground text-xs">Type</span><p className="font-medium">{doc.documentType.replace("_", " ")}</p></div>
                          <div><span className="text-muted-foreground text-xs">Number</span><p className="font-medium">{doc.documentNumber}</p></div>
                          <div><span className="text-muted-foreground text-xs">Expires</span><p className="font-medium">{doc.expiryDate}</p></div>
                          <div><span className="text-muted-foreground text-xs">Country</span><p className="font-medium">{doc.country}</p></div>
                        </div>
                        <FilePreviewGrid paths={paths} />
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => deleteMutation.mutate(doc.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Withdraw submission
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </Card>
              )}
            </>
          ) : (
            <>
              {kycStatus === "rejected" && (
                <>
                  {existingDocs.filter((d) => d.status === "rejected").map((doc) => (
                    <div key={doc.id} className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm flex gap-3 items-start">
                      <ShieldAlert className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-xs">Submission Rejected</p>
                        {doc.reviewNote ? (
                          <p className="text-xs text-muted-foreground mt-0.5">{doc.reviewNote}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Our audit team was unable to verify your previous submission. Please ensure your documents are fully legible and not expired.
                          </p>
                        )}
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 mt-1 text-destructive text-xs"
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Remove & re-submit
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {SLOTS.map((slot) => {
                const state = slots[slot.id];
                const Icon = slot.icon;
                const isUp = state.url !== null;
                return (
                  <Card key={slot.id} className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isUp ? "bg-success/10 text-success" : "bg-accent text-accent-foreground"}`}>
                          {state.uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : isUp ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-display font-semibold">{slot.title}</p>
                          <p className="text-sm text-muted-foreground">{slot.desc}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isUp && (
                          <Button variant="ghost" size="sm" onClick={() => clearSlot(slot.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant={isUp ? "outline" : "default"}
                          size="sm"
                          disabled={state.uploading}
                          onClick={() => fileRefs[slot.id].current?.click()}
                        >
                          {isUp ? "Replace" : "Upload"}
                        </Button>
                      </div>
                    </div>

                    <input
                      ref={fileRefs[slot.id]}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileChange(slot.id, e.target.files?.[0])}
                    />

                    {!isUp && !state.uploading && (
                      <label
                        className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-primary hover:bg-accent/30"
                        onClick={() => fileRefs[slot.id].current?.click()}
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">Drop file here or click to browse</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or PDF — max 10 MB</p>
                      </label>
                    )}

                    {isUp && state.url && (
                      <div className="mt-4">
                        <FilePreview url={state.url} mimeType={state.mimeType ?? ""} />
                      </div>
                    )}
                  </Card>
                );
              })}

              {allUploaded && (
                <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                  <p className="text-sm font-semibold">Document details</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Document type</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={docFields.documentType}
                        onChange={(e) =>
                          setDocFields((f) => ({ ...f, documentType: e.target.value as SubmitKycPayload["documentType"] }))
                        }
                      >
                        <option value="DRIVERS_LICENSE">Driver's License</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="NATIONAL_ID">National ID</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Document number</Label>
                      <Input
                        className="mt-1"
                        placeholder="e.g. DL-9281029"
                        value={docFields.documentNumber}
                        onChange={(e) => setDocFields((f) => ({ ...f, documentNumber: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Expiry date</Label>
                      <Input
                        className="mt-1"
                        type="date"
                        value={docFields.expiryDate}
                        onChange={(e) => setDocFields((f) => ({ ...f, expiryDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Issuing country</Label>
                      <Input
                        className="mt-1"
                        placeholder="e.g. United States"
                        value={docFields.country}
                        onChange={(e) => setDocFields((f) => ({ ...f, country: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  size="lg"
                  disabled={!allUploaded || !docFieldsValid || isSubmitting}
                  onClick={handleSubmit}
                  className="shadow-glow w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    "Submit Verification Audit"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <Card className="h-fit p-6">
          <h3 className="font-display font-semibold text-lg border-b border-border pb-4">Verification Audit</h3>
          <div className="mt-6 space-y-5">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    s.status === "done"     ? "bg-success text-success-foreground"
                    : s.status === "current"  ? "bg-primary text-primary-foreground animate-pulse"
                    : s.status === "rejected" ? "bg-destructive text-destructive-foreground"
                    : "bg-muted text-muted-foreground"
                  }`}>
                    {s.status === "done" ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && <div className="mt-1 h-8 w-px bg-border" />}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── File preview components ────────────────────────────────────────────────

function FilePreview({ url, mimeType }: { url: string; mimeType: string }) {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  if (mimeType === "application/pdf") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <FileText className="h-8 w-8 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">PDF Document</p>
          <p className="text-xs text-muted-foreground">Uploaded successfully</p>
        </div>
        <a href={fullUrl} target="_blank" rel="noopener noreferrer" download>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" /> View
          </Button>
        </a>
      </div>
    );
  }
  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <img
        src={fullUrl}
        alt="Uploaded document"
        className="w-full max-h-52 object-contain bg-muted/20"
      />
    </div>
  );
}

function FilePreviewGrid({ paths }: { paths: Record<string, string> }) {
  const labels: Record<string, string> = { license: "Driving License", passport: "Passport/ID", selfie: "Selfie", document: "Document" };
  const entries = Object.entries(paths).filter(([, url]) => url);
  if (entries.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-3">
      {entries.map(([key, url]) => {
        const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
        const isPdf   = url.endsWith(".pdf");
        return (
          <div key={key} className="rounded-lg border border-border overflow-hidden bg-muted/20">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-2 pb-1">{labels[key] ?? key}</p>
            {isPdf ? (
              <div className="p-3 flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                  View PDF
                </a>
              </div>
            ) : (
              <img src={fullUrl} alt={key} className="w-full h-28 object-contain bg-white" />
            )}
          </div>
        );
      })}
    </div>
  );
}
