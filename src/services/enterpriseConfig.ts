import api from "./api";

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
  environmentLicenseFileId: string;
  approvalStatus: string;
  operationalStatus: string;
  createdTime: string;
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

  getProfile: async (): Promise<RecyclingEnterprise> => {
    const res = await api.get<RecyclingEnterprise>("/recycling-enterprise/me/profile");
    return res.data;
  },

  updateProfile: async (body: {
    name: string;
    taxCode: string;
    address: string;
    legalRepresentative: string;
    representativePosition: string;
    environmentLicenseFileId: string;
  }): Promise<RecyclingEnterprise> => {
    const res = await api.post<RecyclingEnterprise>("/recycling-enterprise/me/profile", body);
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
  regionCode: string;
  createdTime: string;
}

export interface ServiceAreaListParams {
  EnterpriseId?: string;
  RegionCode?: string;
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

  create: async (body: { enterpriseId: string; regionCode: string }): Promise<ServiceArea> => {
    const res = await api.post<ServiceArea>("/EnterpriseServiceArea", body);
    return res.data;
  },

  update: async (id: string, body: { regionCode: string }): Promise<ServiceArea> => {
    const res = await api.put<ServiceArea>(`/EnterpriseServiceArea/${id}`, body);
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
    const res = await api.post<EnterpriseDocument>("/recycling-enterprises/me/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};
