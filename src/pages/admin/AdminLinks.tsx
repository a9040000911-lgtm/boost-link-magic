import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, ExternalLink, Plus, Pencil, Trash2, Link2, AlertTriangle, RefreshCw, Globe, X } from 'lucide-react';

// ── Types ──

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
}

interface PlatformRow {
  id: string;
  key: string;
  name: string;
  domains: string[];
  icon: string | null;
  color: string | null;
  is_enabled: boolean;
  sort_order: number;
}

interface CategoryOption {
  id: string;
  name: string;
}

const LINK_TYPES = ['profile', 'post', 'reel', 'story', 'video', 'shorts', 'channel', 'playlist', 'live', 'group', 'wall', 'photo', 'unknown'];

// ── Component ──

export default function AdminLinks() {
  const [tab, setTab] = useState('unrecognized');

  // Data
  const [unrecognized, setUnrecognized] = useState<UnrecognizedLink[]>([]);
  const [patterns, setPatterns] = useState<LinkPattern[]>([]);
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Pattern dialog
  const [showPatternDialog, setShowPatternDialog] = useState(false);
  const [editingPattern, setEditingPattern] = useState<LinkPattern | null>(null);
  const [patternForm, setPatternForm] = useState({
    platform: '', link_type: 'unknown', pattern: '', label: '',
    extract_username_group: '', extract_id_group: '', category_id: '', is_enabled: true, sort_order: 0,
  });
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  // Platform dialog
  const [showPlatformDialog, setShowPlatformDialog] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<PlatformRow | null>(null);
  const [platformForm, setPlatformForm] = useState({
    key: '', name: '', domains: '', icon: '', color: '', is_enabled: true, sort_order: 0,
  });

  // Assign platform dialog for unrecognized
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningLink, setAssigningLink] = useState<UnrecognizedLink | null>(null);
  const [assignPlatformKey, setAssignPlatformKey] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // ── Fetch ──

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: u }, { data: p }, { data: pl }, { data: c }] = await Promise.all([
      supabase.from('unrecognized_links').select('*').order('created_at', { ascending: false }),
      supabase.from('link_patterns').select('*').order('sort_order'),
      supabase.from('platforms').select('*').order('sort_order'),
      supabase.from('categories').select('id, name').order('sort_order'),
    ]);
    setUnrecognized((u || []) as unknown as UnrecognizedLink[]);
    setPatterns((p || []) as unknown as LinkPattern[]);
    setPlatforms((pl || []) as unknown as PlatformRow[]);
    setCategories((c || []) as unknown as CategoryOption[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Unrecognized actions ──

  const resolveLink = async (id: string) => {
    await supabase.from('unrecognized_links').update({ resolved: true, resolved_at: new Date().toISOString() } as any).eq('id', id);
    setUnrecognized(prev => prev.map(l => l.id === id ? { ...l, resolved: true } : l));
    toast.success('Отмечено как обработанное');
  };

  const openAssignDialog = (link: UnrecognizedLink) => {
    setAssigningLink(link);
    setAssignPlatformKey('');
    setAssignNotes('');
    setShowAssignDialog(true);
  };

  const handleAssign = async () => {
    if (!assigningLink || !assignPlatformKey) return;
    // Update notes with assigned platform
    const notes = `Назначена платформа: ${assignPlatformKey}${assignNotes ? `. ${assignNotes}` : ''}`;
    await supabase.from('unrecognized_links').update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      notes,
    } as any).eq('id', assigningLink.id);
    setUnrecognized(prev => prev.map(l => l.id === assigningLink.id ? { ...l, resolved: true, notes } : l));
    toast.success('Платформа назначена, ссылка обработана');
    setShowAssignDialog(false);
  };

  // ── Pattern actions ──

  const openPatternDialog = (pattern?: LinkPattern) => {
    if (pattern) {
      setEditingPattern(pattern);
      setPatternForm({
        platform: pattern.platform, link_type: pattern.link_type, pattern: pattern.pattern,
        label: pattern.label, extract_username_group: pattern.extract_username_group?.toString() || '',
        extract_id_group: pattern.extract_id_group?.toString() || '', category_id: pattern.category_id || '',
        is_enabled: pattern.is_enabled, sort_order: pattern.sort_order,
      });
    } else {
      setEditingPattern(null);
      setPatternForm({ platform: '', link_type: 'unknown', pattern: '', label: '', extract_username_group: '', extract_id_group: '', category_id: '', is_enabled: true, sort_order: 0 });
    }
    setTestUrl(''); setTestResult(null);
    setShowPatternDialog(true);
  };

  const handleTestPattern = () => {
    if (!testUrl || !patternForm.pattern) return;
    try {
      const re = new RegExp(patternForm.pattern, 'i');
      const match = testUrl.match(re);
      if (match) {
        const parts = ['✅ Совпадение!'];
        if (patternForm.extract_username_group && match[parseInt(patternForm.extract_username_group)])
          parts.push(`Username: ${match[parseInt(patternForm.extract_username_group)]}`);
        if (patternForm.extract_id_group && match[parseInt(patternForm.extract_id_group)])
          parts.push(`ID: ${match[parseInt(patternForm.extract_id_group)]}`);
        setTestResult(parts.join(' | '));
      } else {
        setTestResult('❌ Нет совпадения');
      }
    } catch { setTestResult('⚠️ Невалидный regex'); }
  };

  const savePattern = async () => {
    if (!patternForm.platform || !patternForm.pattern || !patternForm.label) {
      toast.error('Заполните обязательные поля'); return;
    }
    const data: any = {
      platform: patternForm.platform.toLowerCase(), link_type: patternForm.link_type,
      pattern: patternForm.pattern, label: patternForm.label,
      extract_username_group: patternForm.extract_username_group ? parseInt(patternForm.extract_username_group) : null,
      extract_id_group: patternForm.extract_id_group ? parseInt(patternForm.extract_id_group) : null,
      category_id: patternForm.category_id || null, is_enabled: patternForm.is_enabled,
      sort_order: patternForm.sort_order, updated_at: new Date().toISOString(),
    };
    if (editingPattern) {
      await supabase.from('link_patterns').update(data).eq('id', editingPattern.id);
      toast.success('Паттерн обновлён');
    } else {
      await supabase.from('link_patterns').insert(data);
      toast.success('Паттерн добавлен');
    }
    setShowPatternDialog(false); fetchAll();
  };

  const deletePattern = async (id: string) => {
    await supabase.from('link_patterns').delete().eq('id', id);
    toast.success('Паттерн удалён');
    setPatterns(prev => prev.filter(p => p.id !== id));
  };

  // ── Platform actions ──

  const openPlatformDialog = (platform?: PlatformRow) => {
    if (platform) {
      setEditingPlatform(platform);
      setPlatformForm({
        key: platform.key, name: platform.name, domains: platform.domains.join(', '),
        icon: platform.icon || '', color: platform.color || '', is_enabled: platform.is_enabled,
        sort_order: platform.sort_order,
      });
    } else {
      setEditingPlatform(null);
      setPlatformForm({ key: '', name: '', domains: '', icon: '', color: '', is_enabled: true, sort_order: 0 });
    }
    setShowPlatformDialog(true);
  };

  const savePlatform = async () => {
    if (!platformForm.key || !platformForm.name) {
      toast.error('Заполните ключ и название'); return;
    }
    const domainsArr = platformForm.domains.split(',').map(d => d.trim()).filter(Boolean);
    const data: any = {
      key: platformForm.key.toLowerCase(), name: platformForm.name, domains: domainsArr,
      icon: platformForm.icon || null, color: platformForm.color || null,
      is_enabled: platformForm.is_enabled, sort_order: platformForm.sort_order,
      updated_at: new Date().toISOString(),
    };
    if (editingPlatform) {
      await supabase.from('platforms').update(data).eq('id', editingPlatform.id);
      toast.success('Платформа обновлена');
    } else {
      await supabase.from('platforms').insert(data);
      toast.success('Платформа добавлена');
    }
    setShowPlatformDialog(false); fetchAll();
  };

  const deletePlatform = async (id: string) => {
    await supabase.from('platforms').delete().eq('id', id);
    toast.success('Платформа удалена');
    setPlatforms(prev => prev.filter(p => p.id !== id));
  };

  // ── Computed ──
  const unresolvedCount = unrecognized.filter(l => !l.resolved).length;

  // ── Render ──

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
          <TabsTrigger value="platforms" className="gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Платформы
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{platforms.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            Паттерны
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: Unrecognized ── */}
        <TabsContent value="unrecognized" className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>
          ) : unrecognized.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Нет нераспознанных ссылок 🎉</div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium">URL</th>
                    <th className="px-3 py-2 font-medium w-36">Дата</th>
                    <th className="px-3 py-2 font-medium w-28">Статус</th>
                    <th className="px-3 py-2 font-medium w-48">Заметки</th>
                    <th className="px-3 py-2 font-medium w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {unrecognized.map(link => (
                    <tr key={link.id} className={`border-t border-border ${link.resolved ? 'opacity-50' : ''}`}>
                      <td className="px-3 py-2">
                        <a href={link.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-md block flex items-center gap-1.5">
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {link.url}
                        </a>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {new Date(link.created_at).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={link.resolved ? 'secondary' : 'destructive'} className="text-[10px]">
                          {link.resolved ? 'Обработано' : 'Новая'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-48">
                        {link.notes || '—'}
                      </td>
                      <td className="px-3 py-2">
                        {!link.resolved && (
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => openAssignDialog(link)} title="Назначить платформу">
                              <Globe className="w-3 h-3 mr-1" /> Назначить
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => resolveLink(link.id)} title="Обработано">
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: Platforms ── */}
        <TabsContent value="platforms" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">
              Справочник платформ. Встроенные платформы (Instagram, YouTube и т.д.) работают автоматически. Здесь можно добавить новые.
            </p>
            <Button size="sm" onClick={() => openPlatformDialog()}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Добавить
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">Ключ</th>
                  <th className="px-3 py-2 font-medium">Название</th>
                  <th className="px-3 py-2 font-medium">Домены</th>
                  <th className="px-3 py-2 font-medium w-16">Иконка</th>
                  <th className="px-3 py-2 font-medium w-16">Вкл</th>
                  <th className="px-3 py-2 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {platforms.map(p => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs font-medium">{p.key}</td>
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {p.domains.map((d, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{d}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{p.icon || '—'}</td>
                    <td className="px-3 py-2">
                      <Badge variant={p.is_enabled ? 'default' : 'secondary'} className="text-[10px]">
                        {p.is_enabled ? 'Да' : 'Нет'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openPlatformDialog(p)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deletePlatform(p.id)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── TAB: Patterns ── */}
        <TabsContent value="patterns" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">
              Regex-паттерны для распознавания типов ссылок новых платформ. Работают после встроенных правил.
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

      {/* ── Dialog: Pattern ── */}
      <Dialog open={showPatternDialog} onOpenChange={setShowPatternDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPattern ? 'Редактировать паттерн' : 'Новый паттерн'}</DialogTitle>
            <DialogDescription>Regex-правило для распознавания типа ссылки</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Платформа *</Label>
                <Select value={patternForm.platform} onValueChange={v => setPatternForm(f => ({ ...f, platform: v }))}>
                  <SelectTrigger><SelectValue placeholder="Выберите..." /></SelectTrigger>
                  <SelectContent>
                    {platforms.map(p => (
                      <SelectItem key={p.key} value={p.key}>{p.name} ({p.key})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Тип ссылки</Label>
                <Select value={patternForm.link_type} onValueChange={v => setPatternForm(f => ({ ...f, link_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LINK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Regex паттерн *</Label>
              <Input value={patternForm.pattern} onChange={e => setPatternForm(f => ({ ...f, pattern: e.target.value }))} placeholder="max\.app\/([A-Za-z0-9_]+)" className="font-mono text-xs" />
            </div>
            <div>
              <Label className="text-xs">Метка (label) *</Label>
              <Input value={patternForm.label} onChange={e => setPatternForm(f => ({ ...f, label: e.target.value }))} placeholder="Профиль MAX" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Группа username</Label>
                <Input type="number" value={patternForm.extract_username_group} onChange={e => setPatternForm(f => ({ ...f, extract_username_group: e.target.value }))} placeholder="1" />
              </div>
              <div>
                <Label className="text-xs">Группа ID</Label>
                <Input type="number" value={patternForm.extract_id_group} onChange={e => setPatternForm(f => ({ ...f, extract_id_group: e.target.value }))} placeholder="2" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Привязка к категории (опционально)</Label>
              <Select value={patternForm.category_id} onValueChange={v => setPatternForm(f => ({ ...f, category_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Без привязки" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Без привязки</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={patternForm.is_enabled} onCheckedChange={v => setPatternForm(f => ({ ...f, is_enabled: v }))} />
              <Label className="text-xs">Активен</Label>
            </div>
            <div className="border-t border-border pt-3">
              <Label className="text-xs font-medium">Тест паттерна</Label>
              <div className="flex gap-2 mt-1">
                <Input value={testUrl} onChange={e => setTestUrl(e.target.value)} placeholder="https://max.app/user123" className="text-xs" />
                <Button size="sm" variant="outline" onClick={handleTestPattern}>Тест</Button>
              </div>
              {testResult && <div className="mt-1.5 text-xs px-2 py-1 rounded bg-muted">{testResult}</div>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPatternDialog(false)}>Отмена</Button>
            <Button onClick={savePattern}>{editingPattern ? 'Сохранить' : 'Добавить'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Platform ── */}
      <Dialog open={showPlatformDialog} onOpenChange={setShowPlatformDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlatform ? 'Редактировать платформу' : 'Новая платформа'}</DialogTitle>
            <DialogDescription>Соцсеть или сервис для распознавания ссылок</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Ключ (латиница) *</Label>
                <Input value={platformForm.key} onChange={e => setPlatformForm(f => ({ ...f, key: e.target.value }))}
                  placeholder="max" className="font-mono" disabled={!!editingPlatform} />
              </div>
              <div>
                <Label className="text-xs">Название *</Label>
                <Input value={platformForm.name} onChange={e => setPlatformForm(f => ({ ...f, name: e.target.value }))} placeholder="MAX Messenger" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Домены (через запятую)</Label>
              <Input value={platformForm.domains} onChange={e => setPlatformForm(f => ({ ...f, domains: e.target.value }))} placeholder="max.app, max.ru" />
              <p className="text-[10px] text-muted-foreground mt-1">Список доменов, по которым определяется платформа</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Иконка (lucide)</Label>
                <Input value={platformForm.icon} onChange={e => setPlatformForm(f => ({ ...f, icon: e.target.value }))} placeholder="message-circle" />
              </div>
              <div>
                <Label className="text-xs">Цвет (HSL)</Label>
                <Input value={platformForm.color} onChange={e => setPlatformForm(f => ({ ...f, color: e.target.value }))} placeholder="200 80% 55%" />
                {platformForm.color && (
                  <div className="mt-1 w-full h-3 rounded" style={{ backgroundColor: `hsl(${platformForm.color})` }} />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={platformForm.is_enabled} onCheckedChange={v => setPlatformForm(f => ({ ...f, is_enabled: v }))} />
              <Label className="text-xs">Активна</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlatformDialog(false)}>Отмена</Button>
            <Button onClick={savePlatform}>{editingPlatform ? 'Сохранить' : 'Добавить'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Assign platform to unrecognized ── */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Назначить платформу</DialogTitle>
            <DialogDescription className="truncate">{assigningLink?.url}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Платформа</Label>
              <Select value={assignPlatformKey} onValueChange={setAssignPlatformKey}>
                <SelectTrigger><SelectValue placeholder="Выберите платформу..." /></SelectTrigger>
                <SelectContent>
                  {platforms.map(p => (
                    <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Заметка (опционально)</Label>
              <Input value={assignNotes} onChange={e => setAssignNotes(e.target.value)} placeholder="Новый тип ссылки, нужен паттерн" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Отмена</Button>
            <Button onClick={handleAssign} disabled={!assignPlatformKey}>Назначить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
