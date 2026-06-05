import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/verify-otp")({ component: VerifyOtpPage });

function VerifyOtpPage() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  return (
    <AuthShell title="Verify your email" subtitle="We sent a 6-digit code to your email">
      <div className="space-y-6">
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={value} onChange={setValue}>
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          size="lg"
          className="w-full"
          disabled={value.length !== 6}
          onClick={() => { toast.success("Email verified!"); navigate({ to: "/dashboard" }); }}
        >
          Verify & continue
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Didn't get a code? <button className="font-medium text-primary hover:underline">Resend</button>
        </p>
      </div>
    </AuthShell>
  );
}
