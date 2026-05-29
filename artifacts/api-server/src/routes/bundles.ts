import { Router, type IRouter } from "express";
import { db, bundlesTable, bundleItemsTable, productsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router: IRouter = Router();

function validateCreateBundle(body: any): { error?: string } {
  if (!body || typeof body !== "object") return { error: "Invalid body" };
  if (!body.name || typeof body.name !== "string") return { error: "name is required" };
  if (typeof body.sellPrice !== "number" || body.sellPrice < 0) return { error: "sellPrice must be a non-negative number" };
  if (!Array.isArray(body.items) || body.items.length === 0) return { error: "items must be a non-empty array" };
  for (const item of body.items) {
    if (!item || typeof item.productId !== "number") return { error: "Each item must have a numeric productId" };
    if (typeof item.quantity !== "number" || item.quantity <= 0) return { error: "Each item must have a positive quantity" };
  }
  return {};
}

router.get("/bundles", async (req, res): Promise<void> => {
  const bundles = await db
    .select()
    .from(bundlesTable)
    .orderBy(bundlesTable.name);

  const bundleIds = bundles.map((b) => b.id);
  const itemsMap: Record<number, typeof bundleItemsTable.$inferSelect[]> = {};

  if (bundleIds.length > 0) {
    const items = await db
      .select()
      .from(bundleItemsTable)
      .where(inArray(bundleItemsTable.bundleId, bundleIds));

    for (const item of items) {
      if (!itemsMap[item.bundleId]) itemsMap[item.bundleId] = [];
      itemsMap[item.bundleId].push(item);
    }
  }

  const allProductIds = Object.values(itemsMap).flat().map((i) => i.productId);
  let productStockMap: Record<number, { currentStock: string }> = {};
  if (allProductIds.length > 0) {
    const prods = await db
      .select({ id: productsTable.id, currentStock: productsTable.currentStock })
      .from(productsTable)
      .where(inArray(productsTable.id, allProductIds));
    productStockMap = Object.fromEntries(prods.map((p) => [p.id, { currentStock: p.currentStock }]));
  }

  const result = bundles.map((bundle) => {
    const items = itemsMap[bundle.id] ?? [];
    const availableStock = items.length > 0
      ? Math.floor(Math.min(...items.map((item) => {
          const stock = Number(productStockMap[item.productId]?.currentStock ?? 0);
          return stock / Number(item.quantity);
        })))
      : 0;
    return { ...bundle, items, availableStock };
  });

  res.json(result);
});

router.get("/bundles/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [bundle] = await db.select().from(bundlesTable).where(eq(bundlesTable.id, id));
  if (!bundle) { res.status(404).json({ error: "Bundle not found" }); return; }

  const items = await db.select().from(bundleItemsTable).where(eq(bundleItemsTable.bundleId, id));

  const productIds = items.map((i) => i.productId);
  let productStockMap: Record<number, { currentStock: string }> = {};
  if (productIds.length > 0) {
    const prods = await db
      .select({ id: productsTable.id, currentStock: productsTable.currentStock })
      .from(productsTable)
      .where(inArray(productsTable.id, productIds));
    productStockMap = Object.fromEntries(prods.map((p) => [p.id, { currentStock: p.currentStock }]));
  }

  const availableStock = items.length > 0
    ? Math.floor(Math.min(...items.map((item) => {
        const stock = Number(productStockMap[item.productId]?.currentStock ?? 0);
        return stock / Number(item.quantity);
      })))
    : 0;

  res.json({ ...bundle, items, availableStock });
});

router.post("/bundles", async (req, res): Promise<void> => {
  const validation = validateCreateBundle(req.body);
  if (validation.error) { res.status(400).json({ error: validation.error }); return; }

  const { name, description, sellPrice, items } = req.body as {
    name: string;
    description?: string;
    sellPrice: number;
    items: Array<{ productId: number; quantity: number }>;
  };

  const productIds = items.map((i) => i.productId);
  const products = await db
    .select({ id: productsTable.id, name: productsTable.name, buyPrice: productsTable.buyPrice })
    .from(productsTable)
    .where(inArray(productsTable.id, productIds));

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
  const missingIds = productIds.filter((id) => !productMap[id]);
  if (missingIds.length > 0) {
    res.status(400).json({ error: `Products not found: ${missingIds.join(", ")}` });
    return;
  }

  const buyPriceComputed = items.reduce((sum, item) => {
    const bp = Number(productMap[item.productId]?.buyPrice ?? 0);
    return sum + bp * item.quantity;
  }, 0);

  const [bundle] = await db.insert(bundlesTable).values({
    name,
    description: description ?? null,
    sellPrice: String(sellPrice),
    buyPriceComputed: String(buyPriceComputed.toFixed(2)),
  }).returning();

  const bundleItems = items.map((item) => ({
    bundleId: bundle.id,
    productId: item.productId,
    productNameSnapshot: productMap[item.productId].name,
    quantity: String(item.quantity),
    buyPriceSnapshot: String(Number(productMap[item.productId]?.buyPrice ?? 0).toFixed(2)),
  }));

  await db.insert(bundleItemsTable).values(bundleItems);

  const savedItems = await db.select().from(bundleItemsTable).where(eq(bundleItemsTable.bundleId, bundle.id));
  res.status(201).json({ ...bundle, items: savedItems, availableStock: 0 });
});

router.patch("/bundles/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = req.body as {
    name?: string;
    description?: string;
    sellPrice?: number;
    isActive?: boolean;
    items?: Array<{ productId: number; quantity: number }>;
  };

  if (body.items !== undefined) {
    const items = body.items;
    const productIds = items.map((i) => i.productId);
    const products = await db
      .select({ id: productsTable.id, name: productsTable.name, buyPrice: productsTable.buyPrice })
      .from(productsTable)
      .where(inArray(productsTable.id, productIds));
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    const buyPriceComputed = items.reduce((sum, item) => {
      const bp = Number(productMap[item.productId]?.buyPrice ?? 0);
      return sum + bp * item.quantity;
    }, 0);

    await db.delete(bundleItemsTable).where(eq(bundleItemsTable.bundleId, id));

    if (items.length > 0) {
      const bundleItemRows = items.map((item) => ({
        bundleId: id,
        productId: item.productId,
        productNameSnapshot: productMap[item.productId]?.name ?? String(item.productId),
        quantity: String(item.quantity),
        buyPriceSnapshot: String(Number(productMap[item.productId]?.buyPrice ?? 0).toFixed(2)),
      }));
      await db.insert(bundleItemsTable).values(bundleItemRows);
    }

    await db.update(bundlesTable)
      .set({ buyPriceComputed: String(buyPriceComputed.toFixed(2)) })
      .where(eq(bundlesTable.id, id));
  }

  const updateData: Partial<typeof bundlesTable.$inferInsert> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.sellPrice !== undefined) updateData.sellPrice = String(body.sellPrice);
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  if (Object.keys(updateData).length > 0) {
    await db.update(bundlesTable).set(updateData).where(eq(bundlesTable.id, id));
  }

  const [updated] = await db.select().from(bundlesTable).where(eq(bundlesTable.id, id));
  const updatedItems = await db.select().from(bundleItemsTable).where(eq(bundleItemsTable.bundleId, id));
  res.json({ ...updated, items: updatedItems });
});

router.delete("/bundles/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(bundlesTable).where(eq(bundlesTable.id, id));
  res.json({ success: true });
});

export default router;
