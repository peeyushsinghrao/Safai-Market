---
name: Profit system architecture (Safai Market)
description: Where profit tracking lives — DB schema, API routes, frontend utilities, seed data.
---

**DB schema additions (Phase 1):**
- `bill_items`: `buy_price_snapshot` (numeric), `profit_amount` (numeric nullable)
- `bills`: `estimated_profit` (numeric nullable)

**API routes:** `artifacts/api-server/src/routes/profit.ts` — four endpoints: `/profit/summary`, `/profit/daily`, `/profit/by-product`, `/profit/by-category`. Registered in `routes/index.ts`.

**Frontend utilities:** `artifacts/safai-market/src/lib/profit.ts` — `computeMargin`, `classifyMarginTier`, `calculateBillProfit`, `MARGIN_TIER_CONFIG`.

**Receipt printing:** `artifacts/safai-market/src/lib/receipt.ts` — `printReceipt(ReceiptData)` opens popup window with 58mm thermal receipt CSS, calls `window.print()`, then closes.

**Seed script:** `artifacts/api-server/src/scripts/seed-demo.ts` — run with `pnpm dlx tsx artifacts/api-server/src/scripts/seed-demo.ts`. Creates 7 categories, 25 products, 5 customers, 3 suppliers, 12 bills (10 days), 4 expenses.

**Why:** After running seed, the app shows real data including today's profit on dashboard, margin badges on all product cards, and a full profit report page at `/profit`.

**To regenerate API client after spec changes:** `pnpm --filter @workspace/api-spec run codegen`
