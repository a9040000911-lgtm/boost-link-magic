import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "refund_order"
  | "cancel_order"
  | "update_order_status"
  | "assign_role"
  | "remove_role"
  | "grant_permission"
  | "revoke_permission"
  | "toggle_service"
  | "update_service"
  | "create_service"
  | "delete_service"
  | "sync_services"
  | "close_ticket"
  | "reopen_ticket"
  | "reply_ticket"
  | "update_user_balance"
  | "update_user_profile"
  | "update_user_email"
  | "update_user_password"
  | "ban_user"
  | "login_admin"
  | "update_telegram_2fa";

export async function logAuditAction(
  action: AuditAction,
  targetType: string,
  targetId?: string,
  details?: Record<string, any>
) {
  try {
    await supabase.from("admin_audit_logs").insert({
      actor_id: (await supabase.auth.getUser()).data.user?.id,
      action,
      target_type: targetType,
      target_id: targetId || null,
      details: details || {},
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}

export const PERMISSIONS = {
  MANAGE_ORDERS: "manage_orders",
  MANAGE_USERS: "manage_users",
  MANAGE_SERVICES: "manage_services",
  MANAGE_SUPPORT: "manage_support",
  MANAGE_CONTENT: "manage_content",
  PROCESS_REFUNDS: "process_refunds",
  MANAGE_STAFF: "manage_staff",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  VIEW_FINANCES: "view_finances",
} as const;

export const PERMISSION_LABELS: Record<string, string> = {
  manage_orders: "Управление заказами",
  manage_users: "Управление пользователями",
  manage_services: "Управление услугами",
  manage_support: "Техподдержка",
  manage_content: "Управление контентом",
  process_refunds: "Возвраты средств",
  manage_staff: "Управление сотрудниками",
  view_audit_logs: "Просмотр логов",
  view_finances: "Финансовая информация",
};

/** Maps admin tab URLs to the permission required */
export const TAB_PERMISSIONS: Record<string, string | null> = {
  "/admin": null,
  "/admin/orders": "manage_orders",
  "/admin/transactions": "view_finances",
  "/admin/users": "manage_users",
  "/admin/services": "manage_services",
  "/admin/categories": "manage_services",
  "/admin/providers": "manage_services",
  "/admin/promocodes": "manage_services",
  "/admin/pages": "manage_content",
  "/admin/faq": "manage_content",
  "/admin/widgets": "manage_content",
  "/admin/links": "manage_content",
  "/admin/support": "manage_support",
  "/admin/inquiries": "manage_support",
  "/admin/bots": "manage_support",
  "/admin/payments": "view_finances",
  "/admin/staff": "manage_staff",
  "/admin/settings": null,
  "/admin/docs": null,
  "/admin/analytics": "view_finances",
  "/admin/licenses": null,
};

export type StaffRole = "admin" | "ceo" | "moderator" | "investor";

export const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  ceo: "CEO",
  moderator: "Модератор",
  investor: "Инвестор",
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Полный доступ ко всем разделам и функциям",
  ceo: "Полный доступ, высший уровень иерархии",
  moderator: "Доступ только к разрешённым разделам (настройте правами)",
  investor: "Только просмотр финансовых показателей, без управления",
};
