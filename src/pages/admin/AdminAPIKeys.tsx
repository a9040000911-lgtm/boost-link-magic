import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, RefreshCw, Eye, EyeOff, Key } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface AIKey {
  id: string;
  provider: string;
  label: string;
  api_key: string;
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
  const [adding, setAdding] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => { loadKeys(); }, []);

  async function loadKeys() {
    setLoading(true);
    const { data } = await supabase
      .from("ai_api_keys" as any)
      .select("*")
      .eq("provider", "gemini")
      .order("usage_count", { ascending: true });
    setKeys((data as any as AIKey[]) || []);
    setLoading(false);
  }

  async function addKey() {
    if (!newKey.trim()) { toast.error("Введите API ключ"); return; }
    setAdding(true);
    const { error } = await supabase.from("ai_api_keys" as any).insert({
      provider: "gemini",
      label: newLabel.trim() || `Ключ #${keys.length + 1}`,
      api_key: newKey.trim(),
    } as any);
    if (error) { toast.error(error.message); }
    else { toast.success("Ключ добавлен"); setNewLabel(""); setNewKey(""); }
    setAdding(false);
    loadKeys();
  }

  async function toggleKey(id: string, current: boolean) {
    await supabase.from("ai_api_keys" as any).update({ is_enabled: !current } as any).eq("id", id);
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

  const totalUsage = keys.reduce((s, k) => s + k.usage_count, 0);
  const activeCount = keys.filter(k => k.is_enabled).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            Gemini API ключи — ротация
          </CardTitle>
          <CardDescription className="text-xs">
            {activeCount} активных из {keys.length} · {totalUsage} запросов всего · стратегия: наименее используемый
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add key form */}
          <div className="flex gap-2 items-end flex-wrap">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Метка</label>
              <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Проект #1" className="w-36 h-8 text-xs" />
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">API ключ</label>
              <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="AIza..." className="font-mono h-8 text-xs" type="password" />
            </div>
            <Button size="sm" onClick={addKey} disabled={adding} className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1" />
              {adding ? "…" : "Добавить"}
            </Button>
          </div>

          {/* Keys table */}
          {loading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" /></div>
          ) : keys.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Нет ключей. Добавьте хотя бы один Gemini API ключ.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Метка</TableHead>
                  <TableHead className="text-xs">Ключ</TableHead>
                  <TableHead className="text-xs text-center">Запросы</TableHead>
                  <TableHead className="text-xs text-center">Ошибки</TableHead>
                  <TableHead className="text-xs">Последний</TableHead>
                  <TableHead className="text-xs text-center">Вкл</TableHead>
                  <TableHead className="text-xs text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map(k => (
                  <TableRow key={k.id}>
                    <TableCell className="text-xs font-medium">{k.label}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
