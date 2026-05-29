import { Router, type IRouter } from "express";
import { db, dailyClosingsTable, billsTable, billItemsTable, expensesTable } from "@workspace/db";
import { ListDailyClosingsQueryParams, CreateDailyClosingBody } from "@workspace/api-zod";
import { desc, eq, gte, lte, and, inArray, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/daily-closings", async (req, res): Promise<void> => {
  const query = ListDailyClosingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const limit = query.data.limit ?? 30;
  const closings = await db
    .select()
    .from(dailyClosingsTable)
    .orderBy(desc(dailyClosingsTable.date))
    .limit(limit);
  res.json(closings);
});

router.get("/daily-closings/today", async (req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  const todayStart = new Date(today + "T00:00:00.000Z");
  const todayEnd = new Date(today + "T23:59:59.999Z");

  const bills = await db
    .select()
    .from(billsTable)
    .where(and(
      eq(billsTable.status, "active"),
      gte(billsTable.createdAt, todayStart),
      lte(billsTable.createdAt, todayEnd)
    ));

  const totalSales = bills.reduce((s, b) => s + Number(b.totalAmount), 0);
  const cashSales = bills.reduce((s, b) => s + Number(b.cashAmount), 0);
  const upiSales = bills.reduce((s, b) => s + Number(b.upiAmount), 0);
  const udhaarSales = bills.reduce((s, b) => s + Number(b.udhaarAmount), 0);

  const expenses = await db
    .select()
    .from(expensesTable)
    .where(and(
      gte(expensesTable.createdAt, todayStart),
      lte(expensesTable.createdAt, todayEnd)
    ));

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const expectedCash = cashSales - totalExpenses;

  // Top selling products today
  const billIds = bills.map((b) => b.id);
  let topProducts: Array<{ productId: number; productName: string; quantitySold: number; revenue: number }> = [];
  if (billIds.length > 0) {
    const items = await db
      .select()
      .from(billItemsTable)
      .where(inArray(billItemsTable.billId, billIds));

    const productMap = new Map<number, { productId: number; productName: string; quantitySold: number; revenue: number }>();
    for (const item of items) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.quantitySold += Number(item.quantity);
        existing.revenue += Number(item.totalPrice);
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          quantitySold: Number(item.quantity),
          revenue: Number(item.totalPrice),
        });
      }
    }
    topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  res.json({
    date: today,
    totalSales,
    cashSales,
    upiSales,
    udhaarSales,
    totalExpenses,
    expectedCash,
    billCount: bills.length,
    topSellingProducts: topProducts,
  });
});

router.post("/daily-closings", async (req, res): Promise<void> => {
  const parsed = CreateDailyClosingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { date, actualCash, notes } = parsed.data;
  const dateStart = new Date(date + "T00:00:00.000Z");
  const dateEnd = new Date(date + "T23:59:59.999Z");

  const bills = await db
    .select()
    .from(billsTable)
    .where(and(
      eq(billsTable.status, "active"),
      gte(billsTable.createdAt, dateStart),
      lte(billsTable.createdAt, dateEnd)
    ));

  const totalSales = bills.reduce((s, b) => s + Number(b.totalAmount), 0);
  const cashSales = bills.reduce((s, b) => s + Number(b.cashAmount), 0);
  const upiSales = bills.reduce((s, b) => s + Number(b.upiAmount), 0);
  const udhaarGiven = bills.reduce((s, b) => s + Number(b.udhaarAmount), 0);

  const expenses = await db
    .select()
    .from(expensesTable)
    .where(and(
      gte(expensesTable.createdAt, dateStart),
      lte(expensesTable.createdAt, dateEnd)
    ));

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const expectedCash = cashSales - totalExpenses;
  const difference = Number(actualCash) - expectedCash;

  const [closing] = await db.insert(dailyClosingsTable).values({
    date,
    expectedCash: String(expectedCash),
    actualCash: String(actualCash),
    difference: String(difference),
    totalSales: String(totalSales),
    totalExpenses: String(totalExpenses),
    totalUdhaarGiven: String(udhaarGiven),
    totalUpiReceived: String(upiSales),
    billCount: bills.length,
    status: "closed",
    notes: notes ?? null,
  }).returning();

  res.status(201).json(closing);
});

export default router;
