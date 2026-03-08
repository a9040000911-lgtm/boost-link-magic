import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const app = new Hono();

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const mcpAdminKey = Deno.env.get("MCP_ADMIN_KEY")!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function logAudit(action: string, targetType: string, targetId?: string, details?: Record<string, unknown>) {
  const sb = getSupabase();
  await sb.from("admin_audit_logs").insert({
    actor_id: "00000000-0000-0000-0000-000000000000",
    action,
    target_type: targetType,
    target_id: targetId || null,
    details: { ...details, source: "mcp-agent" },
  });
}

const mcpServer = new McpServer({
  name: "admin-mcp-server",
  version: "1.0.0",
});

// ── Tool 1: get_metrics ──
mcpServer.tool({
  name: "get_metrics",
  description: "Get revenue, order count, user count for a date range. Defaults to last 30 days.",
  inputSchema: {
    type: "object",
    properties: {
      from: { type: "string", description: "ISO date start (optional)" },
      to: { type: "string", description: "ISO date end (optional)" },
    },
  },
  handler: async ({ from, to }: { from?: string; to?: string }) => {
    const sb = getSupabase();
    const dateFrom = from || new Date(Date.now() - 30 * 86400000).toISOString();
    const dateTo = to || new Date().toISOString();

    const [ordersRes, usersRes, transRes] = await Promise.all([
      sb.from("orders").select("id, price, status, created_at").gte("created_at", dateFrom).lte("created_at", dateTo),
      sb.from("profiles").select("id, created_at").gte("created_at", dateFrom).lte("created_at", dateTo),
      sb.from("transactions").select("amount, type, status").gte("created_at", dateFrom).lte("created_at", dateTo),
    ]);

    const orders = ordersRes.data || [];
    const revenue = orders.filter(o => o.status !== "canceled").reduce((s, o) => s + Number(o.price), 0);
    const deposits = (transRes.data || []).filter(t => t.type === "deposit" && t.status === "completed").reduce((s, t) => s + Number(t.amount), 0);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          period: { from: dateFrom, to: dateTo },
          total_orders: orders.length,
          completed_orders: orders.filter(o => o.status === "completed").length,
          canceled_orders: orders.filter(o => o.status === "canceled").length,
          revenue: Math.round(revenue * 100) / 100,
          deposits: Math.round(deposits * 100) / 100,
          new_users: (usersRes.data || []).length,
        }, null, 2),
      }],
    };
  },
});

// ── Tool 2: list_orders ──
mcpServer.tool({
  name: "list_orders",
  description: "List recent orders with optional status filter. Max 50.",
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string", description: "Filter by status: pending, processing, completed, canceled" },
      limit: { type: "number", description: "Number of orders (default 20, max 50)" },
    },
  },
  handler: async ({ status, limit }: { status?: string; limit?: number }) => {
    const sb = getSupabase();
    let q = sb.from("orders").select("id, service_name, link, quantity, price, status, platform, created_at").order("created_at", { ascending: false }).limit(Math.min(limit || 20, 50));
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    return { content: [{ type: "text", text: JSON.stringify({ orders: data || [], error: error?.message }, null, 2) }] };
  },
});

// ── Tool 3: get_settings ──
mcpServer.tool({
  name: "get_settings",
  description: "Read all app_settings or a specific key.",
  inputSchema: {
    type: "object",
    properties: {
      key: { type: "string", description: "Specific setting key (optional, returns all if omitted)" },
    },
  },
  handler: async ({ key }: { key?: string }) => {
    const sb = getSupabase();
    let q = sb.from("app_settings").select("key, value, updated_at");
    if (key) q = q.eq("key", key);
    const { data, error } = await q;
    return { content: [{ type: "text", text: JSON.stringify({ settings: data || [], error: error?.message }, null, 2) }] };
  },
});

