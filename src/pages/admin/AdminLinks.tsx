import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, ExternalLink, Plus, Pencil, Trash2, Link2, AlertTriangle, RefreshCw } from 'lucide-react';

interface UnrecognizedLink {
  id: string;
  url: string;
  user_agent: string | null;
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
  notes: string | null;
}

interface LinkPattern {
  id: string;
  platform: string;
  link_type: string;
  pattern: string;
  label: string;
  extract_username_group: number | null;
  extract_id_group: number | null;
  category_id: string | null;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

const LINK_TYPES = ['profile', 'post', 'reel', 'story', 'video', 'shorts', 'channel', 'playlist', 'live', 'group', 'wall', 'photo', 'unknown'];

export default function AdminLinks() {
  const [tab, setTab] = useState('unrecognized');
  const [unrecognized, setUnrecognized] = useState<UnrecognizedLink[]>([]);
  const [patterns, setPatterns] = useState<LinkPattern[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPatternDialog, setShowPatternDialog] = useState(false);
  const [editingPattern, setEditingPattern] = useState<LinkPattern | null>(null);
  const [form, setForm] = useState({
    platform: '', link_type: 'unknown', pattern: '', label: '',
    extract_username_group: '', extract_id_group: '', category_id: '', is_enabled: true, sort_order: 0,
  });
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: u }, { data: p }, { data: c }] = await Promise.all([
      supabase.from('unrecognized_links').select('*').order('created_at', { ascending: false }),
      supabase.from('link_patterns').select('*').order('sort_order'),
      supabase.from('categories').select('id, name').order('sort_order'),
    ]);
    setUnrecognized((u || []) as unknown as UnrecognizedLink[]);
    setPatterns((p || []) as unknown as LinkPattern[]);
    setCategories((c || []) as unknown as CategoryOption[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resolveLink = async (id: string) => {
    await supabase.from('unrecognized_links').update({ resolved: true, resolved_at: new Date().toISOString() } as any).eq('id', id);
    setUnrecognized(prev => prev.map(l => l.id === id ? { ...l, resolved: true } : l));
    toast.success('Отмечено как обработанное');
  };

  const openPatternDialog = (pattern?: LinkPattern) => {
    if (pattern) {
      setEditingPattern(pattern);
      setForm({
        platform: pattern.platform,
        link_type: pattern.link_type,
        pattern: pattern.pattern,
        label: pattern.label,
        extract_username_group: pattern.extract_username_group?.toString() || '',
        extract_id_group: pattern.extract_id_group?.toString() || '',
        category_id: pattern.category_id || '',
        is_enabled: pattern.is_enabled,
        sort_order: pattern.sort_order,
      });
    } else {
      setEditingPattern(null);
      setForm({ platform: '', link_type: 'unknown', pattern: '', label: '', extract_username_group: '', extract_id_group: '', category_id: '', is_enabled: true, sort_order: 0 });
    }
    setTestUrl('');
    setTestResult(null);
    setShowPatternDialog(true);
  };

  const handleTestPattern = () => {
    if (!testUrl || !form.pattern) return;
    try {
      const re = new RegExp(form.pattern, 'i');
      const match = testUrl.match(re);
      if (match) {
        const parts = [`✅ Совпадение!`];
        if (form.extract_username_group && match[parseInt(form.extract_username_group)]) {
          parts.push(`Username: ${match[parseInt(form.extract_username_group)]}`);
        }
        if (form.extract_id_group && match[parseInt(form.extract_id_group)]) {
          parts.push(`ID: ${match[parseInt(form.extract_id_group)]}`);
        }
        setTestResult(parts.join(' | '));
      } else {
        setTestResult('❌ Нет совпадения');
      }
    } catch (e) {
      setTestResult('⚠️ Невалидный regex');
    }
  };

  const savePattern = async () => {
    if (!form.platform || !form.pattern || !form.label) {
      toast.error('Заполните обязательные поля');
      return;
    }
    const data: any = {
      platform: form.platform.toLowerCase(),
      link_type: form.link_type,
      pattern: form.pattern,
      label: form.label,
      extract_username_group: form.extract_username_group ? parseInt(form.extract_username_group) : null,
      extract_id_group: form.extract_id_group ? parseInt(form.extract_id_group) : null,
      category_id: form.category_id || null,
      is_enabled: form.is_enabled,
      sort_order: form.sort_order,
      updated_at: new Date().toISOString(),
    };

    if (editingPattern) {
      await supabase.from('link_patterns').update(data).eq('id', editingPattern.id);
      toast.success('Паттерн обновлён');
    } else {
      await supabase.from('link_patterns').insert(data);
      toast.success('Паттерн добавлен');
    }
    setShowPatternDialog(false);
    fetchAll();
  };

  const deletePattern = async (id: string) => {
    await supabase.from('link_patterns').delete().eq('id', id);
    toast.success('Паттерн удалён');
    setPatterns(prev => prev.filter(p => p.id !== id));
  };

  const unresolvedCount = unrecognized.filter(l => !l.resolved).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Управление ссылками</h1>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Обновить
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="unrecognized" className="gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Нераспознанные
            {unresolvedCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{unresolvedCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            Паттерны ссылок
          </TabsTrigger>
        </TabsList>

        {/* Unrecognized Links */}
        <TabsContent value="unrecognized" className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>
          ) : unrecognized.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Нет нераспознанных ссылок</div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium">URL</th>
                    <th className="px-3 py-2 font-medium w-36">Дата</th>
                    <th className="px-3 py-2 font-medium w-28">Статус</th>
                    <th className="px-3 py-2 font-medium w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {unrecognized.map(link => (
                    <tr key={link.id} className={`border-t border-border ${link.resolved ? 'opacity-50' : ''}`}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                          <a href={link.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-md block">
                            {link.url}
                          </a>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {new Date(link.created_at).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={link.resolved ? 'secondary' : 'destructive'} className="text-[10px]">
                          {link.resolved ? 'Обработано' : 'Новая'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        {!link.resolved && (
                          <Button variant="ghost" size="sm" onClick={() => resolveLink(link.id)}>
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Link Patterns */}
        <TabsContent value="patterns" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">
              Паттерны для распознавания новых платформ и типов ссылок. Имеют приоритет после встроенных правил.
            </p>
            <Button size="sm" onClick={() => openPatternDialog()}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Добавить
            </Button>
          </div>

          {patterns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Нет пользовательских паттернов. Встроенные правила работают по умолчанию.
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium">Платформа</th>
                    <th className="px-3 py-2 font-medium">Тип</th>
                    <th className="px-3 py-2 font-medium">Паттерн</th>
                    <th className="px-3 py-2 font-medium">Метка</th>
                    <th className="px-3 py-2 font-medium">Категория</th>
                    <th className="px-3 py-2 font-medium w-16">Вкл</th>
                    <th className="px-3 py-2 font-medium w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {patterns.map(p => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{p.platform}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{p.link_type}</Badge></td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground truncate max-w-xs">{p.pattern}</td>
                      <td className="px-3 py-2">{p.label}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {p.category_id ? categories.find(c => c.id === p.category_id)?.name || '—' : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={p.is_enabled ? 'default' : 'secondary'} className="text-[10px]">
                          {p.is_enabled ? 'Да' : 'Нет'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openPatternDialog(p)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deletePattern(p.id)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pattern Dialog */}
      <Dialog open={showPatternDialog} onOpenChange={setShowPatternDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPattern ? 'Редактировать паттерн' : 'Новый паттерн'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Платформа *</Label>
                <Input value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} placeholder="max, threads..." />
              </div>
              <div>
                <Label className="text-xs">Тип ссылки</Label>
                <Select value={form.link_type} onValueChange={v => setForm(f => ({ ...f, link_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LINK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Regex паттерн *</Label>
              <Input value={form.pattern} onChange={e => setForm(f => ({ ...f, pattern: e.target.value }))} placeholder="max\.app\/([A-Za-z0-9_]+)" className="font-mono text-xs" />
            </div>
            <div>
              <Label className="text-xs">Метка (label) *</Label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Профиль MAX" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Группа username</Label>
                <Input type="number" value={form.extract_username_group} onChange={e => setForm(f => ({ ...f, extract_username_group: e.target.value }))} placeholder="1" />
              </div>
              <div>
                <Label className="text-xs">Группа ID</Label>
                <Input type="number" value={form.extract_id_group} onChange={e => setForm(f => ({ ...f, extract_id_group: e.target.value }))} placeholder="2" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Привязка к категории (опционально)</Label>
              <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Без привязки" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Без привязки</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_enabled} onCheckedChange={v => setForm(f => ({ ...f, is_enabled: v }))} />
              <Label className="text-xs">Активен</Label>
            </div>

            {/* Test area */}
            <div className="border-t border-border pt-3">
              <Label className="text-xs font-medium">Тест паттерна</Label>
              <div className="flex gap-2 mt-1">
                <Input value={testUrl} onChange={e => setTestUrl(e.target.value)} placeholder="https://max.app/user123" className="text-xs" />
                <Button size="sm" variant="outline" onClick={handleTestPattern}>Тест</Button>
              </div>
              {testResult && (
                <div className="mt-1.5 text-xs px-2 py-1 rounded bg-muted">{testResult}</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPatternDialog(false)}>Отмена</Button>
            <Button onClick={savePattern}>{editingPattern ? 'Сохранить' : 'Добавить'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
