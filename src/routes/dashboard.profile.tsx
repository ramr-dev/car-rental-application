import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/dashboard/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, setUser } = useAuth();
  const { register, handleSubmit } = useForm({ defaultValues: { name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" } });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Profile settings</h1>

      <Card className="mt-8 p-6">
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">{user?.name?.[0] ?? "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-display text-lg font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Button size="sm" variant="outline" className="mt-3">Change photo</Button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit((data) => {
            if (user) setUser({ ...user, ...data });
            toast.success("Profile updated");
          })}
          className="mt-8 grid gap-5 sm:grid-cols-2"
        >
          <div><Label>Full name</Label><Input {...register("name")} /></div>
          <div><Label>Email</Label><Input type="email" {...register("email")} /></div>
          <div><Label>Phone</Label><Input placeholder="+1 (555) 000-0000" {...register("phone")} /></div>
          <div><Label>Country</Label><Input placeholder="United States" /></div>
          <div className="sm:col-span-2"><Button type="submit">Save changes</Button></div>
        </form>
      </Card>
    </div>
  );
}
