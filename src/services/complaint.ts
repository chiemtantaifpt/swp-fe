import api from "./api";

export type ComplaintStatus =
  | "Open"
  | "InReview"
  | "Resolved"
  | "Rejected";

export type ComplaintType = "Feedback" | "Complaint" | string;

export interface ComplaintResolution {
  id?: string;
  status?: string;
  content?: string;
  note?: string | null;
  createdTime?: string;
  createdById?: string;
  [key: string]: unknown;
}

export interface Complaint {
  id: string;
  complainantId: string;
  reportId: string;
  collectionRequestId: string | null;
  type: ComplaintType;
  status: ComplaintStatus | string;
  content: string;
  createdTime: string;
  resolutions: ComplaintResolution[];
}

export interface ComplaintListParams {
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

export interface ComplaintListResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  items: Complaint[];
}

export const complaintService = {
  create: async (body: ComplaintCreateBody): Promise<Complaint> => {
    const res = await api.post<Complaint>("/Complaint", body);
    return res.data;
  },

  getMy: async (params?: ComplaintListParams): Promise<ComplaintListResponse> => {
    const res = await api.get<ComplaintListResponse>("/Complaint/my", { params });
    return res.data;
  },

  getAdmin: async (params?: ComplaintListParams): Promise<ComplaintListResponse> => {
    const res = await api.get<ComplaintListResponse>("/Complaint/admin", { params });
    return res.data;
  },

  getById: async (id: string): Promise<Complaint> => {
    const res = await api.get<Complaint>(`/Complaint/${id}`);
    return res.data;
  },

  updateStatus: async (id: string, status: ComplaintStatus | string): Promise<void> => {
    await api.put(`/Complaint/${id}/status`, { status });
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/Complaint/${id}`);
  },
};
