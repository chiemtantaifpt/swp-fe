import axios, { AxiosError } from "axios";
import api from "@/services/api";
import type {
  AdjustRewardStockPayload,
  CreateRewardPayload,
  Reward,
  RewardApiErrorPayload,
  RewardListParams,
  RewardListResponse,
  RewardRedemption,
  UpdateRewardPayload,
} from "@/services/reward.types";
import { RewardApiError } from "@/services/reward.types";

type UnknownRecord = Record<string, unknown>;

const isObject = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const unwrapEnvelope = <T = unknown>(value: unknown): T | unknown => {
  if (isObject(value) && "data" in value) {
    return value.data;
  }

  return value;
};

const buildParams = (params?: RewardListParams) => {
  if (!params) return undefined;

  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const toNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const toBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const normalizeReward = (input: unknown): Reward => {
  const raw = isObject(input) ? input : {};

  return {
    id: toString(raw.id),
    name: toString(raw.name),
    description: toNullableString(raw.description),
    imageUrl: toNullableString(raw.imageUrl),
    pointCost: toNumber(raw.pointCost),
    stock: toNumber(raw.stock),
    isActive: toBoolean(raw.isActive, true),
    createdTime: toString(raw.createdTime),
  };
};

const normalizeRewardRedemption = (input: unknown): RewardRedemption => {
  const raw = isObject(input) ? input : {};

  return {
    id: toString(raw.id),
    rewardId: toString(raw.rewardId),
    rewardName: toString(raw.rewardName || raw.name, "Phần thưởng"),
    pointCostSnapshot: toNumber(raw.pointCostSnapshot),
    createdTime: toString(raw.createdTime),
  };
};

const normalizeRewardArray = (input: unknown): Reward[] => {
  const payload = unwrapEnvelope(input);

  if (Array.isArray(payload)) {
    return payload.map(normalizeReward);
  }

  if (isObject(payload) && Array.isArray(payload.items)) {
    return payload.items.map(normalizeReward);
  }

  return [];
};

const normalizeRewardRedemptionList = (
  input: unknown,
  fallback: RewardListParams = {}
): RewardListResponse<RewardRedemption> => {
  const payload = unwrapEnvelope(input);

  if (Array.isArray(payload)) {
    const items = payload.map(normalizeRewardRedemption);
    return {
      items,
      totalCount: items.length,
      pageNumber: fallback.pageNumber ?? 1,
      pageSize: fallback.pageSize ?? (items.length || 20),
    };
  }

  if (isObject(payload) && Array.isArray(payload.items)) {
    const items = payload.items.map(normalizeRewardRedemption);
    return {
      items,
      totalCount: toNumber(payload.totalCount, items.length),
      pageNumber: toNumber(payload.pageNumber, fallback.pageNumber ?? 1),
      pageSize: toNumber(payload.pageSize, fallback.pageSize ?? (items.length || 20)),
    };
  }

  return {
    items: [],
    totalCount: 0,
    pageNumber: fallback.pageNumber ?? 1,
    pageSize: fallback.pageSize ?? 20,
  };
};

const mapRewardErrorMessage = (code?: string, fallback?: string) => {
  switch (code) {
    case "reward_not_found":
      return "Phần thưởng không tồn tại hoặc đã bị gỡ.";
    case "out_of_stock":
      return "Phần thưởng này đã hết lượt đổi.";
    case "not_enough_points":
      return "Bạn chưa đủ điểm để đổi phần thưởng này.";
    case "invalid_request":
      return "Yêu cầu không hợp lệ.";
    default:
      return fallback || "Có lỗi xảy ra, vui lòng thử lại.";
  }
};

const toRewardApiError = (error: unknown): RewardApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<RewardApiErrorPayload>;
    const data = axiosError.response?.data;
    const code = data?.code;
    const fallbackMessage = data?.message || data?.title || axiosError.message;

    return new RewardApiError(mapRewardErrorMessage(code, fallbackMessage), {
      code,
      status: axiosError.response?.status,
      details: data?.errors,
    });
  }

  if (error instanceof Error) {
    return new RewardApiError(error.message);
  }

  return new RewardApiError("Có lỗi xảy ra, vui lòng thử lại.");
};

export const getActiveRewards = async (): Promise<Reward[]> => {
  try {
    const response = await api.get("/rewards");
    return normalizeRewardArray(response.data).filter((reward) => reward.isActive && reward.stock > 0);
  } catch (error) {
    throw toRewardApiError(error);
  }
};

export const redeemReward = async (rewardId: string): Promise<RewardRedemption> => {
  try {
    const response = await api.post(`/rewards/${rewardId}/redeem`);
    return normalizeRewardRedemption(unwrapEnvelope(response.data));
  } catch (error) {
    throw toRewardApiError(error);
  }
};

export const getMyRedemptions = async (
  pageNumber = 1,
  pageSize = 20
): Promise<RewardListResponse<RewardRedemption>> => {
  try {
    const response = await api.get("/rewards/me/redemptions", {
      params: buildParams({ pageNumber, pageSize }),
    });
    return normalizeRewardRedemptionList(response.data, { pageNumber, pageSize });
  } catch (error) {
    throw toRewardApiError(error);
  }
};

export const adminGetRewards = async (): Promise<Reward[]> => {
  try {
    const response = await api.get("/rewards/admin");
    return normalizeRewardArray(response.data);
  } catch (error) {
    throw toRewardApiError(error);
  }
};

export const adminGetRewardById = async (id: string): Promise<Reward> => {
  try {
    const response = await api.get(`/rewards/admin/${id}`);
    return normalizeReward(unwrapEnvelope(response.data));
  } catch (error) {
    throw toRewardApiError(error);
  }
};

export const adminCreateReward = async (payload: CreateRewardPayload): Promise<Reward> => {
  try {
    const response = await api.post("/rewards/admin", payload);
    return normalizeReward(unwrapEnvelope(response.data));
  } catch (error) {
    throw toRewardApiError(error);
  }
};

export const adminUpdateReward = async (id: string, payload: UpdateRewardPayload): Promise<Reward> => {
  try {
    const response = await api.put(`/rewards/admin/${id}`, payload);
    return normalizeReward(unwrapEnvelope(response.data));
  } catch (error) {
    throw toRewardApiError(error);
  }
};

export const adminAdjustRewardStock = async (
  id: string,
  payload: AdjustRewardStockPayload
): Promise<void> => {
  try {
    await api.put(`/rewards/admin/${id}/stock`, payload);
  } catch (error) {
    throw toRewardApiError(error);
  }
};
