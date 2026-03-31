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

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const unwrapEnvelope = <T = unknown>(value: T | { data?: T }): T | unknown => {
  if (isObject(value) && "data" in value) {
    return value.data;
  }

  return value;
};

const toArray = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const toStringOrEmpty = (value: unknown): string =>
  typeof value === "string" ? value : "";

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const toNullableNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

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

export interface CollectorProofDetail {
  id: string;
  assignmentId: string;
  requestId: string;
  collectorId: string;
  imageUrl: string | null;
  imageUrls: string[];
  publicId: string | null;
  note: string | null;
  reviewStatus: "Pending" | "Approved" | "Rejected" | string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdTime: string;
  collectedAt: string | null;
  wasteTypeName: string | null;
  regionCode: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export interface CollectorProofListParams {
  AssignmentId?: string;
  ReviewStatus?: "Pending" | "Approved" | "Rejected";
  reviewStatus?: "Pending" | "Approved" | "Rejected";
  pageNumber?: number;
  pageSize?: number;
  PageNumber?: number;
  PageSize?: number;
}

export interface PagedProofResult<TItem = CollectorProof> {
  items: TItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

const normalizeCollectorProof = (value: unknown): CollectorProof => {
  const item = isObject(value) ? value : {};

  return {
    id: toStringOrEmpty(item.id),
    assignmentId: toStringOrEmpty(item.assignmentId),
    requestId: toStringOrEmpty(item.requestId),
    collectorId: toStringOrEmpty(item.collectorId),
    imageUrl: toStringOrEmpty(item.imageUrl),
    publicId: toStringOrEmpty(item.publicId),
    note: toNullableString(item.note),
    reviewStatus: (toStringOrEmpty(item.reviewStatus) || "Pending") as CollectorProof["reviewStatus"],
    reviewNote: toNullableString(item.reviewNote),
    reviewedAt: toNullableString(item.reviewedAt),
    createdTime: toStringOrEmpty(item.createdTime),
    collectedAt: toNullableString(item.collectedAt),
    wasteTypeName: toNullableString(item.wasteTypeName),
    regionCode: toNullableString(item.regionCode),
    latitude: toNullableNumber(item.latitude),
    longitude: toNullableNumber(item.longitude),
  };
};

const normalizeCollectorProofDetail = (value: unknown): CollectorProofDetail => {
  const item = isObject(value) ? value : {};

  return {
    id: toStringOrEmpty(item.id),
    assignmentId: toStringOrEmpty(item.assignmentId),
    requestId: toStringOrEmpty(item.requestId),
    collectorId: toStringOrEmpty(item.collectorId),
    imageUrl: toNullableString(item.imageUrl),
    imageUrls: toArray(item.imageUrls).filter((entry): entry is string => typeof entry === "string"),
    publicId: toNullableString(item.publicId),
    note: toNullableString(item.note),
    reviewStatus: toStringOrEmpty(item.reviewStatus) || "Pending",
    reviewNote: toNullableString(item.reviewNote),
    reviewedAt: toNullableString(item.reviewedAt),
    createdTime: toStringOrEmpty(item.createdTime),
    collectedAt: toNullableString(item.collectedAt),
    wasteTypeName: toNullableString(item.wasteTypeName),
    regionCode: toNullableString(item.regionCode),
    latitude: toNullableNumber(item.latitude),
    longitude: toNullableNumber(item.longitude),
    address: toNullableString(item.address),
  };
};

const normalizePagedProofResult = <TItem>(
  value: unknown,
  normalizeItem: (item: unknown) => TItem,
  fallback: CollectorProofListParams = {}
): PagedProofResult<TItem> => {
  const payload = unwrapEnvelope(value);
  const page = isObject(payload) ? payload : {};
  const items = toArray(page.items).map(normalizeItem);

  return {
    items,
    totalCount: typeof page.totalCount === "number" ? page.totalCount : items.length,
    pageNumber:
      typeof page.pageNumber === "number"
        ? page.pageNumber
        : typeof fallback.pageNumber === "number"
          ? fallback.pageNumber
          : typeof fallback.PageNumber === "number"
            ? fallback.PageNumber
            : 1,
    pageSize:
      typeof page.pageSize === "number"
        ? page.pageSize
        : typeof fallback.pageSize === "number"
          ? fallback.pageSize
          : typeof fallback.PageSize === "number"
            ? fallback.PageSize
            : items.length,
  };
};

export const collectorProofService = {
  create: async (body: CollectorProofCreateBody): Promise<void> => {
    await api.post("/collector-proofs", body);
  },

  /** GET /api/collector-proofs/enterprise — list proofs for the current enterprise */
  getForEnterprise: async (params?: CollectorProofListParams): Promise<PagedProofResult> => {
    const res = await api.get("/collector-proofs/enterprise", { params });
    return normalizePagedProofResult(res.data, normalizeCollectorProof, params);
  },

  /** GET /api/collector-proofs/enterprise/{id} — single proof detail */
  getDetailForEnterprise: async (id: string): Promise<CollectorProof> => {
    const res = await api.get(`/collector-proofs/enterprise/${id}`);
    return normalizeCollectorProof(unwrapEnvelope(res.data));
  },

  /** GET /api/collector-proofs/collector — list proofs for the current collector */
  getForCollector: async (params?: CollectorProofListParams): Promise<PagedProofResult<CollectorProofDetail>> => {
    const res = await api.get("/collector-proofs/collector", { params });
    return normalizePagedProofResult(res.data, normalizeCollectorProofDetail, params);
  },

  /** GET /api/collector-proofs/collector/{id} — collector proof detail */
  getDetailForCollector: async (id: string): Promise<CollectorProofDetail> => {
    const res = await api.get(`/collector-proofs/collector/${id}`);
    return normalizeCollectorProofDetail(unwrapEnvelope(res.data));
  },

  /** PUT /api/collector-proofs/enterprise/{id}/review — approve or reject */
  review: async (id: string, status: "Approved" | "Rejected", reviewNote: string): Promise<void> => {
    await api.put(`/collector-proofs/enterprise/${id}/review`, { status, reviewNote });
  },
};
