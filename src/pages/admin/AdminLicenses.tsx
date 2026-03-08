import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Copy, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface License {
  id: string;
  license_key: string;
  domain: string;
  plan: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export default function AdminLicenses() {
  const { session } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [domain, setDomain] = useState("");
  const [plan, setPlan] = useState("standard");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    fetchLicenses();
  }, []);

  async function fetchLicenses() {
    setLoading(true);
    const { data } = await supabase
      .from("licenses" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setLicenses((data as any as License[]) || []);
    setLoading(false);
  }

  async function generateLicense() {
    if (!domain.trim()) {
      toast.error("Укажите домен");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-license", {
        body: {
          action: "generate",
          domain: domain.trim(),
          plan,
          expires_at: expiresAt || undefined,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Лицензия создана");
      setDomain("");
      setExpiresAt("");
      fetchLicenses();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("licenses" as any).update({ is_active: !current } as any).eq("id", id);
    fetchLicenses();
  }

  async function deleteLicense(id: string) {
    if (!confirm("Удалить лицензию?")) return;
    await supabase.from("licenses" as any).delete().eq("id", id);
    toast.success("Лицензия удалена");
    fetchLicenses();
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("Ключ скопирован");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Лицензии</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Создать лицензию</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Домен</label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com или *"
                className="w-56"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">План</label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Истекает</label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={generateLicense} disabled={generating}>
              <Plus className="h-4 w-4 mr-1" />
              {generating ? "Создание…" : "Создать"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Все лицензии</CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchLicenses}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Загрузка…</p>
          ) : licenses.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет лицензий</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Домен</TableHead>
                  <TableHead>План</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Истекает</TableHead>
                  <TableHead>Создана</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((lic) => (
                  <TableRow key={lic.id}>
                    <TableCell className="font-mono text-sm">{lic.domain}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lic.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lic.is_active ? "default" : "destructive"}>
                        {lic.is_active ? "Активна" : "Отключена"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {lic.expires_at
                        ? format(new Date(lic.expires_at), "dd.MM.yyyy")
                        : "Бессрочно"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(lic.created_at), "dd.MM.yyyy")}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyKey(lic.license_key)}
                        title="Копировать ключ"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(lic.id, lic.is_active)}
                        title={lic.is_active ? "Отключить" : "Включить"}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLicense(lic.id)}
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
