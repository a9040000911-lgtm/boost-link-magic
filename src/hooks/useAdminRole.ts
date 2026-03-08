import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AdminRole = "admin" | "moderator" | null;

export function useAdminRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "moderator"])
      .then(({ data }) => {
        if (data?.some((r) => r.role === "admin")) {
          setRole("admin");
        } else if (data?.some((r) => r.role === "moderator")) {
          setRole("moderator");
        } else {
          setRole(null);
        }
        setLoading(false);
      });
  }, [user]);

  return { role, isAdmin: role === "admin", isModerator: role === "moderator", isStaff: role !== null, loading };
}
