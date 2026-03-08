import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, HelpCircle, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

const AdminFAQ = () => {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const fetchItems = async () => {
    const { data } = await supabase
      .from("faq_items")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    if (editingItem) {
      const { error } = await supabase.from("faq_items").update({
        question, answer, updated_at: new Date().toISOString()
      }).eq("id", editingItem.id);
      if (error) toast.error("Ошибка сохранения");
      else toast.success("FAQ обновлён");
    } else {
      const { error } = await supabase.from("faq_items").insert({
        question, answer, sort_order: items.length, is_published: false
      });
      if (error) toast.error("Ошибка создания");
      else toast.success("FAQ добавлен");
    }

    setDialogOpen(false);
    setEditingItem(null);
    setQuestion("");
    setAnswer("");
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("faq_items").delete().eq("id", id);
    if (error) toast.error("Ошибка удаления");
    else { toast.success("Удалено"); fetchItems(); }
  };

  const togglePublished = async (item: FaqItem) => {
    await supabase.from("faq_items").update({
      is_published: !item.is_published, updated_at: new Date().toISOString()
    }).eq("id", item.id);
    fetchItems();
  };

  const openEdit = (item: FaqItem) => {
    setEditingItem(item);
    setQuestion(item.question);
    setAnswer(item.answer);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    setQuestion("");
    setAnswer("");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" /> FAQ
        </h1>
        <Button onClick={openCreate} size="sm" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> Добавить
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Управление вопросами и ответами. Опубликованные FAQ видны всем посетителям.
      </p>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
      ) : items.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="py-12 text-center text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Нет вопросов. Нажмите «Добавить» чтобы создать первый.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="border-border/60">
              <CardContent className="py-3 px-4 flex items-start gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-1 shrink-0 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{item.question}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.answer}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={item.is_published} onCheckedChange={() => togglePublished(item)} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Редактировать FAQ" : "Новый FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Вопрос</Label>
              <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Как работает сервис?" />
            </div>
            <div className="space-y-2">
              <Label>Ответ</Label>
              <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Подробный ответ..." rows={4} />
            </div>
            <Button onClick={handleSave} className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground">
              {editingItem ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFAQ;
