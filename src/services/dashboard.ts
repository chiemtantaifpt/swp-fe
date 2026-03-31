import api from "./api";

interface ObjectLike {
  [key: string]: unknown;
}

export interface DashboardCountPoint {
  label: string;
  count: number;
}

export interface DashboardValuePoint {
  label: string;
  value: number;
}

export interface AdminDashboardSummary {
  totalUsers: number;
  totalCitizens: number;
  totalEnterprises: number;
  totalCollectors: number;
  totalWasteReports: number;
  totalCollectionRequests: number;
  totalCompletedAssignments: number;
  pendingEnterpriseApprovals: number;
  pendingProofReviews: number;
  totalRewardedPoints: number;
}

export interface AdminDashboardData {
  summary: AdminDashboardSummary;
  usersByRole: DashboardCountPoint[];
  reportsByMonth: DashboardCountPoint[];
  requestsByStatus: DashboardCountPoint[];
  enterprisesByStatus: DashboardCountPoint[];
}

export interface CitizenDashboardSummary {
  myTotalReports: number;
  myPendingReports: number;
  myCollectedReports: number;
  myCurrentPoints: number;
  myPointsThisMonth: number;
}

export interface CitizenDashboardData {
  summary: CitizenDashboardSummary;
  reportsByMonth: DashboardCountPoint[];
  reportsByStatus: DashboardCountPoint[];
  pointsByMonth: DashboardValuePoint[];
  reportsByWasteType: DashboardCountPoint[];
}

export interface EnterpriseDashboardSummary {
  totalRequestsReceived: number;
  pendingRequests: number;
  completedRequests: number;
  pendingProofReviews: number;
  approvedProofs: number;
  rejectedProofs: number;
  completionRate: number;
  todayTotalCapacity: number;
  todayAssignedCount: number;
  todayRemainingCapacity: number;
  todayCollectedQuantity: number;
  totalCollectedQuantityAllTime: number;
}

export interface EnterpriseCapacityByWasteType {
  wasteTypeName: string;
  dailyCapacity: number;
  assignedToday: number;
  remaining: number;
}

export interface EnterpriseDashboardData {
  summary: EnterpriseDashboardSummary;
  requestsByMonth: DashboardCountPoint[];
  requestsByStatus: DashboardCountPoint[];
  proofsByReviewStatus: DashboardCountPoint[];
  requestsByWasteType: DashboardCountPoint[];
  capacityByWasteType: EnterpriseCapacityByWasteType[];
  collectedQuantityByMonth: DashboardValuePoint[];
  collectedQuantityByWasteType: DashboardValuePoint[];
}

export interface CollectorDashboardSummary {
  myTotalAssignments: number;
  myActiveAssignments: number;
  myCompletedAssignments: number;
  myPendingProofReviews: number;
  myRejectedProofs: number;
  myCompletionRate: number;
}

export interface CollectorDashboardData {
  summary: CollectorDashboardSummary;
  assignmentsByMonth: DashboardCountPoint[];
  assignmentsByStatus: DashboardCountPoint[];
  proofsByReviewStatus: DashboardCountPoint[];
  assignmentsByRegion: DashboardCountPoint[];
}

const isObject = (value: unknown): value is ObjectLike =>
  typeof value === "object" && value !== null;

const unwrapEnvelope = <T = unknown>(value: T | { data?: T }): T | unknown => {
  if (isObject(value) && "data" in value) return value.data;
  return value;
};

const toNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toStringOr = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const toArray = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const normalizeCountPoint = (value: unknown): DashboardCountPoint => {
  const item = isObject(value) ? value : {};

  return {
    label: toStringOr(item.label, "Không rõ"),
    count: toNumber(item.count),
  };
};

const normalizeValuePoint = (value: unknown): DashboardValuePoint => {
  const item = isObject(value) ? value : {};

  return {
    label: toStringOr(item.label, "Không rõ"),
    value: toNumber(item.value),
  };
};

const normalizeEnterpriseCapacity = (value: unknown): EnterpriseCapacityByWasteType => {
  const item = isObject(value) ? value : {};

  return {
    wasteTypeName: toStringOr(item.wasteTypeName, "Chưa rõ loại rác"),
    dailyCapacity: toNumber(item.dailyCapacity),
    assignedToday: toNumber(item.assignedToday),
    remaining: toNumber(item.remaining),
  };
};

