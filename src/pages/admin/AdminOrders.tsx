import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Pencil, X, Undo2, ExternalLink, Copy, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTableControls, exportToCsv } from "@/hooks/useTableControls";
import { TablePagination } from "@/components/admin/TablePagination";

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
  refund_status: string | null;
  refunded_amount: number | null;
  refunded_at: string | null;
  refunded_by: string | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, string> = {
  pending: "Ожидает",
  processing: "В обработке",
  in_progress: "Выполняется",
  completed: "Выполнен",
  partial: "Частично",
  canceled: "Отменен",
  refunded: "Возврат",
};

const statusColorClass: Record<string, string> = {
  pending: "text-[hsl(var(--status-pending))]",
  processing: "text-[hsl(var(--status-processing))]",
  in_progress: "text-[hsl(var(--status-in-progress))]",
  completed: "text-[hsl(var(--status-completed))]",
  partial: "text-[hsl(var(--status-partial))]",
  canceled: "text-[hsl(var(--status-canceled))]",
  refunded: "text-[hsl(var(--status-refunded))]",
};

const AdminOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [providerServices, setProviderServices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [ordersRes, psRes, sRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("provider_services").select("id, name, provider, provider_service_id, rate, network, category"),
      supabase.from("services").select("id, name, description, network, price, category"),
    ]);
    setOrders((ordersRes.data || []) as Order[]);
    setProviderServices(psRes.data || []);
    setServices(sRes.data || []);
    setLoading(false);
  };

  const [profilesMap, setProfilesMap] = useState<Record<string, { name: string; email?: string }>>({});

  useEffect(() => {
    if (orders.length === 0) return;
    const userIds = [...new Set(orders.map((o) => o.user_id))];

    // Fetch display names
    supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds)
      .then(({ data }) => {
        const map: Record<string, { name: string; email?: string }> = {};
        data?.forEach((p) => {
          map[p.id] = { name: p.display_name || p.id.slice(0, 8) };
        });
        setProfilesMap((prev) => {
          const merged = { ...prev };
          Object.entries(map).forEach(([id, val]) => { merged[id] = { ...merged[id], ...val }; });
          return merged;
        });
      });

    // Fetch emails
    supabase.functions.invoke("admin-user-management", {
      body: { action: "list_users_auth", user_id: "bulk", user_ids: userIds },
    }).then(({ data }) => {
      if (data && typeof data === "object" && !data.error) {
        setProfilesMap((prev) => {
          const merged = { ...prev };
          Object.entries(data).forEach(([id, info]: [string, any]) => {
            merged[id] = { ...merged[id], name: merged[id]?.name || id.slice(0, 8), email: info?.email };
          });
          return merged;
        });
      }
    }).catch(() => {});
  }, [orders]);

  const platforms = useMemo(() => [...new Set(orders.map((o) => o.platform).filter(Boolean))].sort(), [orders]);
  const statuses = useMemo(() => [...new Set(orders.map((o) => o.status))].sort(), [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (platformFilter !== "all" && o.platform !== platformFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const userName = profilesMap[o.user_id]?.name || "";
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

  const pagination = useTableControls({ data: filtered, pageSize: 50 });

  // Reset page when filters change
  useEffect(() => { pagination.resetPage(); }, [search, statusFilter, platformFilter]);

  const getServiceInfo = (order: Order) => order.service_id ? services.find((s: any) => s.id === order.service_id) : null;
  const getProviderServiceInfo = (order: Order) => order.provider_service_id ? providerServices.find((ps: any) => ps.id === order.provider_service_id) : null;

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", { year: "numeric", month: "2-digit", day: "2-digit" }) + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const handleRefund = async () => {
    if (!refundOrder) return;
    setRefunding(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-refund", {
        body: { order_id: refundOrder.id, reason: refundReason },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success(`Возврат ${data.refund_amount}₽ выполнен`);
      setRefundOrder(null);
      setRefundReason("");
      await loadData();
    } catch (e: any) {
      toast.error("Ошибка возврата: " + e.message);
    }
    setRefunding(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleExport = () => {
    const headers = ["ID", "Дата", "Пользователь", "Услуга", "Ссылка", "Кол-во", "Цена", "Статус", "Провайдер", "ID провайдера"];
    const rows = filtered.map((o) => [
      o.id.slice(0, 8),
      formatDate(o.created_at),
      profilesMap[o.user_id]?.name || o.user_id.slice(0, 8),
      o.service_name,
      o.link,
      String(o.quantity),
      Number(o.price).toFixed(2),
      statusLabels[o.status] || o.status,
      o.provider || "",
      o.provider_order_id || "",
    ]);
    exportToCsv("orders", headers, rows);
    toast.success(`Экспортировано ${rows.length} заказов`);
  };

  // Calculate totals for filtered set
  const totals = useMemo(() => {
    const sum = filtered.reduce((a, o) => a + Number(o.price), 0);
    const qty = filtered.reduce((a, o) => a + o.quantity, 0);
    return { sum, qty };
  }, [filtered]);

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold tracking-tight">СПИСОК ЗАКАЗОВ</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />CSV
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={loadData}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Обновить
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="ID, услуга, ссылка, клиент..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 w-[280px] text-xs" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{statusLabels[s] || s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Платформа" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все платформы</SelectItem>
            {platforms.map((p) => <SelectItem key={p!} value={p!}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span>Найдено: <strong className="text-foreground">{filtered.length}</strong></span>
          <span>Сумма: <strong className="text-foreground">{totals.sum.toFixed(2)}₽</strong></span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto border rounded-lg">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wider">
                <TableHead className="px-3 w-[60px]">#</TableHead>
                <TableHead className="px-3">Пользователь</TableHead>
                <TableHead className="px-3">Информация</TableHead>
                <TableHead className="px-3 w-[90px] text-right">Цена</TableHead>
                <TableHead className="px-3 w-[100px] text-center">Статус</TableHead>
                <TableHead className="px-3 w-[160px]">Создана</TableHead>
                <TableHead className="px-3 w-[80px] text-center">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                    Заказы не найдены
                  </TableCell>
                </TableRow>
              ) : pagination.paginated.map((o, idx) => {
                const svc = getServiceInfo(o);
                const ps = getProviderServiceInfo(o);
                const isExpanded = expandedId === o.id;
                const profile = profilesMap[o.user_id];

                return (
                  <TableRow key={o.id} className="text-sm align-top border-b">
                    <TableCell className="px-3 py-3 font-mono text-xs text-muted-foreground">
                      #{(o as any).order_number || pagination.from + idx}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <button
                        className="text-primary hover:underline font-medium text-sm"
                        onClick={() => navigate(`/admin/users/${o.user_id}`)}
                      >
                        {profile?.email || profile?.name || o.user_id.slice(0, 8)}
                      </button>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="space-y-0.5 text-sm">
                        <div>
                          <span className="font-semibold">Категория:</span>{" "}
                          <span className="text-primary">{svc?.category || o.platform || "—"}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Сервис:</span>{" "}
                          <span className="text-primary">{o.service_name}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Ссылка:</span>{" "}
                          <a href={o.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {o.link.length > 40 ? o.link.slice(0, 40) + "…" : o.link}
                          </a>
                        </div>
                        <div>
                          <span className="font-semibold">Кол-во:</span> {o.quantity}
                          {o.progress > 0 && o.progress < o.quantity && (
                            <span className="text-muted-foreground ml-1">(выполнено: {o.progress})</span>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Дата создания:</span> {formatDate(o.created_at)}
                        </div>

                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-dashed space-y-0.5">
                            <div>
                              <span className="font-semibold">Провайдер:</span>{" "}
                              <span className="text-primary">
                                {o.provider || "—"}
                                {ps && ` (${ps.provider_service_id})`}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold">ID заказа у провайдера:</span>{" "}
                              <span className="font-mono">{o.provider_order_id || "—"}</span>
                            </div>
                            {ps && (
                              <div>
                                <span className="font-semibold">Услуга провайдера:</span>{" "}
                                <span>{ps.name}</span>
                              </div>
                            )}
                            {o.refund_status && (
                              <div>
                                <span className="font-semibold">Возврат:</span>{" "}
                                <span className="text-destructive">
                                  {o.refund_status} {o.refunded_amount ? `(${Number(o.refunded_amount).toFixed(2)}₽)` : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => toggleExpand(o.id)}
                          className="text-primary hover:underline text-xs mt-1 inline-block"
                        >
                          {isExpanded ? "Скрыть детали" : "Показать детали"}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right whitespace-nowrap font-medium">
                      {Number(o.price).toFixed(2)} ₽
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center">
                      <span className={`font-semibold ${statusColorClass[o.status] || "text-muted-foreground"}`}>
                        {statusLabels[o.status] || o.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(o.created_at)}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                          title="Подробности"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {o.refund_status !== "refunded" && o.status !== "refunded" && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setRefundOrder(o)}
                            title="Возврат"
                          >
                            <X className="h-3.5 w-3.5" />
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

      <TablePagination {...pagination} />

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedOrder && (() => {
            const svc = getServiceInfo(selectedOrder);
            const ps = getProviderServiceInfo(selectedOrder);
            const profile = profilesMap[selectedOrder.user_id];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base">Заказ #{selectedOrder.id.slice(0, 8)}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-lg ${statusColorClass[selectedOrder.status] || "text-muted-foreground"}`}>
                      {statusLabels[selectedOrder.status] || selectedOrder.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(selectedOrder.created_at)}</span>
                  </div>

                  <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Клиент</p>
                    <button
                      className="text-primary hover:underline font-medium text-sm"
                      onClick={() => { setSelectedOrder(null); navigate(`/admin/users/${selectedOrder.user_id}`); }}
                    >
                      {profile?.name || selectedOrder.user_id.slice(0, 8)}
                    </button>
                    <p className="text-[10px] text-muted-foreground font-mono">{selectedOrder.user_id}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Услуга</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div><span className="text-muted-foreground">Название:</span> <span className="font-medium">{selectedOrder.service_name}</span></div>
                      <div><span className="text-muted-foreground">Платформа:</span> {selectedOrder.platform ? <Badge variant="outline" className="text-[10px] ml-1">{selectedOrder.platform}</Badge> : "—"}</div>
                      {svc && <div><span className="text-muted-foreground">Категория:</span> {svc.category}</div>}
                      {svc && <div><span className="text-muted-foreground">Цена каталога:</span> {Number(svc.price).toFixed(2)}₽/1к</div>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Параметры заказа</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/40 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold">{selectedOrder.quantity}</p>
                        <p className="text-[10px] text-muted-foreground">Количество</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold">{selectedOrder.progress}/{selectedOrder.quantity}</p>
                        <p className="text-[10px] text-muted-foreground">Прогресс</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold">{Number(selectedOrder.price).toFixed(2)}₽</p>
                        <p className="text-[10px] text-muted-foreground">Сумма</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Ссылка</p>
                    <a href={selectedOrder.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs break-all flex items-start gap-1">
                      {selectedOrder.link}
                      <ExternalLink className="h-3 w-3 shrink-0 mt-0.5" />
                    </a>
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs text-muted-foreground font-medium">Провайдер</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <div><span className="text-muted-foreground">Провайдер:</span> {selectedOrder.provider ? <Badge variant="secondary" className="text-[10px] ml-1">{selectedOrder.provider}</Badge> : "—"}</div>
                      <div><span className="text-muted-foreground">ID у провайдера:</span> <span className="font-mono">{selectedOrder.provider_order_id || "—"}</span></div>
                      {ps && (
                        <>
                          <div><span className="text-muted-foreground">Услуга пров.:</span> {ps.name?.slice(0, 40)}</div>
                          <div><span className="text-muted-foreground">SID:</span> <span className="font-mono">{ps.provider_service_id}</span></div>
                          <div><span className="text-muted-foreground">Цена пров.:</span> {Number(ps.rate).toFixed(2)}₽/1к</div>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedOrder.refund_status && (
                    <div className="border-t pt-3 space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Возврат</p>
                      <div className="bg-destructive/10 rounded-lg p-2 text-xs space-y-0.5">
                        <p><span className="text-muted-foreground">Статус:</span> <span className="text-destructive font-medium">{selectedOrder.refund_status}</span></p>
                        {selectedOrder.refunded_amount && <p><span className="text-muted-foreground">Сумма:</span> {Number(selectedOrder.refunded_amount).toFixed(2)}₽</p>}
                        {selectedOrder.refunded_at && <p><span className="text-muted-foreground">Дата:</span> {formatDate(selectedOrder.refunded_at)}</p>}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-3 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Идентификаторы</p>
                    <div className="text-[10px] text-muted-foreground font-mono space-y-0.5">
                      <p>Order: {selectedOrder.id}</p>
                      <p>User: {selectedOrder.user_id}</p>
                      {selectedOrder.service_id && <p>Service: {selectedOrder.service_id}</p>}
                      {selectedOrder.provider_service_id && <p>ProviderService: {selectedOrder.provider_service_id}</p>}
                    </div>
                  </div>

                  <div className="border-t pt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { setSelectedOrder(null); navigate(`/admin/users/${selectedOrder.user_id}`); }}>
                      Профиль клиента
                    </Button>
                    {selectedOrder.refund_status !== "refunded" && selectedOrder.status !== "refunded" && (
                      <Button variant="destructive" size="sm" className="flex-1 text-xs" onClick={() => { setSelectedOrder(null); setRefundOrder(selectedOrder); }}>
                        <Undo2 className="h-3 w-3 mr-1" />Возврат
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Refund dialog */}
      <Dialog open={!!refundOrder} onOpenChange={() => setRefundOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Возврат средств</DialogTitle></DialogHeader>
          {refundOrder && (
            <div className="space-y-3 text-sm">
              <div className="text-xs space-y-1 bg-muted/50 rounded-lg p-3">
                <p><span className="text-muted-foreground">Заказ:</span> #{refundOrder.id.slice(0, 8)}</p>
                <p><span className="text-muted-foreground">Услуга:</span> {refundOrder.service_name}</p>
                <p><span className="text-muted-foreground">Сумма:</span> {Number(refundOrder.price).toFixed(2)}₽</p>
              </div>
              <Textarea placeholder="Причина возврата..." value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={3} className="text-sm" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setRefundOrder(null)}>Отмена</Button>
                <Button variant="destructive" size="sm" onClick={handleRefund} disabled={refunding || !refundReason.trim()}>
                  {refunding ? "Обработка..." : "Подтвердить возврат"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
