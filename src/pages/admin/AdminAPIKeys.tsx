import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, RefreshCw, Eye, EyeOff, Key, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface AIKey {
  id: string;
  provider: string;
  label: string;
  api_key: string;
  model: string;
  is_enabled: boolean;
  usage_count: number;
  error_count: number;
  last_error: string | null;
  last_used_at: string | null;
  created_at: string;
}

export default function AdminAPIKeys() {
  const [keys, setKeys] = useState<AIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newProvider, setNewProvider] = useState("gemini");
  const [adding, setAdding] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [providerFilter, setProviderFilter] = useState("all");

  useEffect(() => { loadKeys(); }, []);

  async function loadKeys() {
    setLoading(true);
    let query = supabase
      .from("ai_api_keys" as any)
      .select("*")
      .order("provider")
      .order("usage_count", { ascending: true });
    const { data } = await query;
    setKeys((data as any as AIKey[]) || []);
    setLoading(false);
  }

  async function addKey() {
    if (!newKey.trim()) { toast.error("Введите API ключ"); return; }
    if (!newModel.trim()) { toast.error("Введите название модели"); return; }
    setAdding(true);
    const { error } = await supabase.from("ai_api_keys" as any).insert({
      provider: newProvider.trim(),
      label: newLabel.trim() || `Ключ #${keys.length + 1}`,
      api_key: newKey.trim(),
      model: newModel.trim(),
    } as any);
    if (error) { toast.error(error.message); }
    else { toast.success("Ключ добавлен"); setNewLabel(""); setNewKey(""); setNewModel(""); }
    setAdding(false);
    loadKeys();
  }

  async function toggleKey(id: string, current: boolean) {
    await supabase.from("ai_api_keys" as any).update({ is_enabled: !current } as any).eq("id", id);
    loadKeys();
  }

  async function updateField(id: string, field: string, value: string) {
    await supabase.from("ai_api_keys" as any).update({ [field]: value } as any).eq("id", id);
    loadKeys();
  }

  async function deleteKey(id: string) {
    if (!confirm("Удалить ключ?")) return;
    await supabase.from("ai_api_keys" as any).delete().eq("id", id);
    toast.success("Ключ удалён");
    loadKeys();
  }

  async function resetCounters(id: string) {
    await supabase.from("ai_api_keys" as any).update({ usage_count: 0, error_count: 0, last_error: null } as any).eq("id", id);
    toast.success("Счётчики сброшены");
    loadKeys();
  }

  function toggleVisible(id: string) {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function maskKey(key: string) {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "•".repeat(Math.min(key.length - 8, 20)) + key.slice(-4);
  }

  const providers = [...new Set(keys.map(k => k.provider))];
  const filteredKeys = providerFilter === "all" ? keys : keys.filter(k => k.provider === providerFilter);
  const totalUsage = keys.reduce((s, k) => s + k.usage_count, 0);
  const activeCount = keys.filter(k => k.is_enabled).length;
  const uniqueModels = [...new Set(keys.map(k => k.model))];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            AI ключи — универсальная ротация
          </CardTitle>
          <CardDescription className="text-xs">
            {activeCount} активных из {keys.length} · {providers.length} провайдеров · {uniqueModels.length} моделей · {totalUsage} запросов
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add key form */}
          <div className="flex gap-2 items-end flex-wrap">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Провайдер</label>
              <Input value={newProvider} onChange={e => setNewProvider(e.target.value)} placeholder="gemini / openai / claude" className="w-32 h-8 text-xs" list="providers-list" />
              <datalist id="providers-list">
                <option value="gemini" />
                <option value="openai" />
                <option value="claude" />
                <option value="deepseek" />
                <option value="qwen" />
                <option value="glm" />
                <option value="kimi" />
                <option value="custom" />
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Метка</label>
              <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Проект #1" className="w-28 h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Модель</label>
              <Input value={newModel} onChange={e => setNewModel(e.target.value)} placeholder="gemini-2.5-flash / gpt-4o / ..." className="w-48 h-8 text-xs" />
            </div>
            <div className="space-y-1 flex-1 min-w-[180px]">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">API ключ</label>
              <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="sk-... / AIza..." className="font-mono h-8 text-xs" type="password" />
            </div>
            <Button size="sm" onClick={addKey} disabled={adding} className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1" />
              {adding ? "…" : "Добавить"}
            </Button>
          </div>

          {/* Provider filter */}
          {providers.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              <Button variant={providerFilter === "all" ? "default" : "outline"} size="sm" className="h-6 text-[10px] px-2" onClick={() => setProviderFilter("all")}>
                Все ({keys.length})
              </Button>
              {providers.map(p => {
                const count = keys.filter(k => k.provider === p).length;
                return (
                  <Button key={p} variant={providerFilter === p ? "default" : "outline"} size="sm" className="h-6 text-[10px] px-2" onClick={() => setProviderFilter(p)}>
                    {p} ({count})
                  </Button>
                );
              })}
            </div>
          )}

          {/* Keys table */}
          {loading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" /></div>
          ) : filteredKeys.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Нет ключей. Добавьте API ключ любого провайдера с указанием модели.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Провайдер</TableHead>
                  <TableHead className="text-xs">Метка</TableHead>
                  <TableHead className="text-xs">Модель</TableHead>
                  <TableHead className="text-xs">Ключ</TableHead>
                  <TableHead className="text-xs text-center">Запросы</TableHead>
                  <TableHead className="text-xs text-center">Ошибки</TableHead>
                  <TableHead className="text-xs">Последний</TableHead>
                  <TableHead className="text-xs text-center">Вкл</TableHead>
                  <TableHead className="text-xs text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map(k => (
                  <TableRow key={k.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{k.provider}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{k.label}</TableCell>
                    <TableCell>
                      <Input
                        defaultValue={k.model}
                        className="h-7 w-40 text-[11px]"
                        onBlur={(e) => {
                          if (e.target.value !== k.model) updateField(k.id, "model", e.target.value);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-[11px] text-muted-foreground">
                          {visibleKeys.has(k.id) ? k.api_key : maskKey(k.api_key)}
                        </code>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toggleVisible(k.id)}>
                          {visibleKeys.has(k.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-center">{k.usage_count}</TableCell>
                    <TableCell className="text-center">
                      {k.error_count > 0 ? (
                        <Badge variant="destructive" className="text-[10px]" title={k.last_error || ""}>
                          {k.error_count}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {k.last_used_at ? format(new Date(k.last_used_at), "dd MMM HH:mm", { locale: ru }) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={k.is_enabled} onCheckedChange={() => toggleKey(k.id, k.is_enabled)} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => resetCounters(k.id)} title="Сбросить счётчики">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteKey(k.id)} title="Удалить">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Endpoint info */}
          <div className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2 space-y-1">
            <p className="font-medium flex items-center gap-1"><Settings2 className="h-3 w-3" /> Поддерживаемые эндпоинты (автоопределение по провайдеру):</p>
            <p><code className="text-[9px]">gemini</code> → generativelanguage.googleapis.com</p>
            <p><code className="text-[9px]">openai</code> → api.openai.com</p>
            <p><code className="text-[9px]">claude</code> → api.anthropic.com (Messages API)</p>
            <p><code className="text-[9px]">deepseek / qwen / glm / kimi / custom</code> → OpenAI-compatible endpoint (настраивается в системных настройках)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
