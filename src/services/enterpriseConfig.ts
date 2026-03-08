import api from "./api";

// ─────────────────────────────────────────────
// Generic API wrapper
// ─────────────────────────────────────────────
interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  code?: string;
}

// ─────────────────────────────────────────────
// RecyclingEnterprise
// ─────────────────────────────────────────────
export interface RecyclingEnterprise {
  id: string;
  userId: string;
  name: string;
  taxCode: string;
  address: string;
  legalRepresentative: string;
  representativePosition: string;
  environmentLicenseFileId: string | null;
  approvalStatus: string;
  operationalStatus: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  rejectionReason: string | null;
  createdTime: string;
  documents?: EnterpriseDocument[];
}

export interface EnterpriseDocument {
  id: string;
  enterpriseId: string;
  documentType: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface RecyclingEnterpriseListParams {
  PageNumber?: number;
  PageSize?: number;
}

export const recyclingEnterpriseService = {
  getAll: async (params?: RecyclingEnterpriseListParams): Promise<{ totalCount: number; pageNumber: number; pageSize: number; items: RecyclingEnterprise[] }> => {
    const res = await api.get("/recycling-enterprise", { params });
    return res.data;
  },

  getById: async (id: string): Promise<RecyclingEnterprise> => {
    const res = await api.get<RecyclingEnterprise>(`/recycling-enterprise/${id}`);
    return res.data;
  },

  getProfile: async (): Promise<RecyclingEnterprise | null> => {
    const res = await api.get<ApiResponse<RecyclingEnterprise | null>>("/recycling-enterprises/me/profile");
    return res.data.data;
  },

  updateProfile: async (body: {
    name: string;
    taxCode: string;
    address: string;
    legalRepresentative: string;
    representativePosition: string;
    environmentLicenseFileId: string;
  }): Promise<RecyclingEnterprise> => {
    const res = await api.post<ApiResponse<RecyclingEnterprise>>("/recycling-enterprises/me/profile", body);
    return res.data.data;
  },
};

// ─────────────────────────────────────────────
// District & Ward
// ─────────────────────────────────────────────
export interface District {
  id: string;
  name: string;
  code: string;
  provinceCode: string;
  createdTime: string;
}

export interface Ward {
  id: string;
  districtId: string;
  districtName: string;
  name: string;
  code: string;
  createdTime: string;
}

export const districtService = {
  getAll: async (params?: { ProvinceCode?: string; Keyword?: string; PageNumber?: number; PageSize?: number }): Promise<PagedResult<District>> => {
    const res = await api.get<PagedResult<District>>("/District", { params });
    return res.data;
  },
};

export const wardService = {
  getAll: async (params?: { DistrictId?: string; Keyword?: string; PageNumber?: number; PageSize?: number }): Promise<PagedResult<Ward>> => {
    const res = await api.get<PagedResult<Ward>>("/Ward", { params });
    return res.data;
  },
};

// ─────────────────────────────────────────────
// EnterpriseServiceArea
// ─────────────────────────────────────────────
export interface ServiceArea {
  id: string;
  enterpriseId: string;
  enterpriseName?: string;
  districtId?: string;
  districtName?: string;
  districtCode?: string;
  wardId?: string;
  wardName?: string;
  wardCode?: string;
  regionCode?: string;
  createdTime: string;
}

export interface ServiceAreaListParams {
  EnterpriseId?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface PagedResult<T> {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  items: T[];
}

export const serviceAreaService = {
  getAll: async (params: ServiceAreaListParams): Promise<PagedResult<ServiceArea>> => {
    const res = await api.get<PagedResult<ServiceArea>>("/EnterpriseServiceArea", { params });
    return res.data;
  },

  getById: async (id: string): Promise<ServiceArea> => {
    const res = await api.get<ServiceArea>(`/EnterpriseServiceArea/${id}`);
    return res.data;
  },

  create: async (body: { districtId: string; wardId: string }): Promise<ServiceArea> => {
    const res = await api.post<ServiceArea>("/EnterpriseServiceArea", body);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/EnterpriseServiceArea/${id}`);
  },
};

// ─────────────────────────────────────────────
// EnterpriseWasteCapability
// ─────────────────────────────────────────────
export interface WasteCapability {
  id: string;
  enterpriseId: string;
  enterpriseName?: string;
  wasteTypeId: string;
  wasteTypeName?: string;
  dailyCapacityKg: number;
  createdTime: string;
}

export interface WasteCapabilityListParams {
  EnterpriseId?: string;
  WasteTypeId?: string;
  MinCapacity?: number;
  MaxCapacity?: number;
  PageNumber?: number;
  PageSize?: number;
}

export const wasteCapabilityService = {
  getAll: async (params: WasteCapabilityListParams): Promise<PagedResult<WasteCapability>> => {
    const res = await api.get<PagedResult<WasteCapability>>("/EnterpriseWasteCapability", { params });
    return res.data;
  },

  getById: async (id: string): Promise<WasteCapability> => {
    const res = await api.get<WasteCapability>(`/EnterpriseWasteCapability/${id}`);
    return res.data;
  },

  create: async (body: { enterpriseId: string; wasteTypeId: string; dailyCapacityKg: number }): Promise<WasteCapability> => {
    const res = await api.post<WasteCapability>("/EnterpriseWasteCapability", body);
    return res.data;
  },

  update: async (id: string, body: { dailyCapacityKg: number }): Promise<WasteCapability> => {
    const res = await api.put<WasteCapability>(`/EnterpriseWasteCapability/${id}`, body);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/EnterpriseWasteCapability/${id}`);
  },
};

// ─────────────────────────────────────────────
// EnterpriseDocuments
// ─────────────────────────────────────────────
export const enterpriseDocumentsService = {
  getAll: async (): Promise<EnterpriseDocument[]> => {
    const res = await api.get<EnterpriseDocument[]>("/recycling-enterprises/me/documents");
    return res.data;
  },

  upload: async (documentType: number, file: File): Promise<EnterpriseDocument> => {
    const formData = new FormData();
    formData.append("DocumentType", documentType.toString());
    formData.append("File", file);
    const res = await api.post<ApiResponse<EnterpriseDocument>>("/recycling-enterprises/me/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data;
  },
};
