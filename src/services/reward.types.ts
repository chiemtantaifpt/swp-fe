export interface Reward {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  pointCost: number;
  stock: number;
  isActive: boolean;
  createdTime: string;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  rewardName: string;
  pointCostSnapshot: number;
  createdTime: string;
}

export interface CreateRewardPayload {
  name: string;
  description?: string;
  imageFile?: File;
  pointCost: number;
  stock: number;
}

export interface UpdateRewardPayload {
  name?: string;
  description?: string;
  imageUrl?: string;
  pointCost?: number;
  stock?: number;
  isActive?: boolean;
}

export interface AdjustRewardStockPayload {
  delta: number;
}

export interface RewardListParams {
  pageNumber?: number;
  pageSize?: number;
}

export interface RewardListResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface RewardApiErrorPayload {
  code?: string;
  message?: string;
  errors?: Record<string, string[]>;
  title?: string;
}

export class RewardApiError extends Error {
  code?: string;
  status?: number;
  details?: Record<string, string[]>;

  constructor(
    message: string,
    options?: { code?: string; status?: number; details?: Record<string, string[]> }
  ) {
    super(message);
    this.name = "RewardApiError";
    this.code = options?.code;
    this.status = options?.status;
    this.details = options?.details;
  }
}
