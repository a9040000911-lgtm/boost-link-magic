import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FolderKanban, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  created_at: string;
}

interface ProjectStats {
  [projectId: string]: { count: number; total: number };
}

const DashboardProjects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    const [projRes, ordersRes] = await Promise.all([
      supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("project_id, price").eq("user_id", user.id).not("project_id", "is", null),
    ]);
    setProjects((projRes.data as Project[]) || []);

    const stats: ProjectStats = {};
    (ordersRes.data || []).forEach((o: any) => {
      if (!o.project_id) return;
      if (!stats[o.project_id]) stats[o.project_id] = { count: 0, total: 0 };
      stats[o.project_id].count++;
      stats[o.project_id].total += Number(o.price);
    });
    setProjectStats(stats);
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
      description: newProject.description || null,
    });
    if (error) {
      toast.error("Ошибка создания проекта");
    } else {
      toast.success("Проект создан!");
      setNewProject({ name: "", description: "" });
      setDialogOpen(false);
      fetchProjects();
    }
    setSaving(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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
                  placeholder="Например: Клиент Иванов"
                />
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Input
                  value={newProject.description}
                  onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Продвижение Instagram + TikTok"
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
            <p className="text-sm text-muted-foreground/70">Создайте проект для группировки заказов по клиентам или аккаунтам</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const s = projectStats[project.id] || { count: 0, total: 0 };
            return (
              <Card
                key={project.id}
                className="border-border/60 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/dashboard/projects/${project.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {project.name}
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      {project.description && (
                        <CardDescription>{project.description}</CardDescription>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Заказов: </span>
                      <span className="font-medium">{s.count}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Потрачено: </span>
                      <span className="font-bold gradient-text">{s.total.toFixed(2)} ₽</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Создан: {new Date(project.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardProjects;
