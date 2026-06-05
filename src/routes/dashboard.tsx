import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { CustomerSidebar } from "@/components/navigation/CustomerSidebar";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("drivelux-auth");
      if (!raw || !JSON.parse(raw)?.state?.user) throw redirect({ to: "/login" });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <div className="flex">
        <CustomerSidebar />
        <main className="flex-1 px-4 py-8 lg:px-8"><Outlet /></main>
      </div>
    </div>
  );
}
