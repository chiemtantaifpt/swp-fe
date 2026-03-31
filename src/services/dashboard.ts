import api from "./api";

interface ObjectLike {
  [key: string]: unknown;
}

export interface EnterpriseDashboardSummary {
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

export interface EnterpriseChartPoint {
  label: string;
  value: number;
}

export interface EnterpriseDashboardData {
  summary: EnterpriseDashboardSummary;
  capacityByWasteType: EnterpriseCapacityByWasteType[];
  collectedQuantityByMonth: EnterpriseChartPoint[];
  collectedQuantityByWasteType: EnterpriseChartPoint[];
}

const isObject = (value: unknown): value is ObjectLike =>
  typeof value === "object" && value !== null;

const unwrapEnvelope = <T = unknown>(value: T | { data?: T }): T | unknown => {
  if (isObject(value) && "data" in value) {
    return value.data;
  }

  return value;
};

const toNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toStringOr = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const toArray = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const normalizeSummary = (value: unknown): EnterpriseDashboardSummary => {
  const summary = isObject(value) ? value : {};

  return {
    todayTotalCapacity: toNumber(summary.todayTotalCapacity),
    todayAssignedCount: toNumber(summary.todayAssignedCount),
    todayRemainingCapacity: toNumber(summary.todayRemainingCapacity),
    todayCollectedQuantity: toNumber(summary.todayCollectedQuantity),
    totalCollectedQuantityAllTime: toNumber(summary.totalCollectedQuantityAllTime),
  };
};

const normalizeCapacityByWasteType = (value: unknown): EnterpriseCapacityByWasteType => {
  const item = isObject(value) ? value : {};

  return {
    wasteTypeName: toStringOr(item.wasteTypeName, "Chưa rõ loại rác"),
    dailyCapacity: toNumber(item.dailyCapacity),
    assignedToday: toNumber(item.assignedToday),
    remaining: toNumber(item.remaining),
  };
};

const normalizeChartPoint = (value: unknown): EnterpriseChartPoint => {
  const item = isObject(value) ? value : {};

  return {
    label: toStringOr(item.label, "Không rõ"),
    value: toNumber(item.value),
  };
};

export const dashboardService = {
  getEnterprise: async (): Promise<EnterpriseDashboardData> => {
    const response = await api.get("/dashboard/enterprise");
    const payload = unwrapEnvelope(response.data);
    const data = isObject(payload) ? payload : {};

    return {
      summary: normalizeSummary(data.summary),
      capacityByWasteType: toArray(data.capacityByWasteType).map(normalizeCapacityByWasteType),
      collectedQuantityByMonth: toArray(data.collectedQuantityByMonth).map(normalizeChartPoint),
      collectedQuantityByWasteType: toArray(data.collectedQuantityByWasteType).map(normalizeChartPoint),
    };
  },
};
