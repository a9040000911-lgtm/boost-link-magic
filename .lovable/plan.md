

## Plan: Mobile Catalog Fix + Admin Service Speed/Guarantee Fields

### 1. Mobile Catalog — Single Column Cards + Bottom Form

**Current state**: Cards grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (line 636) — already single column on mobile. The mobile sticky form exists at the bottom (lines 860-943) with `bottom-14`.

**Issue to verify**: The mobile form and cards look correct in code. The main content area needs bottom padding so cards don't get hidden behind the sticky form. Line 569 already has `pb-2 md:pb-0` — this needs more padding when a service is selected on mobile (the form is ~180px tall).

**Changes in `src/pages/Catalog.tsx`**:
- Add dynamic bottom padding to the scrollable service list when a service is selected on mobile: change `pb-2` to `pb-48` (or similar) when `selectedService` exists, so the last cards aren't hidden behind the sticky bottom form.
- The grid is already 1 column on mobile — no change needed there.

### 2. Admin Services — Add Speed & Guarantee Fields

**Current state**: The `Service` interface (line 40-50) and `editForm` state (line 84) do NOT include `speed`, `guarantee`, or `warning_text` fields. The DB `services` table has these columns.

**Changes in `src/pages/admin/AdminServices.tsx`**:

1. **Update `Service` interface** (line 40): Add `speed`, `guarantee`, `warning_text` fields.

2. **Update `editForm` state** (line 84): Add `speed`, `guarantee`, `warning_text` to the state object.

3. **Update `openEditDialog`** (line 244): Populate `speed`, `guarantee`, `warning_text` from service data.

4. **Update `saveEditService`** (line 172): Diff and save `speed`, `guarantee`, `warning_text`.

5. **Update `newService` state** (line 77): Add `speed: "medium"`, `guarantee: "none"`, `warning_text: ""` defaults.

6. **Update `createService` function**: Include `speed`, `guarantee`, `warning_text` in the insert.

7. **Update Edit Dialog UI** (after line 583): Add:
   - Speed `<Select>` with options: instant, fast, medium, slow, gradual
   - Guarantee `<Select>` with options: none, 7d, 30d, 60d, lifetime
   - Warning text `<Textarea>` for critical requirements

8. **Update Create Dialog UI** (around line 408): Add same speed/guarantee selects.

### Files to Edit

| File | Change |
|------|--------|
| `src/pages/Catalog.tsx` | Add dynamic bottom padding for mobile when service selected |
| `src/pages/admin/AdminServices.tsx` | Add speed, guarantee, warning_text to Service interface, editForm, create form, save logic, and UI |

