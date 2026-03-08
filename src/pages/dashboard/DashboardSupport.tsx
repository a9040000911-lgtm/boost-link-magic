import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, Send, ArrowLeft, Clock, CheckCircle2,
  XCircle, AlertCircle, Paperclip, Image, X, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface SupportTopic {
  id: string;
  name: string;
  icon: string;
  requires_order_id: boolean;
  sort_order: number;
}

interface UserOrder {
  id: string;
  order_number: number;
  service_name: string;
  created_at: string;
  status: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  channel: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: "Открыт", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Clock },
  in_progress: { label: "В работе", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: AlertCircle },
  resolved: { label: "Решён", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
  closed: { label: "Закрыт", color: "bg-muted text-muted-foreground border-border", icon: XCircle },
};

const channelLabels: Record<string, string> = {
  web: "Сайт",
  telegram: "Telegram",
  email: "Email",
};

const DashboardSupport = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "chat" | "new">("list");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  // Topics & orders
  const [topics, setTopics] = useState<SupportTopic[]>([]);
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);

  // New ticket form
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [contactIdentifier, setContactIdentifier] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [creating, setCreating] = useState(false);

  // Chat input
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatFile, setChatFile] = useState<File | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load tickets & topics
  useEffect(() => {
    if (!user) return;
    loadTickets();
    loadTopics();
    loadUserOrders();
  }, [user]);

  // Handle URL params (e.g. ?new=1&order_id=xxx&topic=xxx)
  useEffect(() => {
    if (!topics.length) return;
    const isNew = searchParams.get("new");
    const orderIdParam = searchParams.get("order_id");
    const topicParam = searchParams.get("topic");
    if (isNew) {
      setView("new");
      if (orderIdParam) setSelectedOrderId(orderIdParam);
      if (topicParam) {
        const found = topics.find(t => t.name.toLowerCase().includes(topicParam.toLowerCase()));
        if (found) setSelectedTopicId(found.id);
      } else if (orderIdParam) {
        // Auto-select first topic that requires order_id
        const orderTopic = topics.find(t => t.requires_order_id);
        if (orderTopic) setSelectedTopicId(orderTopic.id);
      }
      // Clear params
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, topics]);

  const loadTickets = async () => {
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  const loadTopics = async () => {
    const { data } = await supabase
      .from("support_topics")
      .select("id, name, icon, requires_order_id, sort_order")
      .eq("is_enabled", true)
      .order("sort_order");
    setTopics((data as SupportTopic[]) || []);
  };

  const loadUserOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, service_name, created_at, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setUserOrders((data as UserOrder[]) || []);
  };

  const selectedTopic = topics.find(t => t.id === selectedTopicId);

  // Load messages for ticket
  const openTicket = async (ticket: Ticket) => {
    setActiveTicket(ticket);
    setView("chat");
    setMsgLoading(true);
    const { data } = await supabase
      .from("support_messages")
      .select("id, message, is_admin, created_at, attachment_url, attachment_name, attachment_type")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    setMsgLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // Realtime messages
  useEffect(() => {
    if (!activeTicket) return;
    const channel = supabase
      .channel(`ticket-${activeTicket.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "support_messages",
        filter: `ticket_id=eq.${activeTicket.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTicket?.id]);

  // Create ticket
  const handleCreate = async () => {
    if (!user || !selectedTopicId) return;
    const topic = topics.find(t => t.id === selectedTopicId);
    if (!topic) return;
    if (topic.requires_order_id && !selectedOrderId && !contactIdentifier.trim()) {
      toast.error("Укажите заказ или ID/ссылку/email");
      return;
    }
    if (!newMessage.trim()) {
      toast.error("Заполните сообщение");
      return;
    }
    setCreating(true);

    const idPart = selectedOrderId
      ? ` [#${selectedOrderId.slice(0, 8)}]`
      : contactIdentifier.trim()
        ? ` [${contactIdentifier.trim().slice(0, 40)}]`
        : "";
    const subject = `${topic.icon} ${topic.name}${idPart}`;

    const { data: ticket, error: tErr } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject,
        priority: newPriority,
        channel: "web",
        topic_id: selectedTopicId,
        order_id: selectedOrderId || null,
      } as any)
      .select()
      .single();

    if (tErr || !ticket) {
      toast.error("Ошибка создания обращения");
      setCreating(false);
      return;
    }

    // Build first message with context
    const contextLines: string[] = [];
    if (contactIdentifier.trim()) contextLines.push(`📎 ID/Ссылка/Email: ${contactIdentifier.trim()}`);
    if (selectedOrderId) contextLines.push(`📦 Заказ: #${selectedOrderId.slice(0, 8)}`);
    const fullMessage = contextLines.length
      ? `${contextLines.join("\n")}\n\n${newMessage.trim()}`
      : newMessage.trim();

    await supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      user_id: user.id,
      message: fullMessage,
      is_admin: false,
    });

    toast.success("Обращение создано!");
    setSelectedTopicId("");
    setSelectedOrderId("");
    setContactIdentifier("");
    setNewMessage("");
    setNewPriority("normal");
    setCreating(false);
    await loadTickets();
    openTicket(ticket as Ticket);
  };

  // Send message
  const handleSend = async () => {
    if (!user || !activeTicket || (!chatInput.trim() && !chatFile)) return;
    setSending(true);

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    let attachmentType: string | null = null;

    if (chatFile) {
      const ext = chatFile.name.split(".").pop() || "file";
      const path = `${user.id}/${activeTicket.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("support-attachments")
        .upload(path, chatFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("support-attachments").getPublicUrl(path);
        attachmentUrl = urlData.publicUrl;
        attachmentName = chatFile.name;
        attachmentType = chatFile.type.startsWith("image/") ? "image" : "file";
      }
    }

    await supabase.from("support_messages").insert({
      ticket_id: activeTicket.id,
      user_id: user.id,
      message: chatInput.trim() || (attachmentName ? `📎 ${attachmentName}` : ""),
      is_admin: false,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      attachment_type: attachmentType,
    });

    // Reopen ticket if closed
    if (activeTicket.status === "closed" || activeTicket.status === "resolved") {
      await supabase.from("support_tickets").update({
        status: "open",
        reopened_at: new Date().toISOString(),
      }).eq("id", activeTicket.id);
      setActiveTicket({ ...activeTicket, status: "open" });
    }

    setChatInput("");
    setChatFile(null);
    setSending(false);
  };

  const goBack = () => {
    setView("list");
    setActiveTicket(null);
    setMessages([]);
    loadTickets();
  };

  // ─── List View ───
  if (view === "list") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Поддержка</h1>
            <p className="text-sm text-muted-foreground mt-1">Свяжитесь с нами удобным способом</p>
          </div>
          <Button onClick={() => setView("new")} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Новое обращение
          </Button>
        </div>

        {/* Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setView("new")}
            className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Через сайт</p>
              <p className="text-xs text-muted-foreground">Создать тикет здесь</p>
            </div>
          </button>
          <a
            href="https://t.me/smmpanel"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                Telegram <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </p>
              <p className="text-xs text-muted-foreground">Быстрый ответ</p>
            </div>
          </a>
          <a
            href="mailto:support@smmpanel.ru"
            className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                Email <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </p>
              <p className="text-xs text-muted-foreground">support@smmpanel.ru</p>
            </div>
          </a>
        </div>

        {/* Ticket list */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Мои обращения ({tickets.length})
          </h2>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground animate-pulse">Загрузка...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border/60 rounded-xl">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">У вас пока нет обращений</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => {
                const st = statusConfig[ticket.status] || statusConfig.open;
                const StIcon = st.icon;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => openTicket(ticket)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/20 transition-colors text-left"
                  >
                    <StIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {channelLabels[ticket.channel] || ticket.channel} · {format(new Date(ticket.created_at), "dd.MM.yyyy HH:mm")}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${st.color}`}>
                      {st.label}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── New Ticket View ───
  if (view === "new") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={goBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад к обращениям
        </button>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Новое обращение</h1>
          <p className="text-sm text-muted-foreground mt-1">Опишите вашу проблему и мы поможем</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Тема обращения *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => { setSelectedTopicId(topic.id); setSelectedOrderId(""); }}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors text-sm ${
                    selectedTopicId === topic.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/60 bg-background hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <span className="text-base">{topic.icon}</span>
                  <span className="text-xs font-medium leading-tight">{topic.name}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedTopic?.requires_order_id && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Заказ *</label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Выберите заказ" />
                </SelectTrigger>
                <SelectContent>
                  {userOrders.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground text-center">У вас нет заказов</div>
                  ) : (
                    userOrders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        <span className="truncate">#{o.order_number} — {o.service_name}</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Identifier field — always shown for context */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              ID заказа, email или ссылка {selectedTopic?.requires_order_id ? "*" : "(необязательно)"}
            </label>
            <Input
              value={contactIdentifier}
              onChange={(e) => setContactIdentifier(e.target.value)}
              placeholder="Например: #a1b2c3d4, user@mail.ru или https://instagram.com/..."
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Укажите данные, чтобы мы быстрее нашли ваш заказ</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Сообщение *</label>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Подробно опишите проблему..."
              rows={5}
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Приоритет</label>
            <Select value={newPriority} onValueChange={setNewPriority}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Низкий — общий вопрос</SelectItem>
                <SelectItem value="normal">Обычный</SelectItem>
                <SelectItem value="high">Высокий — срочная проблема</SelectItem>
                <SelectItem value="critical">Критический — не работает сервис</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating || !selectedTopicId || !newMessage.trim() || (selectedTopic?.requires_order_id && !selectedOrderId && !contactIdentifier.trim())}
            className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground"
          >
            <Send className="w-4 h-4 mr-2" /> {creating ? "Создание..." : "Отправить обращение"}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Chat View ───
  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/60 shrink-0">
        <button onClick={goBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{activeTicket?.subject}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className={`text-[10px] ${statusConfig[activeTicket?.status || "open"]?.color}`}>
              {statusConfig[activeTicket?.status || "open"]?.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {channelLabels[activeTicket?.channel || "web"]} · #{activeTicket?.id.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
        {msgLoading ? (
          <div className="text-center py-10 text-muted-foreground animate-pulse">Загрузка сообщений...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Нет сообщений</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.is_admin
                    ? "bg-muted/60 text-foreground rounded-bl-sm"
                    : "bg-primary text-primary-foreground rounded-br-sm"
                }`}
              >
                {msg.is_admin && (
                  <p className="text-[10px] font-semibold text-primary mb-0.5">Поддержка</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                {msg.attachment_url && (
                  <div className="mt-2">
                    {msg.attachment_type === "image" ? (
                      <img
                        src={msg.attachment_url}
                        alt={msg.attachment_name || ""}
                        className="max-w-full max-h-48 rounded-lg cursor-pointer"
                        onClick={() => window.open(msg.attachment_url!, "_blank")}
                      />
                    ) : (
                      <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs underline"
                      >
                        <Paperclip className="w-3 h-3" /> {msg.attachment_name || "Файл"}
                      </a>
                    )}
                  </div>
                )}
                <p className={`text-[10px] mt-1 ${msg.is_admin ? "text-muted-foreground/60" : "text-primary-foreground/60"}`}>
                  {format(new Date(msg.created_at), "HH:mm")}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border/60 pt-3">
        {chatFile && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-muted/40 text-sm">
            <Image className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate text-xs text-muted-foreground">{chatFile.name}</span>
            <button onClick={() => setChatFile(null)} className="text-muted-foreground hover:text-destructive ml-auto">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-9 h-9 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setChatFile(f);
              e.target.value = "";
            }}
          />
          <Textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Написать сообщение..."
            rows={1}
            className="text-sm min-h-[36px] max-h-32 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={sending || (!chatInput.trim() && !chatFile)}
            size="icon"
            className="shrink-0 bg-primary hover:bg-primary/90 h-9 w-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSupport;
