export const MIN_WASTE_QUANTITY = 0.01;

const hasAtMostTwoDecimals = (value: number) =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;

export const parseWasteQuantityInput = (value: string): number => {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return Number.NaN;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export const formatWasteQuantityInput = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value) ? String(value) : "";

export const getWasteQuantityValidationError = (value: unknown): string | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Khối lượng phải là số hợp lệ";
  }

  if (value < MIN_WASTE_QUANTITY) {
    return `Khối lượng phải lớn hơn hoặc bằng ${MIN_WASTE_QUANTITY} kg`;
  }

  if (!hasAtMostTwoDecimals(value)) {
    return "Khối lượng chỉ hỗ trợ tối đa 2 số lẻ";
  }

  return null;
};

export const hasInvalidWasteQuantity = (
  items: Array<{ quantity: number }>
): boolean => items.some((item) => !!getWasteQuantityValidationError(item.quantity));

export const getWasteQuantityListValidationError = (
  items: Array<{ quantity: number }>
): string | null => {
  const invalidItem = items.find((item) => !!getWasteQuantityValidationError(item.quantity));
  if (!invalidItem) return null;

  return "Vui lòng nhập khối lượng hợp lệ cho tất cả loại rác (> 0 kg, tối đa 2 số lẻ)";
};
