import type { Reward, RewardRedemption } from "@/services/reward.types";

export const mockRewards: Reward[] = [
  {
    id: "reward-voucher-20k",
    name: "Voucher 20K",
    description: "Voucher giảm giá 20.000 VND",
    imageUrl: "https://example.com/rewards/voucher-20k.png",
    pointCost: 40,
    stock: 30,
    isActive: true,
    createdTime: "2026-03-30T10:00:00Z",
  },
  {
    id: "reward-voucher-50k",
    name: "Voucher 50K",
    description: "Voucher giảm giá 50.000 VND",
    imageUrl: "https://example.com/rewards/voucher-50k.png",
    pointCost: 100,
    stock: 20,
    isActive: true,
    createdTime: "2026-03-30T10:00:00Z",
  },
  {
    id: "reward-bottle",
    name: "Bình nước tái chế",
    description: "Bình nước thân thiện môi trường",
    imageUrl: "https://example.com/rewards/recycled-bottle.png",
    pointCost: 80,
    stock: 12,
    isActive: true,
    createdTime: "2026-03-30T10:00:00Z",
  },
  {
    id: "reward-canvas-bag",
    name: "Túi vải canvas",
    description: "Túi canvas tái sử dụng hằng ngày",
    imageUrl: "https://example.com/rewards/canvas-bag.png",
    pointCost: 60,
    stock: 18,
    isActive: true,
    createdTime: "2026-03-30T10:00:00Z",
  },
  {
    id: "reward-mini-tree",
    name: "Cây xanh mini",
    description: "Chậu cây nhỏ để bàn",
    imageUrl: "https://example.com/rewards/mini-tree.png",
    pointCost: 90,
    stock: 8,
    isActive: true,
    createdTime: "2026-03-30T10:00:00Z",
  },
];

export const mockRewardRedemptions: RewardRedemption[] = [
  {
    id: "redemption-1",
    rewardId: "reward-voucher-20k",
    rewardName: "Voucher 20K",
    pointCostSnapshot: 40,
    createdTime: "2026-03-30T12:00:00Z",
  },
  {
    id: "redemption-2",
    rewardId: "reward-canvas-bag",
    rewardName: "Túi vải canvas",
    pointCostSnapshot: 60,
    createdTime: "2026-03-31T09:30:00Z",
  },
];
