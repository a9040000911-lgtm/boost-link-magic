import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageSquare, Send, Search, User, Clock, ChevronLeft, Paperclip, Mail, MessageCircle, AlertTriangle, Ban, ShieldOff, ShieldCheck, Timer, TimerOff, Reply, X, Sparkles, FileText, BookOpen, Loader2 } from "lucide-react";
import { ImageViewer } from "@/components/support/ImageViewer";
import { AudioPlayer } from "@/components/support/AudioPlayer";
import { VideoPlayer } from "@/components/support/VideoPlayer";
import { toast } from "@/hooks/use-toast";

interface ResponseTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  shortcut: string | null;
}

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  channel?: string;
  auto_close_at?: string | null;
  auto_closed?: boolean;
  last_admin_reply_at?: string | null;
  reopened_at?: string | null;
}

interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  reply_to_id?: string | null;
}

interface ClientGroup {
  user_id: string;
  displayName: string;
  tickets: Ticket[];
  lastActivity: string;
  openCount: number;
  waitingCount: number;
  totalCount: number;
}

interface SupportBan {
  id: string;
  user_id: string;
  warnings: number;
  is_banned: boolean;
  ban_type: string | null;
  banned_at: string | null;
  ban_expires_at: string | null;
  banned_by: string | null;
  unban_reason: string | null;
}

// These will be loaded from app_settings, with fallbacks
let AUTO_CLOSE_HOURS = 24;
let REOPEN_HOURS = 48;

const statusColors: Record<string, string> = {
  open: "bg-green-500/20 text-green-600",
  in_progress: "bg-blue-500/20 text-blue-600",
  waiting_reply: "bg-orange-500/20 text-orange-600",
  closed: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  open: "Открыт",
  in_progress: "В работе",
  waiting_reply: "Ожидание",
  closed: "Закрыт",
};

const channelIcons: Record<string, React.ReactNode> = {
  web: <MessageSquare className="h-2.5 w-2.5" />,
  email: <Mail className="h-2.5 w-2.5" />,
  telegram: <MessageCircle className="h-2.5 w-2.5" />,
};

function getAttachmentCategory(type: string | null | undefined): "image" | "audio" | "video" | "file" {
  if (!type) return "file";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("audio/") || type.includes("ogg") || type.includes("voice")) return "audio";
  if (type.startsWith("video/")) return "video";
  return "file";
}

function MessageAttachment({ msg, onImageClick }: { msg: Message; onImageClick: (url: string) => void }) {
  if (!msg.attachment_url) return null;
  const category = getAttachmentCategory(msg.attachment_type);
  switch (category) {
    case "image":
      return <div className="mt-1"><img src={msg.attachment_url} alt={msg.attachment_name || "Image"} className="max-w-[220px] max-h-[160px] rounded cursor-pointer hover:opacity-80 transition-opacity object-cover" onClick={() => onImageClick(msg.attachment_url!)} /></div>;
    case "audio":
      return <div className="mt-1"><AudioPlayer src={msg.attachment_url} name={msg.attachment_name || "Голосовое сообщение"} /></div>;
    case "video":
      return <div className="mt-1"><VideoPlayer src={msg.attachment_url} name={msg.attachment_name || "Видео"} /></div>;
    default:
      return <div className="mt-1"><a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">📎 {msg.attachment_name || "Файл"}</a></div>;
  }
}

