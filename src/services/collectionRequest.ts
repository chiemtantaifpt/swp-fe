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

export const collectionRequestService = {
  getAll: async (params?: CollectionRequestListParams): Promise<PagedCollectionResult> => {
    const res = await api.get<PagedCollectionResult>("/CollectionRequest/enterprise", { params });
    return res.data;
  },

  accept: async (id: string): Promise<void> => {
    await api.put(`/CollectionRequest/${id}/accept`);
  },

  reject: async (id: string): Promise<void> => {
    await api.put(`/CollectionRequest/${id}/reject`);
  },

  assign: async (id: string, collectorId: string): Promise<void> => {
    await api.put(`/CollectionRequest/${id}/assign`, { collectorId });
  },
};
