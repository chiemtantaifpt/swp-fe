import api from "./api";
import { BaseResponse, unwrapBaseResponse } from "./baseResponse";

export interface PointRule {
  wasteTypeId: string;
  wasteTypeName?: string | null;
  basePoint: number;
  isActive?: boolean;
  createdTime?: string | null;
  lastUpdatedTime?: string | null;
  [key: string]: unknown;
}

export interface CreatePointRuleDto {
  wasteTypeId: string;
  basePoint: number;
}

export interface UpdatePointRuleDto {
  basePoint: number;
  isActive: boolean;
}

const normalizePointRules = (data: unknown): PointRule[] => {
  if (Array.isArray(data)) return data as PointRule[];
  if (Array.isArray((data as { items?: unknown[] })?.items)) {
    return (data as { items: PointRule[] }).items;
  }
  if (Array.isArray((data as { data?: unknown[] })?.data)) {
    return (data as { data: PointRule[] }).data;
  }
  return [];
};

const normalizeSinglePointRule = (data: unknown): PointRule => {
  if (data && typeof data === "object" && "data" in (data as Record<string, unknown>)) {
    return unwrapBaseResponse(data as BaseResponse<PointRule>);
  }
  return data as PointRule;
};

export const pointRuleService = {
  getAll: async (): Promise<PointRule[]> => {
    const res = await api.get("/PointRule");
    const data = res.data as unknown;
    if (data && typeof data === "object" && "data" in (data as Record<string, unknown>)) {
      return normalizePointRules(unwrapBaseResponse(data as BaseResponse<unknown>));
    }
    return normalizePointRules(data);
  },

  create: async (body: CreatePointRuleDto): Promise<PointRule> => {
    const res = await api.post("/PointRule", body);
    return normalizeSinglePointRule(res.data);
  },

  update: async (wasteTypeId: string, body: UpdatePointRuleDto): Promise<PointRule> => {
    const res = await api.put(`/PointRule/${wasteTypeId}`, body);
    return normalizeSinglePointRule(res.data);
  },
};
