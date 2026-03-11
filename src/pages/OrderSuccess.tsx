/**
 * Order Success Page
 * Displayed after successful order creation with status tracking
 */

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge, OrderProgress } from "@/components/orders/OrderStatusBadge";
import {
  CheckCircle2,
  Loader2,
  ExternalLink,
  ArrowRight,
  Package,
  Clock,
  RefreshCw,
  Copy,
  Home,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OrderDetails {
  id: string;
  order_number: number | null;
  service_name: string;
  platform: string | null;
  link: string;
  quantity: number;
  price: number;
  status: string;
  progress: number;
  created_at: string;
  provider: string | null;
}

export default function OrderSuccessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearchParams()[0];
  const orderId = searchParams.get("order_id");
  const newBalance = searchParams.get("balance");

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    if (!user || !orderId) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching order:", error);
      toast.error("Не удалось загрузить информацию о заказе");
      navigate("/dashboard/orders");
      return;
    }

    setOrder(data as OrderDetails);
    setLoading(false);
  }, [user, orderId, navigate]);

  // Initial fetch
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Auto-refresh for processing orders
  useEffect(() => {
    if (!order || !["processing", "in_progress", "pending"].includes(order.status)) return;

    const interval = setInterval(() => {
      fetchOrder();
    }, 5000);

    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  // Countdown for auto-redirect
  useEffect(() => {
    if (loading || !order) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, order]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrder();
    setRefreshing(false);
    toast.success("Статус обновлён");
  };

  const handleCopyOrderId = () => {
    const id = order?.order_number || order?.id?.slice(0, 8);
    navigator.clipboard.writeText(String(id));
    toast.success(`Номер заказа #${id} скопирован`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Загрузка информации о заказе...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Заказ не найден</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              На главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = ["processing", "in_progress", "pending"].includes(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Success Animation */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center",
                isActive
                  ? "bg-blue-100 dark:bg-blue-950/50"
                  : order.status === "completed"
                  ? "bg-green-100 dark:bg-green-950/50"
                  : "bg-red-100 dark:bg-red-950/50"
              )}
            >
              {isActive ? (
                <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin" />
              ) : order.status === "completed" ? (
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              ) : (
                <Package className="h-12 w-12 text-red-600 dark:text-red-400" />
              )}
            </div>
            {/* Pulse animation for active orders */}
            {isActive && (
              <div className="absolute inset-0 rounded-full border-4 border-blue-300 dark:border-blue-700 animate-ping opacity-20" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mt-6 text-center">
            {isActive ? "Заказ принят в работу!" : order.status === "completed" ? "Заказ выполнен!" : "Заказ создан"}
          </h1>

          <p className="text-muted-foreground mt-2 text-center">
            {isActive
              ? "Мы уже начали выполнение вашего заказа"
              : "Спасибо за использование нашего сервиса"}
          </p>
        </div>

        {/* Order Card */}
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Заказ #{order.order_number || order.id.slice(0, 8)}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyOrderId}
                className="text-muted-foreground"
              >
                <Copy className="h-4 w-4 mr-1" />
                Копировать
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Статус</span>
              <OrderStatusBadge status={order.status} size="lg" />
            </div>

            {/* Service Info */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Услуга</p>
                <p className="font-medium">{order.service_name}</p>
              </div>
              {order.platform && (
                <Badge variant="outline" className="shrink-0">
                  {order.platform}
                </Badge>
              )}
            </div>

            {/* Link */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ссылка</p>
              <a
                href={order.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline text-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {order.link.replace(/^https?:\/\/(www\.)?/, "").slice(0, 50)}
                {order.link.length > 55 ? "..." : ""}
              </a>
            </div>

            {/* Progress */}
            {isActive && order.progress < order.quantity && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Прогресс</p>
                  <p className="text-sm font-medium">
                    {order.progress} / {order.quantity}
                  </p>
                </div>
                <OrderProgress current={order.progress} total={order.quantity} />
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Количество</p>
                <p className="font-semibold">{order.quantity.toLocaleString("ru-RU")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Стоимость</p>
                <p className="font-semibold text-primary">{formatPrice(order.price)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Дата создания</p>
                <p className="font-medium text-sm">{formatDate(order.created_at)}</p>
              </div>
              {newBalance && (
                <div>
                  <p className="text-xs text-muted-foreground">Баланс</p>
                  <p className="font-semibold">{parseFloat(newBalance).toFixed(2)} ₽</p>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            {isActive && (
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full mt-2"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Обновить статус
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button variant="outline" onClick={() => navigate("/dashboard/orders")}>
            <Clock className="h-4 w-4 mr-2" />
            Все заказы
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            <Home className="h-4 w-4 mr-2" />
            На главную
          </Button>
        </div>

        {/* Support Link */}
        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={() => navigate(`/dashboard/support?new=1&order_id=${order.id}`)}
            className="text-muted-foreground"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Есть вопросы? Напишите в поддержку
          </Button>
        </div>

        {/* Auto-redirect notice */}
        {countdown > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Автоматический переход через {countdown} сек...
          </p>
        )}
      </div>
    </div>
  );
}
