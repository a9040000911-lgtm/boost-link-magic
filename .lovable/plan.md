

## MCP-сервер для подключения AI-агентов к админке

### Что делаем

Создаём Edge Function `mcp-admin`, которая реализует MCP-сервер (Model Context Protocol) через HTTP. Любой AI-агент (Antigravity, Cursor, Claude Desktop и др.) сможет подключиться к этому серверу позже и получить доступ к диагностике, аналитике и управлению настройками.

### Архитектура

```text
AI Agent (Antigravity / другой)
        │
        ▼  HTTP (MCP Streamable HTTP)
┌───────────────────────────────┐
│  Edge Function: mcp-admin     │
│  ┌─────────────────────────┐  │
│  │ Auth: API-ключ из       │  │
│  │ секрета MCP_ADMIN_KEY   │  │
│  └─────────────────────────┘  │
│  ┌─────────────────────────┐  │
│  │ Tools:                  │  │
│  │  • get_metrics          │  │
│  │  • list_orders          │  │
│  │  • get_settings         │  │
│  │  • update_setting       │  │
│  │  • get_providers_status │  │
│  │  • list_tickets         │  │
│  │  • get_audit_log        │  │
│  │  • run_diagnostics      │  │
│  └─────────────────────────┘  │
│  Audit: все действия → лог    │
└───────────────────────────────┘
        │
        ▼
    Supabase DB
```

### Что создаём

**1. Edge Function `supabase/functions/mcp-admin/index.ts`**
- Используем `mcp-lite` + `Hono` (как в документации)
- Авторизация через Bearer-токен, сверяемый с секретом `MCP_ADMIN_KEY`
- 8 инструментов (tools):

| Tool | Описание | Режим |
|------|----------|-------|
| `get_metrics` | Выручка, заказы, пользователи за период | read |
| `list_orders` | Последние заказы с фильтрами | read |
| `get_settings` | Чтение app_settings | read |
| `update_setting` | Изменение одной настройки | write |
| `get_providers_status` | Статус внешних провайдеров | read |
| `list_tickets` | Открытые тикеты поддержки | read |
| `get_audit_log` | Последние действия в аудит-логе | read |
| `run_diagnostics` | Проверка здоровья системы (rates, providers, pending orders) | read |

- Каждое write-действие логируется в `admin_audit_logs` с actor = "mcp-agent"

**2. Файл `supabase/functions/mcp-admin/deno.json`**
- Зависимость `mcp-lite@^0.10.0` и `hono`

**3. Конфигурация `supabase/config.toml`**
- `verify_jwt = false` для `mcp-admin` (авторизация через собственный API-ключ)

**4. Секрет `MCP_ADMIN_KEY`**
- Запрашиваем у пользователя через `add_secret` — произвольный ключ для доступа агента

### Как подключить потом

После деплоя агент подключается к:
```
URL: https://ozgtjafcbwlmpmrsluhy.supabase.co/functions/v1/mcp-admin
Header: Authorization: Bearer <MCP_ADMIN_KEY>
```

В настройках Antigravity (или другого агента) указывается этот URL как MCP Streamable HTTP endpoint.

