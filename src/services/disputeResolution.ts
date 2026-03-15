import api from "./api";

export interface DisputeResolution {
  id: string;
  complaintId: string;
  handlerId?: string;
  handlerName?: string | null;
  responseNote?: string | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  createdTime?: string | null;
  lastUpdatedTime?: string | null;
  [key: string]: unknown;
}

export interface DisputeResolutionListParams {
  ComplaintId?: string;
  HandlerId?: string;
  FromDate?: string;
  ToDate?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface CreateDisputeResolutionBody {
  complaintId: string;
  responseNote: string;
}

export interface DisputeResolutionListResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  items: DisputeResolution[];
}

const normalizeList = (data: unknown): DisputeResolution[] => {
  if (Array.isArray(data)) return data as DisputeResolution[];
  if (Array.isArray((data as { items?: unknown[] })?.items)) {
    return (data as { items: DisputeResolution[] }).items;
  }
  if (Array.isArray((data as { data?: unknown[] })?.data)) {
    return (data as { data: DisputeResolution[] }).data;
  }
  return [];
};

export const disputeResolutionService = {
  create: async (body: CreateDisputeResolutionBody): Promise<DisputeResolution> => {
    const res = await api.post<DisputeResolution>("/DisputeResolution", body);
    return res.data;
  },

  getAll: async (params?: DisputeResolutionListParams): Promise<DisputeResolutionListResponse> => {
    const res = await api.get("/DisputeResolution", { params });
    const data = res.data as Partial<DisputeResolutionListResponse> & { data?: unknown[] };
    return {
      totalCount: data.totalCount ?? normalizeList(data).length,
      pageNumber: data.pageNumber ?? params?.PageNumber ?? 1,
      pageSize: data.pageSize ?? params?.PageSize ?? normalizeList(data).length,
      items: normalizeList(data),
    };
  },

  getById: async (id: string): Promise<DisputeResolution> => {
    const res = await api.get<DisputeResolution>(`/DisputeResolution/${id}`);
    return res.data;
  },

  getByComplaint: async (complaintId: string): Promise<DisputeResolution[]> => {
    const res = await api.get(`/DisputeResolution/by-complaint/${complaintId}`);
    return normalizeList(res.data);
  },
};
