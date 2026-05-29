import { Router, type IRouter } from "express";
import { db, billsTable, productsTable, customersTable, suppliersTable, expensesTable, activityLogTable, dailyClosingsTable } from "@workspace/db";
import { eq, gte, lte, and, lt, desc, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  const todayStart = new Date(today + "T00:00:00.000Z");
  const todayEnd = new Date(today + "T23:59:59.999Z");

  const [todayBills, totalUdhaar, totalSupplierPending, totalExpenses, lastClosing] = await Promise.all([
    db.select().from(billsTable).where(and(
      eq(billsTable.status, "active"),
      gte(billsTable.createdAt, todayStart),
      lte(billsTable.createdAt, todayEnd)
    )),
    db.select({ total: sql<number>`coalesce(sum(udhaar_balance::numeric), 0)` }).from(customersTable).where(eq(customersTable.status, "active")),
    db.select({ total: sql<number>`coalesce(sum(pending_amount::numeric), 0)` }).from(suppliersTable).where(eq(suppliersTable.status, "active")),
    db.select().from(expensesTable).where(and(
      gte(expensesTable.createdAt, todayStart),
      lte(expensesTable.createdAt, todayEnd)
    )),
    db.select().from(dailyClosingsTable).orderBy(desc(dailyClosingsTable.date)).limit(1),
  ]);

  const todayTotalSales = todayBills.reduce((s, b) => s + Number(b.totalAmount), 0);
  const todayCashReceived = todayBills.reduce((s, b) => s + Number(b.cashAmount), 0);
  const todayUpiReceived = todayBills.reduce((s, b) => s + Number(b.upiAmount), 0);
  const todayUdhaarGiven = todayBills.reduce((s, b) => s + Number(b.udhaarAmount), 0);
  const totalExpensesAmt = totalExpenses.reduce((s, e) => s + Number(e.amount), 0);

  // Low stock count
  const allProducts = await db.select({
    currentStock: productsTable.currentStock,
    lowStockLimit: productsTable.lowStockLimit,
  }).from(productsTable).where(eq(productsTable.status, "active"));
  const lowStockCount = allProducts.filter((p) => Number(p.currentStock) <= Number(p.lowStockLimit)).length;

  // Last unclosed day
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastClosingDate = lastClosing[0]?.date ?? null;
  const pendingClosingDate = lastClosingDate !== yesterday && lastClosingDate !== today ? yesterday : null;

  const todayEstimatedProfit = todayBills.reduce((s, b) => s + (b.estimatedProfit != null ? Number(b.estimatedProfit) : 0), 0);
  const todayBillsWithProfit = todayBills.filter(b => b.estimatedProfit != null).length;

  res.json({
    todayTotalSales,
    todayBillCount: todayBills.length,
    todayCashReceived,
    todayUpiReceived,
    todayUdhaarGiven,
    todayExpenses: totalExpensesAmt,
    totalOutstandingUdhaar: Number(totalUdhaar[0]?.total ?? 0),
    totalSupplierPending: Number(totalSupplierPending[0]?.total ?? 0),
    lowStockCount,
    pendingClosingDate,
    todayEstimatedProfit,
    todayBillsWithProfit,
  });
});

router.get("/dashboard/low-stock", async (req, res): Promise<void> => {
  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      brand: productsTable.brand,
      currentStock: productsTable.currentStock,
      lowStockLimit: productsTable.lowStockLimit,
      unit: productsTable.unit,
    })
    .from(productsTable)
    .where(eq(productsTable.status, "active"))
    .orderBy(asc(productsTable.currentStock));

  const lowStock = products.filter((p) => Number(p.currentStock) <= Number(p.lowStockLimit));
  res.json(lowStock);
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const events = await db
    .select()
    .from(activityLogTable)
    .orderBy(desc(activityLogTable.createdAt))
    .limit(20);

  res.json(events);
});

export default router;