const normalizeSummary = <T extends Record<string, number>>(
  value: unknown,
  keys: Array<keyof T>
): T => {
  const summary = isObject(value) ? value : {};
  return keys.reduce((acc, key) => {
    acc[key] = toNumber(summary[key as string]);
    return acc;
  }, {} as T);
};

const getPayload = (value: unknown) => (isObject(unwrapEnvelope(value)) ? (unwrapEnvelope(value) as ObjectLike) : {});

export const dashboardService = {
  getAdmin: async (): Promise<AdminDashboardData> => {
    const response = await api.get("/dashboard/admin");
    const data = getPayload(response.data);

    return {
      summary: normalizeSummary<AdminDashboardSummary>(data.summary, [
        "totalUsers",
        "totalCitizens",
        "totalEnterprises",
        "totalCollectors",
        "totalWasteReports",
        "totalCollectionRequests",
        "totalCompletedAssignments",
        "pendingEnterpriseApprovals",
        "pendingProofReviews",
        "totalRewardedPoints",
      ]),
      usersByRole: toArray(data.usersByRole).map(normalizeCountPoint),
      reportsByMonth: toArray(data.reportsByMonth).map(normalizeCountPoint),
      requestsByStatus: toArray(data.requestsByStatus).map(normalizeCountPoint),
      enterprisesByStatus: toArray(data.enterprisesByStatus).map(normalizeCountPoint),
    };
  },

  getCitizen: async (): Promise<CitizenDashboardData> => {
    const response = await api.get("/dashboard/citizen");
    const data = getPayload(response.data);

    return {
      summary: normalizeSummary<CitizenDashboardSummary>(data.summary, [
        "myTotalReports",
        "myPendingReports",
        "myCollectedReports",
        "myCurrentPoints",
        "myPointsThisMonth",
      ]),
      reportsByMonth: toArray(data.reportsByMonth).map(normalizeCountPoint),
      reportsByStatus: toArray(data.reportsByStatus).map(normalizeCountPoint),
      pointsByMonth: toArray(data.pointsByMonth).map(normalizeValuePoint),
      reportsByWasteType: toArray(data.reportsByWasteType).map(normalizeCountPoint),
    };
  },

  getEnterprise: async (): Promise<EnterpriseDashboardData> => {
    const response = await api.get("/dashboard/enterprise");
    const data = getPayload(response.data);

    return {
      summary: normalizeSummary<EnterpriseDashboardSummary>(data.summary, [
        "totalRequestsReceived",
        "pendingRequests",
        "completedRequests",
        "pendingProofReviews",
        "approvedProofs",
        "rejectedProofs",
        "completionRate",
        "todayTotalCapacity",
        "todayAssignedCount",
        "todayRemainingCapacity",
        "todayCollectedQuantity",
        "totalCollectedQuantityAllTime",
      ]),
      requestsByMonth: toArray(data.requestsByMonth).map(normalizeCountPoint),
      requestsByStatus: toArray(data.requestsByStatus).map(normalizeCountPoint),
      proofsByReviewStatus: toArray(data.proofsByReviewStatus).map(normalizeCountPoint),
      requestsByWasteType: toArray(data.requestsByWasteType).map(normalizeCountPoint),
      capacityByWasteType: toArray(data.capacityByWasteType).map(normalizeEnterpriseCapacity),
      collectedQuantityByMonth: toArray(data.collectedQuantityByMonth).map(normalizeValuePoint),
      collectedQuantityByWasteType: toArray(data.collectedQuantityByWasteType).map(normalizeValuePoint),
    };
  },

  getCollector: async (): Promise<CollectorDashboardData> => {
    const response = await api.get("/dashboard/collector");
    const data = getPayload(response.data);

    return {
      summary: normalizeSummary<CollectorDashboardSummary>(data.summary, [
        "myTotalAssignments",
        "myActiveAssignments",
        "myCompletedAssignments",
        "myPendingProofReviews",
        "myRejectedProofs",
        "myCompletionRate",
      ]),
      assignmentsByMonth: toArray(data.assignmentsByMonth).map(normalizeCountPoint),
      assignmentsByStatus: toArray(data.assignmentsByStatus).map(normalizeCountPoint),
      proofsByReviewStatus: toArray(data.proofsByReviewStatus).map(normalizeCountPoint),
      assignmentsByRegion: toArray(data.assignmentsByRegion).map(normalizeCountPoint),
    };
  },
};
