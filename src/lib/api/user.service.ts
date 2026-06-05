import { api } from "./client";
import type { User, KycDocument, KycDocumentStatus, MyKycDocument } from "@/lib/types";

export interface UserListParams {
  search?: string;
  role?: string;
  kycStatus?: string;
  isBlocked?: boolean;
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  data: User[];
  pagination: { total: number; page: number; limit: number; pageCount: number };
}

export interface KycListParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface KycListResponse {
  data: KycDocument[];
  pagination: { total: number; page: number; limit: number; pageCount: number };
}

export interface SubmitKycPayload {
  documentType: "DRIVERS_LICENSE" | "PASSPORT" | "NATIONAL_ID";
  documentNumber: string;
  expiryDate: string;
  country: string;
  filePath: string;
}

export const userService = {
  // ── Admin: user list ─────────────────────────────────────────────────────
  list: async (params?: UserListParams): Promise<User[]> => {
    const res = await api.get<UserListResponse>("/admin/users", {
      params: { limit: 100, ...params },
    });
    return res.data.data;
  },

  listPaginated: async (params?: UserListParams): Promise<UserListResponse> => {
    const res = await api.get<UserListResponse>("/admin/users", { params });
    return res.data;
  },

  // ── Own profile ───────────────────────────────────────────────────────────
  getMe: async (): Promise<User> => {
    const res = await api.get<User>("/users/me");
    return res.data;
  },

  updateMe: async (data: { name?: string; phone?: string | null; avatar?: string | null }): Promise<User> => {
    const res = await api.patch<User>("/users/me", data);
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.patch("/users/me/password", { currentPassword, newPassword });
  },

  // ── Customer: upload a KYC file ───────────────────────────────────────────
  uploadKycFile: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ url: string }>("/users/kyc/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // ── Customer: fetch own KYC documents ─────────────────────────────────────
  getMyKyc: async (): Promise<MyKycDocument[]> => {
    const res = await api.get<{ data: MyKycDocument[] }>("/users/kyc");
    return res.data.data;
  },

  // ── Customer: delete own pending KYC document ─────────────────────────────
  deleteKyc: async (id: number): Promise<void> => {
    await api.delete(`/users/kyc/${id}`);
  },

  // ── Customer: submit KYC documents ────────────────────────────────────────
  submitKyc: async (payload: SubmitKycPayload): Promise<{ id: number; status: string }> => {
    const res = await api.post("/users/kyc", payload);
    return res.data;
  },

  // ── Admin: role & block management ───────────────────────────────────────
  // Backend expects uppercase role: CUSTOMER | ADMIN
  updateRole: async (id: string, role: "user" | "admin"): Promise<User> => {
    const res = await api.patch<User>(`/admin/users/${id}/role`, {
      role: role === "admin" ? "ADMIN" : "CUSTOMER",
    });
    return res.data;
  },

  blockUser: async (id: string, isBlocked: boolean): Promise<User> => {
    const res = await api.patch<User>(`/admin/users/${id}/block`, { isBlocked });
    return res.data;
  },

  // ── Admin: KYC document management ───────────────────────────────────────
  listKyc: async (params?: KycListParams): Promise<KycDocument[]> => {
    const res = await api.get<KycListResponse>("/admin/kyc", {
      params: { limit: 100, ...params },
    });
    // Lowercase the status to match KycDocumentStatus
    return res.data.data.map((d) => ({
      ...d,
      status: d.status.toLowerCase() as KycDocumentStatus,
    }));
  },

  reviewKyc: async (
    id: number,
    status: "approved" | "rejected",
    reviewNote?: string,
  ): Promise<KycDocument> => {
    const res = await api.patch<KycDocument>(`/admin/kyc/${id}/review`, {
      status: status.toUpperCase(),
      reviewNote,
    });
    return { ...res.data, status: res.data.status.toLowerCase() as KycDocumentStatus };
  },
};
