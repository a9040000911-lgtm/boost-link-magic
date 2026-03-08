// support-ai-suggest v3 — universal multi-provider with key rotation
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// ===== Provider endpoint mapping =====
const PROVIDER_ENDPOINTS: Record<string, string> = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  glm: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
  kimi: "https://api.moonshot.cn/v1/chat/completions",
  lovable: "https://ai.gateway.lovable.dev/v1/chat/completions",
};

/** Pick the least-used enabled key from ai_api_keys table, optionally filtered by provider */
async function getRotatedKey(supabase: any, provider?: string): Promise<{ id: string; api_key: string; model: string; provider: string } | null> {
  let query = supabase
    .from("ai_api_keys")
    .select("id, api_key, model, provider")
    .eq("is_enabled", true)
    .order("usage_count", { ascending: true })
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .limit(1);

  if (provider && provider !== "any") {
    query = query.eq("provider", provider);
  }

  const { data } = await query.maybeSingle();
  return data;
}

/** Increment usage counter for a key */
async function markKeyUsed(supabase: any, keyId: string, error?: string) {
  if (error) {
    await supabase
      .from("ai_api_keys")
      .update({ last_error: error, last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", keyId);
    await supabase.rpc("increment_ai_key_error", { key_id: keyId }).catch(() => {});
  }
  await supabase.rpc("increment_ai_key_usage", { key_id: keyId }).catch(() => {
    supabase
      .from("ai_api_keys")
      .update({ last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", keyId);
  });
}

/** Build request for Claude (Anthropic Messages API) */
function buildClaudeRequest(model: string, systemPrompt: string, userPrompt: string) {
  return {
    url: "https://api.anthropic.com/v1/messages",
    headers: (apiKey: string) => ({
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    }),
    body: {
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    },
    parseResponse: (data: any) => data.content?.[0]?.text || "",
  };
}

/** Build request for OpenAI-compatible APIs */
function buildOpenAIRequest(url: string, model: string, systemPrompt: string, userPrompt: string) {
  return {
    url,
    headers: (apiKey: string) => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    body: {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    },
    parseResponse: (data: any) => data.choices?.[0]?.message?.content || "",
  };
}

interface AICallParams {
  systemPrompt: string;
  userPrompt: string;
  supabase: any;
  preferredProvider?: string;
}

async function callAI({ systemPrompt, userPrompt, supabase: sb, preferredProvider }: AICallParams): Promise<{ content: string; model: string; provider: string }> {
  // Try to get a rotated key from DB
  const rotated = await getRotatedKey(sb, preferredProvider);

  let provider: string;
  let model: string;
  let apiKey: string;
  let rotatedKeyId: string | null = null;

  if (rotated) {
    provider = rotated.provider;
    model = rotated.model;
    apiKey = rotated.api_key;
    rotatedKeyId = rotated.id;
  } else {
    // Fallback to Lovable AI
    provider = "lovable";
    model = "google/gemini-3-flash-preview";
    apiKey = Deno.env.get("LOVABLE_API_KEY") || "";
    if (!apiKey) throw new Error("Нет доступных AI ключей. Добавьте ключи в разделе API & Интеграции.");
  }

  // Build request based on provider
  let req: ReturnType<typeof buildOpenAIRequest>;

  if (provider === "claude") {
    req = buildClaudeRequest(model, systemPrompt, userPrompt);
  } else {
    // Load custom endpoint from settings if needed
    let endpoint = PROVIDER_ENDPOINTS[provider];
    if (!endpoint) {
      // Check app_settings for custom endpoint
      const { data: customEp } = await sb
        .from("app_settings")
        .select("value")
        .eq("key", `ai_endpoint_${provider}`)
        .maybeSingle();
      endpoint = customEp?.value || PROVIDER_ENDPOINTS.openai; // default to openai-compatible
    }
    req = buildOpenAIRequest(endpoint, model, systemPrompt, userPrompt);
  }

  const response = await fetch(req.url, {
    method: "POST",
    headers: req.headers(apiKey),
    body: JSON.stringify(req.body),
  });

  if (!response.ok) {
    if (rotatedKeyId) await markKeyUsed(sb, rotatedKeyId, `HTTP ${response.status}`);
    if (response.status === 429) throw new Error("RATE_LIMIT");
    if (response.status === 402) throw new Error("PAYMENT_REQUIRED");
    const errText = await response.text();
    console.error(`AI ${provider}/${model} error:`, response.status, errText);
    throw new Error(`AI provider error (${response.status})`);
  }

  if (rotatedKeyId) await markKeyUsed(sb, rotatedKeyId);

  const data = await response.json();
  const content = req.parseResponse(data);
  return { content, model, provider };
}

// ===== Load enrichment context =====
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
    const { messages, ticket_subject, channel, mode: requestMode, action } = body;

    const INTERNAL_SECRET = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    const isInternalCall = !!INTERNAL_SECRET && req.headers.get("x-internal-secret") === INTERNAL_SECRET;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // === Transcribe voice action ===
    if (action === "transcribe") {
      const { audio_url } = body;
      if (!audio_url) return json({ error: "audio_url required" }, 400);

      if (!isInternalCall) {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
        const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
        const { data: { user } } = await callerClient.auth.getUser();
        if (!user) return json({ error: 'Unauthorized' }, 401);
        const { data: hasAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        const { data: hasMod } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'moderator' });
        if (!hasAdmin && !hasMod) return json({ error: 'Forbidden' }, 403);
      }

      // Download audio
      const audioResp = await fetch(audio_url);
      if (!audioResp.ok) return json({ error: "Failed to fetch audio" }, 400);
      const audioBlob = await audioResp.blob();

      // Try to use a key from DB for transcription
      const transcribeKey = await getRotatedKey(supabase);
      
      let transcript = "";

      if (transcribeKey && transcribeKey.provider === "openai") {
        // Use OpenAI Whisper
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.ogg");
        formData.append("model", "whisper-1");
        
        const whisperResp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${transcribeKey.api_key}` },
          body: formData,
        });

        if (whisperResp.ok) {
          const result = await whisperResp.json();
          transcript = result.text || "";
          await markKeyUsed(supabase, transcribeKey.id);
        } else {
          await markKeyUsed(supabase, transcribeKey.id, `Whisper HTTP ${whisperResp.status}`);
        }
      }
      
      if (!transcript) {
        // Fallback: use Gemini with audio via base64
        const geminiKey = await getRotatedKey(supabase, "gemini");
        if (geminiKey) {
          const arrayBuf = await audioBlob.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuf);
          let binary = "";
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const base64Audio = btoa(binary);
          const mimeType = audioBlob.type || "audio/ogg";

          const geminiResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiKey.model}:generateContent?key=${geminiKey.api_key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { inlineData: { mimeType, data: base64Audio } },
                    { text: "Расшифруй это голосовое сообщение. Верни ТОЛЬКО текст расшифровки, без комментариев." }
                  ]
                }]
              }),
            }
          );

          if (geminiResp.ok) {
            const result = await geminiResp.json();
            transcript = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
            await markKeyUsed(supabase, geminiKey.id);
          } else {
            await markKeyUsed(supabase, geminiKey.id, `Gemini transcribe HTTP ${geminiResp.status}`);
          }
        }
      }

      if (!transcript) {
        // Last fallback: Lovable AI
        const lovableKey = Deno.env.get("LOVABLE_API_KEY");
        if (lovableKey) {
          const result = await callAI({
            systemPrompt: "Пользователь отправил голосовое сообщение. К сожалению, аудио недоступно напрямую. Сообщи что расшифровка невозможна без прямого аудио-ввода.",
            userPrompt: "Расшифруй голосовое сообщение",
            supabase,
          });
          return json({ transcript: "⚠️ Для расшифровки голосовых добавьте ключ OpenAI (Whisper) или Gemini в разделе API ключей.", provider: "none" });
        }
        return json({ error: "Нет доступных ключей для расшифровки. Добавьте ключ OpenAI или Gemini." }, 400);
      }

      return json({ transcript, provider: transcribeKey?.provider || "gemini" });
    }

    // === Standard suggest flow ===
    if (!isInternalCall) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
      const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await callerClient.auth.getUser();
      if (!user) return json({ error: 'Unauthorized' }, 401);
      const { data: hasAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      const { data: hasMod } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'moderator' });
      if (!hasAdmin && !hasMod) return json({ error: 'Forbidden' }, 403);
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
        "support_ai_system_prompt", "support_ai_auto_confidence",
        "support_ai_use_faq", "support_ai_use_templates",
      ]);

    const s: Record<string, string> = {};
    (settingsData || []).forEach((r: any) => { s[r.key] = r.value; });

    if (s.support_ai_enabled !== "true") {
      return json({ error: "AI suggestions are disabled" }, 403);
    }

    const preferredProvider = s.support_ai_provider || undefined;
    const aiMode = requestMode || s.support_ai_mode || "suggest";
    const confidenceThreshold = parseFloat(s.support_ai_auto_confidence || "0.8");
    const useFaq = s.support_ai_use_faq === "true";
    const useTemplates = s.support_ai_use_templates === "true";

    const contextKB = await loadContext(supabase, useFaq, useTemplates);

    const baseSystemPrompt = s.support_ai_system_prompt ||
      "Ты — помощник оператора поддержки. Предложи 2-3 варианта ответа клиенту.";

    const systemPrompt = contextKB
      ? `${baseSystemPrompt}\n\nИспользуй следующую базу знаний:\n\n${contextKB}`
      : baseSystemPrompt;

    const contextInfo = [
      ticket_subject ? `Тема тикета: ${ticket_subject}` : "",
      channel ? `Канал: ${channel}` : "",
    ].filter(Boolean).join("\n");

    const conversationHistory = messages.map((m: any) =>
      `${m.is_admin ? "Оператор" : "Клиент"}: ${m.message}`
    ).join("\n");

    let userPrompt: string;
    if (aiMode === "auto") {
      userPrompt = `${contextInfo ? contextInfo + "\n\n" : ""}История переписки:\n${conversationHistory}\n\nПроанализируй последнее сообщение клиента. Если ты уверен в ответе на ${Math.round(confidenceThreshold * 100)}% и выше — предложи ОДИН лучший ответ и укажи уровень уверенности.\n\nФормат:\nУВЕРЕННОСТЬ: [0.0-1.0]\nОТВЕТ: [текст]`;
    } else {
      userPrompt = `${contextInfo ? contextInfo + "\n\n" : ""}История переписки:\n${conversationHistory}\n\nПредложи 2-3 варианта ответа. Нумеруй (1. 2. 3.). Разные по тону: формальный, дружелюбный, лаконичный.`;
    }

    const result = await callAI({
      systemPrompt,
      userPrompt,
      supabase,
      preferredProvider: preferredProvider === "lovable" ? undefined : preferredProvider,
    });

    if (aiMode === "auto") {
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
        provider: result.provider,
      });
    }

    const suggestions = result.content
      .split(/\n/)
      .map((line: string) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line: string) => line.length > 10);

    return json({
      mode: "suggest",
      suggestions,
      raw: result.content,
      model: result.model,
      provider: result.provider,
    });
  } catch (error) {
    console.error("AI suggest error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "RATE_LIMIT") return json({ error: "Слишком много запросов. Подождите." }, 429);
    if (msg === "PAYMENT_REQUIRED") return json({ error: "Недостаточно средств для AI-запросов." }, 402);
    return json({ error: msg }, 500);
  }
});
