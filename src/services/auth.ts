import api from "./api";
import { User, UserRole } from "@/contexts/AuthContext";
import { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";

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
}

// Actual backend response shape — BE wraps data: { data: { accessToken, ... } }
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiredAt: string;
}

interface WrappedAuthResponse {
  data?: AuthResponse;
  accessToken?: string;
  refreshToken?: string;
  expiredAt?: string;
}

// JWT payload shape từ backend
interface JwtPayload {
  sub: string;
  email?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  role?: string; 
  exp: number;
}

// Decode JWT để lấy id và email cơ bản
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

// Map BE error keys sang tiếng Việt
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

// Parse lỗi từ backend thành string tiếng Việt
function parseBackendError(error: AxiosError): string {
  const data = error.response?.data as {
    code?: string;
    message?: { Key: string; Value: string[] }[] | string | null;
    errorMessage?: Record<string, string[]>;
    detail?: string;
    statusCode?: number;
  } | undefined;

  if (!data) return "Đã xảy ra lỗi. Vui lòng thử lại!";

  // Format: { message: [{Key: "...", Value: ["..."]}] } — validation errors
  if (Array.isArray(data.message)) {
    const msgs = data.message
      .map((item) => PASSWORD_ERROR_MAP[item.Key] || item.Value?.[0] || item.Key)
      .filter(Boolean);
    if (msgs.length > 0) return msgs.join("\n");
  }

  // Format: { errorMessage: { Key: ["..."] } }
  if (data.errorMessage && typeof data.errorMessage === "object") {
    const msgs = Object.entries(data.errorMessage)
      .map(([key, values]) => PASSWORD_ERROR_MAP[key] || values?.[0] || key)
      .filter(Boolean);
    if (msgs.length > 0) return msgs.join("\n");
  }

  // Format: message là string
  if (typeof data.message === "string" && data.message) {
    return data.message;
  }

  // Status code specific messages
  if (error.response?.status === 400) return "Email đã tồn tại hoặc thông tin không hợp lệ";
  if (error.response?.status === 401) return "Email hoặc mật khẩu không đúng";
  if (error.response?.status === 500) {
    // Log chi tiết lỗi server để debug
    if (data.detail) console.error("[Backend 500]", data.detail);
    return "Lỗi server. Vui lòng liên hệ quản trị viên!";
  }

  return "Đã xảy ra lỗi. Vui lòng thử lại!";
}

export interface EnterpriseInfo {
  enterpriseName: string;
  taxCode: string;
  address: string;
  legalRepresentative: string;
  representativePosition: string;
  environmentLicenseFileId?: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post<WrappedAuthResponse>("/auth/login", {
        email,
        password,
      });
      // BE có thể trả { data: { accessToken } } hoặc { accessToken } trực tiếp
      const payload = response.data?.data ?? (response.data as unknown as AuthResponse);
      return payload;
    } catch (error) {
      const msg = parseBackendError(error as AxiosError);
      throw new Error(msg);
    }
  },

  register: async (
    fullName: string,
    phone: string,
    email: string,
    password: string,
    role: UserRole,
    enterpriseInfo?: EnterpriseInfo
  ): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>("/auth/register", {
        fullName,
        phone,
        email,
        password,
        role,
        ...(enterpriseInfo ? { enterpriseInfo } : {}),
      });
      return response.data;
    } catch (error) {
      const msg = parseBackendError(error as AxiosError);
      throw new Error(msg);
    }
  },

  getUserAfterLogin: (token: string): User => {
    const decoded = decodeToken(token);

    if (!decoded.role) {
      console.warn("JWT payload không có role (kiểm tra lại BE claim role).");
    }

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.email,
      role: (decoded.role || "Citizen") as UserRole,
    };
  },

  buildUserFromRegister: (token: string, fullName: string, role: UserRole): User => {
    const decoded = decodeToken(token);
    return {
      id: decoded.id,
      email: decoded.email,
      name: fullName,
      role,
    };
  },

};