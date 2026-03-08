import { useState } from "react";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";

const inquirySchema = z.object({
  name: z.string().trim().min(1, "Укажите имя").max(100),
  email: z.string().trim().email("Некорректный email").max(255),
  message: z.string().trim().min(10, "Минимум 10 символов").max(2000),
});

export default function GuestContactForm({ workHours }: { workHours?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = inquirySchema.safeParse({ name, email, message });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setSending(true);
    const { error } = await supabase
      .from("guest_inquiries" as any)
      .insert({ name: parsed.data.name, email: parsed.data.email, message: parsed.data.message } as any);

    if (error) {
      toast.error("Не удалось отправить. Попробуйте позже.");
    } else {
      setSent(true);
    }
    setSending(false);
  }

  if (sent) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">Вопрос отправлен!</h3>
          <p className="text-sm text-muted-foreground">
            Мы ответим на <span className="font-medium">{email}</span> в ближайшее время.
          </p>
          <Button variant="outline" onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); }}>
            Задать ещё вопрос
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          Задать вопрос
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Есть вопрос перед заказом? Напишите нам — ответим на email.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
            <Input
              type="email"
              placeholder="Email для ответа"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              required
            />
          </div>
          <Textarea
            placeholder="Ваш вопрос (минимум 10 символов)…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            required
          />
          <Button type="submit" className="w-full" disabled={sending}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Отправка…" : "Отправить"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
