import api from "./api";

export interface AdminUserManagementItem {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: string;
  isActive: boolean;
  isDeleted: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminUserManagementParams {
  Role?: string;
  SearchTerm?: string;
  IsActive?: boolean;
  EmailConfirmed?: boolean;
  PageNumber?: number;
  PageSize?: number;
  role?: string;
  searchTerm?: string;
  isActive?: boolean;
  emailConfirmed?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface AdminUserManagementResponse {
  items: AdminUserManagementItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUpdateUserStatusPayload {
  isActive: boolean;
}

interface ApiEnvelope<T> {
  data: T;
  message?: string | null;
  statusCode?: string | number;
  code?: string;
}

const cleanParams = (params?: Record<string, unknown>) => {
  if (!params) return undefined;
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  return entries.length ? Object.fromEntries(entries) : undefined;
};

const normalizePage = (
  payload: Partial<AdminUserManagementResponse> | undefined,
  fallback?: AdminUserManagementParams
): AdminUserManagementResponse => ({
  items: Array.isArray(payload?.items) ? payload.items : [],
  totalCount: typeof payload?.totalCount === "number" ? payload.totalCount : 0,
  pageNumber: typeof payload?.pageNumber === "number" ? payload.pageNumber : fallback?.PageNumber ?? fallback?.pageNumber ?? 1,
  pageSize: typeof payload?.pageSize === "number" ? payload.pageSize : fallback?.PageSize ?? fallback?.pageSize ?? 20,
  totalPages: typeof payload?.totalPages === "number" ? payload.totalPages : 1,
});

export const adminUserManagementService = {
  getUsers: async (params?: AdminUserManagementParams): Promise<AdminUserManagementResponse> => {
    const normalizedParams = cleanParams({
      Role: params?.Role ?? params?.role,
      SearchTerm: params?.SearchTerm ?? params?.searchTerm,
      IsActive: params?.IsActive ?? params?.isActive,
      EmailConfirmed: params?.EmailConfirmed ?? params?.emailConfirmed,
      PageNumber: params?.PageNumber ?? params?.pageNumber,
      PageSize: params?.PageSize ?? params?.pageSize,
    });

    const response = await api.get<ApiEnvelope<AdminUserManagementResponse> | AdminUserManagementResponse>(
      "/admin/users",
      { params: normalizedParams }
    );

    const payload =
      response.data && typeof response.data === "object" && "data" in response.data
        ? (response.data as ApiEnvelope<AdminUserManagementResponse>).data
        : (response.data as AdminUserManagementResponse);

    return normalizePage(payload, params);
  },

  updateUserStatus: async (userId: string, body: AdminUpdateUserStatusPayload): Promise<void> => {
    await api.put(`/admin/users/${userId}/status`, body);
  },
};
