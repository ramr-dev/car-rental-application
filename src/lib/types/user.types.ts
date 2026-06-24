export type KycStatus = "not_started" | "pending" | "approved" | "rejected";
export type KycDocumentStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin" | "host";
  kycStatus: KycStatus;
  hostStatus?: "NOT_A_HOST" | "PENDING_KYC" | "VERIFIED" | "REJECTED";
  isBlocked?: boolean;
  createdAt?: string;
  bookingCount?: number;
}

export interface KycDocument {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: string;
  documentNumber: string;
  expiryDate: string;
  country: string;
  filePath: string;
  status: KycDocumentStatus;
  reviewedById?: string;
  reviewNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface MyKycDocument {
  id: number;
  userId: string;
  documentType: string;
  documentNumber: string;
  expiryDate: string;
  country: string;
  filePath: string;
  status: KycDocumentStatus;
  reviewNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}
