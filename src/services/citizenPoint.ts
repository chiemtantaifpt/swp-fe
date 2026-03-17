import api from "./api";
import { BaseResponse, unwrapBaseResponse } from "./baseResponse";

export type CitizenPointPeriod = "AllTime" | "Daily" | "Weekly" | "Monthly" | "Yearly";
export type CitizenPointReviewStatus = "Approved" | "Rejected";
export type CitizenPointSource = "WasteCollectionCompleted" | "ManualAdjustment";

export interface CitizenPointSummaryRaw {
  citizenId?: string;
  totalPoints?: number;
  points?: number;
  currentPoints?: number;
  availablePoints?: number;
  earnedPoints?: number;
  rank?: number | null;
  totalApprovedReports?: number;
  totalCompletedCollections?: number;
  lastUpdatedTime?: string | null;
  [key: string]: unknown;
}

export interface CitizenPointSummary {
  citizenId: string;
  totalPoints: number;
  rank: number | null;
  totalApprovedReports: number;
  totalCompletedCollections: number;
  lastUpdatedTime: string | null;
  raw: CitizenPointSummaryRaw;
}

export interface CitizenPointHistoryItemRaw {
  id?: string;
  citizenId?: string;
  points?: number;
  pointDelta?: number;
  amount?: number;
  balanceAfter?: number | null;
  source?: CitizenPointSource | string;
  reason?: string | null;
  status?: CitizenPointReviewStatus | string | null;
  createdTime?: string | null;
  eventTime?: string | null;
  reportId?: string | null;
  collectionRequestId?: string | null;
  enterpriseId?: string | null;
  enterpriseName?: string | null;
  [key: string]: unknown;
}

export interface CitizenPointHistoryItem {
  id: string;
  citizenId: string;
  points: number;
  balanceAfter: number | null;
  source: CitizenPointSource | string;
  reason: string | null;
  status: CitizenPointReviewStatus | string | null;
  createdTime: string | null;
  reportId: string | null;
  collectionRequestId: string | null;
  enterpriseId: string | null;
  enterpriseName: string | null;
  raw: CitizenPointHistoryItemRaw;
}

