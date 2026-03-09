import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { User, Lock, Trash2 } from "lucide-react";

const DashboardSettings = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        setDisplayName(data.display_name || "");
        return;
      }

      // If profile row is missing, create it (auth trigger may be отсутствовать)
      const fallbackName =
        (user.user_metadata as any)?.display_name ??
        (user.email ? user.email.split("@")[0] : "");

      await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: fallbackName }, { onConflict: "id" });
      setDisplayName(fallbackName || "");
    };

    void fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.rpc("update_own_profile" as any, { p_display_name: displayName });
    if (error) toast.error("Ошибка сохранения");
    else toast.success("Профиль обновлён");
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Минимум 6 символов");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Пароль изменён");
      setNewPassword("");
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeletingAccount(true);
    const { data, error } = await supabase.functions.invoke("delete-account", {
      body: { confirm: true },
    });

    if (error || (data as any)?.error) {
      toast.error((error as any)?.message || (data as any)?.error || "Ошибка удаления аккаунта");
      setDeletingAccount(false);
      return;
    }

    toast.success("Аккаунт удалён");
    await supabase.auth.signOut();
    setDeletingAccount(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Настройки</h1>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" /> Профиль
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Имя</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ваше имя"
            />
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/30"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" /> Безопасность
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Новый пароль</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Минимум 6 символов"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword}
            variant="outline"
          >
            {changingPassword ? "Смена..." : "Сменить пароль"}
          </Button>

          <Separator />

          <div className="space-y-2">
            <Label>Удаление аккаунта</Label>
            <p className="text-sm text-muted-foreground">
              Аккаунт будет мягко удалён: ваши данные останутся доступными только поддержке, а вы сможете
              зарегистрироваться заново с тем же email как новый пользователь.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deletingAccount}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deletingAccount ? "Удаление..." : "Удалить аккаунт"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить аккаунт?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие необратимо для текущего аккаунта: вы выйдете из системы, а повторная
                    регистрация создаст новый аккаунт без доступа к старым данным.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingAccount}>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                  >
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSettings;
