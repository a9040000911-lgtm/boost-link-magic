import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, RefreshCw, Eye, Ban, CheckCircle, Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useTableControls, exportToCsv } from "@/hooks/useTableControls";
import { TablePagination } from "@/components/admin/TablePagination";
import { logAuditAction } from "@/lib/audit";

interface Profile {
  id: string;
  display_name: string | null;
  balance: number;
  discount: number;
  created_at: string;
}

const AdminUsers = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [orderSums, setOrderSums] = useState<Record<string, number>>({});
  const [authMap, setAuthMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: profilesData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles((profilesData || []) as Profile[]);

    const { data: orders } = await supabase.from("orders").select("user_id, price");
    if (orders) {
      const counts: Record<string, number> = {};
      const sums: Record<string, number> = {};
      orders.forEach((o) => {
        counts[o.user_id] = (counts[o.user_id] || 0) + 1;
        sums[o.user_id] = (sums[o.user_id] || 0) + Number(o.price);
      });
      setOrderCounts(counts);
      setOrderSums(sums);
    }

    if (profilesData && profilesData.length > 0) {
      try {
        const { data } = await supabase.functions.invoke("admin-user-management", {
          body: { action: "list_users_auth", user_id: "bulk", user_ids: profilesData.map((p: any) => p.id) },
        });
        if (data && typeof data === "object" && !data.error) {
          setAuthMap(data);
        }
      } catch (_) { /* non-critical */ }
    }

    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search) return profiles;
    const s = search.toLowerCase();
    return profiles.filter((p) => {
      const email = authMap[p.id]?.email || "";
      return (
        (p.display_name || "").toLowerCase().includes(s) ||
        p.id.toLowerCase().includes(s) ||
        email.toLowerCase().includes(s)
      );
    });
  }, [profiles, search, authMap]);

  const pagination = useTableControls({ data: filtered, pageSize: 50 });

  useEffect(() => { pagination.resetPage(); }, [search]);

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const formatDateTime = (d: string) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " +
      date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const handleExport = () => {
    if (!isAdmin) {
      toast.error("Экспорт доступен только администраторам");
      return;
    }
    const headers = ["Имя", "Email", "Баланс", "Скидка", "Заказов", "Потрачено", "Посл. вход", "Статус", "Регистрация"];
    const rows = filtered.map((p) => {
      const auth = authMap[p.id];
      return [
        p.display_name || "—",
        auth?.email || "",
        Number(p.balance).toFixed(2),
        `${Number(p.discount)}%`,
        String(orderCounts[p.id] || 0),
        (orderSums[p.id] || 0).toFixed(2),
        auth?.last_sign_in ? formatDateTime(auth.last_sign_in) : "—",
        auth?.banned ? "Заблокирован" : "Активен",
        formatDate(p.created_at),
      ];
    });
    exportToCsv("users", headers, rows);
    logAuditAction("update_user_profile", "export", undefined, { type: "csv_users", count: rows.length });
    toast.success(`Экспортировано ${rows.length} пользователей`);
  };

  // Totals
  const totals = useMemo(() => {
    const totalBalance = filtered.reduce((a, p) => a + Number(p.balance), 0);
    const totalSpent = filtered.reduce((a, p) => a + (orderSums[p.id] || 0), 0);
    return { totalBalance, totalSpent };
  }, [filtered, orderSums]);

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Пользователи ({filtered.length})</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleExport}>
            <Download className="h-3 w-3 mr-1" />CSV
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={loadData}>
            <RefreshCw className="h-3 w-3 mr-1" />Обновить
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Имя, Email, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-7 w-[300px] text-xs" />
        </div>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>Баланс: <strong className="text-foreground">{totals.totalBalance.toFixed(2)}₽</strong></span>
          <span>Потрачено: <strong className="text-foreground">{totals.totalSpent.toFixed(2)}₽</strong></span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto border rounded-md">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="px-2">Имя</TableHead>
                <TableHead className="px-2">Email</TableHead>
                <TableHead className="px-2 whitespace-nowrap">Баланс</TableHead>
                <TableHead className="px-2 whitespace-nowrap">Скидка</TableHead>
                <TableHead className="px-2 whitespace-nowrap">Заказов</TableHead>
                <TableHead className="px-2 whitespace-nowrap">Потрачено</TableHead>
                <TableHead className="px-2 whitespace-nowrap">Посл. вход</TableHead>
                <TableHead className="px-2 whitespace-nowrap">Статус</TableHead>
                <TableHead className="px-2 whitespace-nowrap">Регистрация</TableHead>
                <TableHead className="px-2">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginated.map((p) => {
                const auth = authMap[p.id];
                const isBanned = auth?.banned === true;
                return (
                  <TableRow key={p.id} className="text-[11px]">
                    <TableCell className="px-2 font-medium">
                      <button className="text-primary hover:underline" onClick={() => navigate(`/admin/users/${p.id}`)}>
                        {p.display_name || "—"}
                      </button>
                    </TableCell>
                    <TableCell className="px-2 text-muted-foreground">{auth?.email || "..."}</TableCell>
                    <TableCell className="px-2 whitespace-nowrap font-medium">{Number(p.balance).toFixed(2)}₽</TableCell>
                    <TableCell className="px-2 whitespace-nowrap">
                      {Number(p.discount) > 0 ? (
                        <Badge variant="secondary" className="text-[9px] px-1">{Number(p.discount)}%</Badge>
                      ) : "0%"}
                    </TableCell>
                    <TableCell className="px-2 whitespace-nowrap">{orderCounts[p.id] || 0}</TableCell>
                    <TableCell className="px-2 whitespace-nowrap">{(orderSums[p.id] || 0).toFixed(2)}₽</TableCell>
                    <TableCell className="px-2 whitespace-nowrap text-muted-foreground">{auth?.last_sign_in ? formatDateTime(auth.last_sign_in) : "—"}</TableCell>
                    <TableCell className="px-2">
                      {isBanned ? (
                        <Badge variant="destructive" className="text-[9px] px-1 gap-0.5"><Ban className="h-2 w-2" />Бан</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] px-1 gap-0.5 text-[hsl(var(--status-active))] border-[hsl(var(--status-active)/0.3)]"><CheckCircle className="h-2 w-2" />Активен</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-2 whitespace-nowrap">{formatDate(p.created_at)}</TableCell>
                    <TableCell className="px-2">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigate(`/admin/users/${p.id}`)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <TablePagination {...pagination} />
    </div>
  );
};

export default AdminUsers;
