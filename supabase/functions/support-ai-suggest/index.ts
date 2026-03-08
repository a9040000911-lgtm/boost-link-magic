import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate caller — must be admin or moderator
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    // Check admin/moderator role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: hasAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    const { data: hasMod } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'moderator' });
    if (!hasAdmin && !hasMod) {
      return json({ error: 'Forbidden' }, 403);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ error: "LOVABLE_API_KEY is not configured" }, 500);
    }

    const body = await req.json();
    const { messages, ticket_subject, channel } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages array required" }, 400);
    }

    // Load AI settings from app_settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["support_ai_enabled", "support_ai_model", "support_ai_system_prompt"]);

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((r: any) => { settingsMap[r.key] = r.value; });

    if (settingsMap.support_ai_enabled !== "true") {
      return json({ error: "AI suggestions are disabled" }, 403);
    }

    const model = settingsMap.support_ai_model || "google/gemini-2.5-flash";
    const systemPrompt = settingsMap.support_ai_system_prompt ||
      "Ты — помощник оператора поддержки. Предложи 2-3 варианта ответа клиенту.";

    // Build context
    const contextInfo = [
      ticket_subject ? `Тема тикета: ${ticket_subject}` : "",
      channel ? `Канал: ${channel}` : "",
    ].filter(Boolean).join("\n");

    const conversationHistory = messages.map((m: any) =>
      `${m.is_admin ? "Оператор" : "Клиент"}: ${m.message}`
    ).join("\n");

    const userPrompt = `${contextInfo ? contextInfo + "\n\n" : ""}История переписки:\n${conversationHistory}\n\nПредложи 2-3 варианта ответа оператора. Каждый вариант начинай с новой строки и нумеруй (1. 2. 3.). Варианты должны быть разными по тону: один формальный, один дружелюбный, один лаконичный.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return json({ error: "Слишком много запросов. Подождите немного." }, 429);
      }
      if (response.status === 402) {
        return json({ error: "Недостаточно средств для AI-запросов." }, 402);
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return json({ error: "AI gateway error" }, 500);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse suggestions from numbered list
    const suggestions = content
      .split(/\n/)
      .map((line: string) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line: string) => line.length > 10);

    return json({ suggestions, raw: content, model });
  } catch (error) {
    console.error("AI suggest error:", error);
    return json({ error: String(error) }, 500);
  }
});
