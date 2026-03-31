import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  AdjustRewardStockPayload,
  CreateRewardPayload,
  UpdateRewardPayload,
} from "@/services/reward.types";
import { citizenPointQueryKeys } from "@/hooks/useCitizenPoint";

export const rewardQueryKeys = {
  all: ["rewards"] as const,
  active: () => [...rewardQueryKeys.all, "active"] as const,
  myRedemptions: (pageNumber = 1, pageSize = 20) =>
    [...rewardQueryKeys.all, "my-redemptions", pageNumber, pageSize] as const,
  adminList: () => [...rewardQueryKeys.all, "admin"] as const,
  adminDetail: (id: string) => [...rewardQueryKeys.all, "admin-detail", id] as const,
};

export const useActiveRewards = () =>
  useQuery({
    queryKey: rewardQueryKeys.active(),
    queryFn: getActiveRewards,
  });

export const useRedeemReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: redeemReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rewardQueryKeys.active() });
      queryClient.invalidateQueries({ queryKey: [...rewardQueryKeys.all, "my-redemptions"] });
      queryClient.invalidateQueries({ queryKey: citizenPointQueryKeys.all });
    },
  });
};

export const useMyRewardRedemptions = (pageNumber = 1, pageSize = 20) =>
  useQuery({
    queryKey: rewardQueryKeys.myRedemptions(pageNumber, pageSize),
    queryFn: () => getMyRedemptions(pageNumber, pageSize),
    placeholderData: (previousData) => previousData,
  });

export const useAdminRewards = () =>
  useQuery({
    queryKey: rewardQueryKeys.adminList(),
    queryFn: adminGetRewards,
  });

export const useAdminRewardDetail = (id?: string) =>
  useQuery({
    queryKey: rewardQueryKeys.adminDetail(id ?? ""),
    queryFn: () => adminGetRewardById(id!),
    enabled: !!id,
  });

export const useAdminCreateReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRewardPayload) => adminCreateReward(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rewardQueryKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: rewardQueryKeys.active() });
    },
  });
};

export const useAdminUpdateReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRewardPayload }) =>
      adminUpdateReward(id, payload),
    onSuccess: (updatedReward) => {
      queryClient.invalidateQueries({ queryKey: rewardQueryKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: rewardQueryKeys.adminDetail(updatedReward.id) });
      queryClient.invalidateQueries({ queryKey: rewardQueryKeys.active() });
    },
  });
};

export const useAdminAdjustRewardStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdjustRewardStockPayload }) =>
      adminAdjustRewardStock(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rewardQueryKeys.adminList() });
      queryClient.invalidateQueries({ queryKey: rewardQueryKeys.adminDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: rewardQueryKeys.active() });
    },
  });
};
