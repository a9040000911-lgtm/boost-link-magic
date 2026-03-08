import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AdminRole = "admin" | "ceo" | "moderator" | "investor" | null;

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "ceo", "moderator", "investor"])
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error) {
          setRole(null);
          setLoading(false);
          return;
        }

        // Priority: admin > ceo > moderator > investor
        if (data?.some((r) => r.role === "admin")) {
          setRole("admin");
        } else if (data?.some((r) => r.role === "ceo")) {
          setRole("ceo");
        } else if (data?.some((r) => r.role === "moderator")) {
          setRole("moderator");
        } else if (data?.some((r) => r.role === "investor")) {
          setRole("investor");
        } else {
          setRole(null);
        }

        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setRole(null);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  return {
    role,
    isAdmin: role === "admin",
    isCeo: role === "ceo",
    isModerator: role === "moderator",
    isInvestor: role === "investor",
    isStaff: role !== null,
    hasFullAccess: role === "admin" || role === "ceo",
    loading,
  };
}
