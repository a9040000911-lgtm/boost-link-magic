import { supabase } from "@/integrations/supabase/client";

export interface PlanLimits {
  label: string;
  maxOrdersPerMonth: number;
  maxOrderAmount: number;
  maxProjectsCount: number;
  supportPriority: "normal" | "high" | "urgent";
  canUsePromocodes: boolean;
  canUseBulkOrders: boolean;
}

const DEFAULTS: Record<string, PlanLimits> = {
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
    maxOrdersPerMonth: 0,
    maxOrderAmount: 0,
    maxProjectsCount: 0,
    supportPriority: "urgent",
    canUsePromocodes: true,
    canUseBulkOrders: true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return DEFAULTS[plan] || DEFAULTS.standard;
}

/** Fetch plan limits from app_settings (DB), falling back to defaults */
export async function fetchPlanLimits(plan: string): Promise<PlanLimits> {
  const defaults = getPlanLimits(plan);
  const prefix = `plan_${plan}_`;

  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .like("key", `${prefix}%`);

  if (!data || data.length === 0) return defaults;

  const settings: Record<string, string> = {};
  data.forEach((r) => { settings[r.key] = r.value; });

  return {
    label: plan.charAt(0).toUpperCase() + plan.slice(1),
    maxOrdersPerMonth: Number(settings[`${prefix}max_orders_month`] ?? defaults.maxOrdersPerMonth),
    maxOrderAmount: Number(settings[`${prefix}max_order_amount`] ?? defaults.maxOrderAmount),
    maxProjectsCount: Number(settings[`${prefix}max_projects`] ?? defaults.maxProjectsCount),
    supportPriority: (settings[`${prefix}support_priority`] as any) || defaults.supportPriority,
    canUsePromocodes: true,
    canUseBulkOrders: settings[`${prefix}bulk_orders`] === "true",
  };
}
