import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  ShieldCheck, Upload, User, CreditCard, ArrowRight,
  Building, CheckCircle2, AlertCircle, Loader2, Landmark,
  ChevronRight, Sparkles, AlertTriangle, Car
} from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/auth";
import { hostService } from "@/lib/api/host.service";
import { userService } from "@/lib/api/user.service";

export const Route = createFileRoute("/host/register")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("drivelux-auth");
      if (!raw || !JSON.parse(raw)?.state?.user) {
        throw redirect({ to: "/login", search: { redirect: "/host/register" } });
      }
    }
  },
  component: HostRegisterPage,
});

interface FormValues {
  panNumber: string;
  phone: string;
  bankAccountNum: string;
  confirmBankAccountNum: string;
  bankIfsc: string;
  bankName: string;
  aadhaarFrontUrl: string;
  aadhaarBackUrl: string;
}

function HostRegisterPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Form setup
  const { register, handleSubmit, setValue, watch, setError, trigger, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      panNumber: "",
      phone: user?.phone ?? "",
      bankAccountNum: "",
      confirmBankAccountNum: "",
      bankIfsc: "",
      bankName: "",
      aadhaarFrontUrl: "",
      aadhaarBackUrl: "",
    }
  });

  const watchValues = watch();

  // Query actual host status & profile
  const { data: hostProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["host-profile"],
    queryFn: () => hostService.getProfile(),
    enabled: !!user,
  });

  const submitProfileMutation = useMutation({
    mutationFn: (data: any) => hostService.submitProfile(data),
    onSuccess: (data) => {
      toast.success("Onboarding profile submitted successfully!");
      if (user) {
        setUser({
          ...user,
          hostStatus: "PENDING_KYC"
        });
      }
      queryClient.invalidateQueries({ queryKey: ["host-profile"] });
      setStep(4);
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      if (data?.error === "Validation failed" && Array.isArray(data.details)) {
        data.details.forEach((detail: { field: string; message: string }) => {
          setError(detail.field as any, {
            type: "server",
            message: detail.message,
          });
        });
        const fieldErrors = data.details.map((d: any) => d.message).join(", ");
        toast.error(`Validation failed: ${fieldErrors}`);
      } else {
        const msg = data?.error ?? "Failed to submit profile. Please try again.";
        toast.error(msg);
      }
    }
  });

  // Handle document upload
  const handleUpload = async (file: File, side: "front" | "back") => {
    if (side === "front") setUploadingFront(true);
    else setUploadingBack(true);

    try {
      const res = await userService.uploadKycFile(file);
      setValue(side === "front" ? "aadhaarFrontUrl" : "aadhaarBackUrl", res.url, { shouldValidate: true });
      toast.success(`${side === "front" ? "Aadhaar Front" : "Aadhaar Back"} uploaded successfully!`);
    } catch (e) {
      toast.error("Failed to upload document. Please try again.");
    } finally {
      if (side === "front") setUploadingFront(false);
      else setUploadingBack(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    if (data.bankAccountNum !== data.confirmBankAccountNum) {
      toast.error("Bank Account Numbers do not match.");
      return;
    }
    if (!data.aadhaarFrontUrl || !data.aadhaarBackUrl) {
      toast.error("Please upload both Aadhaar Front and Back files.");
      return;
    }

    submitProfileMutation.mutate({
      panNumber: data.panNumber,
      phone: data.phone,
      bankAccountNum: data.bankAccountNum,
      bankIfsc: data.bankIfsc,
      bankName: data.bankName,
      aadhaarFrontUrl: data.aadhaarFrontUrl,
      aadhaarBackUrl: data.aadhaarBackUrl,
    });
  };

  // Redirect if already verified host
  if (hostProfile?.hostStatus === "VERIFIED" || user?.role === "host") {
    // If the local role is not host yet, update it
    if (user && user.role !== "host") {
      setUser({ ...user, role: "host", hostStatus: "VERIFIED" });
    }
    navigate({ to: "/host/dashboard" });
    return null;
  }

  const kycStatus = hostProfile?.hostStatus ?? user?.hostStatus ?? "NOT_A_HOST";

  // Check state and render accordingly
  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          
          {profileLoading ? (
            <div className="flex h-96 flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Checking application status...</p>
            </div>
          ) : kycStatus === "PENDING_KYC" ? (
            // PENDING REVIEW SCREEN
            <Card className="border-border shadow-glow bg-card/60 backdrop-blur-md text-center max-w-xl mx-auto p-8">
              <CardHeader className="items-center pb-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
                  <Sparkles className="h-8 w-8 animate-pulse" />
                </div>
                <CardTitle className="font-display text-2xl font-bold">Verification in Progress</CardTitle>
                <CardDescription className="text-base mt-2">
                  We have received your Host registration request and KYC document uploads.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4 space-y-4">
                <div className="rounded-lg bg-amber-500/5 p-4 border border-amber-500/20 text-left">
                  <h4 className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" /> Next Steps:
                  </h4>
                  <ul className="mt-2 space-y-2 text-xs text-muted-foreground list-disc pl-5">
                    <li>DriveLux Compliance officers will review your bank information and Aadhaar/PAN cards.</li>
                    <li>We will audit identity records within 24-48 business hours.</li>
                    <li>Once approved, your role will upgrade and you can start listing your vehicle!</li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  Need assistance? Contact our support team at <a href="mailto:hosts@drivelux.com" className="text-primary hover:underline font-medium">hosts@drivelux.com</a>
                </p>
              </CardContent>
              <CardFooter className="justify-center pt-6 border-t mt-6">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">Go back Home</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : kycStatus === "REJECTED" ? (
            // REJECTED STATE SCREEN
            <Card className="border-border shadow-glow bg-card/60 backdrop-blur-md max-w-xl mx-auto p-8">
              <CardHeader className="items-center pb-2 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <CardTitle className="font-display text-2xl font-bold">Application Rejected</CardTitle>
                <CardDescription className="text-base mt-2 text-destructive">
                  Your Host Profile KYC verification could not be approved.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4 space-y-4">
                <div className="rounded-lg bg-destructive/5 p-4 border border-destructive/20">
                  <h4 className="font-medium text-destructive flex items-center gap-2 text-sm">
                    Reviewer Note:
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground italic">
                    "{hostProfile?.profile?.reviewNote ?? "Documents provided were illegible or expired. Please upload valid PAN and Aadhaar files."}"
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  You can update your details and resubmit the KYC application.
                </p>
              </CardContent>
              <CardFooter className="flex gap-4 pt-6 border-t mt-6">
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/">Cancel</Link>
                </Button>
                <Button className="flex-1" onClick={() => {
                  setStep(2); // take them straight back to onboarding step 2
                  // clear the local state user status if necessary
                  if (user) setUser({ ...user, hostStatus: "NOT_A_HOST" });
                }}>
                  Resubmit Application
                </Button>
              </CardFooter>
            </Card>
          ) : (
            // ONBOARDING WIZARD FLOW
            <div className="grid gap-8 lg:grid-cols-3">
              
              {/* Sidebar Checklist */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-border/60 bg-card/40 backdrop-blur-sm sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold font-display">Become a Host</CardTitle>
                    <CardDescription>Get started in 3 simple steps</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                        step === 1 ? "bg-primary text-primary-foreground" : step > 1 ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                      }`}>
                        {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}>Introduction</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Explore benefits and fee splits</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                        step === 2 ? "bg-primary text-primary-foreground" : step > 2 ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                      }`}>
                        {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : "2"}
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold ${step === 2 ? "text-foreground" : "text-muted-foreground"}`}>Verification</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Identity details & documents</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                        step === 3 ? "bg-primary text-primary-foreground" : step > 3 ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                      }`}>
                        "3"
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold ${step === 3 ? "text-foreground" : "text-muted-foreground"}`}>Bank Accounts</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Set up payout routing</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Wizard Forms */}
              <div className="lg:col-span-2">
                {step === 1 && (
                  <Card className="border-border shadow-soft bg-card">
                    <CardHeader>
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                        <Car className="h-6 w-6" />
                      </div>
                      <CardTitle className="font-display text-2xl font-bold">Share Your Car, Make Money</CardTitle>
                      <CardDescription>
                        Turn your idle vehicle into a source of income. DriveLux makes hosting secure and highly profitable.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="p-4 rounded-xl border bg-muted/10">
                          <h4 className="font-bold text-base font-display">85% Revenue Share</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            We take a fixed 15% platform commission rate. You keep 85% of your car's gross earnings.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl border bg-muted/10">
                          <h4 className="font-bold text-base font-display">GPS Tracked Safety</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your car is fitted with a mandatory real-time GPS tracker so you can monitor routes and location live.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl border bg-muted/10">
                          <h4 className="font-bold text-base font-display">Check-in Checklists</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Our inspection checklists capture 4-side photos, odometer, and fuel levels to prevent damage disputes.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl border bg-muted/10">
                          <h4 className="font-bold text-base font-display">Flexible Scheduling</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            You have total control. Block out dates or define weekly availability schedules whenever you need your car.
                          </p>
                        </div>
                      </div>

                      <div className="bg-primary/5 rounded-xl border border-primary/10 p-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-primary font-bold uppercase tracking-wider">Estimated Earnings</p>
                          <h3 className="font-display text-2xl font-bold mt-1">Earn up to ₹50,000 / month</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Based on listing a standard SUV 15 days a month</p>
                        </div>
                        <Sparkles className="h-8 w-8 text-primary/40 animate-pulse hidden sm:block" />
                      </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6 gap-4">
                      <Button asChild variant="ghost"><Link to="/">Cancel</Link></Button>
                      <Button 
                        onClick={async () => {
                          const isValid = await trigger(["phone", "panNumber"]);
                          if (isValid) {
                            setStep(2);
                          }
                        }} 
                        className="shadow-soft"
                      >
                        Verify Identity <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {step === 2 && (
                  <Card className="border-border shadow-soft bg-card">
                    <CardHeader>
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                        <User className="h-6 w-6" />
                      </div>
                      <CardTitle className="font-display text-2xl font-bold">Personal Verification</CardTitle>
                      <CardDescription>
                        We require valid tax and identification cards to verify car ownership and process financial earnings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="e.g. +91 9876543210"
                          {...register("phone", {
                            required: "Phone number is required",
                            pattern: {
                              value: /^\+?[0-9\s\-()]{10,15}$/,
                              message: "Please enter a valid 10-15 digit phone number"
                            }
                          })}
                        />
                        {errors.phone && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" /> {errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="panNumber">PAN Card Number</Label>
                        <Input
                          id="panNumber"
                          placeholder="ABCDE1234F"
                          className="font-mono uppercase"
                          {...register("panNumber", {
                            required: "PAN card number is required",
                            pattern: {
                              value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i,
                              message: "Invalid PAN card format (Format: ABCDE1234F)"
                            }
                          })}
                        />
                        {errors.panNumber && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" /> {errors.panNumber.message}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        {/* Aadhaar Front */}
                        <div className="space-y-2">
                          <Label>Aadhaar Card Front (Photo)</Label>
                          <input
                            type="file"
                            ref={frontInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(file, "front");
                            }}
                          />
                          <div
                            onClick={() => !uploadingFront && frontInputRef.current?.click()}
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
                              watchValues.aadhaarFrontUrl ? "bg-emerald-500/5 border-emerald-500/30" : "bg-muted/10 border-border hover:bg-muted/20"
                            }`}
                          >
                            {uploadingFront ? (
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            ) : watchValues.aadhaarFrontUrl ? (
                              <>
                                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                                <p className="text-xs font-semibold text-emerald-600">Front uploaded successfully</p>
                                <p className="text-[10px] text-muted-foreground mt-1 underline">Click to change</p>
                              </>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-xs font-semibold">Upload Aadhaar Front</p>
                                <p className="text-[10px] text-muted-foreground mt-1">JPEG or PNG, max 10MB</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Aadhaar Back */}
                        <div className="space-y-2">
                          <Label>Aadhaar Card Back (Photo)</Label>
                          <input
                            type="file"
                            ref={backInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(file, "back");
                            }}
                          />
                          <div
                            onClick={() => !uploadingBack && backInputRef.current?.click()}
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
                              watchValues.aadhaarBackUrl ? "bg-emerald-500/5 border-emerald-500/30" : "bg-muted/10 border-border hover:bg-muted/20"
                            }`}
                          >
                            {uploadingBack ? (
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            ) : watchValues.aadhaarBackUrl ? (
                              <>
                                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                                <p className="text-xs font-semibold text-emerald-600">Back uploaded successfully</p>
                                <p className="text-[10px] text-muted-foreground mt-1 underline">Click to change</p>
                              </>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-xs font-semibold">Upload Aadhaar Back</p>
                                <p className="text-[10px] text-muted-foreground mt-1">JPEG or PNG, max 10MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                    </CardContent>
                    <CardFooter className="justify-between border-t pt-6">
                      <Button onClick={() => setStep(1)} variant="outline">
                        Back
                      </Button>
                      <Button
                        onClick={async () => {
                          const isStep1Valid = await trigger(["phone", "panNumber"]);
                          if (!isStep1Valid) {
                            setStep(1);
                            toast.error("Please fix validation errors in Step 1.");
                            return;
                          }
                          if (!watchValues.aadhaarFrontUrl || !watchValues.aadhaarBackUrl) {
                            toast.error("Please upload Aadhaar Front and Back files first.");
                            return;
                          }
                          setStep(3);
                        }}
                        className="shadow-soft"
                      >
                        Bank Details <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {step === 3 && (
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="border-border shadow-soft bg-card">
                      <CardHeader>
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                          <Landmark className="h-6 w-6" />
                        </div>
                        <CardTitle className="font-display text-2xl font-bold">Bank Account Routing</CardTitle>
                        <CardDescription>
                          Specify the account details where your payouts (85% earnings share) will be wired every week.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input
                            id="bankName"
                            placeholder="e.g. HDFC Bank, ICICI Bank"
                            {...register("bankName", { required: "Bank name is required" })}
                          />
                          {errors.bankName && (
                            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5" /> {errors.bankName.message}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="bankAccountNum">Account Number</Label>
                            <Input
                              id="bankAccountNum"
                              type="password"
                              placeholder="000000000000"
                              {...register("bankAccountNum", {
                                required: "Bank account number is required",
                                minLength: { value: 9, message: "Too short for a bank account" }
                              })}
                            />
                            {errors.bankAccountNum && (
                              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" /> {errors.bankAccountNum.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmBankAccountNum">Confirm Account Number</Label>
                            <Input
                              id="confirmBankAccountNum"
                              placeholder="Re-enter Account Number"
                              {...register("confirmBankAccountNum", {
                                required: "Please confirm your account number"
                              })}
                            />
                            {errors.confirmBankAccountNum && (
                              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" /> {errors.confirmBankAccountNum.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bankIfsc">IFSC Code</Label>
                          <Input
                            id="bankIfsc"
                            placeholder="HDFC0000123"
                            className="font-mono uppercase"
                            {...register("bankIfsc", {
                              required: "IFSC code is required",
                              pattern: {
                                value: /^[A-Z]{4}0[A-Z0-9]{6}$/i,
                                message: "Invalid IFSC format (Format: HDFC0000123)"
                              }
                            })}
                          />
                          {errors.bankIfsc && (
                            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5" /> {errors.bankIfsc.message}
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 flex gap-3 mt-4">
                          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-primary">Direct Deposit Agreement</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                              By submitting this application, you authorize DriveLux to wire weekly P2P host payouts automatically to the specified account. Financial reporting calculations apply the fixed 15% platform commission rate.
                            </p>
                          </div>
                        </div>

                      </CardContent>
                      <CardFooter className="justify-between border-t pt-6">
                        <Button type="button" onClick={() => setStep(2)} variant="outline">
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={submitProfileMutation.isPending}
                          className="shadow-soft bg-gradient-hero text-primary-foreground hover:opacity-90"
                        >
                          {submitProfileMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting Profile...
                            </>
                          ) : (
                            <>
                              Submit KYC Application <CheckCircle2 className="h-4 w-4 ml-1.5" />
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </form>
                )}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </PublicLayout>
  );
}
