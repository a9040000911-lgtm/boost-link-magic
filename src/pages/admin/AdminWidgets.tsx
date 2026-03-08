import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MessageSquareHeart, Bug, Star, Trash2, Check, X, Clock, AlertTriangle, Settings2 } from "lucide-react";

interface Review {
  id: string;
  name: string;
  rating: number;
  message: string;
  is_approved: boolean;
  created_at: string;
}

interface BugReport {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

const AdminWidgets = () => {
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [bugreportEnabled, setBugreportEnabled] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase.from("app_settings").select("key, value").in("key", ["widget_reviews_enabled", "widget_bugreport_enabled"]);
    if (data) {
      data.forEach(s => {
        if (s.key === "widget_reviews_enabled") setReviewsEnabled(s.value === "true");
        if (s.key === "widget_bugreport_enabled") setBugreportEnabled(s.value === "true");
      });
    }
  };

  const fetchReviews = async () => {
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (data) setReviews(data);
  };

  const fetchBugReports = async () => {
    const { data } = await supabase.from("bug_reports").select("*").order("created_at", { ascending: false });
    if (data) setBugReports(data);
  };

  useEffect(() => {
    Promise.all([fetchSettings(), fetchReviews(), fetchBugReports()]).then(() => setLoading(false));
  }, []);

  const toggleSetting = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    await supabase.from("app_settings").update({ value: String(value), updated_at: new Date().toISOString() }).eq("key", key);
    toast.success(value ? "Виджет включён" : "Виджет выключен");
  };

  const approveReview = async (id: string, approved: boolean) => {
    await supabase.from("reviews").update({ is_approved: approved }).eq("id", id);
    toast.success(approved ? "Отзыв одобрен" : "Отзыв скрыт");
    fetchReviews();
  };

  const deleteReview = async (id: string) => {
    await supabase.from("reviews").delete().eq("id", id);
    toast.success("Отзыв удалён");
    fetchReviews();
  };

  const updateBugStatus = async (id: string, status: string) => {
    await supabase.from("bug_reports").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    toast.success("Статус обновлён");
    fetchBugReports();
  };

  const deleteBugReport = async (id: string) => {
    await supabase.from("bug_reports").delete().eq("id", id);
    toast.success("Баг-репорт удалён");
    fetchBugReports();
  };

  const statusColors: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-600",
    in_progress: "bg-yellow-500/10 text-yellow-600",
    resolved: "bg-green-500/10 text-green-600",
    wontfix: "bg-muted text-muted-foreground",
  };

  const statusLabels: Record<string, string> = {
    new: "Новый",
    in_progress: "В работе",
    resolved: "Решён",
    wontfix: "Не баг",
  };

  const priorityIcons: Record<string, JSX.Element> = {
    low: <Clock className="h-3 w-3 text-muted-foreground" />,
    normal: <Clock className="h-3 w-3 text-blue-500" />,
    high: <AlertTriangle className="h-3 w-3 text-orange-500" />,
    critical: <AlertTriangle className="h-3 w-3 text-destructive" />,
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings2 className="h-6 w-6 text-primary" /> Виджеты
      </h1>

      {/* Toggle cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-border/60">
          <CardContent className="py-4 px-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <MessageSquareHeart className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Виджет «Отзывы»</p>
                <p className="text-xs text-muted-foreground">Плавающая кнопка на сайте</p>
              </div>
            </div>
            <Switch checked={reviewsEnabled} onCheckedChange={(v) => toggleSetting("widget_reviews_enabled", v, setReviewsEnabled)} />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="py-4 px-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Bug className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Виджет «Баг-репорт»</p>
                <p className="text-xs text-muted-foreground">Кнопка для тестировщиков</p>
              </div>
            </div>
            <Switch checked={bugreportEnabled} onCheckedChange={(v) => toggleSetting("widget_bugreport_enabled", v, setBugreportEnabled)} />
          </CardContent>
        </Card>
      </div>

      {/* Content tabs */}
      <Tabs defaultValue="reviews">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reviews" className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" /> Отзывы <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">{reviews.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="bugs" className="flex items-center gap-1.5">
            <Bug className="h-3.5 w-3.5" /> Баг-репорты <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">{bugReports.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-3">
          {reviews.length === 0 ? (
            <Card className="border-dashed border-2"><CardContent className="py-12 text-center text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Отзывов пока нет</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {reviews.map((r) => (
                <Card key={r.id} className="border-border/60">
                  <CardContent className="py-3 px-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{r.name || "Аноним"}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                        <Badge variant={r.is_approved ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                          {r.is_approved ? "Опубликован" : "На модерации"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{r.message}</p>
                      <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                        {new Date(r.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => approveReview(r.id, !r.is_approved)}>
                        {r.is_approved ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5 text-green-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteReview(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bugs" className="mt-3">
          {bugReports.length === 0 ? (
            <Card className="border-dashed border-2"><CardContent className="py-12 text-center text-muted-foreground">
              <Bug className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Баг-репортов нет</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {bugReports.map((b) => (
                <Card key={b.id} className="border-border/60">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{priorityIcons[b.priority] || priorityIcons.normal}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{b.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[b.status] || statusColors.new}`}>
                            {statusLabels[b.status] || b.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{b.description}</p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                          {new Date(b.created_at).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <select
                          value={b.status}
                          onChange={(e) => updateBugStatus(b.id, e.target.value)}
                          className="text-[10px] bg-muted rounded px-1.5 py-1 border-none outline-none cursor-pointer"
                        >
                          <option value="new">Новый</option>
                          <option value="in_progress">В работе</option>
                          <option value="resolved">Решён</option>
                          <option value="wontfix">Не баг</option>
                        </select>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBugReport(b.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminWidgets;
