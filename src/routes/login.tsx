import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/store/auth";
import { authService } from "@/lib/api/auth.service";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

type LoginSearch = z.infer<typeof loginSearchSchema>;

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => loginSearchSchema.parse(search),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormVals = z.infer<typeof schema>;

function LoginPage() {
  const { redirect } = Route.useSearch();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormVals>({ resolver: zodResolver(schema) });
  const { setUser, setTokens } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const onSubmit = async (data: FormVals) => {
    try {
      const result = await authService.login(data.email, data.password);
      setTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
      toast.success("Welcome back!");
      navigate({ to: (redirect || (result.user.role === "admin" ? "/admin" : "/dashboard")) as any });
    } catch (err: any) {
      const message = err?.response?.data?.error ?? "Invalid email or password.";
      toast.error(message);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your DriveLux account"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
          {" · "}
          <Link to="/admin-login" className="text-muted-foreground hover:text-foreground">
            Admin login
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
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
            <Label htmlFor="pw">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative mt-1">
            <Input
              id="pw"
              type={show ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
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
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Checkbox />
          Remember me for 30 days
        </label>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
