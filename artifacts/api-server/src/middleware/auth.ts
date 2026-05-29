import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { db, shopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import WebSocket from "ws";

// Node.js 20 lacks native WebSocket — polyfill for @supabase/realtime-js
if (!globalThis.WebSocket) {
  (globalThis as any).WebSocket = WebSocket;
}

const supabaseUrl = process.env["SUPABASE_URL"] ?? "";
const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"] ?? "";

let _sb: ReturnType<typeof createClient> | null = null;
function getSb() {
  if (!_sb && supabaseUrl && supabaseAnonKey) {
    _sb = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _sb;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      shopId?: number;
    }
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();
  const token = authHeader.slice(7);
  const sb = getSb();
  if (!sb) return next();
  try {
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) return next();
    req.userId = user.id;
    const shops = await db.select().from(shopsTable).where(eq(shopsTable.ownerId, user.id)).limit(1);
    if (shops.length > 0) req.shopId = shops[0].id;
  } catch {
    // ignore — route can decide if auth is required
  }
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const token = authHeader.slice(7);
  const sb = getSb();
  if (!sb) { res.status(503).json({ error: "Auth not configured" }); return; }
  try {
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) { res.status(401).json({ error: "Invalid token" }); return; }
    req.userId = user.id;
    const shops = await db.select().from(shopsTable).where(eq(shopsTable.ownerId, user.id)).limit(1);
    if (shops.length > 0) req.shopId = shops[0].id;
    next();
  } catch {
    res.status(401).json({ error: "Auth error" });
  }
}
