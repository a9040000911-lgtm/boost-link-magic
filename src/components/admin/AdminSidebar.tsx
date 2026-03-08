import { useState, useEffect } from "react";
import { Package, ShoppingCart, Users, MessageSquare, LogOut, ArrowLeft, BarChart3, Shield, Server, Receipt, FolderOpen, Settings, Tag, FileText, HelpCircle, Puzzle, Link2, BookOpen, Bot, ChevronDown, CreditCard, TrendingUp, Plug } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ROLE_LABELS } from "@/lib/audit";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  end?: boolean;
  badgeKey?: "links";
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: "Основное",
    items: [
      { title: "Дашборд", url: "/admin", icon: BarChart3, end: true },
      { title: "Аналитика", url: "/admin/analytics", icon: TrendingUp },
      { title: "Заказы", url: "/admin/orders", icon: ShoppingCart },
      { title: "Транзакции", url: "/admin/transactions", icon: Receipt },
      { title: "Пользователи", url: "/admin/users", icon: Users },
    ],
  },
  {
    label: "Каталог",
    items: [
      { title: "Услуги", url: "/admin/services", icon: Package },
      { title: "Категории", url: "/admin/categories", icon: FolderOpen },
      { title: "Провайдеры", url: "/admin/providers", icon: Server },
      { title: "Промокоды", url: "/admin/promocodes", icon: Tag },
    ],
  },
  {
    label: "Контент",
    items: [
      { title: "Страницы и SEO", url: "/admin/pages", icon: FileText },
      { title: "FAQ", url: "/admin/faq", icon: HelpCircle },
      { title: "Виджеты", url: "/admin/widgets", icon: Puzzle },
      { title: "Ссылки", url: "/admin/links", icon: Link2, badgeKey: "links" as const },
    ],
  },
  {
    label: "Коммуникации",
    items: [
      { title: "Поддержка", url: "/admin/support", icon: MessageSquare },
      { title: "Вопросы гостей", url: "/admin/inquiries", icon: HelpCircle },
      { title: "Telegram-боты", url: "/admin/bots", icon: Bot },
    ],
  },
  {
    label: "Система",
    items: [
      { title: "Платежи", url: "/admin/payments", icon: CreditCard },
      { title: "Сотрудники", url: "/admin/staff", icon: Shield },
      { title: "API & Интеграции", url: "/admin/api", icon: Plug },
      { title: "Настройки", url: "/admin/settings", icon: Settings },
      { title: "Документация", url: "/admin/docs", icon: BookOpen },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const { role } = useAdminRole();
  const { canAccessTab } = useStaffPermissions();
  const location = useLocation();
  const [unresolvedCount, setUnresolvedCount] = useState(0);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    supabase
      .from('unrecognized_links')
      .select('id', { count: 'exact', head: true })
      .eq('resolved', false)
      .then(({ count }) => {
        setUnresolvedCount(count || 0);
      });
  }, []);

  // Filter menu groups based on permissions
  const filteredGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessTab(item.url)),
    }))
    .filter((group) => group.items.length > 0);

  const isGroupActive = (group: MenuGroup) =>
    group.items.some(item => item.end ? location.pathname === item.url : location.pathname.startsWith(item.url));

  const roleColor = role === "admin" ? "destructive" : role === "ceo" ? "default" : role === "investor" ? "secondary" : "outline";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarContent>
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-destructive font-bold text-sm px-4 py-2 flex items-center gap-2">
              Админ-панель
              {role && (
                <Badge variant={roleColor as any} className="text-[8px] px-1 py-0">
                  {ROLE_LABELS[role]}
                </Badge>
              )}
            </SidebarGroupLabel>
          </SidebarGroup>
        )}

        {filteredGroups.map((group) => (
          <Collapsible key={group.label} defaultOpen={collapsed || isGroupActive(group)}>
            {!collapsed && (
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                {group.label}
                <ChevronDown className="h-3 w-3 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
              </CollapsibleTrigger>
            )}
            <CollapsibleContent>
              <SidebarGroup className="py-0">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end={item.end}
                            className="hover:bg-muted/50 transition-colors"
                            activeClassName="bg-primary/10 text-primary font-medium"
                          >
                            <item.icon className="mr-2 h-4 w-4" />
                            {!collapsed && (
                              <span className="text-sm flex-1 flex items-center justify-between">
                                {item.title}
                                {item.badgeKey === 'links' && unresolvedCount > 0 && (
                                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0 ml-auto">
                                    {unresolvedCount}
                                  </Badge>
                                )}
                              </span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </CollapsibleContent>
          </Collapsible>
        ))}

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
