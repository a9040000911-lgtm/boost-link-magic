import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Users, Shield, UserPlus, Trash2, RefreshCw, Search, History, Eye } from "lucide-react";
import { toast } from "sonner";
import { logAuditAction, PERMISSIONS, PERMISSION_LABELS } from "@/lib/audit";

interface StaffMember {
  user_id: string;
  role: string;
  display_name: string | null;
  balance: number;
  created_at: string;
  permissions: string[];
}

const AdminStaff = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAudit, setShowAudit] = useState(false);
  const [auditFilter, setAuditFilter] = useState("all");
  const [auditSearch, setAuditSearch] = useState("");
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  // Add staff dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<"moderator" | "admin">("moderator");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);

    // Get all staff (users with roles)
    const { data: roles } = await supabase.from("user_roles").select("*");
    const { data: permissions } = await supabase.from("staff_permissions").select("*");

    if (roles && roles.length > 0) {
      const userIds = [...new Set(roles.map((r) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("*").in("id", userIds);

      const pMap: Record<string, string> = {};
      profiles?.forEach((p) => { pMap[p.id] = p.display_name || p.id.slice(0, 8); });
      setProfilesMap(pMap);

      const staffList: StaffMember[] = userIds.map((uid) => {
        const userRoles = roles.filter((r) => r.user_id === uid);
        const profile = profiles?.find((p) => p.id === uid);
        const userPerms = (permissions || []).filter((p) => p.user_id === uid).map((p) => p.permission);
        return {
          user_id: uid,
          role: userRoles.map((r) => r.role).join(", "),
          display_name: profile?.display_name || null,
          balance: profile?.balance || 0,
          created_at: profile?.created_at || "",
          permissions: userPerms,
        };
      });
      setStaff(staffList);
    }

    // Load audit logs
    const { data: logs } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setAuditLogs(logs || []);

    // Get all actor profiles for audit
    if (logs && logs.length > 0) {
      const actorIds = [...new Set(logs.map((l) => l.actor_id))];
      const { data: actorProfiles } = await supabase.from("profiles").select("id, display_name").in("id", actorIds);
      actorProfiles?.forEach((p) => {
        setProfilesMap((prev) => ({ ...prev, [p.id]: p.display_name || p.id.slice(0, 8) }));
      });
    }

    setLoading(false);
  };

  const togglePermission = async (userId: string, permission: string, hasIt: boolean) => {
    if (hasIt) {
      await supabase.from("staff_permissions").delete().eq("user_id", userId).eq("permission", permission);
      await logAuditAction("revoke_permission", "staff", userId, { permission });
      toast.success("Право отозвано");
    } else {
      await supabase.from("staff_permissions").insert({ user_id: userId, permission, granted_by: user!.id });
      await logAuditAction("grant_permission", "staff", userId, { permission });
      toast.success("Право выдано");
    }
    await loadData();
  };

  const removeStaff = async (userId: string, role: string) => {
    if (!confirm("Удалить роль у сотрудника?")) return;
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    await supabase.from("staff_permissions").delete().eq("user_id", userId);
    await logAuditAction("remove_role", "staff", userId, { role });
    toast.success("Роль удалена");
    await loadData();
  };

  const addStaff = async () => {
    // Find user by email - we need to search profiles
    // Since we can't query auth.users, we look up by display_name or ask for user ID
    toast.error("Введите UUID пользователя (найдите в разделе Пользователи)");
    // For now, treat addEmail as user ID
    if (!addEmail || addEmail.length < 10) return;
    
    const { error } = await supabase.from("user_roles").insert({ user_id: addEmail, role: addRole });
    if (error) {
      toast.error("Ошибка: " + error.message);
      return;
    }
    await logAuditAction("assign_role", "staff", addEmail, { role: addRole });
    toast.success(`Роль ${addRole} назначена`);
    setAddOpen(false);
    setAddEmail("");
    await loadData();
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (auditFilter !== "all" && log.action !== auditFilter) return false;
    if (auditSearch) {
      const s = auditSearch.toLowerCase();
      const actorName = profilesMap[log.actor_id] || "";
      if (!log.action.includes(s) && !actorName.toLowerCase().includes(s) && !(log.target_id || "").includes(s)) return false;
    }
    return true;
  });

  const auditActions = [...new Set(auditLogs.map((l) => l.action))].sort();

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">{showAudit ? "Журнал действий" : "Сотрудники"}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant={showAudit ? "default" : "outline"} className="h-7 text-xs" onClick={() => setShowAudit(!showAudit)}>
            <History className="h-3 w-3 mr-1" />{showAudit ? "Сотрудники" : "Журнал"}
          </Button>
          {!showAudit && (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 text-xs"><UserPlus className="h-3 w-3 mr-1" />Добавить</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Добавить сотрудника</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">UUID пользователя (скопируйте из раздела Пользователи)</p>
                    <Input placeholder="UUID пользователя" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
                  </div>
                  <Select value={addRole} onValueChange={(v) => setAddRole(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moderator">Модератор</SelectItem>
                      <SelectItem value="admin">Администратор</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    <strong>Модератор</strong> — ограниченный доступ, настраивается правами.<br/>
                    <strong>Администратор</strong> — полный доступ ко всем разделам.
                  </p>
                  <Button onClick={addStaff} className="w-full" disabled={!addEmail}>Назначить роль</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={loadData}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {!showAudit ? (
        /* Staff list */
        <div className="flex-1 min-h-0 overflow-auto border rounded-md">
          {staff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Нет сотрудников</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-[11px]">
                  <TableHead className="px-2">Сотрудник</TableHead>
                  <TableHead className="px-2">Роль</TableHead>
                  <TableHead className="px-2">Права</TableHead>
                  <TableHead className="px-2 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.user_id} className="text-[11px]">
                    <TableCell className="px-2">
                      <button className="text-primary hover:underline font-medium" onClick={() => navigate(`/admin/users/${s.user_id}`)}>
                        {s.display_name || s.user_id.slice(0, 12)}
                      </button>
                      <p className="text-[9px] text-muted-foreground font-mono">{s.user_id.slice(0, 16)}</p>
                    </TableCell>
                    <TableCell className="px-2">
                      <Badge variant={s.role.includes("admin") ? "destructive" : "secondary"} className="text-[9px]">{s.role}</Badge>
                    </TableCell>
                    <TableCell className="px-2">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(PERMISSIONS).map(([key, perm]) => {
                          const hasIt = s.permissions.includes(perm);
                          const isAdmin = s.role.includes("admin");
                          return (
                            <div key={perm} className="flex items-center gap-0.5">
                              <Switch
                                className="scale-50"
                                checked={isAdmin || hasIt}
                                disabled={isAdmin}
                                onCheckedChange={() => togglePermission(s.user_id, perm, hasIt)}
                              />
                              <span className={`text-[9px] ${isAdmin || hasIt ? "text-foreground" : "text-muted-foreground"}`}>
                                {PERMISSION_LABELS[perm]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="px-2">
                      {!s.role.includes("admin") && (
                        <button className="text-destructive" onClick={() => removeStaff(s.user_id, s.role.split(", ")[0])}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ) : (
        /* Audit logs */
        <>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input placeholder="Поиск..." value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} className="pl-7 h-7 w-[200px] text-xs" />
            </div>
            <Select value={auditFilter} onValueChange={setAuditFilter}>
              <SelectTrigger className="w-[150px] h-7 text-xs"><SelectValue placeholder="Действие" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все действия</SelectItem>
                {auditActions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-[10px] text-muted-foreground">{filteredLogs.length} записей</span>
          </div>

          <div className="flex-1 min-h-0 overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="text-[10px]">
                  <TableHead className="px-1 whitespace-nowrap">Дата/время</TableHead>
                  <TableHead className="px-1">Сотрудник</TableHead>
                  <TableHead className="px-1">Действие</TableHead>
                  <TableHead className="px-1">Тип</TableHead>
                  <TableHead className="px-1">ID объекта</TableHead>
                  <TableHead className="px-1">Детали</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="text-[11px]">
                    <TableCell className="px-1 whitespace-nowrap text-[10px]">{formatDate(log.created_at)}</TableCell>
                    <TableCell className="px-1">
                      <button className="text-primary hover:underline" onClick={() => navigate(`/admin/users/${log.actor_id}`)}>
                        {profilesMap[log.actor_id] || log.actor_id?.slice(0, 8)}
                      </button>
                    </TableCell>
                    <TableCell className="px-1">
                      <Badge variant="outline" className="text-[9px]">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="px-1 text-muted-foreground">{log.target_type}</TableCell>
                    <TableCell className="px-1 font-mono text-[9px] text-muted-foreground">{log.target_id?.slice(0, 12) || "—"}</TableCell>
                    <TableCell className="px-1 max-w-[250px]">
                      <span className="text-[9px] text-muted-foreground break-all">
                        {log.details && Object.keys(log.details).length > 0 ? JSON.stringify(log.details) : "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminStaff;
