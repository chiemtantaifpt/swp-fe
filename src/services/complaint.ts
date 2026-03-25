import type { AxiosError } from "axios";
import api from "./api";
import type { BaseResponse } from "./baseResponse";
import type { DisputeResolution } from "./disputeResolution";

export type ComplaintStatus =
  | "Open"
  | "InReview"
  | "EnterpriseResponded"
  | "Resolved"
  | "Rejected";

export type ComplaintType = "Complaint" | "Feedback" | string;

export interface Complaint {
  id: string;
  complainantId: string;
  reportId: string;
  collectionRequestId?: string | null;
  type: ComplaintType;
  status: ComplaintStatus;
  content: string;
  createdTime: string;
  resolutions: DisputeResolution[];
}

export interface PagedComplaintResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  items: Complaint[];
}

export interface ComplaintFilterParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  reportId?: string;
}

export interface ComplaintListParams extends ComplaintFilterParams {
  ComplainantId?: string;
  Status?: string;
  Type?: string;
  ReportId?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface ComplaintCreateBody {
  reportId: string;
  collectionRequestId?: string | null;
  type: ComplaintType;
  content: string;
}

export type ComplaintListResponse = PagedComplaintResponse;

export interface ComplaintApiError {
  message?: string;
  statusCode?: string | number;
  code?: string;
  errors?: Record<string, string[]>;
}

export type ComplaintAxiosError = AxiosError<ComplaintApiError>;

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

const normalizeComplaint = (value: unknown): Complaint => {
  const item = (isObject(value) ? value : {}) as Partial<Complaint>;

  return {
    id: String(item.id ?? ""),
    complainantId: String(item.complainantId ?? ""),
    reportId: String(item.reportId ?? ""),
    collectionRequestId: item.collectionRequestId == null ? null : String(item.collectionRequestId),
    type: (item.type ?? "Complaint") as ComplaintType,
    status: (item.status ?? "Open") as ComplaintStatus,
    content: String(item.content ?? ""),
    createdTime: String(item.createdTime ?? ""),
    resolutions: Array.isArray(item.resolutions) ? (item.resolutions as DisputeResolution[]) : [],
  };
};

const normalizePagedComplaints = (
  value: unknown,
  fallback?: ComplaintFilterParams | ComplaintListParams
): PagedComplaintResponse => {
  const payload = hasDataEnvelope<unknown>(value) ? value.data : value;
  const page = (isObject(payload) ? payload : {}) as Partial<PagedComplaintResponse>;
  const items = Array.isArray(page.items) ? page.items.map(normalizeComplaint) : [];
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

const normalizeComplaintDetail = (value: unknown): Complaint => {
  const payload = hasDataEnvelope<unknown>(value) ? value.data : value;
  return normalizeComplaint(payload);
};

export const complaintQueryKeys = {
  all: ["complaints"] as const,
  enterprise: (params?: ComplaintFilterParams) => ["complaints", "enterprise", params ?? {}] as const,
  detail: (id?: string | null) => ["complaints", "detail", id ?? ""] as const,
};

export const complaintService = {
  create: async (body: ComplaintCreateBody): Promise<Complaint> => {
    const res = await api.post<Complaint | BaseResponse<Complaint>>("/Complaint", body);
    return normalizeComplaintDetail(res.data);
  },

  getMy: async (params?: ComplaintListParams): Promise<ComplaintListResponse> => {
    const normalizedParams = cleanParams({
      ComplainantId: params?.ComplainantId,
      Status: params?.Status ?? params?.status,
      Type: params?.Type ?? params?.type,
      ReportId: params?.ReportId ?? params?.reportId,
      PageNumber: params?.PageNumber ?? params?.pageNumber,
      PageSize: params?.PageSize ?? params?.pageSize,
    });

    const res = await api.get<PagedComplaintResponse | BaseResponse<PagedComplaintResponse>>("/Complaint/my", {
      params: normalizedParams,
    });
    return normalizePagedComplaints(res.data, params);
  },

  getAdmin: async (params?: ComplaintListParams): Promise<ComplaintListResponse> => {
    const normalizedParams = cleanParams({
      Status: params?.Status ?? params?.status,
      Type: params?.Type ?? params?.type,
      ReportId: params?.ReportId ?? params?.reportId,
      PageNumber: params?.PageNumber ?? params?.pageNumber,
      PageSize: params?.PageSize ?? params?.pageSize,
    });

    const res = await api.get<PagedComplaintResponse | BaseResponse<PagedComplaintResponse>>("/Complaint/admin", {
      params: normalizedParams,
    });
    return normalizePagedComplaints(res.data, params);
  },

  getEnterprise: async (params?: ComplaintFilterParams): Promise<PagedComplaintResponse> => {
    const normalizedParams = cleanParams({
      pageNumber: params?.pageNumber,
      pageSize: params?.pageSize,
      status: params?.status,
      type: params?.type,
      reportId: params?.reportId,
    });

    const res = await api.get<PagedComplaintResponse | BaseResponse<PagedComplaintResponse>>("/Complaint/enterprise", {
      params: normalizedParams,
    });
    return normalizePagedComplaints(res.data, params);
  },

  getById: async (id: string): Promise<Complaint> => {
    const res = await api.get<Complaint | BaseResponse<Complaint>>(`/Complaint/${id}`);
    return normalizeComplaintDetail(res.data);
  },

  updateStatus: async (id: string, status: ComplaintStatus | string): Promise<void> => {
    await api.put(`/Complaint/${id}/status`, { status });
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/Complaint/${id}`);
  },

  createComplaint: async (body: ComplaintCreateBody): Promise<Complaint> => {
    return complaintService.create(body);
  },

  getMyComplaints: async (params?: ComplaintListParams): Promise<ComplaintListResponse> => {
    return complaintService.getMy(params);
  },

  getEnterpriseComplaints: async (params?: ComplaintFilterParams): Promise<PagedComplaintResponse> => {
    return complaintService.getEnterprise(params);
  },

  getComplaintById: async (id: string): Promise<Complaint> => {
    return complaintService.getById(id);
  },

  updateComplaintStatus: async (id: string, status: ComplaintStatus | string): Promise<void> => {
    await complaintService.updateStatus(id, status);
  },

  deleteComplaint: async (id: string): Promise<void> => {
    await complaintService.delete(id);
  },
};
