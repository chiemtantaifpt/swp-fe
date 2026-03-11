import api from "./api";
import { RecyclingEnterprise, PagedResult } from "./enterpriseConfig";

interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: string | number;
  code?: string;
}

export interface EnterpriseApprovalListParams {
  PageNumber?: number;
  PageSize?: number;
}

export const enterpriseApprovalService = {
  getAll: async (params?: EnterpriseApprovalListParams): Promise<PagedResult<RecyclingEnterprise>> => {
    const res = await api.get<ApiResponse<PagedResult<RecyclingEnterprise>>>("/admin/enterprise-approvals", { params });
    return res.data.data;
  },

  getById: async (enterpriseId: string): Promise<RecyclingEnterprise> => {
    const res = await api.get<ApiResponse<{ enterprise: RecyclingEnterprise }>>(`/admin/enterprise-approvals/${enterpriseId}`);
    return res.data.data.enterprise;
  },

  approve: async (enterpriseId: string): Promise<void> => {
    await api.post("/admin/enterprise-approvals/approve", { enterpriseId });
  },

  reject: async (enterpriseId: string, reason: string): Promise<void> => {
    await api.post("/admin/enterprise-approvals/reject", { enterpriseId, reason });
  },
};
