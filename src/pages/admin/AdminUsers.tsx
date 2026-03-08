import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, RefreshCw } from "lucide-react";

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: profilesData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles(profilesData || []);

    // Get order counts per user
    const { data: orders } = await supabase.from("orders").select("user_id");
    if (orders) {
      const counts: Record<string, number> = {};
      orders.forEach((o) => { counts[o.user_id] = (counts[o.user_id] || 0) + 1; });
      setOrderCounts(counts);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search) return profiles;
    const s = search.toLowerCase();
    return profiles.filter((p) =>
      (p.display_name || "").toLowerCase().includes(s) ||
      p.id.toLowerCase().includes(s)
    );
  }, [profiles, search]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Пользователи ({filtered.length})</h1>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={loadData}>
          <RefreshCw className="h-3 w-3 mr-1" />Обновить
        </Button>
      </div>

      <div className="relative shrink-0">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input placeholder="Имя, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-7 w-[250px] text-xs" />
      </div>

      <div className="flex-1 min-h-0 overflow-auto border rounded-md">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="px-2">Имя</TableHead>
                <TableHead className="px-2">ID</TableHead>
                <TableHead className="px-2 whitespace-nowrap">Баланс</TableHead>
                <TableHead className="px-2 whitespace-nowrap">Заказов</TableHead>
                <TableHead className="px-2 whitespace-nowrap">Регистрация</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="text-[11px] cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/users/${p.id}`)}>
                  <TableCell className="px-2 font-medium">
                    <button className="text-primary hover:underline">{p.display_name || "—"}</button>
                  </TableCell>
                  <TableCell className="px-2 font-mono text-[10px] text-muted-foreground">{p.id.slice(0, 12)}</TableCell>
                  <TableCell className="px-2 whitespace-nowrap font-medium">{Number(p.balance).toFixed(2)}₽</TableCell>
                  <TableCell className="px-2 whitespace-nowrap">{orderCounts[p.id] || 0}</TableCell>
                  <TableCell className="px-2 whitespace-nowrap">{formatDate(p.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
