import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, UserPlus, Trash2, RefreshCw, Search, History, Settings2, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { logAuditAction, PERMISSIONS, PERMISSION_LABELS, ROLE_LABELS, ROLE_DESCRIPTIONS, type StaffRole } from "@/lib/audit";

interface StaffMember {
  user_id: string;
  role: string;
  display_name: string | null;
  balance: number;
  created_at: string;
  permissions: string[];
  telegram_chat_id: string | null;
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
  const [addRole, setAddRole] = useState<StaffRole>("moderator");
  const [addPermissions, setAddPermissions] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editTelegramChatId, setEditTelegramChatId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);

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
          telegram_chat_id: (profile as any)?.telegram_chat_id || null,
        };
      });
      setStaff(staffList);
    } else {
      setStaff([]);
    }

    const { data: logs } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setAuditLogs(logs || []);

    if (logs && logs.length > 0) {
      const actorIds = [...new Set(logs.map((l) => l.actor_id))];
      const { data: actorProfiles } = await supabase.from("profiles").select("id, display_name").in("id", actorIds);
      actorProfiles?.forEach((p) => {
        setProfilesMap((prev) => ({ ...prev, [p.id]: p.display_name || p.id.slice(0, 8) }));
      });
    }

    setLoading(false);
  };

  // ── Add staff ──
  const addStaff = async () => {
    if (!addEmail || !addEmail.includes("@")) {
      toast.error("Введите корректный email");
      return;
    }
    setAddLoading(true);
    try {
      // Create user via admin edge function
      const { data: createData, error: createError } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "create_user", email: addEmail },
      });
      if (createError) throw createError;
      if (createData?.error) throw new Error(createData.error);

      const newUserId = createData.user_id;
      const generatedPassword = createData.generated_password;

      // Assign role
      const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: newUserId, role: addRole });
      if (roleErr) throw roleErr;

      // Grant permissions
      if (addPermissions.length > 0 && (addRole === "moderator" || addRole === "investor")) {
        const permsToInsert = addPermissions.map((p) => ({
          user_id: newUserId,
          permission: p,
          granted_by: user!.id,
        }));
        await supabase.from("staff_permissions").insert(permsToInsert);
      }

      await logAuditAction("assign_role", "staff", newUserId, { role: addRole, permissions: addPermissions, email: addEmail });
      
      setCreatedCreds({ email: addEmail, password: generatedPassword });
      toast.success(`Сотрудник ${addEmail} создан`);
      await loadData();
    } catch (e: any) {
      toast.error("Ошибка: " + (e.message || e));
    }
    setAddLoading(false);
  };

  // ── Edit dialog open ──
  const openEditDialog = (member: StaffMember) => {
    setEditMember(member);
    setEditRole(member.role.split(", ")[0]);
    setEditPermissions([...member.permissions]);
    setEditTelegramChatId(member.telegram_chat_id || "");
    setEditOpen(true);
  };

  // ── Save edits ──
  const saveEdits = async () => {
    if (!editMember || !user) return;
    setSaving(true);

    // Update telegram_chat_id if changed
    const oldTg = editMember.telegram_chat_id || "";
    if (editTelegramChatId !== oldTg) {
      await supabase.from("profiles").update({ telegram_chat_id: editTelegramChatId || null } as any).eq("id", editMember.user_id);
      await logAuditAction("update_telegram_2fa", "staff", editMember.user_id, { telegram_chat_id: editTelegramChatId || null });
    }
    setSaving(true);

    const currentRole = editMember.role.split(", ")[0];

    // Update role if changed
    if (editRole !== currentRole) {
      await supabase.from("user_roles").delete().eq("user_id", editMember.user_id);
      await supabase.from("user_roles").insert({ user_id: editMember.user_id, role: editRole as any });
      await logAuditAction("assign_role", "staff", editMember.user_id, { old_role: currentRole, new_role: editRole });
    }

    // Sync permissions
    const currentPerms = editMember.permissions;
    const toAdd = editPermissions.filter((p) => !currentPerms.includes(p));
    const toRemove = currentPerms.filter((p) => !editPermissions.includes(p));

    if (toRemove.length > 0) {
      for (const perm of toRemove) {
        await supabase.from("staff_permissions").delete().eq("user_id", editMember.user_id).eq("permission", perm);
      }
      await logAuditAction("revoke_permission", "staff", editMember.user_id, { permissions: toRemove });
    }

    if (toAdd.length > 0) {
      const inserts = toAdd.map((p) => ({ user_id: editMember.user_id, permission: p, granted_by: user.id }));
      await supabase.from("staff_permissions").insert(inserts);
      await logAuditAction("grant_permission", "staff", editMember.user_id, { permissions: toAdd });
    }

    toast.success("Изменения сохранены");
    setSaving(false);
    setEditOpen(false);
    await loadData();
  };

  // ── Remove staff ──
  const removeStaff = async (userId: string, role: string) => {
    if (!confirm("Удалить роль у сотрудника? Все права также будут отозваны.")) return;
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    await supabase.from("staff_permissions").delete().eq("user_id", userId);
    await logAuditAction("remove_role", "staff", userId, { role });
    toast.success("Роль удалена");
    await loadData();
  };

  const toggleAddPerm = (perm: string) => {
    setAddPermissions((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
  };

  const toggleEditPerm = (perm: string) => {
    setEditPermissions((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
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

  const allPerms = Object.values(PERMISSIONS);

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
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Добавить сотрудника</DialogTitle></DialogHeader>
                {createdCreds ? (
                  <div className="space-y-4">
                    <div className="bg-accent/50 border border-primary/20 rounded-md p-4 space-y-2">
                      <p className="text-sm font-medium text-primary">✅ Сотрудник создан!</p>
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p className="text-sm font-mono">{createdCreds.email}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Пароль</Label>
                        <p className="text-sm font-mono select-all">{createdCreds.password}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Скопируйте пароль и отправьте сотруднику. Он не будет показан повторно.</p>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => { setCreatedCreds(null); setAddEmail(""); setAddPermissions([]); setAddOpen(false); }}>Закрыть</Button>
                    </DialogFooter>
                  </div>
                ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Email сотрудника</Label>
                    <p className="text-[10px] text-muted-foreground mb-1">Аккаунт будет создан автоматически, пароль сгенерируется</p>
                    <Input type="email" placeholder="employee@example.com" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} className="text-xs" />
                  </div>

                  <div>
                    <Label className="text-xs">Роль</Label>
                    <Select value={addRole} onValueChange={(v) => setAddRole(v as StaffRole)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moderator">{ROLE_LABELS.moderator}</SelectItem>
                        <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                        <SelectItem value="ceo">{ROLE_LABELS.ceo}</SelectItem>
                        <SelectItem value="investor">{ROLE_LABELS.investor}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {ROLE_DESCRIPTIONS[addRole]}
                    </p>
                  </div>

                  {(addRole === "moderator" || addRole === "investor") && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-xs mb-2 block">Права доступа</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {allPerms.map((perm) => (
                            <div key={perm} className="flex items-center gap-2">
                              <Switch
                                checked={addPermissions.includes(perm)}
                                onCheckedChange={() => toggleAddPerm(perm)}
                                className="scale-75"
                              />
                              <span className="text-xs">{PERMISSION_LABELS[perm]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddOpen(false)}>Отмена</Button>
                    <Button onClick={addStaff} disabled={!addEmail || addLoading}>
                      {addLoading ? "Создание..." : "Создать сотрудника"}
                    </Button>
                  </DialogFooter>
                </div>
                )}
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
                  <TableHead className="px-2 w-20 text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => {
                  const isFullAccess = s.role.includes("admin") || s.role.includes("ceo");
                  return (
                    <TableRow key={s.user_id} className="text-[11px]">
                      <TableCell className="px-2">
                        <button className="text-primary hover:underline font-medium" onClick={() => navigate(`/admin/users/${s.user_id}`)}>
                          {s.display_name || s.user_id.slice(0, 12)}
                        </button>
                        <p className="text-[9px] text-muted-foreground font-mono">
                          {s.user_id.slice(0, 16)}
                          {s.telegram_chat_id && <MessageCircle className="inline h-3 w-3 ml-1 text-blue-500" />}
                        </p>
                      </TableCell>
                      <TableCell className="px-2">
                        <Badge variant={isFullAccess ? "destructive" : s.role.includes("investor") ? "secondary" : "outline"} className="text-[9px]">
                          {s.role.split(", ").map(r => ROLE_LABELS[r] || r).join(", ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-2">
                        <div className="flex flex-wrap gap-1">
                          {isFullAccess ? (
                            <span className="text-[9px] text-muted-foreground italic">Полный доступ</span>
                          ) : s.role.includes("investor") ? (
                            <span className="text-[9px] text-muted-foreground italic">Только просмотр</span>
                          ) : (
                            allPerms.map((perm) => {
                              const hasIt = s.permissions.includes(perm);
                              return (
                                <Badge
                                  key={perm}
                                  variant={hasIt ? "default" : "outline"}
                                  className={`text-[8px] px-1 py-0 ${hasIt ? "" : "opacity-40"}`}
                                >
                                  {PERMISSION_LABELS[perm]}
                                </Badge>
                              );
                            })
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditDialog(s)}>
                            <Settings2 className="h-3 w-3" />
                          </Button>
                          {!isFullAccess && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => removeStaff(s.user_id, s.role.split(", ")[0])}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                    <TableCell className="px-1"><Badge variant="outline" className="text-[9px]">{log.action}</Badge></TableCell>
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

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Редактирование прав и роли
            </DialogTitle>
          </DialogHeader>

          {editMember && (
            <div className="space-y-4">
              {/* User info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {(editMember.display_name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{editMember.display_name || "Без имени"}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{editMember.user_id}</p>
                </div>
              </div>

              {/* Role selector */}
              <div>
                <Label className="text-xs font-medium">Роль</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Пользователь (без роли)</SelectItem>
                    <SelectItem value="moderator">{ROLE_LABELS.moderator}</SelectItem>
                    <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                    <SelectItem value="ceo">{ROLE_LABELS.ceo}</SelectItem>
                    <SelectItem value="investor">{ROLE_LABELS.investor}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {ROLE_DESCRIPTIONS[editRole] || "Обычный пользователь без доступа к админке"}
                </p>
              </div>

              {/* Permissions */}
              {(editRole === "moderator" || editRole === "investor") && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-medium">Права доступа</Label>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[9px] px-1.5"
                          onClick={() => setEditPermissions([...allPerms])}
                        >
                          Все
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[9px] px-1.5"
                          onClick={() => setEditPermissions([])}
                        >
                          Снять
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {allPerms.map((perm) => (
                        <div key={perm} className="flex items-center gap-2.5 p-2 rounded-md border border-border/60 hover:bg-muted/30 transition-colors">
                          <Switch
                            checked={editPermissions.includes(perm)}
                            onCheckedChange={() => toggleEditPerm(perm)}
                          />
                          <span className="text-xs">{PERMISSION_LABELS[perm]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {(editRole === "admin" || editRole === "ceo") && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-xs text-destructive font-medium">⚠️ {ROLE_LABELS[editRole]} имеет полный доступ</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Все права включены автоматически. Для ограниченного доступа используйте роль «Модератор» или «Инвестор».</p>
                </div>
              )}

              {/* Telegram 2FA */}
              <Separator />
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <MessageCircle className="h-3 w-3" />
                  Telegram Chat ID (для 2FA)
                </Label>
                <Input
                  className="mt-1 text-xs"
                  placeholder="Например: 123456789"
                  value={editTelegramChatId}
                  onChange={(e) => setEditTelegramChatId(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Коды 2FA будут отправляться в Telegram и на почту. Если ID не указан — только на почту.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Отмена</Button>
            <Button onClick={saveEdits} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaff;
