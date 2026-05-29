---
name: Supabase Node.js 20 WebSocket fix
description: Node.js 20 has no native WebSocket; @supabase/realtime-js crashes without a polyfill
---

## Rule
Always polyfill `globalThis.WebSocket` before calling `createClient` in any Node.js ≤ 21 server environment.

```typescript
import WebSocket from 'ws';
if (!globalThis.WebSocket) {
  (globalThis as any).WebSocket = WebSocket;
}
```

Also install `ws` package: `pnpm --filter @workspace/api-server add ws`

**Why:** `@supabase/realtime-js` calls `new WebSocket(...)` at module load time via `RealtimeClient._initializeOptions`. Node.js 20 doesn't have `WebSocket` in global scope, causing an immediate `Error: Node.js 20 detected without native WebSocket support` crash before the server starts.

**How to apply:** Add the polyfill at the very top of any server file that imports from `@supabase/supabase-js`, before the import executes (put it in the first lines of auth middleware or a setup file that's imported early).
