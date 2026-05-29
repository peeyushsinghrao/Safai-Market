import { Router, type IRouter } from "express";
import { db, purchasesTable, purchaseItemsTable, productsTable, suppliersTable, supplierLedgerTable, stockMovementsTable, activityLogTable } from "@workspace/db";
import {
  ListPurchasesQueryParams,
  CreatePurchaseBody,
  GetPurchaseParams,
} from "@workspace/api-zod";
import { eq, desc, inArray, sql } from "drizzle-orm";

function generatePurchaseNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const timePart = Date.now().toString().slice(-4);
  return `PO-${datePart}-${timePart}`;
}

const router: IRouter = Router();

router.get("/purchases", async (req, res): Promise<void> => {
  const query = ListPurchasesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 50;
  let purchases = await db
    .select()
    .from(purchasesTable)
    .orderBy(desc(purchasesTable.createdAt))
    .limit(limit);

  if (query.data.supplierId) {
    purchases = purchases.filter((p) => p.supplierId === query.data.supplierId);
  }

  const purchaseIds = purchases.map((p) => p.id);
  let itemCounts: Record<number, number> = {};
  if (purchaseIds.length > 0) {
    const counts = await db
      .select({ purchaseId: purchaseItemsTable.purchaseId, count: sql<number>`count(*)::int` })
      .from(purchaseItemsTable)
      .where(inArray(purchaseItemsTable.purchaseId, purchaseIds))
      .groupBy(purchaseItemsTable.purchaseId);
    itemCounts = Object.fromEntries(counts.map((c) => [c.purchaseId, c.count]));
  }

  res.json(purchases.map((p) => ({ ...p, itemCount: itemCounts[p.id] ?? 0 })));
});

router.post("/purchases", async (req, res): Promise<void> => {
  const parsed = CreatePurchaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { supplierId, items, totalAmount, paidAmount, invoiceRef, notes } = parsed.data;

  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, supplierId));
  if (!supplier) {
    res.status(400).json({ error: "Supplier not found" });
    return;
  }

  const pendingAmount = Number(totalAmount) - Number(paidAmount);
  let paymentStatus: "paid" | "partial" | "pending" = "pending";
  if (Number(paidAmount) >= Number(totalAmount)) paymentStatus = "paid";
  else if (Number(paidAmount) > 0) paymentStatus = "partial";

  const [purchase] = await db.insert(purchasesTable).values({
    purchaseNumber: generatePurchaseNumber(),
    supplierId,
    supplierName: supplier.name,
    totalAmount: String(totalAmount),
    paidAmount: String(paidAmount),
    paymentStatus,
    invoiceRef: invoiceRef ?? null,
    notes: notes ?? null,
  }).returning();

  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) continue;

    const totalQty = Number(item.quantity) + Number(item.freeQuantity ?? 0);
    const stockBefore = Number(product.currentStock);
    const stockAfter = stockBefore + totalQty;

    await db.insert(purchaseItemsTable).values({
      purchaseId: purchase.id,
      productId: item.productId,
      productName: product.name,
      quantity: String(item.quantity),
      unitCost: String(item.unitCost),
      totalCost: String(Number(item.quantity) * Number(item.unitCost)),
      freeQuantity: String(item.freeQuantity ?? 0),
    });

    await db.update(productsTable)
      .set({ currentStock: String(stockAfter), buyPrice: String(item.unitCost) })
      .where(eq(productsTable.id, item.productId));

    await db.insert(stockMovementsTable).values({
      productId: item.productId,
      productName: product.name,
      movementType: "purchase",
      quantity: String(totalQty),
      stockBefore: String(stockBefore),
      stockAfter: String(stockAfter),
      referenceId: purchase.id,
      referenceType: "purchase",
      reason: `Purchase ${purchase.purchaseNumber}`,
    });
  }

  // Update supplier pending
  if (pendingAmount > 0) {
    const newPending = Number(supplier.pendingAmount) + pendingAmount;
    await db.update(suppliersTable).set({ pendingAmount: String(newPending) }).where(eq(suppliersTable.id, supplierId));
    await db.insert(supplierLedgerTable).values({
      supplierId,
      entryType: "debit",
      amount: String(totalAmount),
      balanceAfter: String(newPending),
      description: `Purchase ${purchase.purchaseNumber}`,
      purchaseId: purchase.id,
    });
  }

  await db.insert(activityLogTable).values({
    eventType: "purchase_created",
    description: `Purchase ${purchase.purchaseNumber} from ${supplier.name}`,
    amount: String(totalAmount),
  });

  res.status(201).json({ ...purchase, itemCount: items.length });
});

router.get("/purchases/:id", async (req, res): Promise<void> => {
  const params = GetPurchaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [purchase] = await db.select().from(purchasesTable).where(eq(purchasesTable.id, params.data.id));
  if (!purchase) {
    res.status(404).json({ error: "Purchase not found" });
    return;
  }

  const items = await db.select().from(purchaseItemsTable).where(eq(purchaseItemsTable.purchaseId, params.data.id));
  res.json({ ...purchase, items });
});

export default router;
