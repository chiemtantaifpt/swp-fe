import { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";
import { User } from "@/contexts/AuthContext";
import api from "./api";
import type { BaseResponse } from "./baseResponse";
import {
  AuthApiError,
  type AuthTokenResponse,
  type EnterpriseInfo,
  type ParsedVerifyEmailResult,
  type RegisterResponse,
  type UserRole,
  type VerifyEmailResponse,
} from "./auth.types";

export type {
  AuthTokenResponse as AuthResponse,
  EnterpriseInfo,
  ParsedVerifyEmailResult,
  UserRole,
  VerifyEmailNextStep,
} from "./auth.types";

interface WrappedAuthResponse {
  data?: AuthTokenResponse;
  accessToken?: string;
  refreshToken?: string;
  expiredAt?: string;
}

interface JwtPayload {
  sub: string;
  email?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  role?: string;
  exp: number;
}

function decodeToken(token: string): { id: string; email: string; role: string } {
  const payload = jwtDecode<JwtPayload>(token);

  const email =
    payload.email ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
    "";

  const role =
    payload.role ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "";

  return {
    id: payload.sub,
    email,
    role,
  };
}

const PASSWORD_ERROR_MAP: Record<string, string> = {
  PasswordTooShort: "Mật khẩu phải có ít nhất 6 ký tự",
  PasswordRequiresDigit: "Mật khẩu phải có ít nhất 1 chữ số (0-9)",
  PasswordRequiresUpper: "Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)",
  PasswordRequiresLower: "Mật khẩu phải có ít nhất 1 chữ thường (a-z)",
  PasswordRequiresNonAlphanumeric: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%...)",
  DuplicateEmail: "Email này đã được sử dụng",
  DuplicateUserName: "Email này đã được sử dụng",
  InvalidEmail: "Email không hợp lệ",
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const mapAuthErrorMessage = (
  error: AxiosError<{
    code?: string;
    message?: { Key: string; Value: string[] }[] | string | null;
    errorMessage?: Record<string, string[]>;
    detail?: string;
  }>
): AuthApiError => {
  const data = error.response?.data;

  if (!data) {
    return new AuthApiError("Đã xảy ra lỗi. Vui lòng thử lại!", {
      code: "unknown_error",
      status: error.response?.status,
    });
  }

  if (Array.isArray(data.message)) {
    const msgs = data.message
      .map((item) => PASSWORD_ERROR_MAP[item.Key] || item.Value?.[0] || item.Key)
      .filter(Boolean);

    if (msgs.length > 0) {
      return new AuthApiError(msgs.join("\n"), {
        code: "validation_error",
        status: error.response?.status,
      });
    }
  }

  if (data.errorMessage && typeof data.errorMessage === "object") {
    const msgs = Object.entries(data.errorMessage)
      .map(([key, values]) => PASSWORD_ERROR_MAP[key] || values?.[0] || key)
      .filter(Boolean);

    if (msgs.length > 0) {
      return new AuthApiError(msgs.join("\n"), {
        code: "validation_error",
        status: error.response?.status,
        details: data.errorMessage,
      });
    }
  }

  const message = typeof data.message === "string" ? data.message : "";
  const normalized = message.toLowerCase();
  const backendCode = data.code?.toLowerCase();

  if (backendCode === "email_not_confirmed" || normalized.includes("email_not_confirmed")) {
    return new AuthApiError(
      "Email của bạn chưa được xác thực. Vui lòng kiểm tra hộp thư và bấm vào liên kết xác thực trước khi đăng nhập.",
      {
        code: "email_not_confirmed",
        status: error.response?.status,
      }
    );
  }

  if (
    normalized.includes("already verified") ||
    normalized.includes("already confirmed") ||
    normalized.includes("đã được xác thực") ||
    normalized.includes("đã xác thực")
  ) {
    return new AuthApiError("Email này đã được xác thực trước đó.", {
      code: "already_verified",
      status: error.response?.status,
    });
  }

  if (
    normalized.includes("invalid token") ||
    normalized.includes("token is invalid") ||
    normalized.includes("token expired") ||
    normalized.includes("liên kết xác thực không hợp lệ") ||
    normalized.includes("liên kết xác thực đã hết hạn")
  ) {
    return new AuthApiError("Liên kết xác thực không hợp lệ hoặc đã hết hạn.", {
      code: "invalid_token",
      status: error.response?.status,
    });
  }

  if (message) {
    return new AuthApiError(message, {
      code: data.code || "unknown_error",
      status: error.response?.status,
    });
  }

  if (error.response?.status === 400) {
    return new AuthApiError("Thông tin gửi lên không hợp lệ.", {
      code: "validation_error",
      status: error.response.status,
    });
  }

  if (error.response?.status === 401) {
    return new AuthApiError("Email hoặc mật khẩu không đúng.", {
      code: "unknown_error",
      status: error.response.status,
    });
  }

  if (error.response?.status === 500) {
    if (data.detail) console.error("[Backend 500]", data.detail);
    return new AuthApiError("Lỗi server. Vui lòng thử lại sau.", {
      code: "unknown_error",
      status: error.response.status,
    });
  }

  return new AuthApiError("Đã xảy ra lỗi. Vui lòng thử lại!", {
    code: "unknown_error",
    status: error.response?.status,
  });
};

const normalizeVerifyEmailResponse = (value: VerifyEmailResponse | BaseResponse<unknown>): ParsedVerifyEmailResult => {
  const root = isObject(value) ? value : {};
  const payload = "data" in root && isObject(root.data) ? root.data : {};

  const rootMessage = typeof root.message === "string" ? root.message : null;
  const payloadMessage = typeof payload.message === "string" ? payload.message : null;

  return {
    succeeded: typeof payload.succeeded === "boolean" ? payload.succeeded : true,
    email: typeof payload.email === "string" ? payload.email : null,
    role: typeof payload.role === "string" ? payload.role : null,
    message: payloadMessage ?? rootMessage,
    nextStep: typeof payload.nextStep === "string" ? payload.nextStep : "Login",
  };
};

export const authService = {
  login: async (email: string, password: string): Promise<AuthTokenResponse> => {
    try {
      const response = await api.post<WrappedAuthResponse>("/auth/login", {
        email,
        password,
      });
      const payload = response.data?.data ?? (response.data as unknown as AuthTokenResponse);
      return payload;
    } catch (error) {
      throw mapAuthErrorMessage(error as AxiosError);
    }
  },

  register: async (
    fullName: string,
    phone: string,
    email: string,
    password: string,
    role: UserRole,
    enterpriseInfo?: EnterpriseInfo,
    location?: { districtId?: string; wardId?: string }
  ) => {
    try {
      const response = await api.post<RegisterResponse>("/auth/register", {
        fullName,
        phone,
        email,
        password,
        role,
        ...(location?.districtId ? { districtId: location.districtId } : {}),
        ...(location?.wardId ? { wardId: location.wardId } : {}),
        ...(enterpriseInfo ? { enterpriseInfo } : {}),
      });

      return response.data;
    } catch (error) {
      throw mapAuthErrorMessage(error as AxiosError);
    }
  },

  verifyEmail: async (
    userId: string,
    token: string
  ): Promise<ParsedVerifyEmailResult> => {
    try {
      const response = await api.get<VerifyEmailResponse>("/auth/verify-email", {
        params: { userId, token },
      });
      return normalizeVerifyEmailResponse(response.data);
    } catch (error) {
      throw mapAuthErrorMessage(error as AxiosError);
    }
  },

  getUserAfterLogin: (token: string): User => {
    const decoded = decodeToken(token);

    if (!decoded.role) {
      console.warn("JWT payload không có role, đang dùng Citizen làm fallback.");
    }

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.email,
      role: (decoded.role || "Citizen") as UserRole,
    };
  },
};
