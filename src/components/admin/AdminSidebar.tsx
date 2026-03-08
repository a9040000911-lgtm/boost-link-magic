import { Package, ShoppingCart, Users, MessageSquare, LogOut, ArrowLeft, BarChart3, Shield, Server, Receipt, FolderOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const adminMenuItems = [
  { title: "Дашборд", url: "/admin", icon: BarChart3, end: true },
  { title: "Заказы", url: "/admin/orders", icon: ShoppingCart },
  { title: "Транзакции", url: "/admin/transactions", icon: Receipt },
  { title: "Пользователи", url: "/admin/users", icon: Users },
  { title: "Услуги", url: "/admin/services", icon: Package },
  { title: "Провайдеры", url: "/admin/providers", icon: Server },
  { title: "Поддержка", url: "/admin/support", icon: MessageSquare },
  { title: "Сотрудники", url: "/admin/staff", icon: Shield },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-destructive font-bold text-sm px-4 py-2">
              Админ-панель
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard" className="hover:bg-muted/50 transition-colors text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {!collapsed && <span className="text-sm">Кабинет</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-gradient-to-br from-destructive to-primary text-primary-foreground text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{displayName}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={signOut} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
