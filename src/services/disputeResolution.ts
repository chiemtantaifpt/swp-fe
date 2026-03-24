import type { AxiosError } from "axios";
import api from "./api";
import type { BaseResponse } from "./baseResponse";

export interface DisputeResolution {
  id: string;
  complaintId: string;
  enterpriseId: string;
  responseNote: string;
  resolvedAt: string;
  createdTime: string;
  handlerId?: string;
  handlerName?: string | null;
  resolutionNote?: string | null;
}

export interface CreateDisputeResolutionPayload {
  complaintId: string;
  responseNote: string;
}

export interface DisputeResolutionFilterParams {
  pageNumber?: number;
  pageSize?: number;
  complaintId?: string;
  enterpriseId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface DisputeResolutionListParams extends DisputeResolutionFilterParams {
  ComplaintId?: string;
  HandlerId?: string;
  FromDate?: string;
  ToDate?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface PagedDisputeResolutionResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  items: DisputeResolution[];
}

export type DisputeResolutionListResponse = PagedDisputeResolutionResponse;

export interface DisputeResolutionApiError {
  message?: string;
  statusCode?: string | number;
  code?: string;
  errors?: Record<string, string[]>;
}

export type DisputeResolutionAxiosError = AxiosError<DisputeResolutionApiError>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasDataEnvelope = <TData>(value: unknown): value is BaseResponse<TData> =>
  isObject(value) && "data" in value;

const cleanParams = (params?: Record<string, unknown>) => {
  if (!params) return undefined;

  const entries = Object.entries(params).filter(([, value]) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const normalizeDisputeResolution = (value: unknown): DisputeResolution => {
  const item = (isObject(value) ? value : {}) as Partial<DisputeResolution> & {
    handlerId?: string;
    responseNote?: string | null;
    resolutionNote?: string | null;
    resolvedAt?: string | null;
    createdTime?: string | null;
  };

  return {
    id: String(item.id ?? ""),
    complaintId: String(item.complaintId ?? ""),
    enterpriseId: String(item.enterpriseId ?? item.handlerId ?? ""),
    responseNote: String(item.responseNote ?? item.resolutionNote ?? ""),
    resolvedAt: String(item.resolvedAt ?? item.createdTime ?? ""),
    createdTime: String(item.createdTime ?? item.resolvedAt ?? ""),
    handlerId: item.handlerId ? String(item.handlerId) : undefined,
    handlerName: item.handlerName == null ? null : String(item.handlerName),
    resolutionNote: item.resolutionNote == null ? null : String(item.resolutionNote),
  };
};

const normalizeList = (value: unknown): DisputeResolution[] => {
  const payload = hasDataEnvelope<unknown>(value) ? value.data : value;

  if (Array.isArray(payload)) {
    return payload.map(normalizeDisputeResolution);
  }

  if (Array.isArray((payload as { items?: unknown[] })?.items)) {
    return ((payload as { items: unknown[] }).items).map(normalizeDisputeResolution);
  }

  if (Array.isArray((payload as { data?: unknown[] })?.data)) {
    return ((payload as { data: unknown[] }).data).map(normalizeDisputeResolution);
  }

  return [];
};

const normalizePagedList = (
  value: unknown,
  fallback?: DisputeResolutionFilterParams | DisputeResolutionListParams
): PagedDisputeResolutionResponse => {
  const payload = hasDataEnvelope<unknown>(value) ? value.data : value;
  const page = (isObject(payload) ? payload : {}) as Partial<PagedDisputeResolutionResponse>;
  const items = normalizeList(payload);
  const fallbackPageNumberCandidate = isObject(fallback)
    ? ("pageNumber" in fallback ? fallback.pageNumber : fallback?.PageNumber)
    : undefined;
  const fallbackPageSizeCandidate = isObject(fallback)
    ? ("pageSize" in fallback ? fallback.pageSize : fallback?.PageSize)
    : undefined;
  const fallbackPageNumber =
    typeof fallbackPageNumberCandidate === "number" ? fallbackPageNumberCandidate : undefined;
  const fallbackPageSize =
    typeof fallbackPageSizeCandidate === "number" ? fallbackPageSizeCandidate : undefined;

  return {
    totalCount: typeof page.totalCount === "number" ? page.totalCount : items.length,
    pageNumber: typeof page.pageNumber === "number" ? page.pageNumber : fallbackPageNumber ?? 1,
    pageSize: typeof page.pageSize === "number" ? page.pageSize : fallbackPageSize ?? items.length,
    items,
  };
};

export const disputeResolutionQueryKeys = {
  all: ["disputeResolutions"] as const,
  list: (params?: DisputeResolutionFilterParams) => ["disputeResolutions", "list", params ?? {}] as const,
  byComplaint: (complaintId?: string | null) => ["disputeResolutions", "complaint", complaintId ?? ""] as const,
  detail: (id?: string | null) => ["disputeResolutions", "detail", id ?? ""] as const,
};

export const disputeResolutionService = {
  create: async (body: CreateDisputeResolutionPayload): Promise<DisputeResolution> => {
    const res = await api.post<DisputeResolution | BaseResponse<DisputeResolution>>("/DisputeResolution", body);
    return normalizeDisputeResolution(hasDataEnvelope<DisputeResolution>(res.data) ? res.data.data : res.data);
  },

  getAll: async (params?: DisputeResolutionListParams): Promise<DisputeResolutionListResponse> => {
    const normalizedParams = cleanParams({
      pageNumber: params?.pageNumber ?? params?.PageNumber,
      pageSize: params?.pageSize ?? params?.PageSize,
      complaintId: params?.complaintId ?? params?.ComplaintId,
      enterpriseId: params?.enterpriseId ?? params?.HandlerId,
      fromDate: params?.fromDate ?? params?.FromDate,
      toDate: params?.toDate ?? params?.ToDate,
    });

    const res = await api.get<PagedDisputeResolutionResponse | BaseResponse<PagedDisputeResolutionResponse>>(
      "/DisputeResolution",
      { params: normalizedParams }
    );
    return normalizePagedList(res.data, params);
  },

  getById: async (id: string): Promise<DisputeResolution> => {
    const res = await api.get<DisputeResolution | BaseResponse<DisputeResolution>>(`/DisputeResolution/${id}`);
    return normalizeDisputeResolution(hasDataEnvelope<DisputeResolution>(res.data) ? res.data.data : res.data);
  },

  getByComplaint: async (complaintId: string): Promise<DisputeResolution[]> => {
    const res = await api.get<DisputeResolution[] | BaseResponse<DisputeResolution[]>>(
      `/DisputeResolution/by-complaint/${complaintId}`
    );
    return normalizeList(res.data);
  },

  createDisputeResolution: async (body: CreateDisputeResolutionPayload): Promise<DisputeResolution> => {
    return disputeResolutionService.create(body);
  },

  getDisputeResolutionById: async (id: string): Promise<DisputeResolution> => {
    return disputeResolutionService.getById(id);
  },

  getDisputeResolutionsByComplaintId: async (complaintId: string): Promise<DisputeResolution[]> => {
    return disputeResolutionService.getByComplaint(complaintId);
  },

  getPagedDisputeResolutions: async (
    params?: DisputeResolutionFilterParams | DisputeResolutionListParams
  ): Promise<DisputeResolutionListResponse> => {
    return disputeResolutionService.getAll(params);
  },
};