export interface CitizenPointHistoryPageRaw {
  items?: CitizenPointHistoryItemRaw[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface CitizenPointHistoryPage {
  items: CitizenPointHistoryItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  raw: CitizenPointHistoryPageRaw;
}

export interface CitizenPointLeaderboardItemRaw {
  citizenId?: string;
  citizenName?: string | null;
  fullName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  wardId?: string | null;
  districtId?: string | null;
  wardName?: string | null;
  districtName?: string | null;
  totalPoints?: number;
  points?: number;
  rank?: number | null;
  [key: string]: unknown;
}

export interface CitizenPointLeaderboardItem {
  citizenId: string;
  citizenName: string;
  avatarUrl: string | null;
  wardId: string | null;
  districtId: string | null;
  wardName: string | null;
  districtName: string | null;
  totalPoints: number;
  rank: number | null;
  raw: CitizenPointLeaderboardItemRaw;
}

export interface CitizenPointMyRankRaw {
  citizenId?: string;
  rank?: number | null;
  totalPoints?: number;
  points?: number;
  period?: CitizenPointPeriod | string;
  totalCitizens?: number | null;
  percentile?: number | null;
  [key: string]: unknown;
}

export interface CitizenPointMyRank {
  citizenId: string;
  rank: number | null;
  totalPoints: number;
  period: CitizenPointPeriod | string;
  totalCitizens: number | null;
  percentile: number | null;
  raw: CitizenPointMyRankRaw;
}

export interface CitizenPointHistoryParams {
  pageNumber?: number;
  pageSize?: number;
}

export interface CitizenPointLeaderboardParams {
  period?: CitizenPointPeriod;
  topCount?: number;
  wardId?: string;
  districtId?: string;
}

const toNumber = (value: unknown, fallback = 0): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const toNullableNumber = (value: unknown): number | null => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const toStringOrEmpty = (value: unknown): string => {
  return typeof value === "string" ? value : "";
};

const toNullableString = (value: unknown): string | null => {
  return typeof value === "string" ? value : null;
};

export const normalizeCitizenPointSummary = (raw: CitizenPointSummaryRaw): CitizenPointSummary => ({
  citizenId: toStringOrEmpty(raw.citizenId),
  totalPoints: toNumber(raw.totalPoints ?? raw.points ?? raw.currentPoints ?? raw.availablePoints ?? raw.earnedPoints),
  rank: toNullableNumber(raw.rank),
  totalApprovedReports: toNumber(raw.totalApprovedReports),
  totalCompletedCollections: toNumber(raw.totalCompletedCollections),
  lastUpdatedTime: toNullableString(raw.lastUpdatedTime),
  raw,
});

export const normalizeCitizenPointHistoryItem = (raw: CitizenPointHistoryItemRaw): CitizenPointHistoryItem => ({
  id: toStringOrEmpty(raw.id),
  citizenId: toStringOrEmpty(raw.citizenId),
  points: toNumber(raw.points ?? raw.pointDelta ?? raw.amount),
  balanceAfter: toNullableNumber(raw.balanceAfter),
  source: toStringOrEmpty(raw.source),
  reason: toNullableString(raw.reason),
  status: toNullableString(raw.status),
  createdTime: toNullableString(raw.createdTime ?? raw.eventTime),
  reportId: toNullableString(raw.reportId),
  collectionRequestId: toNullableString(raw.collectionRequestId),
  enterpriseId: toNullableString(raw.enterpriseId),
  enterpriseName: toNullableString(raw.enterpriseName),
  raw,
});

export const normalizeCitizenPointHistoryPage = (raw: CitizenPointHistoryPageRaw, fallback: CitizenPointHistoryParams = {}): CitizenPointHistoryPage => {
  const items = Array.isArray(raw.items) ? raw.items.map(normalizeCitizenPointHistoryItem) : [];
  const pageSize = raw.pageSize ?? fallback.pageSize ?? items.length ?? 0;
  const totalCount = raw.totalCount ?? items.length;

  return {
    items,
    pageNumber: raw.pageNumber ?? fallback.pageNumber ?? 1,
    pageSize,
    totalCount,
    totalPages: raw.totalPages ?? (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1),
    raw,
  };
};

export const normalizeCitizenPointLeaderboardItem = (raw: CitizenPointLeaderboardItemRaw): CitizenPointLeaderboardItem => ({
  citizenId: toStringOrEmpty(raw.citizenId),
  citizenName: toStringOrEmpty(raw.citizenName ?? raw.fullName ?? raw.displayName) || "Ẩn danh",
  avatarUrl: toNullableString(raw.avatarUrl),
  wardId: toNullableString(raw.wardId),
  districtId: toNullableString(raw.districtId),
  wardName: toNullableString(raw.wardName),
  districtName: toNullableString(raw.districtName),
  totalPoints: toNumber(raw.totalPoints ?? raw.points),
  rank: toNullableNumber(raw.rank),
  raw,
});

export const normalizeCitizenPointMyRank = (raw: CitizenPointMyRankRaw): CitizenPointMyRank => ({
  citizenId: toStringOrEmpty(raw.citizenId),
  rank: toNullableNumber(raw.rank),
  totalPoints: toNumber(raw.totalPoints ?? raw.points),
  period: toStringOrEmpty(raw.period) || "AllTime",
  totalCitizens: toNullableNumber(raw.totalCitizens),
  percentile: toNullableNumber(raw.percentile),
  raw,
});

export const citizenPointService = {
  getByCitizenId: async (citizenId: string): Promise<CitizenPointSummary> => {
    const res = await api.get<BaseResponse<CitizenPointSummaryRaw>>(`/CitizenPoint/${citizenId}`);
    return normalizeCitizenPointSummary(unwrapBaseResponse(res.data));
  },

  getHistoryByCitizenId: async (
    citizenId: string,
    params: CitizenPointHistoryParams = {}
  ): Promise<CitizenPointHistoryPage> => {
    const res = await api.get<BaseResponse<CitizenPointHistoryPageRaw>>(`/CitizenPoint/${citizenId}/history`, {
      params,
    });
    return normalizeCitizenPointHistoryPage(unwrapBaseResponse(res.data), params);
  },

  getLeaderboard: async (
    params: CitizenPointLeaderboardParams = {}
  ): Promise<CitizenPointLeaderboardItem[]> => {
    const res = await api.get<BaseResponse<CitizenPointLeaderboardItemRaw[]>>("/CitizenPoint/leaderboard", {
      params: {
        period: params.period ?? "AllTime",
        topCount: params.topCount ?? 10,
        wardId: params.wardId ?? undefined,
        districtId: params.districtId ?? undefined,
      },
    });
    return unwrapBaseResponse(res.data).map(normalizeCitizenPointLeaderboardItem);
  },

  getMyRank: async (period: CitizenPointPeriod = "AllTime"): Promise<CitizenPointMyRank> => {
    const res = await api.get<BaseResponse<CitizenPointMyRankRaw>>("/CitizenPoint/my-rank", {
      params: { period },
    });
    return normalizeCitizenPointMyRank(unwrapBaseResponse(res.data));
  },
};

