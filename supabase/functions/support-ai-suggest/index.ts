import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// ===== Multi-provider AI call =====
interface AICallParams {
  provider: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  endpoint?: string;
  apiKeyEnv?: string;
  supabase?: any;
}

/** Pick the least-used enabled Gemini key from ai_api_keys table */
async function getRotatedKey(supabase: any): Promise<{ id: string; api_key: string } | null> {
/** Pick the least-used enabled Gemini key from ai_api_keys table */
async function getRotatedKey(supabase: any): Promise<{ id: string; api_key: string; model: string } | null> {
  const { data } = await supabase
    .from("ai_api_keys")
    .select("id, api_key, model")
    .eq("provider", "gemini")
    .eq("is_enabled", true)
    .order("usage_count", { ascending: true })
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .limit(1)
    .maybeSingle();
  return data;
}

/** Increment usage counter for a key */
async function markKeyUsed(supabase: any, keyId: string, error?: string) {
  if (error) {
    await supabase
      .from("ai_api_keys")
      .update({ error_count: supabase.rpc ? undefined : 0, last_error: error, last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", keyId);
    // increment error_count via raw update
    await supabase.rpc("increment_ai_key_error", { key_id: keyId }).catch(() => {});
  }
  // Always increment usage_count
  await supabase.rpc("increment_ai_key_usage", { key_id: keyId }).catch(() => {
    // Fallback if RPC doesn't exist yet
    supabase
      .from("ai_api_keys")
      .update({ last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", keyId);
  });
}

async function callAI({ provider, model, systemPrompt, userPrompt, endpoint, apiKeyEnv, supabase: sb }: AICallParams): Promise<{ content: string; model: string }> {
  let url: string;
  let apiKey: string;
  let actualModel = model;
  let rotatedKeyId: string | null = null;

  switch (provider) {
    case "lovable":
    default:
      url = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = Deno.env.get("LOVABLE_API_KEY") || "";
      actualModel = model || "google/gemini-3-flash-preview";
      break;

    case "gemini": {
      url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      actualModel = model || "gemini-2.5-flash";
      // Rotate keys from DB
      if (sb) {
        const rotated = await getRotatedKey(sb);
        if (rotated) {
          apiKey = rotated.api_key;
          rotatedKeyId = rotated.id;
        } else {
          // Fallback to env
          apiKey = Deno.env.get(apiKeyEnv || "GEMINI_API_KEY") || "";
        }
      } else {
        apiKey = Deno.env.get(apiKeyEnv || "GEMINI_API_KEY") || "";
      }
      break;
    }

    case "openclaw":
      url = endpoint || "https://api.openclaw.com/v1/chat/completions";
      apiKey = Deno.env.get(apiKeyEnv || "OPENCLAW_API_KEY") || "";
      actualModel = model || "default";
      break;

    case "custom":
      url = endpoint || "";
      apiKey = Deno.env.get(apiKeyEnv || "CUSTOM_AI_API_KEY") || "";
      actualModel = model || "default";
      break;
  }

  if (!url) throw new Error(`AI endpoint not configured for provider: ${provider}`);
  if (!apiKey) throw new Error(`API key not configured for provider: ${provider}. ${provider === "gemini" ? "Добавьте ключи в разделе API & Интеграции" : `Set secret: ${apiKeyEnv || "LOVABLE_API_KEY"}`}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: actualModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    // Mark key error if rotated
    if (rotatedKeyId && sb) {
      await markKeyUsed(sb, rotatedKeyId, `HTTP ${response.status}`);
    }
    if (response.status === 429) throw new Error("RATE_LIMIT");
    if (response.status === 402) throw new Error("PAYMENT_REQUIRED");
    const errText = await response.text();
    console.error(`AI provider ${provider} error:`, response.status, errText);
    throw new Error(`AI provider error (${response.status})`);
  }

  // Mark key success
  if (rotatedKeyId && sb) {
    await markKeyUsed(sb, rotatedKeyId);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  return { content, model: actualModel };
}

// ===== Load enrichment context (FAQ + templates) =====
async function loadContext(supabase: any, useFaq: boolean, useTemplates: boolean): Promise<string> {
  const parts: string[] = [];

  if (useFaq) {
    const { data: faqItems } = await supabase
      .from("faq_items")
      .select("question, answer")
      .eq("is_published", true)
      .order("sort_order")
      .limit(30);
    if (faqItems?.length) {
      parts.push("=== FAQ база знаний ===");
      faqItems.forEach((f: any) => parts.push(`В: ${f.question}\nО: ${f.answer}`));
    }
  }

  if (useTemplates) {
    const { data: templates } = await supabase
      .from("support_response_templates")
      .select("title, content, category")
      .eq("is_enabled", true)
      .order("sort_order")
      .limit(20);
    if (templates?.length) {
      parts.push("=== Шаблоны ответов ===");
      templates.forEach((t: any) => parts.push(`[${t.category}] ${t.title}: ${t.content}`));
    }
  }

  return parts.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json();
    const { messages, ticket_subject, channel, mode: requestMode } = body;

    // For "internal" calls from telegram bot — skip auth, require internal_secret
    const isInternalCall = body._internal === true;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!isInternalCall) {
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

      const { data: hasAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      const { data: hasMod } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'moderator' });
      if (!hasAdmin && !hasMod) {
        return json({ error: 'Forbidden' }, 403);
      }
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages array required" }, 400);
    }

    // Load AI settings
    const { data: settingsData } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "support_ai_enabled", "support_ai_provider", "support_ai_mode",
        "support_ai_model", "support_ai_system_prompt", "support_ai_auto_confidence",
        "support_ai_custom_endpoint", "support_ai_custom_key_env",
        "support_ai_use_faq", "support_ai_use_templates",
      ]);

    const s: Record<string, string> = {};
    (settingsData || []).forEach((r: any) => { s[r.key] = r.value; });

    if (s.support_ai_enabled !== "true") {
      return json({ error: "AI suggestions are disabled" }, 403);
    }

    const provider = s.support_ai_provider || "lovable";
    const aiMode = requestMode || s.support_ai_mode || "suggest";
    const model = s.support_ai_model || "";
    const confidenceThreshold = parseFloat(s.support_ai_auto_confidence || "0.8");
    const useFaq = s.support_ai_use_faq === "true";
    const useTemplates = s.support_ai_use_templates === "true";

    // Load enrichment context
    const contextKB = await loadContext(supabase, useFaq, useTemplates);

    // Build system prompt
    const baseSystemPrompt = s.support_ai_system_prompt ||
      "Ты — помощник оператора поддержки. Предложи 2-3 варианта ответа клиенту.";

    const systemPrompt = contextKB
      ? `${baseSystemPrompt}\n\nИспользуй следующую базу знаний для формулировки ответов:\n\n${contextKB}`
      : baseSystemPrompt;

    // Build user prompt
    const contextInfo = [
      ticket_subject ? `Тема тикета: ${ticket_subject}` : "",
      channel ? `Канал: ${channel}` : "",
    ].filter(Boolean).join("\n");

    const conversationHistory = messages.map((m: any) =>
      `${m.is_admin ? "Оператор" : "Клиент"}: ${m.message}`
    ).join("\n");

    let userPrompt: string;

    if (aiMode === "auto") {
      userPrompt = `${contextInfo ? contextInfo + "\n\n" : ""}История переписки:\n${conversationHistory}\n\nПроанализируй последнее сообщение клиента. Если ты уверен в ответе на ${Math.round(confidenceThreshold * 100)}% и выше — предложи ОДИН лучший ответ и укажи уровень уверенности (0.0-1.0).\n\nФормат ответа:\nУВЕРЕННОСТЬ: [число от 0 до 1]\nОТВЕТ: [текст ответа]`;
    } else {
      userPrompt = `${contextInfo ? contextInfo + "\n\n" : ""}История переписки:\n${conversationHistory}\n\nПредложи 2-3 варианта ответа оператора. Каждый вариант начинай с новой строки и нумеруй (1. 2. 3.). Варианты должны быть разными по тону: один формальный, один дружелюбный, один лаконичный.`;
    }

    // Call AI provider
    const result = await callAI({
      provider,
      model,
      systemPrompt,
      userPrompt,
      endpoint: s.support_ai_custom_endpoint,
      apiKeyEnv: s.support_ai_custom_key_env,
      supabase,
    });

    // Parse response based on mode
    if (aiMode === "auto") {
      // Parse confidence and answer
      const confidenceMatch = result.content.match(/УВЕРЕННОСТЬ:\s*([\d.]+)/i);
      const answerMatch = result.content.match(/ОТВЕТ:\s*([\s\S]+)/i);

      const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0;
      const answer = answerMatch ? answerMatch[1].trim() : result.content;

      return json({
        mode: "auto",
        confidence,
        threshold: confidenceThreshold,
        should_auto_reply: confidence >= confidenceThreshold,
        answer,
        raw: result.content,
        model: result.model,
        provider,
      });
    }

    // Suggest mode — parse numbered list
    const suggestions = result.content
      .split(/\n/)
      .map((line: string) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line: string) => line.length > 10);

    return json({
      mode: "suggest",
      suggestions,
      raw: result.content,
      model: result.model,
      provider,
    });
  } catch (error) {
    console.error("AI suggest error:", error);
    const msg = error instanceof Error ? error.message : String(error);

    if (msg === "RATE_LIMIT") return json({ error: "Слишком много запросов. Подождите немного." }, 429);
    if (msg === "PAYMENT_REQUIRED") return json({ error: "Недостаточно средств для AI-запросов." }, 402);

    return json({ error: msg }, 500);
  }
});
