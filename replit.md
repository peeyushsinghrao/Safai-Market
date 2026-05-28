# Safai Market — Anupurna Traders

A comprehensive mobile-first store management web app for an Indian cleaning supplies shop. Covers billing/POS, products & inventory, customers & udhaar (credit), suppliers, purchase entry, stock movements, expenses, daily closing, and low stock alerts.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS + wouter + @tanstack/react-query + shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas for backend validation
- `lib/db/src/schema/` — Drizzle ORM table definitions (one file per entity)
- `artifacts/api-server/src/routes/` — Express route handlers (one file per module)
- `artifacts/safai-market/src/pages/` — Frontend page components
- `artifacts/safai-market/src/index.css` — Theme file (green primary: #16A34A)

## Architecture decisions

- Contract-first API: OpenAPI spec is the source of truth; server uses generated Zod schemas for validation, client uses generated React Query hooks.
- No hard deletes: products use `status: archived` instead of deletion.
- Mixed payment mode: bills track cash, UPI, and udhaar amounts separately.
- Udhaar ledger: every customer credit/debit is recorded in `udhaar_ledger` table with running balance.
- Activity log: all significant events (bills, payments, purchases, expenses) are recorded in `activity_log` for the dashboard recent activity feed.

## Product

- **Dashboard**: Today's sales summary, quick actions, low stock alerts, recent activity, udhaar & supplier summaries
- **Billing/POS**: Product search, cart with qty stepper, split payment (cash + UPI + udhaar), customer selector
- **Products**: Searchable list with category filters, stock indicators, product detail, stock movements history
- **Customers**: List with udhaar balances, ledger history, receive payment
- **Suppliers**: List with pending amounts, make payment
- **Purchases**: Create purchase (from supplier), update stock automatically
- **Expenses**: Log and delete daily expenses
- **Daily Closing**: Expected vs actual cash computation, close register
- **Low Stock ("What Is Finishing")**: Out-of-stock and low-stock products, quick restock
- **Stock Movements**: Full history of all stock changes

## User preferences

- Mobile-first, touch targets 48×48 minimum
- Primary color: green (#16A34A)
- No emojis in UI
- Language: Hinglish (Hindi/English) product aliases for search

## Gotchas

- After schema changes, always run `pnpm --filter @workspace/db run push`
- After OpenAPI changes, always run `pnpm --filter @workspace/api-spec run codegen`
- The `scripts` package must have `@workspace/db` as a dependency to run seed scripts
- The API routes match the paths in the OpenAPI spec exactly (including `/api/` prefix from the proxy)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
