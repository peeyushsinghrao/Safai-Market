import { Router, type IRouter } from "express";
import { db, shopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/shops/my", requireAuth, async (req, res): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const shops = await db.select().from(shopsTable).where(eq(shopsTable.ownerId, req.userId)).limit(1);
  if (shops.length === 0) {
    res.status(404).json({ error: "No shop found" });
    return;
  }
  res.json(shops[0]);
});

router.post("/shops", requireAuth, async (req, res): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const existing = await db.select().from(shopsTable).where(eq(shopsTable.ownerId, req.userId)).limit(1);
  if (existing.length > 0) {
    res.json(existing[0]);
    return;
  }
  const { name, phone, address, gstNumber } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ error: "Shop name required" });
    return;
  }
  const [shop] = await db.insert(shopsTable).values({
    name: name.trim(),
    ownerId: req.userId,
    phone: phone?.trim() || null,
    address: address?.trim() || null,
    gstNumber: gstNumber?.trim() || null,
  }).returning();
  res.status(201).json(shop);
});

router.put("/shops/my", requireAuth, async (req, res): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { name, phone, address, gstNumber } = req.body;
  const [shop] = await db.update(shopsTable)
    .set({
      name: name?.trim() || undefined,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      gstNumber: gstNumber?.trim() || null,
    })
    .where(eq(shopsTable.ownerId, req.userId))
    .returning();
  if (!shop) {
    res.status(404).json({ error: "No shop found" });
    return;
  }
  res.json(shop);
});

export default router;
