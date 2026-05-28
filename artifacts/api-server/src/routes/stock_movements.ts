import { Router, type IRouter } from "express";
import { db, stockMovementsTable, productsTable, activityLogTable } from "@workspace/db";
import { ListStockMovementsQueryParams, CreateStockAdjustmentBody } from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stock-movements", async (req, res): Promise<void> => {
  const query = ListStockMovementsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 50;
  let movements = await db
    .select()
    .from(stockMovementsTable)
    .orderBy(desc(stockMovementsTable.createdAt))
    .limit(limit);

  if (query.data.productId) {
    movements = movements.filter((m) => m.productId === query.data.productId);
  }

  if (query.data.movementType) {
    movements = movements.filter((m) => m.movementType === query.data.movementType);
  }

  res.json(movements);
});

router.post("/stock-movements", async (req, res): Promise<void> => {
  const parsed = CreateStockAdjustmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.productId));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const stockBefore = Number(product.currentStock);
  const stockAfter = stockBefore + Number(parsed.data.quantity);

  await db
    .update(productsTable)
    .set({ currentStock: String(stockAfter) })
    .where(eq(productsTable.id, parsed.data.productId));

  const [movement] = await db.insert(stockMovementsTable).values({
    productId: parsed.data.productId,
    productName: product.name,
    movementType: "adjustment",
    quantity: String(parsed.data.quantity),
    stockBefore: String(stockBefore),
    stockAfter: String(stockAfter),
    reason: parsed.data.reason,
  }).returning();

  await db.insert(activityLogTable).values({
    eventType: "stock_adjusted",
    description: `Stock adjusted: ${product.name} (${parsed.data.quantity > 0 ? "+" : ""}${parsed.data.quantity}) - ${parsed.data.reason}`,
    amount: null,
  });

  res.status(201).json(movement);
});

export default router;
