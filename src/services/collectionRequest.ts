import api from "./api";

export interface CollectionRequest {
  id: string;
  wasteReportWasteId: string;
  wasteReportId: string;
  enterpriseId: string;
  status: string;
  priorityScore: number;
  rejectReason: string | null;
  rejectReasonName: string | null;
  rejectNote: string | null;
  wasteTypeId: string;
  wasteTypeName?: string;
  note?: string;
  address?: string;
  imageUrls?: string[];
  latitude?: number;
  longitude?: number;
  regionCode?: string;
  hasAssignment: boolean;
  createdTime: string;
  lastUpdatedTime: string;
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

  reject: async (id: string, reason: string): Promise<void> => {
    await api.post("/CollectionRequest/reject", {
      requestId: id,
      reason,
      note: null,
    });
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
  lastUpdatedTime: string;
  enterpriseId: string;
  requestStatus: string;
  priorityScore: number;
  wasteReportWasteId: string;
  wasteTypeId: string;
  wasteTypeName: string | null;
  note: string | null;
  address: string | null;
  imageUrls: string[] | null;
  wasteReportId: string;
  latitude: number | null;
  longitude: number | null;
  regionCode: string | null;
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

  create: async (requestId: string, collectorId: string): Promise<CollectorAssignment> => {
    const res = await api.post<CollectorAssignment>("/collector-assignments", { requestId, collectorId });
    return res.data;
  },

  updateStatus: async (id: string, status: string, collectedNote?: string): Promise<void> => {
    await api.put(`/collector-assignments/collector/${id}/status`, { status, collectedNote: collectedNote ?? null });
  },
};

// ─── Collector Proofs ─────────────────────────────────────────────────────────
export interface CollectorProofCreateBody {
  assignmentId: string;
  imageUrl: string;
  publicId: string;
  note: string;
}

// Enterprise-facing proof shape returned by GET /collector-proofs/enterprise
export interface CollectorProof {
  id: string;
  assignmentId: string;
  requestId: string;
  collectorId: string;
  imageUrl: string;
  publicId: string;
  note: string | null;
  reviewStatus: "Pending" | "Approved" | "Rejected";
  reviewNote: string | null;
  reviewedAt: string | null;
  createdTime: string;
  collectedAt: string | null;
  wasteTypeName: string | null;
  regionCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CollectorProofListParams {
  reviewStatus?: "Pending" | "Approved" | "Rejected";
  pageNumber?: number;
  pageSize?: number;
}

export interface PagedProofResult {
  items: CollectorProof[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export const collectorProofService = {
  create: async (body: CollectorProofCreateBody): Promise<void> => {
    await api.post("/collector-proofs", body);
  },

  /** GET /api/collector-proofs/enterprise — list proofs for the current enterprise */
  getForEnterprise: async (params?: CollectorProofListParams): Promise<PagedProofResult> => {
    const res = await api.get<PagedProofResult>("/collector-proofs/enterprise", { params });
    return res.data;
  },

  /** GET /api/collector-proofs/enterprise/{id} — single proof detail */
  getDetailForEnterprise: async (id: string): Promise<CollectorProof> => {
    const res = await api.get<CollectorProof>(`/collector-proofs/enterprise/${id}`);
    return res.data;
  },

  /** PUT /api/collector-proofs/enterprise/{id}/review — approve or reject */
  review: async (id: string, status: "Approved" | "Rejected", reviewNote: string): Promise<void> => {
    await api.put(`/collector-proofs/enterprise/${id}/review`, { status, reviewNote });
  },
};
