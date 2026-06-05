import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff, KeyRound, Save, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/admin/profile")({ component: AdminProfile });

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function ProfileCard() {
  const { user, setUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      jobTitle: "Master Administrator",
    },
  });

  const onSubmit = (data: ProfileForm) => {
    if (user) setUser({ ...user, name: data.name, email: data.email, phone: data.phone });
    toast.success("Profile updated successfully.");
  };

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "AD";

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3 pb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <User className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-base font-semibold">Account Information</h3>
          <p className="text-sm text-muted-foreground">Update your name, email and contact details.</p>
        </div>
      </div>
      <Separator className="mb-6" />

      {/* Avatar section */}
      <div className="flex items-center gap-5 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1.5">
          <p className="font-display text-lg font-semibold">{user?.name}</p>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground text-xs">
              <ShieldCheck className="mr-1 h-3 w-3" /> Master Admin
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {user?.kycStatus?.replace("_", " ") ?? "Verified"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Admin ID: #{user?.id?.toUpperCase() ?? "ADM001"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" {...register("name")} className="mt-1" />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" {...register("email")} className="mt-1" />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" placeholder="+1 (555) 000-0000" {...register("phone")} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="jobTitle">Job Title</Label>
          <Input id="jobTitle" {...register("jobTitle")} className="mt-1" />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" className="shadow-soft" disabled={!isDirty}>
            <Save className="mr-2 h-4 w-4" /> Save Profile
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = (_data: PasswordForm) => {
    toast.success("Password changed successfully. Please use your new credentials next time.");
    reset();
  };

  function PasswordInput({
    id,
    show,
    toggle,
    error,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; show: boolean; toggle: () => void; error?: string }) {
    return (
      <div>
        <div className="relative mt-1">
          <Input id={id} type={show ? "text" : "password"} className="pr-10" {...props} />
          <button
            type="button"
            onClick={toggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3 pb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10">
          <KeyRound className="h-4.5 w-4.5 text-warning" />
        </div>
        <div>
          <h3 className="font-display text-base font-semibold">Change Password</h3>
          <p className="text-sm text-muted-foreground">Update your admin account password. Use a strong, unique password.</p>
        </div>
      </div>
      <Separator className="mb-6" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="currentPassword">Current Password</Label>
          <PasswordInput
            id="currentPassword"
            show={showCurrent}
            toggle={() => setShowCurrent((p) => !p)}
            placeholder="Enter your current password"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
        </div>
        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <PasswordInput
            id="newPassword"
            show={showNew}
            toggle={() => setShowNew((p) => !p)}
            placeholder="Min. 8 characters"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <PasswordInput
            id="confirmPassword"
            show={showConfirm}
            toggle={() => setShowConfirm((p) => !p)}
            placeholder="Re-enter new password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Password requirements:</p>
          <p>• Minimum 8 characters</p>
          <p>• Mix of uppercase and lowercase letters</p>
          <p>• At least one number or special character</p>
        </div>

        <Button type="submit" variant="outline" className="border-warning/30 text-warning hover:bg-warning/10">
          <KeyRound className="mr-2 h-4 w-4" /> Update Password
        </Button>
      </form>
    </Card>
  );
}

function AdminProfile() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Admin Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your administrator account and security settings.</p>
      </div>

      <ProfileCard />
      <PasswordCard />
    </div>
  );
}
