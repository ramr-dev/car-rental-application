import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";

export function useLoginMutation() {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      // Simulate API delay
      await new Promise((r) => setTimeout(r, 600));
      return {
        id: "u1",
        name: credentials.email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase()),
        email: credentials.email,
        role: credentials.email.includes("admin") ? ("admin" as const) : ("user" as const),
        kycStatus: "approved" as const,
      };
    },
    onSuccess: (user) => {
      setUser(user);
      localStorage.setItem("auth_token", "mock-jwt-token-12345");
      toast.success("Welcome back!");
    },
  });
}

export function useRegisterMutation() {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: async (details: { name: string; email: string }) => {
      await new Promise((r) => setTimeout(r, 600));
      return {
        id: "u1",
        name: details.name,
        email: details.email,
        role: "user" as const,
        kycStatus: "not_started" as const,
      };
    },
    onSuccess: (user) => {
      setUser(user);
      toast.success("Account created! Please verify your email.");
    },
  });
}
