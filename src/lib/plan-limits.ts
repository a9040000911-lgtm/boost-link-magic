// License plan definitions and limits
export interface PlanLimits {
  label: string;
  maxOrdersPerMonth: number;      // 0 = unlimited
  maxOrderAmount: number;          // max single order price (₽), 0 = unlimited
  maxProjectsCount: number;        // 0 = unlimited
  supportPriority: "normal" | "high" | "urgent";
  canUsePromocodes: boolean;
  canUseBulkOrders: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  standard: {
    label: "Standard",
    maxOrdersPerMonth: 100,
    maxOrderAmount: 5000,
    maxProjectsCount: 3,
    supportPriority: "normal",
    canUsePromocodes: true,
    canUseBulkOrders: false,
  },
  pro: {
    label: "Pro",
    maxOrdersPerMonth: 1000,
    maxOrderAmount: 50000,
    maxProjectsCount: 20,
    supportPriority: "high",
    canUsePromocodes: true,
    canUseBulkOrders: true,
  },
  enterprise: {
    label: "Enterprise",
    maxOrdersPerMonth: 0, // unlimited
    maxOrderAmount: 0,    // unlimited
    maxProjectsCount: 0,  // unlimited
    supportPriority: "urgent",
    canUsePromocodes: true,
    canUseBulkOrders: true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.standard;
}