// Countdown component that updates every second
function CountdownTimer({ autoCloseAt }: { autoCloseAt: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const target = new Date(autoCloseAt).getTime();
  const totalMs = AUTO_CLOSE_HOURS * 60 * 60 * 1000;
  const remainingMs = Math.max(0, target - now);
  const progress = ((totalMs - remainingMs) / totalMs) * 100;

  if (remainingMs <= 0) return <span className="text-[9px] text-destructive font-bold">Закрывается...</span>;

  const hours = Math.floor(remainingMs / 3600000);
  const minutes = Math.floor((remainingMs % 3600000) / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  const timeStr = hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м ${seconds}с`;

  return (
    <div className="flex items-center gap-1.5 w-full">
      <Timer className="h-3 w-3 text-orange-500 shrink-0" />
      <Progress value={progress} className="h-1.5 flex-1 [&>div]:bg-orange-500" />
      <span className="text-[9px] text-orange-600 font-mono font-bold whitespace-nowrap">{timeStr}</span>
    </div>
  );
}

// Mini countdown for sidebar
function MiniCountdown({ autoCloseAt }: { autoCloseAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, new Date(autoCloseAt).getTime() - now);
  if (remaining <= 0) return <span className="text-[8px] text-destructive">⏰</span>;

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return <span className="text-[8px] text-orange-500 font-mono">{hours}ч{minutes}м</span>;
}

const AdminSupport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [bansMap, setBansMap] = useState<Record<string, SupportBan>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // New features
  const [responseTemplates, setResponseTemplates] = useState<ResponseTemplate[]>([]);
  const [staffRules, setStaffRules] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (!user) return;
    loadTickets();
    loadBans();
    loadTemplatesAndSettings();
  }, [user]);

  useEffect(() => {
    if (!selectedUserId) return;
    const userTickets = tickets.filter(t => t.user_id === selectedUserId);
    if (userTickets.length === 0) return;

    loadAllUserMessages(userTickets);

    const active = userTickets.find(t => t.status !== "closed") || userTickets[0];
    setActiveTicketId(active.id);

    const channels = userTickets.map(t =>
      supabase.channel(`ticket-${t.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${t.id}` }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe()
    );

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [selectedUserId, tickets]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadAllUserMessages = async (userTickets: Ticket[]) => {
    const ticketIds = userTickets.map(t => t.id);
    const { data } = await supabase.from("support_messages").select("*").in("ticket_id", ticketIds).order("created_at", { ascending: true });
    setMessages((data || []) as Message[]);
  };

  const loadTickets = async () => {
    setLoading(true);
    const { data } = await supabase.from("support_tickets").select("*").order("updated_at", { ascending: false });
    const ticketList = (data || []) as Ticket[];
    setTickets(ticketList);

    const userIds = [...new Set(ticketList.map(t => t.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
      const map: Record<string, string> = {};
      profiles?.forEach(p => { map[p.id] = p.display_name || p.id.slice(0, 8); });
      setProfilesMap(map);
    }
    setLoading(false);
  };

  const loadBans = async () => {
    const { data } = await supabase.from("support_bans").select("*");
    const map: Record<string, SupportBan> = {};
    (data || []).forEach((b: any) => { map[b.user_id] = b as SupportBan; });
    setBansMap(map);
  };

  const loadTemplatesAndSettings = async () => {
    // Load settings
    const { data: settingsData } = await supabase.from("app_settings").select("key, value").in("key", [
      "ticket_auto_close_hours", "ticket_reopen_window_hours", "support_staff_rules", "support_ai_enabled"
    ]);
    if (settingsData) {
      for (const r of settingsData as any[]) {
        if (r.key === "ticket_auto_close_hours") AUTO_CLOSE_HOURS = parseInt(r.value) || 24;
        if (r.key === "ticket_reopen_window_hours") REOPEN_HOURS = parseInt(r.value) || 48;
        if (r.key === "support_staff_rules") setStaffRules(r.value || "");
        if (r.key === "support_ai_enabled") setAiEnabled(r.value === "true");
      }
    }
    // Load templates
    const { data: tplData } = await supabase.from("support_response_templates").select("*").eq("is_enabled", true).order("sort_order");
    setResponseTemplates((tplData as any[]) || []);
  };

  const fetchAiSuggestions = async () => {
    if (!activeTicket || messages.length === 0) return;
    setAiLoading(true);
    setAiError("");
    setAiSuggestions([]);
    try {
      const ticketMessages = messages
        .filter(m => m.ticket_id === activeTicket.id)
        .slice(-10)
        .map(m => ({ message: m.message, is_admin: m.is_admin }));

      const { data, error } = await supabase.functions.invoke("support-ai-suggest", {
        body: {
          messages: ticketMessages,
          ticket_subject: activeTicket.subject,
          channel: activeTicket.channel || "web",
        },
      });
      if (error) throw error;
      if (data?.error) { setAiError(data.error); return; }
      setAiSuggestions(data?.suggestions || []);
    } catch (e: any) {
      setAiError(e.message || "Ошибка ИИ");
    } finally {
      setAiLoading(false);
    }
  };

  const applyTemplate = (content: string) => {
    setNewMessage(content);
  };

  const applySuggestion = (suggestion: string) => {
    setNewMessage(suggestion);
    setAiSuggestions([]);
  };

  const clientGroups = useMemo((): ClientGroup[] => {
    const groupMap: Record<string, Ticket[]> = {};
    tickets.forEach(t => {
      if (!groupMap[t.user_id]) groupMap[t.user_id] = [];
      groupMap[t.user_id].push(t);
    });

    return Object.entries(groupMap).map(([userId, userTickets]) => ({
      user_id: userId,
      displayName: profilesMap[userId] || userId.slice(0, 8),
      tickets: userTickets,
      lastActivity: userTickets.reduce((max, t) => t.updated_at > max ? t.updated_at : max, ""),
      openCount: userTickets.filter(t => t.status === "open").length,
      waitingCount: userTickets.filter(t => t.status === "waiting_reply").length,
      totalCount: userTickets.length,
    })).sort((a, b) => {
      if (a.openCount > 0 && b.openCount === 0) return -1;
      if (b.openCount > 0 && a.openCount === 0) return 1;
      if (a.waitingCount > 0 && b.waitingCount === 0) return -1;
      if (b.waitingCount > 0 && a.waitingCount === 0) return 1;
      return b.lastActivity.localeCompare(a.lastActivity);
    });
  }, [tickets, profilesMap]);

  const filteredGroups = useMemo(() => {
    return clientGroups.filter(g => {
      if (statusFilter !== "all") {
        if (!g.tickets.some(t => t.status === statusFilter)) return false;
      }
      if (channelFilter !== "all") {
        if (!g.tickets.some(t => (t.channel || "web") === channelFilter)) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        if (!g.displayName.toLowerCase().includes(s) && !g.tickets.some(t => t.subject.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [clientGroups, search, statusFilter, channelFilter]);

  const selectedUserTickets = useMemo(() => {
    if (!selectedUserId) return [];
    return tickets.filter(t => t.user_id === selectedUserId).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [selectedUserId, tickets]);

  const activeTicket = useMemo(() => selectedUserTickets.find(t => t.id === activeTicketId) || null, [selectedUserTickets, activeTicketId]);

  const currentBan = selectedUserId ? bansMap[selectedUserId] : null;
  const isUserBanned = currentBan?.is_banned && (!currentBan.ban_expires_at || new Date(currentBan.ban_expires_at) > new Date());

  const canReopen = (ticket: Ticket) => {
    if (ticket.status !== "closed") return false;
    if (!ticket.auto_closed) return true; // manual close can always reopen
    // Auto-closed: can reopen within 48h
    const closedAt = new Date(ticket.updated_at).getTime();
    return Date.now() - closedAt < REOPEN_HOURS * 60 * 60 * 1000;
  };

  const uploadFile = async (file: File): Promise<{ url: string; type: string; name: string } | null> => {
    if (!activeTicket) return null;
    const ext = file.name.split(".").pop();
    const path = `${activeTicket.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("support-attachments").upload(path, file);
    if (error) { toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" }); return null; }
    const { data } = supabase.storage.from("support-attachments").getPublicUrl(path);
    return { url: data.publicUrl, type: file.type, name: file.name };
  };

  const sendMessage = async (attachmentData?: { url: string; type: string; name: string }) => {
    if ((!newMessage.trim() && !attachmentData) || !activeTicket || !user) return;
    setSending(true);

    const msgData: any = {
      ticket_id: activeTicket.id,
      user_id: user.id,
      message: newMessage.trim() || (attachmentData ? `📎 ${attachmentData.name}` : ""),
      is_admin: true,
    };
    if (attachmentData) {
      msgData.attachment_url = attachmentData.url;
      msgData.attachment_type = attachmentData.type;
      msgData.attachment_name = attachmentData.name;
    }
    if (replyTo) {
      msgData.reply_to_id = replyTo.id;
    }

    await supabase.from("support_messages").insert(msgData);

    // After admin reply → set to waiting_reply with auto-close timer
    const autoCloseAt = new Date(Date.now() + AUTO_CLOSE_HOURS * 60 * 60 * 1000).toISOString();
    await supabase.from("support_tickets").update({
      status: "waiting_reply",
      auto_close_at: autoCloseAt,
      last_admin_reply_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any).eq("id", activeTicket.id);

    setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, status: "waiting_reply", auto_close_at: autoCloseAt, last_admin_reply_at: new Date().toISOString() } : t));

    // Notify admin via Telegram
    try {
      await supabase.functions.invoke("telegram-bot", {
        body: { action: "notify", text: `📤 Ответ на тикет: <b>${activeTicket.subject}</b>\n\n${newMessage.trim() || "📎 Файл"}\n\n⏳ Автозакрытие через ${AUTO_CLOSE_HOURS}ч если клиент не ответит` },
      });
    } catch (e) {}

    // Send reply to Telegram user if channel is telegram
    if (activeTicket.channel === "telegram") {
      const chatIdMatch = activeTicket.subject.match(/\((\d+)\)/);
      if (chatIdMatch) {
        try {
          await supabase.functions.invoke("support-telegram-bot", {
            body: { action: "reply", chat_id: chatIdMatch[1], text: newMessage.trim() || "📎 Файл отправлен" },
          });
        } catch (e) {}
      }
    }

    // Send reply via email if channel is email
    if (activeTicket.channel === "email") {
      const emailMatch = activeTicket.subject.match(/\(([^\s@]+@[^\s@]+\.[^\s@]+)\)/);
      if (emailMatch) {
        try {
          await supabase.functions.invoke("support-email", {
            body: { action: "reply", to: emailMatch[1], subject: `Re: ${activeTicket.subject}`, text: newMessage.trim() || "📎 Файл отправлен" },
          });
        } catch (e) {}
      }
    }

    setNewMessage("");
    setReplyTo(null);
    setSending(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast({ title: "Файл слишком большой", description: "Максимум 20 МБ", variant: "destructive" }); return; }
    setUploading(true);
    const result = await uploadFile(file);
    if (result) await sendMessage(result);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeTicket = async () => {
    if (!activeTicket) return;
    await supabase.from("support_tickets").update({ status: "closed", auto_close_at: null, updated_at: new Date().toISOString() } as any).eq("id", activeTicket.id);
    setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, status: "closed", auto_close_at: null } : t));
  };

  const reopenTicket = async () => {
    if (!activeTicket) return;
    await supabase.from("support_tickets").update({ status: "open", auto_closed: false, auto_close_at: null, reopened_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any).eq("id", activeTicket.id);
    setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, status: "open", auto_closed: false, auto_close_at: null } : t));
  };

  // Cancel auto-close (keep as in_progress)
  const cancelAutoClose = async () => {
    if (!activeTicket) return;
    await supabase.from("support_tickets").update({ status: "in_progress", auto_close_at: null, updated_at: new Date().toISOString() } as any).eq("id", activeTicket.id);
    setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, status: "in_progress", auto_close_at: null } : t));
    toast({ title: "Автозакрытие отменено", description: "Тикет вернулся в статус «В работе»" });
  };

  // Ban system
  const addWarning = async () => {
    if (!selectedUserId || !user) return;
    const current = bansMap[selectedUserId];
    const newWarnings = (current?.warnings || 0) + 1;
    if (newWarnings >= 3) { await applyBan("24h"); return; }
    if (current) {
      await supabase.from("support_bans").update({ warnings: newWarnings, updated_at: new Date().toISOString() } as any).eq("user_id", selectedUserId);
    } else {
      await supabase.from("support_bans").insert({ user_id: selectedUserId, warnings: newWarnings } as any);
    }
    toast({ title: `Предупреждение ${newWarnings}/3`, description: newWarnings === 2 ? "Следующее предупреждение = бан на 24ч" : "" });
    await loadBans();
  };

  const applyBan = async (type: "24h" | "permanent") => {
    if (!selectedUserId || !user) return;
    const banData: any = {
      user_id: selectedUserId,
      warnings: type === "24h" ? 3 : (bansMap[selectedUserId]?.warnings || 0),
      is_banned: true, ban_type: type,
      banned_at: new Date().toISOString(), banned_by: user.id,
      ban_expires_at: type === "24h" ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    const current = bansMap[selectedUserId];
    if (current) { await supabase.from("support_bans").update(banData).eq("user_id", selectedUserId); }
    else { await supabase.from("support_bans").insert(banData); }

    const userTicketIds = tickets.filter(t => t.user_id === selectedUserId && t.status !== "closed").map(t => t.id);
    for (const tid of userTicketIds) {
      await supabase.from("support_tickets").update({ status: "closed", auto_close_at: null, updated_at: new Date().toISOString() } as any).eq("id", tid);
    }
    setTickets(prev => prev.map(t => userTicketIds.includes(t.id) ? { ...t, status: "closed", auto_close_at: null } : t));
    toast({ title: type === "24h" ? "Бан на 24 часа" : "Пожизненный бан", description: `Пользователь ${profilesMap[selectedUserId] || ""} заблокирован` });
    setBanDialogOpen(false);
    await loadBans();
  };

  const unbanUser = async () => {
    if (!selectedUserId) return;
    await supabase.from("support_bans").update({ is_banned: false, ban_type: null, ban_expires_at: null, warnings: 0, unban_reason: "Разбан администратором", updated_at: new Date().toISOString() } as any).eq("user_id", selectedUserId);
    toast({ title: "Пользователь разбанен" });
    setBanDialogOpen(false);
    await loadBans();
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return "только что";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}м`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}ч`;
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  };

  const formatFullTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const totalOpen = tickets.filter(t => t.status === "open").length;
  const totalWaiting = tickets.filter(t => t.status === "waiting_reply").length;

  const messagesWithDividers = useMemo(() => {
    const result: Array<{ type: "divider"; ticket: Ticket } | { type: "message"; msg: Message }> = [];
    let lastTicketId = "";
    for (const msg of messages) {
      if (msg.ticket_id !== lastTicketId) {
        const ticket = tickets.find(t => t.id === msg.ticket_id);
        if (ticket) result.push({ type: "divider", ticket });
        lastTicketId = msg.ticket_id;
      }
      result.push({ type: "message", msg });
    }
    return result;
  }, [messages, tickets]);

  return (
    <div className="flex h-full gap-0 border rounded-md overflow-hidden">
      {/* Client list */}
      <div className={`flex flex-col border-r w-[320px] shrink-0 ${selectedUserId ? "hidden lg:flex" : "flex w-full lg:w-[320px]"}`}>
        <div className="p-2 border-b shrink-0 space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Тикеты
              {totalOpen > 0 && <Badge variant="destructive" className="text-[9px] px-1 h-4">{totalOpen}</Badge>}
              {totalWaiting > 0 && <Badge className="bg-orange-500/20 text-orange-600 text-[9px] px-1 h-4">{totalWaiting}⏳</Badge>}
            </h2>
          </div>
          <div className="flex gap-1">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-6 text-[11px]" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[80px] h-6 text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="open">Открыт</SelectItem>
                <SelectItem value="in_progress">В работе</SelectItem>
                <SelectItem value="waiting_reply">Ожидание</SelectItem>
                <SelectItem value="closed">Закрыт</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[60px] h-6 text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📨</SelectItem>
                <SelectItem value="web">🌐</SelectItem>
                <SelectItem value="email">📧</SelectItem>
                <SelectItem value="telegram">💬</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" /></div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">Нет тикетов</div>
          ) : (
            filteredGroups.map(g => {
              const ban = bansMap[g.user_id];
              const isBanned = ban?.is_banned && (!ban.ban_expires_at || new Date(ban.ban_expires_at) > new Date());
              return (
                <div key={g.user_id} className={`p-2 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedUserId === g.user_id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`} onClick={() => setSelectedUserId(g.user_id)}>
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground shrink-0" />
                        <p className="text-[11px] font-medium truncate">{g.displayName}</p>
                        {isBanned && <Ban className="h-3 w-3 text-destructive shrink-0" />}
                        {ban && !isBanned && ban.warnings > 0 && <span className="text-[9px] text-orange-500 font-bold">{ban.warnings}/3</span>}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {g.tickets.slice(0, 2).map(t => (
                          <div key={t.id} className="flex items-center gap-1">
                            {channelIcons[t.channel || "web"]}
                            <span className="text-[10px] text-muted-foreground truncate">{t.subject}</span>
                            <span className={`text-[8px] px-1 py-0 rounded ${statusColors[t.status]}`}>
                              {statusLabels[t.status] || t.status}
                            </span>
                            {t.status === "waiting_reply" && t.auto_close_at && <MiniCountdown autoCloseAt={t.auto_close_at} />}
                          </div>
                        ))}
                        {g.totalCount > 2 && <span className="text-[9px] text-muted-foreground">+{g.totalCount - 2} ещё</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      {g.openCount > 0 && <Badge variant="destructive" className="text-[8px] px-1 h-3.5">{g.openCount}</Badge>}
                      {g.waitingCount > 0 && <Badge className="bg-orange-500/20 text-orange-600 text-[8px] px-1 h-3.5">⏳{g.waitingCount}</Badge>}
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2 w-2" />{formatTime(g.lastActivity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat */}
      <div className={`flex flex-col flex-1 min-w-0 ${!selectedUserId ? "hidden lg:flex" : "flex"}`}>
        {!selectedUserId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Выберите клиента</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-2 border-b shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 lg:hidden" onClick={() => setSelectedUserId(null)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <button className="text-xs font-bold hover:underline flex items-center gap-1" onClick={() => navigate(`/admin/users/${selectedUserId}`)}>
                        <User className="h-3 w-3" />{profilesMap[selectedUserId] || selectedUserId.slice(0, 8)}
                      </button>
                      {isUserBanned && (
                        <Badge variant="destructive" className="text-[8px] px-1 h-4">
                          {currentBan?.ban_type === "permanent" ? "Пожизненный бан" : `Бан до ${formatFullTime(currentBan?.ban_expires_at || "")}`}
                        </Badge>
                      )}
                      {currentBan && !isUserBanned && currentBan.warnings > 0 && (
                        <Badge className="bg-orange-500/20 text-orange-600 text-[8px] px-1 h-4">⚠ {currentBan.warnings}/3</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{selectedUserTickets.length} тикетов</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Rules button */}
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setShowRules(!showRules)} title="Правила для сотрудников">
                    <BookOpen className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-orange-500 hover:text-orange-600" onClick={addWarning} title="Предупреждение">
                    <AlertTriangle className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-destructive hover:text-destructive" onClick={() => setBanDialogOpen(true)} title="Бан">
                    <Ban className="h-3 w-3" />
                  </Button>
                  {activeTicket && activeTicket.status === "waiting_reply" && (
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-orange-500" onClick={cancelAutoClose} title="Отменить автозакрытие">
                      <TimerOff className="h-3 w-3" />
                    </Button>
                  )}
                  {activeTicket && activeTicket.status !== "closed" ? (
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={closeTicket}>Закрыть</Button>
                  ) : activeTicket && canReopen(activeTicket) ? (
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={reopenTicket}>Открыть</Button>
                  ) : null}
                </div>
              </div>

              {/* Countdown bar for active ticket */}
              {activeTicket?.status === "waiting_reply" && activeTicket.auto_close_at && (
                <div className="mt-1.5 px-1">
                  <CountdownTimer autoCloseAt={activeTicket.auto_close_at} />
                </div>
              )}

              {/* Ticket tabs */}
              {selectedUserTickets.length > 1 && (
                <div className="flex gap-1 mt-1.5 overflow-x-auto">
                  {selectedUserTickets.map(t => (
                    <button
                      key={t.id}
                      className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap transition-colors ${
                        activeTicketId === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border hover:bg-muted"
                      }`}
                      onClick={() => setActiveTicketId(t.id)}
                    >
                      {channelIcons[t.channel || "web"]} {t.subject.slice(0, 25)}{t.subject.length > 25 ? "…" : ""}
                      <span className={`ml-1 text-[8px] px-1 rounded ${statusColors[t.status]}`}>
                        {t.status === "waiting_reply" ? "⏳" : t.status === "open" ? "○" : t.status === "in_progress" ? "●" : "✕"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Staff Rules Panel */}
            {showRules && staffRules && (
              <div className="border-b bg-muted/30 p-2 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold flex items-center gap-1"><BookOpen className="h-3 w-3" /> Правила для сотрудников</span>
                  <button onClick={() => setShowRules(false)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
                </div>
                <div className="text-[10px] text-muted-foreground whitespace-pre-wrap max-h-[120px] overflow-y-auto">{staffRules}</div>
              </div>
            )}

            {/* AI Suggestions Widget */}
            {aiEnabled && activeTicket && activeTicket.status !== "closed" && (
              <div className="border-b bg-gradient-to-r from-primary/5 to-primary/0 p-2 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> ИИ-подсказки</span>
                  <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={fetchAiSuggestions} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Получить подсказки"}
                  </Button>
                </div>
                {aiError && <p className="text-[10px] text-destructive">{aiError}</p>}
                {aiSuggestions.length > 0 && (
                  <div className="space-y-1">
                    {aiSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => applySuggestion(s)}
                        className="w-full text-left text-[10px] bg-background border rounded-md px-2 py-1.5 hover:border-primary/50 hover:bg-primary/5 transition-colors line-clamp-2"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {!aiLoading && aiSuggestions.length === 0 && !aiError && (
                  <p className="text-[10px] text-muted-foreground">Нажмите «Получить подсказки» для генерации вариантов ответа</p>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {messagesWithDividers.map((item, idx) => {
                if (item.type === "divider") {
                  return (
                    <div key={`div-${item.ticket.id}-${idx}`} className="flex items-center gap-2 py-1">
                      <div className="flex-1 border-t border-dashed" />
                      <span className="text-[9px] text-muted-foreground px-2 bg-background">
                        {channelIcons[item.ticket.channel || "web"]} {item.ticket.subject} — {formatFullTime(item.ticket.created_at)}
                      </span>
                      <div className="flex-1 border-t border-dashed" />
                    </div>
                  );
                }
                const msg = item.msg;
                const repliedMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                return (
                  <div key={msg.id} className={`group flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
                    <div className="flex items-center gap-1 max-w-[70%]">
                      {!msg.is_admin && (
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                          onClick={() => setReplyTo(msg)}
                          title="Ответить"
                        >
                          <Reply className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                      <div className={`rounded-lg px-3 py-1.5 ${msg.is_admin ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {repliedMsg && (
                          <div className={`mb-1 pl-2 border-l-2 ${msg.is_admin ? "border-primary-foreground/40" : "border-primary/40"} rounded-sm`}>
                            <p className={`text-[10px] font-medium ${msg.is_admin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {repliedMsg.is_admin ? "Поддержка" : profilesMap[repliedMsg.user_id] || "Клиент"}
                            </p>
                            <p className={`text-[10px] truncate max-w-[200px] ${msg.is_admin ? "text-primary-foreground/60" : "text-muted-foreground/80"}`}>
                              {repliedMsg.message || "📎 Вложение"}
                            </p>
                          </div>
                        )}
                        {msg.message && <p className="text-xs whitespace-pre-wrap">{msg.message}</p>}
                        <MessageAttachment msg={msg} onImageClick={setViewerImage} />
                        <p className={`text-[9px] mt-0.5 ${msg.is_admin ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{formatFullTime(msg.created_at)}</p>
                      </div>
                      {msg.is_admin && (
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                          onClick={() => setReplyTo(msg)}
                          title="Ответить"
                        >
                          <Reply className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {activeTicket && activeTicket.status !== "closed" && !isUserBanned && (
              <div className="border-t shrink-0">
                {replyTo && (
                  <div className="px-3 py-1.5 bg-muted/50 flex items-center gap-2 border-b">
                    <Reply className="h-3 w-3 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground">
                        {replyTo.is_admin ? "Поддержка" : profilesMap[replyTo.user_id] || "Клиент"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{replyTo.message || "📎 Вложение"}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="p-2 flex gap-2 items-center">
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*,audio/*,video/*,.pdf,.doc,.docx" onChange={handleFileSelect} />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  {/* Templates popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" title="Шаблоны ответов">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start" side="top">
                      <div className="p-2 border-b">
                        <p className="text-[10px] font-bold">Шаблоны ответов</p>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto">
                        {responseTemplates.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground p-3 text-center">Нет шаблонов</p>
                        ) : responseTemplates.map(tpl => (
                          <button
                            key={tpl.id}
                            onClick={() => applyTemplate(tpl.content)}
                            className="w-full text-left p-2 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium">{tpl.title}</span>
                              {tpl.shortcut && <Badge variant="secondary" className="text-[8px] px-1 h-4">{tpl.shortcut}</Badge>}
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{tpl.content}</p>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Textarea
                    placeholder="Написать ответ..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    className="min-h-[36px] max-h-[200px] text-xs resize-none overflow-y-auto"
                    rows={1}
                    ref={(el) => {
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = Math.min(el.scrollHeight, 200) + "px";
                      }
                    }}
                  />
                  <Button size="sm" className="h-8 px-3" onClick={() => sendMessage()} disabled={(!newMessage.trim() && !uploading) || sending}>
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {activeTicket?.status === "closed" && activeTicket.auto_closed && (
              <div className="p-2 border-t shrink-0 flex items-center justify-center gap-2 bg-muted/30">
                <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Тикет закрыт автоматически</span>
                {canReopen(activeTicket) && (
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 ml-2" onClick={reopenTicket}>Переоткрыть</Button>
                )}
              </div>
            )}

            {isUserBanned && (
              <div className="p-2 border-t shrink-0 flex items-center justify-center gap-2 bg-destructive/5">
                <Ban className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs text-destructive">Пользователь заблокирован в поддержке</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ban dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2"><Ban className="h-4 w-4" />Управление баном — {profilesMap[selectedUserId || ""] || ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {currentBan && (
              <div className="text-xs space-y-1 p-2 rounded bg-muted/50">
                <p>Предупреждений: <b>{currentBan.warnings}/3</b></p>
                <p>Статус: {isUserBanned ? <span className="text-destructive font-bold">{currentBan.ban_type === "permanent" ? "Пожизненный бан" : `Бан до ${formatFullTime(currentBan.ban_expires_at || "")}`}</span> : <span className="text-green-600">Не заблокирован</span>}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={addWarning}>
                <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" />Предупреждение
              </Button>
              <Button variant="outline" size="sm" className="text-xs text-destructive" onClick={() => applyBan("24h")}>
                <ShieldOff className="h-3 w-3 mr-1" />Бан 24ч
              </Button>
            </div>
            <Button variant="destructive" size="sm" className="w-full text-xs" onClick={() => applyBan("permanent")}>
              <Ban className="h-3 w-3 mr-1" />Пожизненный бан
            </Button>
            {isUserBanned && (
              <Button variant="outline" size="sm" className="w-full text-xs text-green-600 border-green-200" onClick={unbanUser}>
                <ShieldCheck className="h-3 w-3 mr-1" />Снять бан
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ImageViewer src={viewerImage || ""} open={!!viewerImage} onOpenChange={(open) => { if (!open) setViewerImage(null); }} />
    </div>
  );
};

export default AdminSupport;
