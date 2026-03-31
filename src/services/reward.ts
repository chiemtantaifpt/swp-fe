import {
  adminAdjustRewardStock,
  adminCreateReward,
  adminGetRewardById,
  adminGetRewards,
  adminUpdateReward,
  getActiveRewards,
  getMyRedemptions,
  redeemReward,
} from "@/services/reward.api";
import type {
  CreateRewardPayload,
  Reward,
  RewardListParams,
  RewardListResponse,
  RewardRedemption,
  UpdateRewardPayload,
} from "@/services/reward.types";

export type {
  AdjustRewardStockPayload,
  CreateRewardPayload,
  Reward,
  RewardApiError,
  RewardApiErrorPayload,
  RewardListParams,
  RewardListResponse,
  RewardRedemption,
  UpdateRewardPayload,
} from "@/services/reward.types";

export type CreateRewardRequest = CreateRewardPayload;
export type UpdateRewardRequest = UpdateRewardPayload;
export type RewardRedemptionListResponse = RewardListResponse<RewardRedemption>;

export interface RewardListCompatibilityResponse extends RewardListResponse<Reward> {}

export const rewardService = {
  getAll: async (params?: RewardListParams): Promise<RewardListCompatibilityResponse> => {
    const items = await getActiveRewards();

    if (!params?.pageNumber && !params?.pageSize) {
      return {
        items,
        totalCount: items.length,
        pageNumber: 1,
        pageSize: items.length || 20,
      };
    }

    const pageNumber = params.pageNumber ?? 1;
    const pageSize = params.pageSize ?? (items.length || 20);
    const startIndex = (pageNumber - 1) * pageSize;

    return {
      items: items.slice(startIndex, startIndex + pageSize),
      totalCount: items.length,
      pageNumber,
      pageSize,
    };
  },

  redeem: redeemReward,

  getMyRedemptions: (params?: RewardListParams): Promise<RewardRedemptionListResponse> =>
    getMyRedemptions(params?.pageNumber ?? 1, params?.pageSize ?? 20),

  getAdminAll: (): Promise<Reward[]> => adminGetRewards(),

  getAdminById: (id: string): Promise<Reward> => adminGetRewardById(id),

  create: (payload: CreateRewardPayload): Promise<Reward> => adminCreateReward(payload),

  update: (id: string, payload: UpdateRewardPayload): Promise<Reward> => adminUpdateReward(id, payload),

  adjustStock: (id: string, delta: number): Promise<void> =>
    adminAdjustRewardStock(id, { delta }),
};
