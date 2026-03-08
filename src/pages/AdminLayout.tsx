import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single()
        .then(({ data }) => {
          if (!data) {
            navigate("/dashboard");
          } else {
            setIsAdmin(true);
          }
        });
    }
  }, [user, loading, navigate]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-muted/30 overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-12 shrink-0 flex items-center border-b border-border/60 bg-card px-4 gap-4">
            <SidebarTrigger />
            <h2 className="font-semibold text-destructive text-sm">Админ-панель</h2>
          </header>
          <main className="flex-1 p-3 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
