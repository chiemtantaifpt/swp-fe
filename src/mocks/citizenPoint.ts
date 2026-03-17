import {
  CitizenPointHistoryPageRaw,
  CitizenPointLeaderboardItemRaw,
  CitizenPointMyRankRaw,
  CitizenPointSummaryRaw,
} from "@/services/citizenPoint";
import { BaseResponse } from "@/services/baseResponse";

export const mockCitizenPointSummaryResponse: BaseResponse<CitizenPointSummaryRaw> = {
  data: {
    citizenId: "3adbd0c5-347a-4cc4-2aca-08de827a755d",
    totalPoints: 320,
    rank: 2,
    totalApprovedReports: 12,
    totalCompletedCollections: 8,
    lastUpdatedTime: "2026-03-17T10:15:00+07:00",
  },
  message: null,
  statusCode: 200,
  code: "Success",
};

export const mockCitizenPointHistoryResponse: BaseResponse<CitizenPointHistoryPageRaw> = {
  data: {
    totalCount: 3,
    pageNumber: 1,
    pageSize: 20,
    totalPages: 1,
    items: [
      {
        id: "hist-01",
        citizenId: "3adbd0c5-347a-4cc4-2aca-08de827a755d",
        points: 25,
        balanceAfter: 320,
        source: "WasteCollectionCompleted",
        status: "Approved",
        reason: "Hoàn tất thu gom cho báo cáo rác đã được xác minh",
        createdTime: "2026-03-16T14:00:00+07:00",
        reportId: "report-01",
      },
      {
        id: "hist-02",
        citizenId: "3adbd0c5-347a-4cc4-2aca-08de827a755d",
        points: 15,
        balanceAfter: 295,
        source: "ManualAdjustment",
        status: "Approved",
        reason: "Điều chỉnh cộng điểm từ quản trị viên",
        createdTime: "2026-03-14T09:30:00+07:00",
      },
      {
        id: "hist-03",
        citizenId: "3adbd0c5-347a-4cc4-2aca-08de827a755d",
        points: -10,
        balanceAfter: 280,
        source: "ManualAdjustment",
        status: "Rejected",
        reason: "Yêu cầu cộng điểm không hợp lệ",
        createdTime: "2026-03-10T08:00:00+07:00",
      },
    ],
  },
  message: null,
  statusCode: 200,
  code: "Success",
};

export const mockCitizenPointLeaderboardResponse: BaseResponse<CitizenPointLeaderboardItemRaw[]> = {
  data: [
    {
      citizenId: "citizen-01",
      citizenName: "Nguyễn Văn A",
      wardName: "Phường 1",
      districtName: "Quận 1",
      totalPoints: 520,
      rank: 1,
    },
    {
      citizenId: "3adbd0c5-347a-4cc4-2aca-08de827a755d",
      citizenName: "Bạn",
      wardName: "Phường 1",
      districtName: "Quận 1",
      totalPoints: 320,
      rank: 2,
    },
    {
      citizenId: "citizen-03",
      citizenName: "Trần Thị B",
      wardName: "Phường 2",
      districtName: "Quận 1",
      totalPoints: 280,
      rank: 3,
    },
  ],
  message: null,
  statusCode: 200,
  code: "Success",
};

export const mockCitizenPointMyRankResponse: BaseResponse<CitizenPointMyRankRaw> = {
  data: {
    citizenId: "3adbd0c5-347a-4cc4-2aca-08de827a755d",
    rank: 2,
    totalPoints: 320,
    period: "AllTime",
    totalCitizens: 145,
    percentile: 98,
  },
  message: null,
  statusCode: 200,
  code: "Success",
};
