# Safai Market — Project Handover Document

## Project Summary

**Safai Market** is a multi-shop inventory and billing PWA for small Indian retail businesses. It provides POS billing, stock management, customer udhaar (credit) tracking, supplier management, purchase recording, expense tracking, and profit reporting. The UI is mobile-first, designed to feel like WhatsApp/PhonePe/Blinkit.

---

## Architecture

### Monorepo Structure

```
workspace/
├── lib/
│   ├── db/                    ← Drizzle ORM schema + Postgres client
│   │   ├── src/schema/        ← Table definitions (one file per table)
│   │   └── drizzle.config.ts  ← Schema migration config
│   ├── api-spec/              ← OpenAPI YAML (source of truth for API)
│   ├── api-client-react/      ← Generated React Query hooks (orval codegen)
│   └── api-zod/               ← Generated Zod validators (orval codegen)
├── artifacts/
│   ├── api-server/            ← Express 5 REST API (Node.js 20)
│   │   ├── src/routes/        ← One file per resource
│   │   ├── src/middleware/    ← auth.ts (Supabase JWT validation)
│   │   └── src/scripts/       ← seed-demo.ts
│   └── safai-market/          ← React 18 + Vite frontend
│       ├── src/pages/         ← Route-level components
│       ├── src/components/    ← Shared UI components
│       ├── src/stores/        ← Zustand stores (cart, auth, settings)
│       ├── src/lib/           ← Utilities (receipt, supabase, format, profit)
│       └── src/hooks/         ← Custom hooks
└── scripts/                   ← Workspace-level scripts
```

### Key Design Decisions

| Decision | Why |
|---|---|
| Contract-first API | OpenAPI YAML → orval generates hooks + validators. Never hand-write API calls. |
| Drizzle ORM | Type-safe SQL with PostgreSQL, no magic, easy migrations |
| Zustand for cart | Cart must survive page refresh (localStorage persist) |
| optionalAuth middleware | App works in demo mode (no login) and in multi-shop mode |
| shop_id nullable | Backward compat — existing rows have NULL shop_id (demo data) |
| Lazy barcode scanner | ZXing is 100KB+, only loads when camera button is tapped |
| IST timezone for dashboard | Indian shops bill all day, UTC midnight would split "today" at 5:30 AM IST |

---

## Database Schema

### Core Tables

| Table | Key Columns | Notes |
|---|---|---|
| `shops` | id, owner_id (Supabase UID), name, address | One per Supabase user (after onboarding) |
| `products` | id, shop_id, name, sku_code, barcode, buy_price, sell_price, current_stock | shop_id = NULL means demo/global |
| `categories` | id, shop_id, name, subcategories[] | NULL shop_id = global category visible to all |
| `customers` | id, shop_id, name, phone, udhaar_balance | |
| `udhaar_ledger` | id, customer_id, entry_type, amount, balance_after | Debit = udhaar given, Credit = payment received |
| `suppliers` | id, name, phone, pending_amount | |
| `bills` | id, shop_id, bill_number, customer_id, total_amount, cash_amount, upi_amount, udhaar_amount, estimated_profit | |
| `bill_items` | id, bill_id, product_id, quantity, unit_price, buy_price_snapshot, profit_amount | Snapshot prices at time of sale |
| `stock_movements` | id, product_id, movement_type, quantity, stock_before, stock_after | Full audit trail |
| `purchases` | id, product_id, supplier_id, quantity, cost_price | |
| `expenses` | id, category, amount, description | |
| `daily_closings` | id, date, total_sales, cash, upi, udhaar, expenses, net_profit | |
| `activity_log` | id, event_type, description, amount | Dashboard feed |
| `bundles` / `bundle_items` | Bundle products with fixed sell price | |

### Adding shop_id to a New Table

1. Add `shopId: integer("shop_id")` to the table schema in `lib/db/src/schema/`
2. Run: `pnpm --filter @workspace/db run push`
3. Add `optionalAuth` middleware to the route
4. Filter: `req.shopId ? eq(table.shopId, req.shopId) : isNull(table.shopId)`
5. On create: stamp `shopId: req.shopId ?? null`

---

## API Codegen Workflow

When the OpenAPI spec changes, regenerate client code:

```bash
pnpm --filter @workspace/api-client-react run generate
pnpm --filter @workspace/api-zod run generate
```

**Never hand-write API calls.** Always add new endpoints to `lib/api-spec/openapi.yaml` first, then regenerate.

---

## Auth Flow

```
User opens app
    ↓
AuthProvider (listens to Supabase session)
    ↓ session found?
    YES → AuthGuard allows through
    NO  → redirect to /auth/login
         ↓
         Login / Register with Supabase
         ↓
         Session established
         ↓
         AuthGuard checks: has shop?
         NO → redirect to /auth/onboarding
         YES → allow through to app
```

### API Auth

- `optionalAuth`: Validates Bearer JWT if present, sets `req.userId` + `req.shopId`
- `requireAuth`: Returns 401 if no valid JWT (used for shop management routes)
- All data routes use `optionalAuth` so demo mode works without login

---

## Key Files

| File | Purpose |
|---|---|
| `lib/api-spec/openapi.yaml` | Source of truth for all API endpoints |
| `lib/db/src/schema/` | Drizzle table definitions |
| `artifacts/api-server/src/middleware/auth.ts` | Supabase JWT validation + shop lookup |
| `artifacts/api-server/src/routes/bills.ts` | Bill creation (DB transaction, stock, udhaar) |
| `artifacts/safai-market/src/stores/cart.ts` | Cart state (Zustand + localStorage) |
| `artifacts/safai-market/src/stores/auth.ts` | Auth state (Supabase session) |
| `artifacts/safai-market/src/lib/supabase.ts` | Lazy getSupabase() pattern |
| `artifacts/safai-market/src/lib/receipt.ts` | 58mm thermal receipt HTML generator |
| `artifacts/safai-market/src/pages/billing/index.tsx` | Main billing/POS screen |
| `artifacts/safai-market/src/components/barcode-scanner-modal.tsx` | Camera barcode scanner (ZXing) |

---

## Environment Variables

| Variable | Required Where | Purpose |
|---|---|---|
| `DATABASE_URL` | API server | Postgres connection string |
| `SUPABASE_URL` | API server | JWT validation + shops table lookup |
| `SUPABASE_ANON_KEY` | API server | Supabase client |
| `VITE_SUPABASE_URL` | Frontend | Supabase auth client |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase auth client |

---

## Planned Future Work

### Phase F1 — Multi-Branch
- `branches` table (shop_id, name, address, manager)
- Stock tracked per branch (branch_id on stock_movements)
- Bills stamped with branch_id
- Reports filterable by branch

### Phase F7 — Unknown Barcode Workflow
- Barcode not found → modal: Create Product / Assign to Existing / Cancel

### Phase F8 — GST
- Toggle in Store Settings
- CGST / SGST on receipts when enabled

### Phase F9 — Sales Returns
- Find bill → select items → return qty → process (stock restored, ledger credited)

### Phase P5 — Offline Support
- Service worker + IndexedDB
- Sync queue for offline bill creation
- Critical for low-connectivity shop environments

---

## Known Limitations

| Issue | Status |
|---|---|
| No desktop layout | Mobile-only. Stretched on 1024px+ screens |
| No offline support | Requires internet for all operations |
| No RLS policies | Supabase RLS not configured (DB is Replit Postgres, not Supabase Postgres) |
| No GST | Simple billing only |
| No barcode label printing | Manual barcode entry only |
| Frequently Sold Together | Uses same-category heuristic, not co-purchase data |
