import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Car, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/auth";
import { authService } from "@/lib/api/auth.service";

export const Route = createFileRoute("/admin-login")({ component: AdminLoginPage });

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormVals = z.infer<typeof schema>;

function AdminLoginPage() {
  const { user, setUser, setTokens } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  // If already authenticated as admin, skip login
  useEffect(() => {
    if (user?.role === "admin") {
      navigate({ to: "/admin" });
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormVals>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormVals) => {
    try {
      const result = await authService.adminLogin(data.email, data.password);
      setTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
      toast.success("Welcome back, Admin!");
      navigate({ to: "/admin" });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        setError("email", { message: "This account does not have admin access." });
      } else {
        setError("email", {
          message: err?.response?.data?.error ?? "Invalid admin credentials.",
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      {/* Background pattern */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-background shadow-elevated p-8">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-glow mb-4">
              <Car className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Admin Access</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              DriveLux Master Administration Panel
            </p>
            <div className="mt-3 flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Restricted access — authorised personnel only
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@drivelux.com"
                autoComplete="email"
                className="mt-1"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShow((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full shadow-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying credentials…" : "Sign in to Admin Panel"}
            </Button>
          </form>

        </div>

        {/* Back link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not an admin?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Customer login →
          </Link>
        </p>
      </div>
    </div>
  );
}
