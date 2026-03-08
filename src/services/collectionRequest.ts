import api from "./api";

export interface CollectionRequest {
  id: string;
  wasteReportWasteId: string;
  wasteReportId: string;
  enterpriseId: string;
  status: string;
  priorityScore: number;
  wasteTypeId: string;
  wasteTypeName?: string;
  note?: string;
  imageUrls?: string[];
  latitude?: number;
  longitude?: number;
  regionCode?: string;
  createdTime: string;
}

export interface CollectionRequestListParams {
  Status?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface PagedCollectionResult {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  items: CollectionRequest[];
}

// ─────────────────────────────────────────────
export interface Collector {
  userId: string;
  collectorProfileId: string;
  email: string;
  fullName: string;
  isActive: boolean;
  isProfileCompleted: boolean;
  enterpriseId: string;
}

export const collectionRequestService = {
  getAll: async (params?: CollectionRequestListParams): Promise<PagedCollectionResult> => {
    const res = await api.get<PagedCollectionResult>("/CollectionRequest/enterprise", { params });
    return res.data;
  },

  accept: async (id: string): Promise<void> => {
    await api.post("/CollectionRequest/accept", { requestId: id });
  },

  reject: async (id: string, reason?: string): Promise<void> => {
    await api.post("/CollectionRequest/reject", { requestId: id, reason: reason ?? "" });
  },

  assign: async (id: string, collectorId: string): Promise<void> => {
    await api.put(`/CollectionRequest/${id}/assign`, { collectorId });
  },
};

export const collectorService = {
  getMyCollectors: async (): Promise<Collector[]> => {
    const res = await api.get<{ data: Collector[] }>("/collectors/my-collectors");
    return res.data.data;
  },

  create: async (body: { email: string; password: string; fullName: string }): Promise<Collector> => {
    const res = await api.post<{ data: Collector }>("/collectors", body);
    return res.data.data;
  },
};

// ─── Collector Assignments ────────────────────────────────────────────────────
export interface CollectorAssignment {
  id: string;
  requestId: string;
  collectorId: string;
  status: string;
  collectedNote: string | null;
  collectedAt: string | null;
  createdTime: string;
}

export interface PagedAssignmentResult {
  items: CollectorAssignment[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AssignmentListParams {
  Status?: string;
  CollectorId?: string;
  RequestId?: string;
  PageNumber?: number;
  PageSize?: number;
}

export const collectorAssignmentService = {
  getMyAssignments: async (params?: AssignmentListParams): Promise<PagedAssignmentResult> => {
    const res = await api.get<PagedAssignmentResult>("/collector-assignments/collector", { params });
    return res.data;
  },
};
