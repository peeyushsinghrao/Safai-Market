export type MarginTier =
  | "HIGH_MARGIN"
  | "GOOD_MARGIN"
  | "LOW_MARGIN"
  | "THIN_MARGIN"
  | "BREAK_EVEN"
  | "NEGATIVE_MARGIN"
  | "UNTRACKED";

export interface MarginInfo {
  profitPerUnit: number;
  marginPct: number;
  tier: MarginTier;
}

export function classifyMarginTier(marginPct: number): MarginTier {
  if (marginPct >= 25) return "HIGH_MARGIN";
  if (marginPct >= 15) return "GOOD_MARGIN";
  if (marginPct >= 5) return "LOW_MARGIN";
  if (marginPct >= 1) return "THIN_MARGIN";
  if (marginPct === 0) return "BREAK_EVEN";
  return "NEGATIVE_MARGIN";
}

export function computeMargin(
  buyPrice: number | null | undefined,
  sellPrice: number | null | undefined
): MarginInfo | null {
  const buy = Number(buyPrice);
  const sell = Number(sellPrice);
  if (!buyPrice || !sellPrice || sell === 0 || buy === 0) return null;
  const profitPerUnit = sell - buy;
  const marginPct = (profitPerUnit / sell) * 100;
  return { profitPerUnit, marginPct, tier: classifyMarginTier(marginPct) };
}

export function calculateItemProfit(
  buyPrice: number | null | undefined,
  unitPrice: number,
  quantity: number,
  discountAmount = 0
): number | null {
  if (buyPrice == null || Number(buyPrice) === 0) return null;
  return (unitPrice - Number(buyPrice)) * quantity - discountAmount;
}

export function calculateBillProfit(
  items: Array<{
    buyPrice?: number | null;
    unitPrice: number;
    quantity: number;
    discountAmount?: number;
  }>
): { totalProfit: number | null; hasUntracked: boolean } {
  let totalProfit = 0;
  let hasUntracked = false;
  let anyTracked = false;

  for (const item of items) {
    const itemProfit = calculateItemProfit(
      item.buyPrice,
      item.unitPrice,
      item.quantity,
      item.discountAmount ?? 0
    );
    if (itemProfit == null) {
      hasUntracked = true;
    } else {
      totalProfit += itemProfit;
      anyTracked = true;
    }
  }

  return {
    totalProfit: anyTracked ? totalProfit : null,
    hasUntracked,
  };
}

export const MARGIN_TIER_CONFIG: Record<
  MarginTier,
  { label: string; color: string; badgeClass: string }
> = {
  HIGH_MARGIN: {
    label: "High Margin",
    color: "text-green-700",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
  },
  GOOD_MARGIN: {
    label: "Good",
    color: "text-blue-700",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  LOW_MARGIN: {
    label: "Low Margin",
    color: "text-amber-700",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  THIN_MARGIN: {
    label: "Thin",
    color: "text-orange-700",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
  },
  BREAK_EVEN: {
    label: "Break Even",
    color: "text-yellow-700",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  NEGATIVE_MARGIN: {
    label: "Loss",
    color: "text-red-700",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
  UNTRACKED: {
    label: "No Cost Data",
    color: "text-gray-500",
    badgeClass: "bg-gray-100 text-gray-500 border-gray-200",
  },
};
