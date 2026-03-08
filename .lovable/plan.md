

## Problem

Currently: user selects a service card → order form appears **below** the grid → user must scroll down to see it. This violates the no-scroll principle.

Additionally, there's no way to compare tariffs side-by-side.

## Plan

### 1. Inline order form (no scroll)

Replace the current layout: instead of cards grid + separate order form below, use a **split layout**:

- **Left panel**: service list as compact rows/table (not big cards) — showing name, price, requirements, "popular" badge
- **Right panel (sticky)**: order form for the selected service — always visible, no scrolling needed

This way, when the user clicks a service row on the left, the right panel instantly shows the form. No scrolling required.

### 2. Tariff comparison

Add a **"Сравнить тарифы"** toggle button above the service list. When enabled:

- Show a compact comparison table with columns: Name, Price/1pc, Min, Max, Description
- Highlight the cheapest (popular) row with the platform accent color
- Selected row gets a border highlight
- Clicking a row selects it and populates the order form on the right

### Technical changes

**File: `src/pages/Catalog.tsx`**

- Restructure the right content area (`flex-1`) into a two-column layout:
  - Left column (~60%): service list (compact rows or comparison table)
  - Right column (~40%, `sticky top-6`): order form with link, email, quantity, consents, submit button
- Add `compareMode` state toggle
- In default mode: show service cards as smaller clickable rows
- In compare mode: show a table with all services side-by-side
- Remove the separate order form section below the grid
- Ensure everything fits within viewport height by using `max-h-[calc(100vh-...)]` with `overflow-y-auto` on the service list only (vertical scroll for long lists is acceptable — the form stays fixed)

### Layout sketch

```text
┌─────────────────────────────────────────────────┐
│  [Platform icons row]                           │
├──────────┬──────────────────────┬───────────────┤
│ Category │  Service rows/table  │  Order Form   │
│ sidebar  │  (scrollable)        │  (sticky)     │
│          │  [Compare toggle]    │  Link input   │
│          │  ┌─────────────────┐ │  Email input  │
│          │  │ Service 1  ₽0.5 │ │  Quantity     │
│          │  │ Service 2  ₽0.3 │ │  [Order btn]  │
│          │  │ Service 3  ₽0.8 │ │  Consents     │
│          │  └─────────────────┘ │               │
└──────────┴──────────────────────┴───────────────┘
```

