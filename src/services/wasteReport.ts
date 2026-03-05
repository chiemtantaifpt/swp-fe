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
  wasteTypeId: string;
  wasteTypeName?: string;
  description?: string;
  address: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  status: WasteReportStatus;
  points?: number;
  createdAt: string;
  citizenId?: string;
  citizenName?: string;
  collectorId?: string;
  collectorName?: string;
}

export interface WasteItem {
  wasteTypeId: string;
  note?: string;
  images?: string[]; // Cloudinary URLs (upload trước qua /api/Image/upload-multiple)
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
  // POST /api/WasteReport — multipart/form-data
  create: async (data: CreateWasteReportRequest): Promise<WasteReport> => {
    const formData = new FormData();
    if (data.description) formData.append("Description", data.description);
    if (data.latitude != null) formData.append("Latitude", data.latitude.toString());
    if (data.longitude != null) formData.append("Longitude", data.longitude.toString());
    // [FromForm] binding yêu cầu indexed fields cho nested collections
    data.wastes.forEach((w, i) => {
      formData.append(`Wastes[${i}].WasteTypeId`, w.wasteTypeId);
      if (w.note) formData.append(`Wastes[${i}].Note`, w.note);
      w.images?.forEach((url, j) => {
        formData.append(`Wastes[${i}].Images[${j}]`, url);
      });
    });
    const response = await api.post<WasteReport>("/WasteReport", formData, {
      headers: { "Content-Type": "multipart/form-data" },
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
};
