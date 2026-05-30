import { Router, type IRouter } from "express";
import { db, billsTable, billItemsTable, productsTable, customersTable, udhaarLedgerTable, stockMovementsTable, activityLogTable } from "@workspace/db";
import {
  ListBillsQueryParams,
  CreateBillBody,
  GetBillParams,
  CancelBillParams,
  CancelBillBody,
} from "@workspace/api-zod";
import { eq, desc, and, inArray, sql, isNull } from "drizzle-orm";
import { optionalAuth } from "../middleware/auth";
import { randomBytes } from "crypto";

// FIX BUG-005: crypto random suffix prevents bill number collision under concurrent requests
function generateBillNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `BL-${datePart}-${suffix}`;
}

const router: IRouter = Router();

// GET /bills — list bills with SQL-level filtering (FIX BUG-007)
router.get("/bills", optionalAuth, async (req, res): Promise<void> => {
  const query = ListBillsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const limit = query.data.limit ?? 50;
  const shopFilter = req.shopId ? eq(billsTable.shopId, req.shopId) : isNull(billsTable.shopId);

  const conditions: any[] = [shopFilter];
  if (query.data.status) conditions.push(eq(billsTable.status, query.data.status));
  if (query.data.customerId) conditions.push(eq(billsTable.customerId, query.data.customerId));

  const bills = await db
    .select({
      id: billsTable.id,
      billNumber: billsTable.billNumber,
      customerId: billsTable.customerId,
      customerName: billsTable.customerName,
      totalAmount: billsTable.totalAmount,
      cashAmount: billsTable.cashAmount,
      upiAmount: billsTable.upiAmount,
      udhaarAmount: billsTable.udhaarAmount,
      discountAmount: billsTable.discountAmount,
      estimatedProfit: billsTable.estimatedProfit,
      status: billsTable.status,
      notes: billsTable.notes,
      createdAt: billsTable.createdAt,
    })
    .from(billsTable)
    .where(and(...conditions))
    .orderBy(desc(billsTable.createdAt))
    .limit(limit);

  const billIds = bills.map((b) => b.id);
  let itemCounts: Record<number, number> = {};
  if (billIds.length > 0) {
    const counts = await db
      .select({ billId: billItemsTable.billId, count: sql<number>`count(*)::int` })
      .from(billItemsTable)
      .where(inArray(billItemsTable.billId, billIds))
      .groupBy(billItemsTable.billId);
    itemCounts = Object.fromEntries(counts.map((c) => [c.billId, c.count]));
  }

  res.json(bills.map((b) => ({ ...b, itemCount: itemCounts[b.id] ?? 0 })));
});

