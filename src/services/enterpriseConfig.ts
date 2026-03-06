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

export interface RecyclingEnterpriseListParams {
  PageNumber?: number;
  PageSize?: number;
}

export const recyclingEnterpriseService = {
  getAll: async (params?: RecyclingEnterpriseListParams): Promise<{ totalCount: number; pageNumber: number; pageSize: number; items: RecyclingEnterprise[] }> => {
    const res = await api.get("/RecyclingEnterprise", { params });
    return res.data;
  },

  getById: async (id: string): Promise<RecyclingEnterprise> => {
    const res = await api.get<RecyclingEnterprise>(`/RecyclingEnterprise/${id}`);
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
