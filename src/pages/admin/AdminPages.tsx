import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Eye, EyeOff, Globe, Search as SearchIcon, GripVertical, ExternalLink, Copy } from "lucide-react";

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  is_published: boolean;
  meta_title: string;
  meta_description: string;
  og_image: string;
  custom_css: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const emptyPage: Omit<Page, "id" | "created_at" | "updated_at"> = {
  slug: "",
  title: "",
  content: "",
  is_published: false,
  meta_title: "",
  meta_description: "",
  og_image: "",
  custom_css: "",
  sort_order: 0,
};

export default function AdminPages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [form, setForm] = useState(emptyPage);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("pages")
      .select("*")
      .order("sort_order", { ascending: true });
    setPages((data as Page[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPage);
    setDialogOpen(true);
  };

  const openEdit = (p: Page) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      title: p.title,
      content: p.content,
      is_published: p.is_published,
      meta_title: p.meta_title,
      meta_description: p.meta_description,
      og_image: p.og_image,
      custom_css: p.custom_css,
      sort_order: p.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.title.trim()) {
      toast({ title: "Заполните slug и название", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from("pages").update(payload).eq("id", editing.id);
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Страница обновлена" });
      }
    } else {
      const { error } = await supabase.from("pages").insert(payload);
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Страница создана" });
      }
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("pages").delete().eq("id", id);
    toast({ title: "Страница удалена" });
    setDeleteConfirm(null);
    load();
  };

  const togglePublish = async (p: Page) => {
    await supabase.from("pages").update({ is_published: !p.is_published, updated_at: new Date().toISOString() }).eq("id", p.id);
    toast({ title: p.is_published ? "Снято с публикации" : "Опубликовано" });
    load();
  };

  const filtered = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const metaTitleLen = form.meta_title.length;
  const metaDescLen = form.meta_description.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Страницы и SEO</h1>
          <p className="text-sm text-muted-foreground">Управление контентом страниц и мета-тегами</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Новая страница
        </Button>
      </div>

      <div className="relative max-w-xs">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию или slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Страница</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>SEO</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Нет страниц
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p, i) => {
                  const hasMeta = !!(p.meta_title && p.meta_description);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/{p.slug}</code>
                      </TableCell>
                      <TableCell>
                        {hasMeta ? (
                          <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">
                            <Globe className="h-3 w-3 mr-1" /> Настроен
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-500 border-orange-300 text-[10px]">
                            Нет мета
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.is_published ? "default" : "secondary"} className="text-[10px]">
                          {p.is_published ? "Опубликована" : "Черновик"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePublish(p)} title={p.is_published ? "Снять" : "Опубликовать"}>
                            {p.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить страницу?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Это действие необратимо.</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
            <Button variant="destructive" size="sm" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать страницу" : "Новая страница"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="content" className="flex-1">Контент</TabsTrigger>
              <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1">Дополнительно</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Название страницы</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm((f) => ({
                        ...f,
                        title,
                        slug: f.slug || title.toLowerCase().replace(/[^a-zа-яё0-9]/gi, "-").replace(/-+/g, "-"),
                      }));
                    }}
                    placeholder="О компании"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">URL-slug</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">/</span>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      placeholder="about"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Содержание (HTML)</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={10}
                  placeholder="<h2>О нас</h2><p>Текст страницы...</p>"
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
                />
                <Label className="text-xs">Опубликована</Label>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              {/* Google preview */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-muted-foreground font-normal">Превью в Google</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-blue-600 text-sm font-medium truncate">
                    {form.meta_title || form.title || "Название страницы"}
                  </p>
                  <p className="text-green-700 text-xs truncate">
                    example.com/{form.slug || "page"}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {form.meta_description || "Описание страницы не задано..."}
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Meta Title</Label>
                  <span className={`text-[10px] ${metaTitleLen > 60 ? "text-destructive" : "text-muted-foreground"}`}>
                    {metaTitleLen}/60
                  </span>
                </div>
                <Input
                  value={form.meta_title}
                  onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                  placeholder="SEO заголовок страницы"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Meta Description</Label>
                  <span className={`text-[10px] ${metaDescLen > 160 ? "text-destructive" : "text-muted-foreground"}`}>
                    {metaDescLen}/160
                  </span>
                </div>
                <Textarea
                  value={form.meta_description}
                  onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                  rows={3}
                  placeholder="Краткое описание для поисковых систем"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">OG Image URL</Label>
                <Input
                  value={form.og_image}
                  onChange={(e) => setForm((f) => ({ ...f, og_image: e.target.value }))}
                  placeholder="https://example.com/og-image.jpg"
                />
                {form.og_image && (
                  <img src={form.og_image} alt="OG preview" className="mt-2 rounded border max-h-32 object-cover" />
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Порядок сортировки</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Пользовательский CSS</Label>
                <Textarea
                  value={form.custom_css}
                  onChange={(e) => setForm((f) => ({ ...f, custom_css: e.target.value }))}
                  rows={5}
                  placeholder=".page-about { background: #f5f5f5; }"
                  className="font-mono text-xs"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Сохранение..." : editing ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
