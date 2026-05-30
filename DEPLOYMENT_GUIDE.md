# Safai Market — Deployment Guide

## Architecture Overview

| Layer | Tech | Notes |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind | SPA, served as static files |
| Backend | Express 5 + Node.js | REST API, port 3001 |
| Database | PostgreSQL + Drizzle ORM | Replit-managed Postgres |
| Auth | Supabase (JWT) | Email + Phone OTP login |
| Monorepo | pnpm workspaces | Shared lib/db, lib/api-spec |

---

## Replit Deployment (Recommended)

This app is built to deploy on Replit. Use the Deploy button in the Replit workspace.

### Prerequisites

All environment variables must be set before deploying:

```env
DATABASE_URL=postgresql://...          # Auto-provisioned by Replit
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

### Deploy Steps

1. Open the Replit workspace
2. Click **Deploy** in the top bar
3. Select **Reserved VM** (required for persistent Express server)
4. Set environment variables in the Secrets panel
5. Click **Deploy**

The app will be live at `https://your-repl-name.replit.app`

---

## Netlify Deployment (Frontend Only)

> **Note:** Netlify does not support persistent Node.js servers. To deploy on Netlify, the Express API must be rewritten as Netlify Functions (serverless). This is a significant refactor. Replit deployment is strongly recommended.

### If deploying frontend-only to Netlify (with API hosted elsewhere):

#### Build Settings

| Setting | Value |
|---|---|
| Base directory | `artifacts/safai-market` |
| Build command | `pnpm install && pnpm run build` |
| Publish directory | `artifacts/safai-market/dist` |
| Node version | 20 |

#### netlify.toml (place at repo root)

```toml
[build]
  base = "artifacts/safai-market"
  command = "pnpm install && pnpm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  PNPM_VERSION = "10"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### Environment Variables (Netlify Dashboard)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_API_BASE_URL=https://your-api-server.com
```

---

## Database Setup

### First-time Setup

```bash
# Push schema to database
pnpm --filter @workspace/db run push

# Seed demo data (optional)
pnpm dlx tsx artifacts/api-server/src/scripts/seed-demo.ts
```

### Schema Tables

| Table | Purpose |
|---|---|
| products | Product catalog (shop_id scoped) |
| categories | Product categories (global + shop-specific) |
| customers | Customer list with udhaar balance |
| udhaar_ledger | Debit/credit entries per customer |
| suppliers | Vendor list |
| bills | Bill headers (shop_id scoped) |
| bill_items | Line items per bill |
| stock_movements | Full stock audit trail |
| purchases | Purchase records |
| expenses | Daily expenses |
| daily_closings | End-of-day register |
| activity_log | Dashboard event feed |
| bundles / bundle_items | Combo packs |
| shops | Multi-shop registry |

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API**
3. Copy **Project URL** and **anon/public key**
4. Set all 4 environment variables (with and without `VITE_` prefix)
5. Enable **Email** and **Phone** auth providers in Authentication → Providers

---

## PWA Installation

The app ships with a `manifest.json` and full PWA meta tags. Users can install it from their browser:

- **Android Chrome:** "Add to Home Screen" banner appears automatically
- **iOS Safari:** Share → "Add to Home Screen"
- **Desktop Chrome:** Install icon in address bar

---

## Domain Setup (Replit)

1. Go to **Deployments** in Replit
2. Click **Custom Domain**
3. Add your domain (e.g., `app.safaimarket.com`)
4. Add the CNAME record to your DNS provider:
   ```
   CNAME app your-repl.replit.app
   ```
5. SSL is provisioned automatically by Replit

---

## Troubleshooting

| Issue | Solution |
|---|---|
| API 502 / not responding | Restart the API Server workflow |
| Login not working | Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set |
| Database error | Run `pnpm --filter @workspace/db run push` |
| Camera scanner not working | Site must be served over HTTPS (camera requires secure context) |
| WhatsApp share opens app | Use `https://wa.me/?text=` (not `whatsapp://`) for cross-platform |
