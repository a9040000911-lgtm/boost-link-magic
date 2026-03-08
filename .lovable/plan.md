

## Plan: Contact info and working hours on public page + admin editing

### What changes

1. **Add 3 new settings to `SETTINGS_META` in `AdminSettingsPage.tsx`** under a new group "contacts":
   - `contact_email` (text) — публичный email для связи
   - `contact_work_hours` (text) — часы работы, default "9:00 — 21:00 МСК"
   - `contact_work_days` (text) — рабочие дни, default "Пн — Вс"
   
   Add the group to `GROUPS` array with a Mail icon.

2. **Update `Contact.tsx`** — fetch `contact_email`, `contact_work_hours`, `contact_work_days` from `app_settings` and display them above the form:
   - Email с иконкой (кликабельный mailto:)
   - Часы работы с иконкой Clock

3. **Update `Footer.tsx`** — fetch `contact_email` from `app_settings` and use it instead of hardcoded `support@smmpanel.ru`. Also show working hours line.

4. **Update `GuestContactForm.tsx`** — add a note under the form showing working hours (passed as prop from Contact page).

### Technical notes
- `app_settings` already has public SELECT RLS, so no migration needed.
- Settings are fetched once on mount via `supabase.from("app_settings").select("key, value").in("key", [...])`.
- Fallback values used when settings are empty (email: `support@smmpanel.ru`, hours: `9:00 — 21:00 МСК`).

