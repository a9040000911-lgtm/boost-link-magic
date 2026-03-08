import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, RefreshCw, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Order {
  id: string;
  user_id: string;
  link: string;
  platform: string | null;
  service_name: string;
  quantity: number;
  price: number;
  progress: number;
  status: string;
  provider: string | null;
  provider_order_id: string | null;
  service_id: string | null;
  provider_service_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string | null; id: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600",
  processing: "bg-blue-500/20 text-blue-600",
  in_progress: "bg-blue-500/20 text-blue-600",
  completed: "bg-green-500/20 text-green-600",
  partial: "bg-orange-500/20 text-orange-600",
  canceled: "bg-red-500/20 text-red-600",
  refunded: "bg-purple-500/20 text-purple-600",
};

const AdminOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [providerServices, setProviderServices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [ordersRes, psRes, sRes] = await Promise.all([
      supabase
        .from("orders")
        .select("*, profiles!orders_user_id_fkey(display_name, id)")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("provider_services").select("id, name, provider, provider_service_id, rate, network"),
      supabase.from("services").select("id, name, description, network, price"),
    ]);
    
    // If the join fails due to missing FK, load profiles separately
    let finalOrders = ordersRes.data || [];
    if (ordersRes.error) {
      const plainOrders = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
      finalOrders = plainOrders.data || [];
    }
    
    setOrders(finalOrders as Order[]);
    setProviderServices(psRes.data || []);
    setServices(sRes.data || []);
    setLoading(false);
  };

  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (orders.length === 0) return;
    const userIds = [...new Set(orders.map((o) => o.user_id))];
    supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach((p) => { map[p.id] = p.display_name || p.id.slice(0, 8); });
        setProfilesMap(map);
      });
  }, [orders]);

  const platforms = useMemo(() => [...new Set(orders.map((o) => o.platform).filter(Boolean))].sort(), [orders]);
  const statuses = useMemo(() => [...new Set(orders.map((o) => o.status))].sort(), [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (platformFilter !== "all" && o.platform !== platformFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const userName = profilesMap[o.user_id] || "";
        if (
          !o.id.toLowerCase().includes(s) &&
          !o.service_name.toLowerCase().includes(s) &&
          !o.link.toLowerCase().includes(s) &&
          !(o.provider_order_id || "").toLowerCase().includes(s) &&
          !userName.toLowerCase().includes(s)
        ) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, platformFilter, profilesMap]);

  const getServiceInfo = (order: Order) => {
    if (order.service_id) {
      return services.find((s: any) => s.id === order.service_id);
    }
    return null;
  };

  const getProviderServiceInfo = (order: Order) => {
    if (order.provider_service_id) {
      return providerServices.find((ps: any) => ps.id === order.provider_service_id);
    }
    return null;
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-base font-bold">Заказы ({filtered.length})</h1>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={loadData}>
          <RefreshCw className="h-3 w-3 mr-1" />Обновить
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="ID, услуга, ссылка, клиент..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-7 w-[250px] text-xs" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-7 text-xs"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[120px] h-7 text-xs"><SelectValue placeholder="Платформа" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            {platforms.map((p) => <SelectItem key={p!} value={p!}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto border rounded-md">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="px-1 whitespace-nowrap">ID</TableHead>
                <TableHead className="px-1 whitespace-nowrap">Дата</TableHead>
                <TableHead className="px-1">Клиент</TableHead>
                <TableHead className="px-1 whitespace-nowrap">Соцсеть</TableHead>
                <TableHead className="px-1">Услуга</TableHead>
                <TableHead className="px-1">Ссылка</TableHead>
                <TableHead className="px-1 whitespace-nowrap">Кол-во</TableHead>
                <TableHead className="px-1 whitespace-nowrap">Прогресс</TableHead>
                <TableHead className="px-1 whitespace-nowrap">Цена</TableHead>
                <TableHead className="px-1 whitespace-nowrap">Статус</TableHead>
                <TableHead className="px-1 whitespace-nowrap">Пров.</TableHead>
                <TableHead className="px-1 whitespace-nowrap">ID пров.</TableHead>
                <TableHead className="px-1 w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id} className="text-[11px]">
                  <TableCell className="px-1 font-mono text-[10px] text-muted-foreground">{o.id.slice(0, 8)}</TableCell>
                  <TableCell className="px-1 whitespace-nowrap">{formatDate(o.created_at)}</TableCell>
                  <TableCell className="px-1">
                    <button
                      className="text-primary hover:underline font-medium"
                      onClick={() => navigate(`/admin/users/${o.user_id}`)}
                    >
                      {profilesMap[o.user_id] || o.user_id.slice(0, 8)}
                    </button>
                  </TableCell>
                  <TableCell className="px-1 whitespace-nowrap">
                    {o.platform && <Badge variant="outline" className="text-[9px] px-1">{o.platform}</Badge>}
                  </TableCell>
                  <TableCell className="px-1 max-w-[200px] truncate">{o.service_name}</TableCell>
                  <TableCell className="px-1 max-w-[150px]">
                    <a href={o.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block text-[10px]">
                      {o.link.replace(/^https?:\/\/(www\.)?/, "").slice(0, 30)}
                      <ExternalLink className="h-2 w-2 inline ml-0.5" />
                    </a>
                  </TableCell>
                  <TableCell className="px-1 whitespace-nowrap">{o.quantity}</TableCell>
                  <TableCell className="px-1 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, o.quantity > 0 ? (o.progress / o.quantity) * 100 : 0)}%` }} />
                      </div>
                      <span>{o.progress}/{o.quantity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-1 whitespace-nowrap font-medium">{Number(o.price).toFixed(2)}₽</TableCell>
                  <TableCell className="px-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${statusColors[o.status] || "bg-muted"}`}>
                      {o.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-1 whitespace-nowrap">
                    {o.provider && <Badge variant="secondary" className="text-[9px] px-1">{o.provider}</Badge>}
                  </TableCell>
                  <TableCell className="px-1 font-mono text-[10px] text-muted-foreground">{o.provider_order_id || "—"}</TableCell>
                  <TableCell className="px-1">
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setSelectedOrder(o)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Детали заказа</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">ID заказа:</span><br/><span className="font-mono">{selectedOrder.id}</span></div>
                <div><span className="text-muted-foreground">Дата:</span><br/>{formatDate(selectedOrder.created_at)}</div>
                <div>
                  <span className="text-muted-foreground">Клиент:</span><br/>
                  <button className="text-primary hover:underline" onClick={() => { setSelectedOrder(null); navigate(`/admin/users/${selectedOrder.user_id}`); }}>
                    {profilesMap[selectedOrder.user_id] || selectedOrder.user_id.slice(0, 8)}
                  </button>
                </div>
                <div><span className="text-muted-foreground">Статус:</span><br/>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[selectedOrder.status] || "bg-muted"}`}>{selectedOrder.status}</span>
                </div>
              </div>
              <div className="border-t pt-2">
                <p className="text-muted-foreground text-xs mb-1">Услуга на сайте</p>
                <p className="font-medium">{selectedOrder.service_name}</p>
                {(() => {
                  const svc = getServiceInfo(selectedOrder);
                  return svc ? <p className="text-xs text-muted-foreground">{svc.description || "Без описания"} | Цена: {svc.price}₽</p> : null;
                })()}
              </div>
              <div className="border-t pt-2">
                <p className="text-muted-foreground text-xs mb-1">Провайдер</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Провайдер:</span> {selectedOrder.provider || "—"}</div>
                  <div><span className="text-muted-foreground">ID у провайдера:</span> <span className="font-mono">{selectedOrder.provider_order_id || "—"}</span></div>
                  {(() => {
                    const ps = getProviderServiceInfo(selectedOrder);
                    return ps ? (
                      <>
                        <div><span className="text-muted-foreground">Услуга пров.:</span> {ps.name}</div>
                        <div><span className="text-muted-foreground">Цена пров.:</span> {ps.rate}₽</div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="border-t pt-2 grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-muted-foreground">Количество:</span><br/>{selectedOrder.quantity}</div>
                <div><span className="text-muted-foreground">Прогресс:</span><br/>{selectedOrder.progress}/{selectedOrder.quantity}</div>
                <div><span className="text-muted-foreground">Сумма:</span><br/><strong>{Number(selectedOrder.price).toFixed(2)}₽</strong></div>
              </div>
              <div className="border-t pt-2 text-xs">
                <span className="text-muted-foreground">Ссылка:</span><br/>
                <a href={selectedOrder.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                  {selectedOrder.link} <ExternalLink className="h-2.5 w-2.5 inline" />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
