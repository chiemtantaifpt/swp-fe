import api from "./api";

export type WasteReportStatus =
  | "PENDING"
  | "PROCESSING"
  | "ASSIGNED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export interface WasteReport {
  id: string;
  citizenId?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  status: WasteReportStatus;
  createdTime: string;
  wastes: WasteItem[];
  points?: number;
  citizenName?: string;
  collectorId?: string;
  collectorName?: string;
  address?: string;
}

export interface WasteItem {
  wasteTypeId: string;
  wasteTypeName?: string;
  quantity?: number;    // BE constraint: Quantity > 0
  note?: string;
  imageUrls?: string[]; // Cloudinary URLs — returned by GET response
  images?: string[];    // Cloudinary URLs — sent in POST body
}

export interface CreateWasteReportRequest {
  description?: string;
  latitude?: number;
  longitude?: number;
  wastes: WasteItem[];
}

export interface WasteReportListParams {
  CitizenId?: string;
  Status?: string;
  Keyword?: string;
  PageNumber?: number;
  PageSize?: number;
}

export const wasteReportService = {
  // POST /api/WasteReport — application/json
  create: async (data: CreateWasteReportRequest): Promise<WasteReport> => {
    const response = await api.post<WasteReport>("/WasteReport", data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  },

  // GET /api/WasteReport — Lấy danh sách, handle cả array lẫn paginated object
  getAll: async (params?: WasteReportListParams): Promise<WasteReport[]> => {
    const response = await api.get("/WasteReport", { params });
    const data = response.data;
    // BE trả về array trực tiếp
    if (Array.isArray(data)) return data;
    // BE trả về { items: [], total: ... } hoặc { data: [] }
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    // Fallback an toàn
    return [];
  },

  // GET /api/WasteReport/{id} — Lấy chi tiết 1 báo cáo
  getById: async (id: string): Promise<WasteReport> => {
    const response = await api.get<WasteReport>(`/WasteReport/${id}`);
    return response.data;
  },

  // PUT /api/WasteReport/{id} — Cập nhật báo cáo (Enterprise accept/reject, Collector update status)
  update: async (id: string, data: Partial<WasteReport>): Promise<WasteReport> => {
    const response = await api.put<WasteReport>(`/WasteReport/${id}`, data);
    return response.data;
  },

  // DELETE /api/WasteReport/{id} — Citizen hủy báo cáo
  delete: async (id: string): Promise<void> => {
    await api.delete(`/WasteReport/${id}`);
  },

  // GET /api/WasteReport/{reportId}/proof
  getProof: async (reportId: string): Promise<WasteReportProof | null> => {
    try {
      const response = await api.get<WasteReportProof>(`/WasteReport/${reportId}/proof`);
      return response.data;
    } catch {
      return null;
    }
  },
};

export interface WasteReportProof {
  proofId: string;
  createdTime: string;
  notes: string | null;
  reviewStatus: string;
  images: string[];
}
