import api from "./api";
import { enterpriseProfileApi } from "./enterprise-profile.api";
import type {
  EnterpriseDocument,
  EnterpriseProfile as RecyclingEnterprise,
  SetEnvironmentLicensePayload,
  SubmitEnterpriseProfilePayload,
  SubmitEnterpriseProfileResult,
  UpsertEnterpriseProfilePayload,
} from "./profile.types";

// ─────────────────────────────────────────────
// Generic API wrapper
// ─────────────────────────────────────────────
interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number | string;
  code?: string;
}

// ─────────────────────────────────────────────
// RecyclingEnterprise
// ─────────────────────────────────────────────
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

  getProfile: (): Promise<RecyclingEnterprise | null> => enterpriseProfileApi.getMe(),

  updateProfile: (body: UpsertEnterpriseProfilePayload): Promise<RecyclingEnterprise> =>
    enterpriseProfileApi.upsertMe(body),

  setEnvironmentLicense: (body: SetEnvironmentLicensePayload): Promise<RecyclingEnterprise> =>
    enterpriseProfileApi.setEnvironmentLicense(body),

  submitProfile: (body: SubmitEnterpriseProfilePayload): Promise<SubmitEnterpriseProfileResult> =>
    enterpriseProfileApi.submit(body),
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

export interface CreateDistrictDto {
  name: string;
  code: string;
  provinceCode: string;
}

export interface DistrictListParams {
  ProvinceCode?: string;
  Keyword?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface Ward {
  id: string;
  districtId: string;
  districtName: string;
  name: string;
  code: string;
  createdTime: string;
}

export interface CreateWardDto {
  districtId: string;
  name: string;
  code: string;
}

export interface WardListParams {
  DistrictId?: string;
  Keyword?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface CreateDistrictThenWardInput {
  district: CreateDistrictDto;
  ward: Omit<CreateWardDto, "districtId">;
}

export interface CreateDistrictThenWardResult {
  district: District;
  ward: Ward;
}

const getAllPagedItems = async <T>(
  fetchPage: (pageNumber: number, pageSize: number) => Promise<PagedResult<T>>,
  pageSize = 100
): Promise<T[]> => {
  const firstPage = await fetchPage(1, pageSize);
  const items = [...firstPage.items];
  const totalPages = Math.max(1, Math.ceil((firstPage.totalCount || items.length) / pageSize));

  for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
    const nextPage = await fetchPage(pageNumber, pageSize);
    items.push(...nextPage.items);
  }

  return items;
};

export const districtService = {
  getAll: async (params?: DistrictListParams): Promise<PagedResult<District>> => {
    const res = await api.get<PagedResult<District>>("/District", { params });
    return res.data;
  },

  getAllItems: async (params?: Omit<DistrictListParams, "PageNumber">): Promise<District[]> => {
    const pageSize = params?.PageSize ?? 100;
    return getAllPagedItems(
      (pageNumber, currentPageSize) =>
        districtService.getAll({
          ...params,
          PageNumber: pageNumber,
          PageSize: currentPageSize,
        }),
      pageSize
    );
  },

  create: async (body: CreateDistrictDto): Promise<District> => {
    const res = await api.post<District>("/District", body);
    return res.data;
  },
};

export const wardService = {
  getAll: async (params?: WardListParams): Promise<PagedResult<Ward>> => {
    const res = await api.get<PagedResult<Ward>>("/Ward", { params });
    return res.data;
  },

  getAllItems: async (params?: Omit<WardListParams, "PageNumber">): Promise<Ward[]> => {
    const pageSize = params?.PageSize ?? 100;
    return getAllPagedItems(
      (pageNumber, currentPageSize) =>
        wardService.getAll({
          ...params,
          PageNumber: pageNumber,
          PageSize: currentPageSize,
        }),
      pageSize
    );
  },

  create: async (body: CreateWardDto): Promise<Ward> => {
    const res = await api.post<Ward>("/Ward", body);
    return res.data;
  },
};

export const createDistrictThenWard = async (
  input: CreateDistrictThenWardInput
): Promise<CreateDistrictThenWardResult> => {
  try {
    const district = await districtService.create(input.district);
    const ward = await wardService.create({
      districtId: district.id,
      name: input.ward.name,
      code: input.ward.code,
    });

    return { district, ward };
  } catch (error) {
    console.error("createDistrictThenWard failed:", error);
    throw error;
  }
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
  getAll: (): Promise<EnterpriseDocument[]> => enterpriseProfileApi.getDocuments(),

  upload: (documentType: number | string, file: File): Promise<EnterpriseDocument> =>
    enterpriseProfileApi.uploadDocument(documentType, file),
};
