

## Plan: YooKassa Test/Production Mode + Security Hardening

### 1. YooKassa Test/Production Mode Toggle

**AdminPayments.tsx** -- restructure YooKassa fields to support dual credentials:

- Add fields: `yookassa_test_shop_id`, `yookassa_test_secret_key`
- Add toggle: `yookassa_test_mode` (switch between test and production)
- Visual separation: "Тестовые ключи" and "Боевые ключи" sections with clear labels
- When test mode is ON, show yellow warning banner "Используются тестовые ключи. Реальные списания не производятся."

**Edge Functions** (`create-payment/index.ts`, `yookassa-webhook/index.ts`) -- read `yookassa_test_mode` from `app_settings`:
- If test mode: use `YOOKASSA_TEST_SHOP_ID` / `YOOKASSA_TEST_SECRET_KEY` secrets
- If production: use existing `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` secrets
- Add 2 new secrets: `YOOKASSA_TEST_SHOP_ID`, `YOOKASSA_TEST_SECRET_KEY`

**app_settings RLS** -- add `yookassa_test_mode` to the keys readable by edge functions (already accessible via admin policy).

### 2. Security Fixes (Critical Findings)

The security scan found **5 issues**, including 1 critical:

#### A. CRITICAL: Users can set own balance/discount (PRIVILEGE_ESCALATION)
The `profiles` table UPDATE policy lets users modify ANY column including `balance` and `discount`.

**Fix:** Create a migration that:
1. Drops the current "Users can update own profile" policy
2. Creates a new restricted policy that only allows updating `display_name`, `avatar_url`, `bio`, `telegram_chat_id` columns using a SECURITY DEFINER function

```sql
CREATE OR REPLACE FUNCTION public.update_own_profile(
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_telegram_chat_id text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE profiles SET
    display_name = COALESCE(p_display_name, display_name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    bio = COALESCE(p_bio, bio),
    telegram_chat_id = COALESCE(p_telegram_chat_id, telegram_chat_id),
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;
```

Then restrict the UPDATE RLS policy to only allow updates on safe columns using a column-level check (or remove direct UPDATE entirely and force all updates through the RPC).

#### B. License settings publicly readable (EXPOSED_SENSITIVE_DATA)
Remove `license_%` from the public SELECT policy on `app_settings`.

#### C. RLS "always true" INSERT policies
- `guest_inquiries`: INSERT WITH CHECK (true) -- acceptable for contact form
- `unrecognized_links`: INSERT WITH CHECK (true) -- acceptable for link logging
- These are intentional for anonymous operations. Mark as acknowledged.

#### D. Leaked Password Protection Disabled
Enable leaked password protection via auth configuration.

### 3. Additional Security Hardening (2026 Best Practices)

- **Rate limiting metadata**: Add IP-based tracking to `create-payment` and `create-order` for future rate limiting
- **Webhook IP validation**: Add YooKassa webhook IP whitelist check (185.71.76.0/27, 185.71.77.0/27, 77.75.153.0/25, 77.75.156.11, 77.75.156.35)
- **CORS tightening**: Replace `Access-Control-Allow-Origin: '*'` with actual domain in `create-payment` (user-facing function)
- **Input sanitization**: Add `amount` integer validation (no decimals < 1 kopek)

### 4. End-to-End Service Test

After implementing the above, I will:
1. Call `create-payment` edge function with a test amount to verify the test/production mode switching works
2. Check webhook function logs for any errors
3. Verify RLS policies are correctly applied after migration

### Files to Create/Edit

| File | Action |
|------|--------|
| `src/pages/admin/AdminPayments.tsx` | Add test/prod mode toggle, dual key fields |
| `supabase/functions/create-payment/index.ts` | Read test mode, pick correct credentials |
| `supabase/functions/yookassa-webhook/index.ts` | Read test mode, pick correct credentials, add IP whitelist |
| New migration SQL | Fix profiles UPDATE policy, remove license_% from public settings |
| 2 new secrets | `YOOKASSA_TEST_SHOP_ID`, `YOOKASSA_TEST_SECRET_KEY` |

