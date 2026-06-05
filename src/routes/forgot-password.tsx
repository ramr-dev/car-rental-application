import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const { register, handleSubmit } = useForm<{ email: string }>();
  return (
    <AuthShell title="Reset your password" subtitle="We'll send a magic link to your email" footer={<Link to="/login" className="text-primary hover:underline">Back to sign in</Link>}>
      <form onSubmit={handleSubmit(() => toast.success("Reset link sent. Check your inbox."))} className="space-y-5">
        <div>
          <Label>Email</Label>
          <Input type="email" placeholder="you@example.com" {...register("email", { required: true })} />
        </div>
        <Button type="submit" size="lg" className="w-full">Send reset link</Button>
      </form>
    </AuthShell>
  );
}
