import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  bot_type: string;
  category: string;
  welcome_message: string;
  confirm_message: string;
  buttons: any[];
  settings: Record<string, any>;
}

interface Props {
  onSelect: (template: Template) => void;
}

export function BotTemplateGallery({ onSelect }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("bot_templates").select("*").order("sort_order").then(({ data }) => {
      setTemplates((data as any[]) || []);
      setLoading(false);
    });
  }, []);

  const supportTemplates = templates.filter(t => t.category === "support");
  const orderTemplates = templates.filter(t => t.category === "orders");

  if (loading) return <div className="text-center py-8 text-muted-foreground">Загрузка шаблонов...</div>;

  return (
    <Tabs defaultValue="support" className="space-y-4">
      <TabsList>
        <TabsTrigger value="support">🎧 Поддержка ({supportTemplates.length})</TabsTrigger>
        <TabsTrigger value="orders">🛒 Заказы ({orderTemplates.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="support">
        <div className="grid gap-3 md:grid-cols-2">
          {supportTemplates.map(t => (
            <TemplateCard key={t.id} template={t} onSelect={onSelect} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="orders">
        <div className="grid gap-3 md:grid-cols-2">
          {orderTemplates.map(t => (
            <TemplateCard key={t.id} template={t} onSelect={onSelect} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function TemplateCard({ template, onSelect }: { template: any; onSelect: (t: any) => void }) {
  const buttonCount = (template.buttons as any[])?.length || 0;

  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => onSelect(template)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm">{template.name}</CardTitle>
          <Badge variant="outline" className="text-[10px]">{buttonCount} кнопок</Badge>
        </div>
        {template.description && <CardDescription className="text-xs">{template.description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="bg-muted/50 rounded-md p-2 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3 mb-3">
          {template.welcome_message}
        </div>
        <Button size="sm" variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Check className="mr-1 h-3.5 w-3.5" /> Использовать
        </Button>
      </CardContent>
    </Card>
  );
}
