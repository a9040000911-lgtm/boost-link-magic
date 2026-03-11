import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("mode") === "register" ? "register" : "login";
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Pre-fill email from URL if present
  const emailFromUrl = searchParams.get("email") || "";

  // Login state
  const [loginEmail, setLoginEmail] = useState(emailFromUrl);
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regEmail, setRegEmail] = useState(emailFromUrl);
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");

  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Silent Onboarding Logic
  useEffect(() => {
    const onboarding = searchParams.get("onboarding") === "true";
    const emailParam = searchParams.get("email");

    if (onboarding && emailParam && !session && !loading) {
      // Small delay or check to avoid immediate double-triggering
      const triggerSilentSignup = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
          email: emailParam,
          options: {
            emailRedirectTo: `${window.location.origin}/catalog?restoring_order=true`,
          },
        });

        if (error) {
          // If it's the specific rate limit error, we can ignore it if we already sent one
          if (error.message.includes("security purposes")) {
            console.log("Rate limit hit, ignoring as request likely already sent");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Ссылка для входа отправлена на почту!");
        }
        setLoading(false);
      };
      triggerSilentSignup();
    }
    // We only want to trigger this once when searchParams or session changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, session]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Ссылка для сброса пароля отправлена на почту!");
      setForgotMode(false);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Вход выполнен!");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { display_name: regName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Проверьте почту для подтверждения!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl gradient-text font-bold">Личный кабинет</CardTitle>
            <CardDescription>
              {loadingSession ? "Проверка сессии..." : session ? "Вы уже авторизованы" : "Войдите или создайте аккаунт"}
            </CardDescription>
            {searchParams.get("service") && !session && (
              <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium animate-pulse">
                🚀 Почти готово! Войдите, чтобы завершить заказ.
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loadingSession ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : session ? (
              <div className="space-y-6 py-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                  <p className="text-sm text-foreground mb-1">Вы вошли как:</p>
                  <p className="font-bold text-primary">{session.user.email}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="w-full bg-primary text-white shadow-lg shadow-primary/20"
                  >
                    Перейти в панель управления
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setSession(null);
                    }}
                    className="w-full border-border/60"
                  >
                    Выйти из аккаунта
                  </Button>
                </div>
              </div>
            ) : searchParams.get("onboarding") === "true" ? (
              <div className="space-y-6 py-4 text-center">
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-primary animate-bounce" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">✨ Вход без пароля</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Мы создали для вас аккаунт на <span className="text-foreground font-medium">{searchParams.get("email")}</span>.
                    <b> Пароль не требуется</b> — мы отправили письмо с кнопкой для моментального входа.
                  </p>
                  <div className="text-left space-y-2 bg-background/50 p-3 rounded-lg border border-border/40">
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-bold text-primary mr-1">💡 Совет:</span>
                      Просто нажмите на кнопку в письме на <b>любом устройстве</b>, где вы хотите сделать заказ.
                      Если вы открыли почту с телефона, вы войдете в кабинет на телефоне.
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-bold text-primary mr-1">🔐 Пароль:</span>
                      Если вы захотите установить постоянный пароль, вы сможете сделать это позже в настройках профиля.
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/catalog")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                  Вернуться в каталог
                </Button>
              </div>
            ) : forgotMode ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-muted-foreground">Введите email, и мы отправим ссылку для сброса пароля.</p>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/30"
                >
                  {loading ? "Отправка..." : "Отправить ссылку"}
                </Button>
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Вернуться к входу
                </button>
              </form>
            ) : (
              <Tabs defaultValue={defaultTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Вход</TabsTrigger>
                  <TabsTrigger value="register">Регистрация</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Пароль</Label>
                        <button
                          type="button"
                          onClick={() => setForgotMode(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Забыли пароль?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/30"
                    >
                      {loading ? "Загрузка..." : "Войти"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Имя</Label>
                      <Input
                        id="reg-name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Ваше имя"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Пароль</Label>
                      <div className="relative">
                        <Input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Минимум 6 символов"
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/30"
                    >
                      {loading ? "Загрузка..." : "Создать аккаунт"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