// ── Tool 4: update_setting ──
mcpServer.tool({
  name: "update_setting",
  description: "Update a single app_setting value. Logged to audit.",
  inputSchema: {
    type: "object",
    properties: {
      key: { type: "string", description: "Setting key" },
      value: { type: "string", description: "New value" },
    },
    required: ["key", "value"],
  },
  handler: async ({ key, value }: { key: string; value: string }) => {
    const sb = getSupabase();
    const { error } = await sb.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() });
    if (!error) await logAudit("update_setting", "app_settings", key, { value });
    return { content: [{ type: "text", text: JSON.stringify({ success: !error, error: error?.message }) }] };
  },
});

// ── Tool 5: get_providers_status ──
mcpServer.tool({
  name: "get_providers_status",
  description: "Get status and health of all configured providers.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const sb = getSupabase();
    const { data } = await sb.from("providers").select("key, label, is_enabled, health_status, health_latency_ms, balance, balance_currency, services_count, last_health_check");
    return { content: [{ type: "text", text: JSON.stringify({ providers: data || [] }, null, 2) }] };
  },
});

// ── Tool 6: list_tickets ──
mcpServer.tool({
  name: "list_tickets",
  description: "List support tickets with optional status filter.",
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string", description: "open, waiting, closed (default: open)" },
      limit: { type: "number", description: "Max results (default 20, max 50)" },
    },
  },
  handler: async ({ status, limit }: { status?: string; limit?: number }) => {
    const sb = getSupabase();
    let q = sb.from("support_tickets").select("id, subject, status, priority, channel, created_at, updated_at").order("created_at", { ascending: false }).limit(Math.min(limit || 20, 50));
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    return { content: [{ type: "text", text: JSON.stringify({ tickets: data || [], error: error?.message }, null, 2) }] };
  },
});

// ── Tool 7: get_audit_log ──
mcpServer.tool({
  name: "get_audit_log",
  description: "Get recent admin audit log entries.",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Number of entries (default 30, max 100)" },
      action: { type: "string", description: "Filter by action type" },
    },
  },
  handler: async ({ limit, action }: { limit?: number; action?: string }) => {
    const sb = getSupabase();
    let q = sb.from("admin_audit_logs").select("id, action, target_type, target_id, details, created_at, actor_id").order("created_at", { ascending: false }).limit(Math.min(limit || 30, 100));
    if (action) q = q.eq("action", action);
    const { data, error } = await q;
    return { content: [{ type: "text", text: JSON.stringify({ logs: data || [], error: error?.message }, null, 2) }] };
  },
});

// ── Tool 8: run_diagnostics ──
mcpServer.tool({
  name: "run_diagnostics",
  description: "Run a system health check: exchange rates freshness, provider health, pending orders count, open tickets count.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const sb = getSupabase();

    const [ratesRes, providersRes, pendingRes, ticketsRes] = await Promise.all([
      sb.from("exchange_rates").select("base_currency, target_currency, rate, fetched_at").order("fetched_at", { ascending: false }).limit(5),
      sb.from("providers").select("key, label, is_enabled, health_status, last_health_check"),
      sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);

    const rates = ratesRes.data || [];
    const ratesFresh = rates.length > 0 && (Date.now() - new Date(rates[0].fetched_at).getTime()) < 24 * 3600 * 1000;

    const providers = providersRes.data || [];
    const unhealthy = providers.filter(p => p.is_enabled && p.health_status !== "ok");

    const diagnostics = {
      exchange_rates: { fresh: ratesFresh, latest: rates.slice(0, 2) },
      providers: {
        total: providers.length,
        enabled: providers.filter(p => p.is_enabled).length,
        unhealthy: unhealthy.map(p => ({ key: p.key, status: p.health_status })),
      },
      pending_orders: pendingRes.count || 0,
      open_tickets: ticketsRes.count || 0,
      timestamp: new Date().toISOString(),
      status: unhealthy.length === 0 && ratesFresh ? "healthy" : "warning",
    };

    return { content: [{ type: "text", text: JSON.stringify(diagnostics, null, 2) }] };
  },
});

// ── Auth middleware ──
app.use("/*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return c.newResponse(null, 204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type, accept",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    });
  }

  const auth = c.req.header("Authorization");
  if (!auth || auth !== `Bearer ${mcpAdminKey}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});

// ── MCP transport ──
const transport = new StreamableHttpTransport();

app.all("/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcpServer);
});

Deno.serve(app.fetch);
