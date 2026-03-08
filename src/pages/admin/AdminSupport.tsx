import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Search, User, Clock, ChevronLeft } from "lucide-react";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

const statusColors: Record<string, string> = {
  open: "bg-green-500/20 text-green-600",
  in_progress: "bg-blue-500/20 text-blue-600",
  closed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground",
  normal: "text-foreground",
  high: "text-orange-500",
  urgent: "text-red-500",
};

const AdminSupport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadTickets();
  }, [user]);

  useEffect(() => {
    if (!selectedTicket) return;
    loadMessages(selectedTicket.id);

    const channel = supabase
      .channel(`ticket-${selectedTicket.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${selectedTicket.id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadTickets = async () => {
    setLoading(true);
    const { data } = await supabase.from("support_tickets").select("*").order("updated_at", { ascending: false });
    const ticketList = (data || []) as Ticket[];
    setTickets(ticketList);

    // Load profiles for all users
    const userIds = [...new Set(ticketList.map((t) => t.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
      const map: Record<string, string> = {};
      profiles?.forEach((p) => { map[p.id] = p.display_name || p.id.slice(0, 8); });
      setProfilesMap(map);
    }
    setLoading(false);
  };

  const loadMessages = async (ticketId: string) => {
    const { data } = await supabase.from("support_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
    setMessages((data || []) as Message[]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return;
    setSending(true);
    await supabase.from("support_messages").insert({
      ticket_id: selectedTicket.id,
      user_id: user.id,
      message: newMessage.trim(),
      is_admin: true,
    });
    // Update ticket status to in_progress if open
    if (selectedTicket.status === "open") {
      await supabase.from("support_tickets").update({ status: "in_progress", updated_at: new Date().toISOString() }).eq("id", selectedTicket.id);
      setSelectedTicket({ ...selectedTicket, status: "in_progress" });
      setTickets((prev) => prev.map((t) => t.id === selectedTicket.id ? { ...t, status: "in_progress" } : t));
    }
    setNewMessage("");
    setSending(false);
  };

  const closeTicket = async () => {
    if (!selectedTicket) return;
    await supabase.from("support_tickets").update({ status: "closed", updated_at: new Date().toISOString() }).eq("id", selectedTicket.id);
    setSelectedTicket({ ...selectedTicket, status: "closed" });
    setTickets((prev) => prev.map((t) => t.id === selectedTicket.id ? { ...t, status: "closed" } : t));
  };

  const reopenTicket = async () => {
    if (!selectedTicket) return;
    await supabase.from("support_tickets").update({ status: "open", updated_at: new Date().toISOString() }).eq("id", selectedTicket.id);
    setSelectedTicket({ ...selectedTicket, status: "open" });
    setTickets((prev) => prev.map((t) => t.id === selectedTicket.id ? { ...t, status: "open" } : t));
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const userName = profilesMap[t.user_id] || "";
        if (!t.subject.toLowerCase().includes(s) && !userName.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [tickets, search, statusFilter, profilesMap]);

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "только что";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}м`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}ч`;
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  };

  const formatFullTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="flex h-full gap-0 border rounded-md overflow-hidden">
      {/* Ticket list - left panel */}
      <div className={`flex flex-col border-r w-[320px] shrink-0 ${selectedTicket ? "hidden lg:flex" : "flex w-full lg:w-[320px]"}`}>
        <div className="p-2 border-b shrink-0 space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Тикеты
              {openCount > 0 && <Badge variant="destructive" className="text-[9px] px-1 h-4">{openCount}</Badge>}
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
                <SelectItem value="closed">Закрыт</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" /></div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">Нет тикетов</div>
          ) : (
            filteredTickets.map((t) => (
              <div
                key={t.id}
                className={`p-2 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedTicket?.id === t.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                onClick={() => setSelectedTicket(t)}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium truncate">{t.subject}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        className="text-[10px] text-primary hover:underline"
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${t.user_id}`); }}
                      >
                        {profilesMap[t.user_id] || t.user_id.slice(0, 8)}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className={`text-[9px] px-1 py-0.5 rounded ${statusColors[t.status] || "bg-muted"}`}>{t.status === "open" ? "Открыт" : t.status === "in_progress" ? "В работе" : "Закрыт"}</span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2 w-2" />{formatTime(t.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat - right panel */}
      <div className={`flex flex-col flex-1 min-w-0 ${!selectedTicket ? "hidden lg:flex" : "flex"}`}>
        {!selectedTicket ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Выберите тикет</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-2 border-b shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 lg:hidden" onClick={() => setSelectedTicket(null)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{selectedTicket.subject}</p>
                  <button
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                    onClick={() => navigate(`/admin/users/${selectedTicket.user_id}`)}
                  >
                    <User className="h-2 w-2" />{profilesMap[selectedTicket.user_id] || selectedTicket.user_id.slice(0, 8)}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusColors[selectedTicket.status]}`}>
                  {selectedTicket.status === "open" ? "Открыт" : selectedTicket.status === "in_progress" ? "В работе" : "Закрыт"}
                </span>
                {selectedTicket.status !== "closed" ? (
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={closeTicket}>Закрыть</Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={reopenTicket}>Открыть</Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-lg px-3 py-1.5 ${msg.is_admin ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p className="text-xs whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-[9px] mt-0.5 ${msg.is_admin ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {formatFullTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {selectedTicket.status !== "closed" && (
              <div className="p-2 border-t shrink-0 flex gap-2">
                <Input
                  placeholder="Написать ответ..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  className="h-8 text-xs"
                />
                <Button size="sm" className="h-8 px-3" onClick={sendMessage} disabled={!newMessage.trim() || sending}>
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
