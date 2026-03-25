import api from "./api";
import {
  CollectorProfile,
  CollectorProfileListParams,
  CreateCollectorProfilePayload,
  PagedCollectorProfileResponse,
  ProfileBaseResponse,
  UpdateCollectorProfilePayload,
} from "./profile.types";

const cleanParams = <T extends object>(params?: T): Partial<T> | undefined => {
  if (!params) return undefined;

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ) as Partial<T>;
};

const unwrapDirectOrBase = <T>(payload: ProfileBaseResponse<T> | T): T => {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as ProfileBaseResponse<T>).data;
  }
  return payload as T;
};

export const collectorProfileApi = {
  getMe: async (): Promise<CollectorProfile> => {
    const response = await api.get<ProfileBaseResponse<CollectorProfile> | CollectorProfile>("/enterprise/collectors/me");
    return unwrapDirectOrBase(response.data);
  },

  getPaged: async (params?: CollectorProfileListParams): Promise<PagedCollectorProfileResponse> => {
    const response = await api.get<ProfileBaseResponse<PagedCollectorProfileResponse> | PagedCollectorProfileResponse>(
      "/enterprise/collectors",
      {
        params: cleanParams(params),
      }
    );
    return unwrapDirectOrBase(response.data);
  },

  getAll: async (): Promise<CollectorProfile[]> => {
    const response = await api.get<ProfileBaseResponse<CollectorProfile[]> | CollectorProfile[]>("/enterprise/collectors/all");
    return unwrapDirectOrBase(response.data);
  },

  getById: async (id: string): Promise<CollectorProfile> => {
    const response = await api.get<ProfileBaseResponse<CollectorProfile> | CollectorProfile>(`/enterprise/collectors/${id}`);
    return unwrapDirectOrBase(response.data);
  },

  create: async (body: CreateCollectorProfilePayload): Promise<CollectorProfile> => {
    const response = await api.post<ProfileBaseResponse<CollectorProfile> | CollectorProfile>("/enterprise/collectors", body);
    return unwrapDirectOrBase(response.data);
  },

  update: async (id: string, body: UpdateCollectorProfilePayload): Promise<CollectorProfile> => {
    const response = await api.put<ProfileBaseResponse<CollectorProfile> | CollectorProfile>(
      `/enterprise/collectors/${id}`,
      body
    );
    return unwrapDirectOrBase(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/enterprise/collectors/${id}`);
  },
};
