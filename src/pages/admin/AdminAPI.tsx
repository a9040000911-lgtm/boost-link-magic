import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminAPIKeys from "./AdminAPIKeys";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plug, Key, ScrollText, Activity, Copy, Check, RefreshCw, ExternalLink, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface AuditLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | string | null;
  created_at: string;
  actor_id: string;
}

export default function AdminAPI() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState<string>("all");
  const [copied, setCopied] = useState(false);
  const [mcpKeySet, setMcpKeySet] = useState<boolean | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const mcpEndpoint = `https://${projectId}.supabase.co/functions/v1/mcp-admin`;

  useEffect(() => {
    loadLogs();
    checkMcpKey();
  }, [logFilter]);

  async function checkMcpKey() {
    // We check if MCP key is configured by looking at app_settings
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "mcp_key_configured")
      .maybeSingle();
    setMcpKeySet(data?.value === "true");
  }

  async function loadLogs() {
    setLoading(true);
    let q = supabase
      .from("admin_audit_logs")
      .select("id, action, target_type, target_id, details, created_at, actor_id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (logFilter === "mcp") {
      q = q.contains("details", { source: "mcp-agent" });
    }

    const { data } = await q;
    setLogs((data || []) as unknown as AuditLog[]);
    setLoading(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Скопировано");
    setTimeout(() => setCopied(false), 2000);
  }

  const mcpTools = [
    { name: "get_metrics", desc: "Выручка, заказы, пользователи за период", mode: "read" },
    { name: "list_orders", desc: "Последние заказы с фильтрами", mode: "read" },
    { name: "get_settings", desc: "Чтение настроек приложения", mode: "read" },
    { name: "update_setting", desc: "Изменение настройки (с аудитом)", mode: "write" },
    { name: "get_providers_status", desc: "Статус и здоровье провайдеров", mode: "read" },
    { name: "list_tickets", desc: "Тикеты поддержки", mode: "read" },
    { name: "get_audit_log", desc: "Журнал аудита", mode: "read" },
    { name: "run_diagnostics", desc: "Комплексная диагностика системы", mode: "read" },
  ];

  const agentLogs = logs.filter(
    (l) => l.details && typeof l.details === "object" && (l.details as Record<string, unknown>).source === "mcp-agent"
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" />
            API & Интеграции
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Подключение AI-агентов через Model Context Protocol (MCP)
          </p>
        </div>
      </div>

      <Tabs defaultValue="connection" className="space-y-3">
        <TabsList className="h-8">
          <TabsTrigger value="connection" className="text-xs gap-1.5">
            <Key className="h-3.5 w-3.5" />
            Подключение
          </TabsTrigger>
          <TabsTrigger value="tools" className="text-xs gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Инструменты
          </TabsTrigger>
          <TabsTrigger value="keys" className="text-xs gap-1.5">
            <Key className="h-3.5 w-3.5" />
            Gemini ключи
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            Лог агента
          </TabsTrigger>
        </TabsList>

        {/* ─── Connection Tab ─── */}
        <TabsContent value="connection" className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  MCP-сервер
                </CardTitle>
                <CardDescription className="text-xs">
                  Endpoint для подключения AI-агентов (Antigravity, Cursor, Claude Desktop)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    URL эндпоинта
                  </label>
                  <div className="flex gap-1.5 mt-1">
                    <Input
                      readOnly
                      value={mcpEndpoint}
                      className="font-mono text-xs h-8"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 shrink-0"
                      onClick={() => copyToClipboard(mcpEndpoint)}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Статус ключа
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {mcpKeySet === null ? (
                      <Badge variant="outline" className="text-[10px]">Проверка…</Badge>
                    ) : mcpKeySet ? (
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        Ключ настроен
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">
                        Ключ не настроен
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Секрет <code className="bg-muted px-1 rounded">MCP_ADMIN_KEY</code> задаётся в настройках Lovable Cloud
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Протокол
                  </label>
                  <p className="text-xs text-foreground mt-0.5">MCP Streamable HTTP (mcp-lite)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  Инструкция подключения
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                    <p>Задайте секрет <code className="bg-muted px-1 rounded">MCP_ADMIN_KEY</code> — произвольная строка для авторизации агента</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">2</span>
                    <p>В настройках IDE-агента укажите URL эндпоинта (выше)</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">3</span>
                    <p>Укажите заголовок авторизации:</p>
                  </div>
                  <div className="bg-muted rounded-md p-2 font-mono text-[11px]">
                    Authorization: Bearer &lt;MCP_ADMIN_KEY&gt;
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">4</span>
                    <p>Агент автоматически обнаружит доступные инструменты через MCP protocol</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Tools Tab ─── */}
        <TabsContent value="tools" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Доступные инструменты MCP-сервера</CardTitle>
              <CardDescription className="text-xs">
                8 инструментов для диагностики, аналитики и управления
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-[180px]">Инструмент</TableHead>
                    <TableHead className="text-xs">Описание</TableHead>
                    <TableHead className="text-xs w-[80px]">Режим</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mcpTools.map((tool) => (
                    <TableRow key={tool.name}>
                      <TableCell className="font-mono text-xs">{tool.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tool.desc}</TableCell>
                      <TableCell>
                        <Badge
                          variant={tool.mode === "write" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {tool.mode}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Gemini Keys Tab ─── */}
        <TabsContent value="keys" className="space-y-3">
          <AdminAPIKeys />
        </TabsContent>

        {/* ─── Logs Tab ─── */}
        <TabsContent value="logs" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Журнал действий агента
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {logFilter === "mcp"
                      ? `${agentLogs.length} действий MCP-агента`
                      : `${logs.length} записей (все действия)`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={logFilter} onValueChange={setLogFilter}>
                    <SelectTrigger className="h-7 w-[150px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Все действия</SelectItem>
                      <SelectItem value="mcp" className="text-xs">Только MCP-агент</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-7 px-2" onClick={loadLogs}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  {logFilter === "mcp"
                    ? "MCP-агент ещё не выполнял действий"
                    : "Журнал аудита пуст"}
                </div>
              ) : (
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs w-[140px]">Время</TableHead>
                        <TableHead className="text-xs w-[140px]">Действие</TableHead>
                        <TableHead className="text-xs w-[100px]">Тип</TableHead>
                        <TableHead className="text-xs w-[100px]">Цель</TableHead>
                        <TableHead className="text-xs">Детали</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => {
                        const isMcp =
                          log.details &&
                          typeof log.details === "object" &&
                          (log.details as Record<string, unknown>).source === "mcp-agent";
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(log.created_at), "dd MMM HH:mm:ss", { locale: ru })}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              <div className="flex items-center gap-1.5">
                                {log.action}
                                {isMcp && (
                                  <Badge variant="outline" className="text-[9px] px-1">
                                    MCP
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {log.target_type}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[100px]">
                              {log.target_id || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {log.details ? JSON.stringify(log.details) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
