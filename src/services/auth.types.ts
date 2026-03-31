import type { BaseResponse } from "./baseResponse";

export type UserRole = "Citizen" | "Enterprise" | "Collector" | "Admin";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
  wardId?: string;
  districtId?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiredAt: string;
}

export interface RegisterResponseData {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  requireEmailVerification: boolean;
  message: string;
}

export type RegisterResponse = BaseResponse<RegisterResponseData>;

export type VerifyEmailNextStep =
  | "Login"
  | "CompleteEnterpriseProfile"
  | "WaitForApproval"
  | string;

export interface VerifyEmailResponseData {
  succeeded: boolean;
  email: string;
  role: UserRole | string;
  message: string;
  nextStep: VerifyEmailNextStep;
}

export type VerifyEmailResponse = BaseResponse<VerifyEmailResponseData>;

export interface ParsedVerifyEmailResult {
  succeeded: boolean;
  email: string | null;
  role: string | null;
  message: string | null;
  nextStep: VerifyEmailNextStep;
}

export interface EnterpriseInfo {
  enterpriseName: string;
  taxCode: string;
  address: string;
  legalRepresentative: string;
  representativePosition: string;
  environmentLicenseFileId?: string;
}

export type AuthErrorCode =
  | "email_not_confirmed"
  | "invalid_token"
  | "already_verified"
  | "validation_error"
  | "unknown_error";

export class AuthApiError extends Error {
  code?: AuthErrorCode | string;
  status?: number;
  details?: Record<string, string[]>;

  constructor(
    message: string,
    options?: {
      code?: AuthErrorCode | string;
      status?: number;
      details?: Record<string, string[]>;
    }
  ) {
    super(message);
    this.name = "AuthApiError";
    this.code = options?.code;
    this.status = options?.status;
    this.details = options?.details;
  }
}