// POST /bills — create bill
router.post("/bills", optionalAuth, async (req, res): Promise<void> => {
  const parsed = CreateBillBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { items, customerId: rawCustomerId, totalAmount, cashAmount, upiAmount, udhaarAmount, discountAmount, notes } = parsed.data;

  // FIX BUG-003 + BUG-018: 0 and null both mean Walk-in
  const customerId = rawCustomerId && rawCustomerId !== 0 ? rawCustomerId : null;

  // FIX BUG-016: Validate non-negative discounts
  if ((discountAmount ?? 0) < 0) { res.status(400).json({ error: "Discount cannot be negative" }); return; }
  for (const item of items) {
    if ((item.discountAmount ?? 0) < 0) {
      res.status(400).json({ error: `Discount for item ${item.productId} cannot be negative` });
      return;
    }
  }

  let customerName: string | null = null;
  if (customerId) {
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, customerId));
    customerName = customer?.name ?? null;
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [bill] = await tx.insert(billsTable).values({
        billNumber: generateBillNumber(),
        customerId: customerId ?? null,
        customerName,
        shopId: req.shopId ?? null,
        totalAmount: String(totalAmount),
        cashAmount: String(cashAmount),
        upiAmount: String(upiAmount),
        udhaarAmount: String(udhaarAmount),
        discountAmount: String(discountAmount ?? 0),
        notes: notes ?? null,
      }).returning();

      let totalEstimatedProfit = 0;

      for (const item of items) {
        // FIX BUG-001 + BUG-008: SELECT FOR UPDATE inside transaction prevents race condition
        const [product] = await tx
          .select()
          .from(productsTable)
          .where(eq(productsTable.id, item.productId))
          .for("update");

        if (!product) throw new Error(`Product ${item.productId} not found`);

        const stockBefore = Number(product.currentStock);
        const stockNeeded = Number(item.quantity);

        if (stockBefore < stockNeeded) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${stockBefore}, needed: ${stockNeeded}`);
        }

        const stockAfter = stockBefore - stockNeeded;
        const itemDiscAmt = Number(item.discountAmount ?? 0);
        const totalPrice = stockNeeded * Number(item.unitPrice) - itemDiscAmt;
        const buyPriceSnapshot = product.buyPrice != null ? Number(product.buyPrice) : null;
        let profitAmount: number | null = null;

        if (buyPriceSnapshot != null) {
          profitAmount = (Number(item.unitPrice) - buyPriceSnapshot) * stockNeeded - itemDiscAmt;
          totalEstimatedProfit += profitAmount;
        }

        await tx.insert(billItemsTable).values({
          billId: bill.id,
          productId: item.productId,
          productName: product.name,
          quantity: String(stockNeeded),
          unitPrice: String(item.unitPrice),
          totalPrice: String(totalPrice),
          discountAmount: String(itemDiscAmt),
          buyPriceSnapshot: buyPriceSnapshot != null ? String(buyPriceSnapshot) : null,
          profitAmount: profitAmount != null ? String(profitAmount) : null,
        });

        await tx.update(productsTable)
          .set({ currentStock: String(stockAfter) })
          .where(eq(productsTable.id, item.productId));

        await tx.insert(stockMovementsTable).values({
          productId: item.productId,
          productName: product.name,
          movementType: "sale",
          quantity: String(-stockNeeded),
          stockBefore: String(stockBefore),
          stockAfter: String(stockAfter),
          referenceId: bill.id,
          referenceType: "bill",
        });
      }

      // FIX BUG-004: Deduct bill-level discount from profit
      if (discountAmount && Number(discountAmount) > 0) {
        totalEstimatedProfit -= Number(discountAmount);
      }

      // Udhaar — only for real customers (not Walk-in)
      if (udhaarAmount && Number(udhaarAmount) > 0 && customerId) {
        const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, customerId));
        if (customer) {
          const newBalance = Number(customer.udhaarBalance) + Number(udhaarAmount);
          await tx.update(customersTable)
            .set({ udhaarBalance: String(newBalance) })
            .where(eq(customersTable.id, customerId));
          await tx.insert(udhaarLedgerTable).values({
            customerId,
            entryType: "debit",
            amount: String(udhaarAmount),
            balanceAfter: String(newBalance),
            description: `Bill ${bill.billNumber}`,
            billId: bill.id,
          });
        }
      }

      const [updatedBill] = await tx
        .update(billsTable)
        .set({ estimatedProfit: String(totalEstimatedProfit) })
        .where(eq(billsTable.id, bill.id))
        .returning();

      // FIX BUG-009: Pass shopId to activity log
      await tx.insert(activityLogTable).values({
        shopId: req.shopId ?? null,
        eventType: "bill_created",
        description: `Bill ${bill.billNumber} - ₹${totalAmount}${customerName ? ` (${customerName})` : ""}`,
        amount: String(totalAmount),
      });

      return { ...updatedBill, itemCount: items.length };
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error("Bill creation failed:", err);
    const isClientError = err?.message?.includes("Insufficient stock") || err?.message?.includes("not found") || err?.message?.includes("negative");
    res.status(isClientError ? 400 : 500).json({
      error: err?.message ?? "Bill creation failed. Please try again.",
    });
  }
});

// GET /bills/:id — FIX BUG-002: Add shop isolation
router.get("/bills/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetBillParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const shopFilter = req.shopId
    ? and(eq(billsTable.id, params.data.id), eq(billsTable.shopId, req.shopId))
    : and(eq(billsTable.id, params.data.id), isNull(billsTable.shopId));

  const [bill] = await db.select().from(billsTable).where(shopFilter);
  if (!bill) { res.status(404).json({ error: "Bill not found" }); return; }

  const items = await db.select().from(billItemsTable).where(eq(billItemsTable.billId, params.data.id));
  res.json({ ...bill, items });
});

// POST /bills/:id/cancel — FIX BUG-002: Add shop isolation
router.post("/bills/:id/cancel", optionalAuth, async (req, res): Promise<void> => {
  const params = CancelBillParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = CancelBillBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const shopFilter = req.shopId
    ? and(eq(billsTable.id, params.data.id), eq(billsTable.shopId, req.shopId))
    : and(eq(billsTable.id, params.data.id), isNull(billsTable.shopId));

  const [bill] = await db.select().from(billsTable).where(shopFilter);
  if (!bill) { res.status(404).json({ error: "Bill not found" }); return; }
  if (bill.status === "cancelled") { res.status(400).json({ error: "Bill is already cancelled" }); return; }

  const items = await db.select().from(billItemsTable).where(eq(billItemsTable.billId, bill.id));

  try {
    const result = await db.transaction(async (tx) => {
      for (const item of items) {
        const [product] = await tx.select().from(productsTable)
          .where(eq(productsTable.id, item.productId)).for("update");

        if (product) {
          const stockBefore = Number(product.currentStock);
          const stockAfter = stockBefore + Number(item.quantity);
          await tx.update(productsTable).set({ currentStock: String(stockAfter) }).where(eq(productsTable.id, item.productId));
          await tx.insert(stockMovementsTable).values({
            productId: item.productId,
            productName: item.productName,
            movementType: "return",
            quantity: item.quantity,
            stockBefore: String(stockBefore),
            stockAfter: String(stockAfter),
            referenceId: bill.id,
            referenceType: "bill_cancel",
            reason: `Bill ${bill.billNumber} cancelled`,
          });
        }
      }

      if (Number(bill.udhaarAmount) > 0 && bill.customerId) {
        const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, bill.customerId));
        if (customer) {
          const newBalance = Math.max(0, Number(customer.udhaarBalance) - Number(bill.udhaarAmount));
          await tx.update(customersTable).set({ udhaarBalance: String(newBalance) }).where(eq(customersTable.id, bill.customerId));
          await tx.insert(udhaarLedgerTable).values({
            customerId: bill.customerId,
            entryType: "credit",
            amount: bill.udhaarAmount,
            balanceAfter: String(newBalance),
            description: `Bill ${bill.billNumber} cancelled`,
            billId: bill.id,
          });
        }
      }

      const [updated] = await tx
        .update(billsTable)
        .set({ status: "cancelled", cancelReason: parsed.data.reason })
        .where(eq(billsTable.id, params.data.id))
        .returning();

      await tx.insert(activityLogTable).values({
        shopId: req.shopId ?? null,
        eventType: "bill_cancelled",
        description: `Bill ${bill.billNumber} cancelled`,
        amount: bill.totalAmount,
      });

      return { ...updated, itemCount: items.length };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Cancellation failed.", detail: err?.message });
  }
});

export default router;
