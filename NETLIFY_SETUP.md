# Safai Market — Netlify Setup Guide

> **Important:** Netlify is a static hosting platform. It does not support persistent Node.js servers.
> Safai Market has an Express 5 REST API that requires a persistent server process.
>
> **Option A (Recommended):** Deploy on Replit — supports the full stack natively.
> **Option B:** Deploy frontend on Netlify + API on a separate server (Railway, Render, Fly.io, etc.)

---

## Option A — Full Stack on Replit

No extra configuration needed. Use the Deploy button in the Replit workspace.

---

## Option B — Netlify (Frontend) + Separate API Host

### Step 1 — Deploy the API

Deploy `artifacts/api-server` on any Node.js-compatible host:

**Railway (easiest):**
1. Create new project on [railway.app](https://railway.app)
2. Connect GitHub repo
3. Set root directory: `artifacts/api-server`
4. Set start command: `pnpm run dev` or `pnpm run start`
5. Add environment variables:
   ```env
   DATABASE_URL=postgresql://...
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_...
   PORT=3001
   ```

**Render:**
1. New Web Service → connect repo
2. Build command: `pnpm install && pnpm run build`
3. Start command: `node ./dist/index.mjs`
4. Root directory: `artifacts/api-server`

---

### Step 2 — Update Frontend API URL

Update `artifacts/safai-market/vite.config.ts` to point to your deployed API:

```typescript
// For production build, use VITE_API_BASE_URL env var
// In development, proxy /api to localhost:3001
```

Or add to `.env.production` in `artifacts/safai-market/`:
```env
VITE_API_BASE_URL=https://your-api.railway.app
```

Then update all API calls to use `${import.meta.env.VITE_API_BASE_URL}/api/...`

---

### Step 3 — Deploy Frontend to Netlify

#### netlify.toml (place at repo root)

```toml
[build]
  base = "artifacts/safai-market"
  command = "cd ../.. && pnpm install && cd artifacts/safai-market && pnpm run build"
  publish = "artifacts/safai-market/dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Content-Type = "application/manifest+json"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

#### Netlify Environment Variables

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_API_BASE_URL=https://your-api.railway.app
NODE_VERSION=20
```

---

### Step 4 — Configure Netlify Deploy Settings

In Netlify Dashboard:

| Setting | Value |
|---|---|
| Repository | Your GitHub repo URL |
| Branch to deploy | `main` |
| Base directory | `artifacts/safai-market` |
| Build command | `pnpm run build` |
| Publish directory | `dist` |
| Node version | 20 (set via env var `NODE_VERSION=20`) |

---

## SPA Routing

The `[[redirects]]` rule in netlify.toml handles client-side routing:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This ensures that navigating directly to `/billing` or `/products` doesn't return a 404.

---

## PWA on Netlify

The app ships PWA-ready:

- ✅ `public/manifest.json` with name, icons, theme color
- ✅ Apple mobile web app meta tags
- ✅ `theme-color` meta tag
- ✅ Installable from Chrome/Safari

**For full PWA offline support** (not yet implemented), you'll need to add a service worker. Recommended: `vite-plugin-pwa`.

```bash
pnpm --filter @workspace/safai-market add -D vite-plugin-pwa
```

---

## CORS Configuration

If deploying frontend and API on different domains, update `artifacts/api-server/src/app.ts` to allow your Netlify domain:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-site.netlify.app',
    'https://your-custom-domain.com',
  ],
  credentials: true,
}));
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| API calls return 404 | Check `VITE_API_BASE_URL` is set correctly |
| CORS error | Add Netlify domain to CORS allowlist in API server |
| Page refresh gives 404 | Ensure the `[[redirects]]` rule is in netlify.toml |
| Camera scanner broken | Netlify auto-provides HTTPS. Camera requires secure context. |
| Auth redirect loop | Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set |
| Build fails | Check `pnpm-lock.yaml` is committed and Node version is 20 |
