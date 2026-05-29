import { Router, type IRouter } from "express";
import { db, billsTable, billItemsTable, productsTable, customersTable, udhaarLedgerTable, stockMovementsTable, activityLogTable } from "@workspace/db";
import {
  ListBillsQueryParams,
  CreateBillBody,
  GetBillParams,
  CancelBillParams,
  CancelBillBody,
} from "@workspace/api-zod";
import { eq, desc, and, gte, lte, inArray, sql } from "drizzle-orm";

function generateBillNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const timePart = Date.now().toString().slice(-4);
  return `BL-${datePart}-${timePart}`;
}

const router: IRouter = Router();

router.get("/bills", async (req, res): Promise<void> => {
  const query = ListBillsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 50;

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

  let result = bills.map((b) => ({ ...b, itemCount: itemCounts[b.id] ?? 0 }));

  if (query.data.status) {
    result = result.filter((b) => b.status === query.data.status);
  }
  if (query.data.customerId) {
    result = result.filter((b) => b.customerId === query.data.customerId);
  }

  res.json(result);
});

router.post("/bills", async (req, res): Promise<void> => {
  const parsed = CreateBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, customerId, totalAmount, cashAmount, upiAmount, udhaarAmount, discountAmount, notes } = parsed.data;

  // Pre-validate stock BEFORE starting transaction (fast fail without holding a transaction lock)
  for (const item of items) {
    const [product] = await db
      .select({ currentStock: productsTable.currentStock, name: productsTable.name })
      .from(productsTable)
      .where(eq(productsTable.id, item.productId));

    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }

    if (Number(product.currentStock) < Number(item.quantity)) {
      res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.currentStock}` });
      return;
    }
  }

  // Get customer name if provided
  let customerName: string | null = null;
  if (customerId) {
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, customerId));
    customerName = customer?.name ?? null;
  }

  try {
    // Wrap everything in a single atomic transaction
    const result = await db.transaction(async (tx) => {
      // Create bill
      const [bill] = await tx.insert(billsTable).values({
        billNumber: generateBillNumber(),
        customerId: customerId ?? null,
        customerName,
        totalAmount: String(totalAmount),
        cashAmount: String(cashAmount),
        upiAmount: String(upiAmount),
        udhaarAmount: String(udhaarAmount),
        discountAmount: String(discountAmount ?? 0),
        notes: notes ?? null,
      }).returning();

      // Insert items, update stock, log movements
      let totalEstimatedProfit = 0;
      for (const item of items) {
        const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, item.productId));
        const stockBefore = Number(product!.currentStock);
        const stockAfter = stockBefore - Number(item.quantity);
        const totalPrice = Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount ?? 0);

        const buyPriceSnapshot = product!.buyPrice != null ? Number(product!.buyPrice) : null;
        let profitAmount: number | null = null;
        if (buyPriceSnapshot != null) {
          profitAmount = (Number(item.unitPrice) - buyPriceSnapshot) * Number(item.quantity) - Number(item.discountAmount ?? 0);
          totalEstimatedProfit += profitAmount;
        }

        await tx.insert(billItemsTable).values({
          billId: bill.id,
          productId: item.productId,
          productName: product!.name,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          totalPrice: String(totalPrice),
          discountAmount: String(item.discountAmount ?? 0),
          buyPriceSnapshot: buyPriceSnapshot != null ? String(buyPriceSnapshot) : null,
          profitAmount: profitAmount != null ? String(profitAmount) : null,
        });

        await tx.update(productsTable)
          .set({ currentStock: String(stockAfter) })
          .where(eq(productsTable.id, item.productId));

        await tx.insert(stockMovementsTable).values({
          productId: item.productId,
          productName: product!.name,
          movementType: "sale",
          quantity: String(-Number(item.quantity)),
          stockBefore: String(stockBefore),
          stockAfter: String(stockAfter),
          referenceId: bill.id,
          referenceType: "bill",
        });
      }

      // If udhaar, update customer balance
      if (udhaarAmount && Number(udhaarAmount) > 0 && customerId) {
        const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, customerId));
        const newBalance = Number(customer!.udhaarBalance) + Number(udhaarAmount);
        await tx.update(customersTable).set({ udhaarBalance: String(newBalance) }).where(eq(customersTable.id, customerId));
        await tx.insert(udhaarLedgerTable).values({
          customerId,
          entryType: "debit",
          amount: String(udhaarAmount),
          balanceAfter: String(newBalance),
          description: `Bill ${bill.billNumber}`,
          billId: bill.id,
        });
      }

      // Update bill with computed estimated profit
      const [updatedBill] = await tx
        .update(billsTable)
        .set({ estimatedProfit: String(totalEstimatedProfit) })
        .where(eq(billsTable.id, bill.id))
        .returning();

      await tx.insert(activityLogTable).values({
        eventType: "bill_created",
        description: `Bill ${bill.billNumber} - ₹${totalAmount}${customerName ? ` (${customerName})` : ""}`,
        amount: String(totalAmount),
      });

      return { ...updatedBill, itemCount: items.length };
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error("Bill creation failed:", err);
    res.status(500).json({ error: "Bill creation failed. Please try again.", detail: err?.message });
  }
});

router.get("/bills/:id", async (req, res): Promise<void> => {
  const params = GetBillParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bill] = await db.select().from(billsTable).where(eq(billsTable.id, params.data.id));

  if (!bill) {
    res.status(404).json({ error: "Bill not found" });
    return;
  }

  const items = await db
    .select()
    .from(billItemsTable)
    .where(eq(billItemsTable.billId, params.data.id));

  res.json({ ...bill, items });
});

router.post("/bills/:id/cancel", async (req, res): Promise<void> => {
  const params = CancelBillParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CancelBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bill] = await db.select().from(billsTable).where(eq(billsTable.id, params.data.id));
  if (!bill) {
    res.status(404).json({ error: "Bill not found" });
    return;
  }
  if (bill.status === "cancelled") {
    res.status(400).json({ error: "Bill is already cancelled" });
    return;
  }

  const items = await db.select().from(billItemsTable).where(eq(billItemsTable.billId, bill.id));

  try {
    const result = await db.transaction(async (tx) => {
      // Restore stock for each item
      for (const item of items) {
        const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, item.productId));
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

      // Reverse udhaar if applicable
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
        eventType: "bill_cancelled",
        description: `Bill ${bill.billNumber} cancelled: ${parsed.data.reason}`,
        amount: bill.totalAmount,
      });

      return { ...updated, itemCount: items.length };
    });

    res.json(result);
  } catch (err: any) {
    console.error("Bill cancellation failed:", err);
    res.status(500).json({ error: "Bill cancellation failed. Please try again.", detail: err?.message });
  }
});

export default router;
