import { api } from "./client";
import type { User } from "@/lib/types";

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),

  register: (name: string, email: string, password: string, phone?: string) =>
    api.post<AuthResponse>("/auth/register", { name, email, password, phone }).then((r) => r.data),

  adminLogin: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/admin/login", { email, password }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<RefreshResponse>("/auth/refresh", { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post("/auth/logout", { refreshToken }).then((r) => r.data),
};
