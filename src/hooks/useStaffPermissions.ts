import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useAdminRole } from "./useAdminRole";
import { PERMISSIONS, TAB_PERMISSIONS } from "@/lib/audit";

export function useStaffPermissions() {
  const { user } = useAuth();
  const { role, hasFullAccess } = useAdminRole();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !role) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    // Admin & CEO get all permissions
    if (hasFullAccess) {
      setPermissions(Object.values(PERMISSIONS));
      setLoading(false);
      return;
    }

    // Investor gets read-only financial access
    if (role === "investor") {
      setPermissions(["view_finances"]);
      setLoading(false);
      return;
    }

    // Moderator — fetch from DB
    supabase
      .from("staff_permissions")
      .select("permission")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setPermissions(data?.map((p) => p.permission) || []);
        setLoading(false);
      });
  }, [user, role, hasFullAccess]);

  const canAccessTab = useCallback(
    (url: string) => {
      if (!role) return false;

      // Admin & CEO — full access
      if (hasFullAccess) return true;

      // Investor — only dashboard + analytics
      if (role === "investor") {
        return url === "/admin" || url === "/admin/analytics";
      }

      // Moderator — check permission mapping
      const requiredPerm = TAB_PERMISSIONS[url];
      if (requiredPerm === null) {
        // null means admin/ceo only (settings) or everyone (docs, dashboard)
        return url === "/admin" || url === "/admin/docs";
      }
      return permissions.includes(requiredPerm);
    },
    [role, hasFullAccess, permissions]
  );

  const hasPermission = useCallback(
    (perm: string) => {
      if (hasFullAccess) return true;
      return permissions.includes(perm);
    },
    [hasFullAccess, permissions]
  );

  return { permissions, canAccessTab, hasPermission, loading };
}
