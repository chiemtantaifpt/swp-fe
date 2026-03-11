import api from "./api";

// Category enum khớp BE: Organic=0, Recyclable=1, Hazardous=2, Other=3
export const WASTE_CATEGORIES: Record<number, string> = {
  0: "Hữu cơ (Organic)",
  1: "Tái chế (Recyclable)",
  2: "Nguy hại (Hazardous)",
  3: "Khác (Other)",
};

export interface WasteType {
  id: string;
  name: string;
  description?: string;
  category?: number;
  isActive?: boolean;
  icon?: string;
}

export interface WasteTypeListParams {
  category?: number;
  isActive?: boolean;
  keyword?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface WasteTypeListResponse {
  items?: WasteType[];
  data?: WasteType[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateWasteTypeRequest {
  name: string;
  description?: string;
  category: number;
}

export interface UpdateWasteTypeRequest {
  name: string;
  description?: string;
  category: number;
  isActive: boolean;
}

const CATEGORY_NAME_TO_NUM: Record<string, number> = {
  Organic: 0,
  Recyclable: 1,
  Hazardous: 2,
  Other: 3,
};

function normalizeWasteType(w: WasteType): WasteType {
  if (typeof w.category === "string") {
    return { ...w, category: CATEGORY_NAME_TO_NUM[w.category as string] ?? 3 };
  }
  return w;
}

export const wasteTypeService = {
  // GET /api/WasteType
  getAll: async (params?: WasteTypeListParams): Promise<WasteType[]> => {
    const response = await api.get("/WasteType", { params });
    const data = response.data;
    let items: WasteType[] = [];
    if (Array.isArray(data)) items = data;
    else if (Array.isArray(data?.items)) items = data.items;
    else if (Array.isArray(data?.data)) items = data.data;
    return items.map(normalizeWasteType);
  },

  // GET /api/WasteType/{id}
  getById: async (id: string): Promise<WasteType> => {
    const response = await api.get<WasteType>(`/WasteType/${id}`);
    return response.data;
  },

  // POST /api/WasteType
  create: async (body: CreateWasteTypeRequest): Promise<void> => {
    await api.post("/WasteType", body);
  },

  // PUT /api/WasteType/{id}
  update: async (id: string, body: UpdateWasteTypeRequest): Promise<void> => {
    await api.put(`/WasteType/${id}`, body);
  },

  // DELETE /api/WasteType/{id}
  delete: async (id: string): Promise<void> => {
    await api.delete(`/WasteType/${id}`);
  },
};
