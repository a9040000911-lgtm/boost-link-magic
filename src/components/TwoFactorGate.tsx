import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Send, Loader2, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface TwoFactorGateProps {
  children: React.ReactNode;
  userId: string;
}

const SESSION_KEY = "2fa_verified";

export function TwoFactorGate({ children, userId }: TwoFactorGateProps) {
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [channels, setChannels] = useState<{ telegram: boolean; email: boolean }>({ telegram: false, email: false });
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Check if already verified this session
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === userId) {
      setVerified(true);
    }
    setChecking(false);
  }, [userId]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = useCallback(async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-2fa-code");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCodeSent(true);
      setChannels(data.channels || {});
      setEmailHint(data.email_hint || null);
      setCooldown(60);
      toast.success("Код отправлен!");
    } catch (e: any) {
      if (e.message?.includes("Подождите")) {
        setCooldown(60);
        setCodeSent(true);
      }
      toast.error(e.message || "Ошибка отправки кода");
    }
    setSending(false);
  }, []);

  const verifyCode = useCallback(async (codeValue: string) => {
    if (codeValue.length !== 6) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-2fa-code", {
        body: { code: codeValue },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.verified) {
        sessionStorage.setItem(SESSION_KEY, userId);
        setVerified(true);
        toast.success("Вход подтверждён!");
      }
    } catch (e: any) {
      toast.error(e.message || "Неверный код");
      setCode("");
    }
    setVerifying(false);
  }, [userId]);

  if (checking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (verified) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm border-border/60 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Двухфакторная проверка</CardTitle>
          <CardDescription>
            Для доступа к панели управления требуется подтверждение
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!codeSent ? (
            <Button
              className="w-full gap-2"
              onClick={sendCode}
              disabled={sending}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Отправка..." : "Получить код"}
            </Button>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                {channels.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-green-500" />
                    {emailHint || "Email"}
                  </span>
                )}
                {channels.telegram && (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-blue-500" />
                    Telegram
                  </span>
                )}
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(v) => {
                    setCode(v);
                    if (v.length === 6) verifyCode(v);
                  }}
                  disabled={verifying}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {verifying && (
                <div className="flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={sendCode}
                disabled={sending || cooldown > 0}
              >
                {cooldown > 0 ? `Повторить через ${cooldown}с` : "Отправить код повторно"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
