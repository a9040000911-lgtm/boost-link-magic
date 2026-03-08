import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, Send, Mail, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export default function AdminInquiries() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchInquiries(); }, []);

  async function fetchInquiries() {
    setLoading(true);
    const { data } = await supabase
      .from("guest_inquiries" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setInquiries((data as any as Inquiry[]) || []);
    setLoading(false);
  }

  async function sendReply(inq: Inquiry) {
    if (!reply.trim()) return;
    setSending(true);

    const { error } = await supabase
      .from("guest_inquiries" as any)
      .update({
        admin_reply: reply.trim(),
        status: "replied",
        replied_at: new Date().toISOString(),
        replied_by: user?.id,
      } as any)
      .eq("id", inq.id);

    if (error) {
      toast.error("Ошибка сохранения");
    } else {
      // Try to send email notification
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            to: inq.email,
            subject: `Ответ на ваш вопрос`,
            html: `
              <p>Здравствуйте, ${inq.name}!</p>
              <p>Вы спрашивали:</p>
              <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#666;">${inq.message}</blockquote>
              <p><strong>Наш ответ:</strong></p>
              <p>${reply.trim().replace(/\n/g, "<br>")}</p>
            `,
          },
        });
      } catch {}

      toast.success("Ответ отправлен");
      setReply("");
      setSelectedId(null);
      fetchInquiries();
    }
    setSending(false);
  }

  const statusBadge = (status: string) => {
    if (status === "replied") return <Badge className="bg-primary/10 text-primary border-0"><CheckCircle className="h-3 w-3 mr-1" />Отвечено</Badge>;
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Новый</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Вопросы гостей
        </h1>
        <Button variant="ghost" size="icon" onClick={fetchInquiries}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Загрузка…</p>
      ) : inquiries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Пока нет вопросов от гостей
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <Card key={inq.id} className={selectedId === inq.id ? "ring-1 ring-primary" : ""}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{inq.name}</span>
                      <a href={`mailto:${inq.email}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                        <Mail className="h-3 w-3" />{inq.email}
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(inq.created_at), "dd.MM.yyyy HH:mm")}
                    </p>
                  </div>
                  {statusBadge(inq.status)}
                </div>

                <p className="text-sm bg-muted/50 rounded-md p-3">{inq.message}</p>

                {inq.admin_reply && (
                  <div className="text-sm bg-primary/5 rounded-md p-3 border-l-2 border-primary">
                    <p className="text-xs text-muted-foreground mb-1">Ваш ответ:</p>
                    {inq.admin_reply}
                  </div>
                )}

                {selectedId === inq.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Введите ответ…"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => sendReply(inq)} disabled={sending || !reply.trim()}>
                        <Send className="h-3.5 w-3.5 mr-1" />
                        {sending ? "Отправка…" : "Отправить"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedId(null); setReply(""); }}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => { setSelectedId(inq.id); setReply(inq.admin_reply || ""); }}>
                    {inq.admin_reply ? "Изменить ответ" : "Ответить"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
