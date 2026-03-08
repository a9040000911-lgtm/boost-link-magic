import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { TwoFactorGate } from "@/components/TwoFactorGate";
import { ROLE_LABELS } from "@/lib/audit";
import { Badge } from "@/components/ui/badge";

const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, isStaff, loading: roleLoading } = useAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (!authLoading && !roleLoading && !isStaff) {
      navigate("/dashboard");
    }
  }, [user, authLoading, roleLoading, isStaff, navigate]);

  if (authLoading || roleLoading || !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const roleColor = role === "admin" ? "destructive" : role === "ceo" ? "default" : role === "investor" ? "secondary" : "outline";

  return (
    <TwoFactorGate userId={user!.id}>
      <SidebarProvider>
        <div className="h-screen flex w-full bg-muted/30 overflow-hidden">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header className="h-12 shrink-0 flex items-center border-b border-border/60 bg-card px-4 gap-4">
              <SidebarTrigger />
              <h2 className="font-semibold text-destructive text-sm">Админ-панель</h2>
              {role && (
                <Badge variant={roleColor as any} className="text-[9px] ml-auto">
                  {ROLE_LABELS[role] || role}
                </Badge>
              )}
            </header>
            <main className="flex-1 p-3 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TwoFactorGate>
  );
};

export default AdminLayout;
