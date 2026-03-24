import type { BaseResponse } from "./baseResponse";
import type { UserRole } from "@/contexts/AuthContext";

export type ProfileBaseResponse<TData> = BaseResponse<TData>;

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  wardId: string | null;
  wardName: string | null;
  districtId: string | null;
  districtName: string | null;
  role: UserRole;
  emailConfirmed: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateUserProfilePayload {
  fullName: string;
  phoneNumber: string;
  wardId?: string | null;
  districtId?: string | null;
}

export interface EnterpriseDocument {
  id: string;
  recyclingEnterpriseId: string;
  documentType: string;
  originalFileName: string;
  storedFileName: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
  isDeleted: boolean;
}

export interface EnterpriseProfile {
  id: string;
  userId: string;
  name: string;
  taxCode: string;
  address: string;
  legalRepresentative: string;
  representativePosition: string;
  environmentLicenseFileId: string | null;
  approvalStatus: "PendingApproval" | "Approved" | "Rejected" | string;
  operationalStatus: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  rejectionReason: string | null;
  createdTime: string;
  documents: EnterpriseDocument[];
}

export interface UpsertEnterpriseProfilePayload {
  name: string;
  taxCode: string;
  address: string;
  legalRepresentative: string;
  representativePosition: string;
  environmentLicenseFileId?: string | null;
}

export interface SetEnvironmentLicensePayload {
  documentId: string;
}

export interface SubmitEnterpriseProfilePayload {
  note: string;
}

export interface SubmitEnterpriseProfileResult {
  enterpriseId: string;
  approvalStatus: string;
  submittedAt: string;
  message: string;
}

export interface CollectorProfile {
  id: string;
  collectorId: string;
  collectorName: string;
  collectorEmail: string;
  enterpriseId: string;
  isActive: boolean;
  isProfileCompleted: boolean;
  createdTime: string;
}

export interface CreateCollectorProfilePayload {
  collectorId: string;
  isActive: boolean;
}

export interface UpdateCollectorProfilePayload {
  isActive: boolean;
}

export interface CollectorProfileListParams {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  isActive?: boolean;
  isProfileCompleted?: boolean;
}

export interface PagedCollectorProfileResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  items: CollectorProfile[];
}
