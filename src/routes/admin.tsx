import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    // Server-side: window is undefined — skip localStorage check.
    // The component-level guard below handles the SSR bypass case on the client.
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem("drivelux-auth");
    const user = raw ? JSON.parse(raw)?.state?.user : null;

    if (!user) throw redirect({ to: "/admin-login" });
    if (user.role !== "admin") throw redirect({ to: "/admin-login" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Component-level guard: catches cases where SSR bypassed beforeLoad.
  // Runs synchronously on every render so non-admins never see admin content.
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate({ to: "/admin-login", replace: true });
    }
  }, [user, navigate]);

  // Prevent flash of admin content when redirecting
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 px-4 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
