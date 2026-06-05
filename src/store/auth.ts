import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api/client";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) => {
        if (typeof window === "undefined") return;
        localStorage.setItem("auth_token", accessToken);
        localStorage.setItem("auth_refresh_token", refreshToken);
      },

      logout: () => {
        if (typeof window !== "undefined") {
          const refreshToken = localStorage.getItem("auth_refresh_token");
          if (refreshToken) {
            // Fire-and-forget — UI should clear immediately regardless of network
            api.post("/auth/logout", { refreshToken }).catch(() => {});
          }
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_refresh_token");
        }
        set({ user: null });
      },
    }),
    { name: "drivelux-auth" },
  ),
);
