import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  citizenPointService,
  CitizenPointHistoryParams,
  CitizenPointLeaderboardParams,
  CitizenPointPeriod,
} from "@/services/citizenPoint";

export const citizenPointQueryKeys = {
  all: ["citizenPoint"] as const,
  summary: (citizenId: string) => [...citizenPointQueryKeys.all, "summary", citizenId] as const,
  history: (citizenId: string, params: CitizenPointHistoryParams) =>
    [...citizenPointQueryKeys.all, "history", citizenId, params.pageNumber ?? 1, params.pageSize ?? 20] as const,
  leaderboard: (params: CitizenPointLeaderboardParams) =>
    [
      ...citizenPointQueryKeys.all,
      "leaderboard",
      params.period ?? "AllTime",
      params.topCount ?? 10,
      params.wardId ?? "",
      params.districtId ?? "",
    ] as const,
  myRank: (period: CitizenPointPeriod) => [...citizenPointQueryKeys.all, "my-rank", period] as const,
  dashboard: (citizenId: string, period: CitizenPointPeriod, history: CitizenPointHistoryParams, leaderboard: CitizenPointLeaderboardParams) =>
    [...citizenPointQueryKeys.all, "dashboard", citizenId, period, history.pageNumber ?? 1, history.pageSize ?? 20, leaderboard.topCount ?? 10, leaderboard.wardId ?? "", leaderboard.districtId ?? ""] as const,
};

export const useCitizenPoint = (citizenId?: string) => {
  return useQuery({
    queryKey: citizenId ? citizenPointQueryKeys.summary(citizenId) : [...citizenPointQueryKeys.all, "summary", "anonymous"],
    queryFn: () => citizenPointService.getByCitizenId(citizenId!),
    enabled: !!citizenId,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export const useCitizenPointHistory = (citizenId?: string, params: CitizenPointHistoryParams = {}) => {
  return useQuery({
    queryKey: citizenId ? citizenPointQueryKeys.history(citizenId, params) : [...citizenPointQueryKeys.all, "history", "anonymous"],
    queryFn: () => citizenPointService.getHistoryByCitizenId(citizenId!, params),
    enabled: !!citizenId,
    placeholderData: (previousData) => previousData,
  });
};

export const useCitizenPointLeaderboard = (params: CitizenPointLeaderboardParams = {}) => {
  return useQuery({
    queryKey: citizenPointQueryKeys.leaderboard(params),
    queryFn: () => citizenPointService.getLeaderboard(params),
  });
};

export const useCitizenPointMyRank = (period: CitizenPointPeriod = "AllTime") => {
  return useQuery({
    queryKey: citizenPointQueryKeys.myRank(period),
    queryFn: () => citizenPointService.getMyRank(period),
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export const useCitizenPointDashboard = ({
  citizenId,
  period = "AllTime",
  history = { pageNumber: 1, pageSize: 20 },
  leaderboard = { period: "AllTime", topCount: 10 },
}: {
  citizenId?: string;
  period?: CitizenPointPeriod;
  history?: CitizenPointHistoryParams;
  leaderboard?: CitizenPointLeaderboardParams;
}) => {
  const results = useQueries({
    queries: [
      {
        queryKey: citizenId ? citizenPointQueryKeys.summary(citizenId) : [...citizenPointQueryKeys.all, "summary", "anonymous"],
        queryFn: () => citizenPointService.getByCitizenId(citizenId!),
        enabled: !!citizenId,
      },
      {
        queryKey: citizenId ? citizenPointQueryKeys.history(citizenId, history) : [...citizenPointQueryKeys.all, "history", "anonymous"],
        queryFn: () => citizenPointService.getHistoryByCitizenId(citizenId!, history),
        enabled: !!citizenId,
        placeholderData: (previousData: unknown) => previousData,
      },
      {
        queryKey: citizenPointQueryKeys.leaderboard({ ...leaderboard, period }),
        queryFn: () => citizenPointService.getLeaderboard({ ...leaderboard, period }),
      },
      {
        queryKey: citizenPointQueryKeys.myRank(period),
        queryFn: () => citizenPointService.getMyRank(period),
      },
    ],
  });

  const [summaryQuery, historyQuery, leaderboardQuery, myRankQuery] = results;

  return useMemo(
    () => ({
      summaryQuery,
      historyQuery,
      leaderboardQuery,
      myRankQuery,
      data: {
        summary: summaryQuery.data,
        history: historyQuery.data,
        leaderboard: leaderboardQuery.data ?? [],
        myRank: myRankQuery.data,
      },
      isLoading: results.some((query) => query.isLoading),
      isFetching: results.some((query) => query.isFetching),
      isError: results.some((query) => query.isError),
      errors: results.map((query) => query.error).filter(Boolean),
    }),
    [historyQuery, leaderboardQuery, myRankQuery, results, summaryQuery]
  );
};
