import api from "./api";

export type WasteReportStatus =
  | "Pending"
  | "Accepted"
  | "Assigned"
  | "OnTheWay"
  | "Collected"
  | "Verified"
  | "Rejected"
  | "Disputed"
  | "NoEnterpriseAvailable";

export type RejectionReason = "WrongWasteType" | "ImageNotClear";

export interface WasteReport {
  id: string;
  citizenId?: string;
  collectionRequestId?: string | null;
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
  rejectionReasons?: RejectionReason[]; // Lý do từ chối từ enterprises
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
  address?: string;
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

  // PUT /api/WasteReport/{id} — Cập nhật báo cáo chung
  update: async (id: string, data: Partial<WasteReport>): Promise<WasteReport> => {
    const response = await api.put<WasteReport>(`/WasteReport/${id}`, data);
    return response.data;
  },

  // PUT /api/WasteReport/{id} (NoEnterpriseAvailable) — Chỉnh sửa khi NoEnterpriseAvailable
  // Khi report bị từ chối liên tiếp bởi 3 enterprise khác nhau, status chuyển thành NoEnterpriseAvailable
  // Nếu bị từ chối bởi 1 trong 2 lý do: WrongWasteType / ImageNotClear, thì bắt buộc phải edit lại và không được redispatch
  // Nếu bị từ chối 3 lần bởi lí do khác, có thể chọn redispatch (1 lần) hoặc edit (cũng sẽ redispatch)
  // Edit (update) sẽ gửi lại report và BE tự động xử lý redispatch, nên không cần gọi redispatch riêng khi đã edit
  updateNoEnterpriseAvailable: async (
    id: string,
    data: Pick<WasteReport, "description" | "address" | "latitude" | "longitude" | "wastes">,
  ): Promise<WasteReport> => {
    const response = await api.put<WasteReport>(`/WasteReport/${id}`, data);
    return response.data;
  },

  // POST /api/WasteReport/{id}/redispatch — Tái tạo lại đơn khi treo hoặc bị từ chối nhiều
  // Chỉ được gọi một lần cho mỗi report
  // Không gọi redispatch nếu report bị từ chối vì WrongWasteType/ImageNotClear (phải edit lại)
  redispatch: async (id: string): Promise<void> => {
    await api.post(`/WasteReport/${id}/redispatch`);
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
