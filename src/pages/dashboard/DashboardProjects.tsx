import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FolderKanban, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  platform: string | null;
  url: string | null;
  description: string | null;
  created_at: string;
}

const DashboardProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", platform: "", url: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setProjects((data as Project[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newProject.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      name: newProject.name.trim(),
      platform: newProject.platform || null,
      url: newProject.url || null,
      description: newProject.description || null,
    });
    if (error) {
      toast.error("Ошибка создания проекта");
    } else {
      toast.success("Проект создан!");
      setNewProject({ name: "", platform: "", url: "", description: "" });
      setDialogOpen(false);
      fetchProjects();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast.error("Ошибка удаления");
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Проект удалён");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Проекты</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/30">
              <Plus className="h-4 w-4 mr-2" /> Новый проект
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать проект</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input
                  value={newProject.name}
                  onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Мой Instagram аккаунт"
                />
              </div>
              <div className="space-y-2">
                <Label>Платформа</Label>
                <Select value={newProject.platform} onValueChange={(v) => setNewProject((p) => ({ ...p, platform: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите платформу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="vk">VK</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ссылка</Label>
                <Input
                  value={newProject.url}
                  onChange={(e) => setNewProject((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Input
                  value={newProject.description}
                  onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Краткое описание проекта"
                />
              </div>
              <Button onClick={handleCreate} disabled={saving || !newProject.name.trim()} className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                {saving ? "Создание..." : "Создать"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">У вас пока нет проектов</p>
            <p className="text-sm text-muted-foreground/70">Создайте первый проект для управления заказами</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="border-border/60 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.platform && (
                      <CardDescription className="capitalize">{project.platform}</CardDescription>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                )}
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Открыть
                  </a>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Создан: {new Date(project.created_at).toLocaleDateString("ru-RU")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardProjects;
