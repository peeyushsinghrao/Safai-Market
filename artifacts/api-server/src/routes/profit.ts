import { Router, type IRouter } from "express";
import { db, billsTable, billItemsTable, productsTable, categoriesTable } from "@workspace/db";
import { eq, gte, lte, and, desc, sql, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/profit/summary", async (req, res): Promise<void> => {
  const { from, to } = req.query;
  const today = new Date().toISOString().slice(0, 10);
  const fromDate = new Date(((from as string) || today) + "T00:00:00.000Z");
  const toDate = new Date(((to as string) || today) + "T23:59:59.999Z");

  const bills = await db
    .select({
      id: billsTable.id,
      totalAmount: billsTable.totalAmount,
      estimatedProfit: billsTable.estimatedProfit,
      createdAt: billsTable.createdAt,
    })
    .from(billsTable)
    .where(and(
      eq(billsTable.status, "active"),
      gte(billsTable.createdAt, fromDate),
      lte(billsTable.createdAt, toDate)
    ));

  const totalSales = bills.reduce((s, b) => s + Number(b.totalAmount), 0);
  const totalProfit = bills.filter(b => b.estimatedProfit != null).reduce((s, b) => s + Number(b.estimatedProfit), 0);
  const billsWithProfit = bills.filter(b => b.estimatedProfit != null).length;
  const billCount = bills.length;
  const avgMarginPct = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  res.json({ totalSales, totalProfit, billCount, billsWithProfit, avgMarginPct });
});

router.get("/profit/daily", async (req, res): Promise<void> => {
  const { days } = req.query;
  const numDays = Math.min(Number(days) || 30, 90);

  const fromDate = new Date(Date.now() - numDays * 86400000);
  fromDate.setHours(0, 0, 0, 0);

  const bills = await db
    .select({
      totalAmount: billsTable.totalAmount,
      estimatedProfit: billsTable.estimatedProfit,
      createdAt: billsTable.createdAt,
    })
    .from(billsTable)
    .where(and(
      eq(billsTable.status, "active"),
      gte(billsTable.createdAt, fromDate)
    ))
    .orderBy(billsTable.createdAt);

  const byDay: Record<string, { date: string; sales: number; profit: number; billCount: number }> = {};
  for (const b of bills) {
    const day = new Date(b.createdAt).toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { date: day, sales: 0, profit: 0, billCount: 0 };
    byDay[day].sales += Number(b.totalAmount);
    if (b.estimatedProfit != null) byDay[day].profit += Number(b.estimatedProfit);
    byDay[day].billCount += 1;
  }

  res.json(Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)));
});

router.get("/profit/by-product", async (req, res): Promise<void> => {
  const { from, to, limit } = req.query;
  const today = new Date().toISOString().slice(0, 10);
  const fromDate = new Date(((from as string) || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)) + "T00:00:00.000Z");
  const toDate = new Date(((to as string) || today) + "T23:59:59.999Z");
  const limitN = Math.min(Number(limit) || 20, 50);

  const rows = await db
    .select({
      productId: billItemsTable.productId,
      productName: billItemsTable.productName,
      quantity: sql<number>`sum(${billItemsTable.quantity}::numeric)`,
      revenue: sql<number>`sum(${billItemsTable.totalPrice}::numeric)`,
      profit: sql<number>`sum(${billItemsTable.profitAmount}::numeric)`,
      profitCount: sql<number>`count(case when ${billItemsTable.profitAmount} is not null then 1 end)::int`,
    })
    .from(billItemsTable)
    .innerJoin(billsTable, and(
      eq(billItemsTable.billId, billsTable.id),
      eq(billsTable.status, "active"),
      gte(billsTable.createdAt, fromDate),
      lte(billsTable.createdAt, toDate)
    ))
    .groupBy(billItemsTable.productId, billItemsTable.productName)
    .orderBy(desc(sql`sum(${billItemsTable.profitAmount}::numeric)`))
    .limit(limitN);

  const enriched = rows.map(r => ({
    productId: r.productId,
    productName: r.productName,
    quantitySold: Number(r.quantity),
    revenue: Number(r.revenue),
    profit: Number(r.profit ?? 0),
    marginPct: Number(r.revenue) > 0 ? (Number(r.profit ?? 0) / Number(r.revenue)) * 100 : 0,
    hasProfit: Number(r.profitCount) > 0,
  }));

  res.json(enriched);
});

router.get("/profit/by-category", async (req, res): Promise<void> => {
  const { from, to } = req.query;
  const today = new Date().toISOString().slice(0, 10);
  const fromDate = new Date(((from as string) || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)) + "T00:00:00.000Z");
  const toDate = new Date(((to as string) || today) + "T23:59:59.999Z");

  const rows = await db
    .select({
      productId: billItemsTable.productId,
      revenue: sql<number>`sum(${billItemsTable.totalPrice}::numeric)`,
      profit: sql<number>`sum(${billItemsTable.profitAmount}::numeric)`,
    })
    .from(billItemsTable)
    .innerJoin(billsTable, and(
      eq(billItemsTable.billId, billsTable.id),
      eq(billsTable.status, "active"),
      gte(billsTable.createdAt, fromDate),
      lte(billsTable.createdAt, toDate)
    ))
    .groupBy(billItemsTable.productId, billItemsTable.productName);

  const productIds = [...new Set(rows.map(r => r.productId))];
  const products = productIds.length > 0
    ? await db
        .select({ id: productsTable.id, categoryId: productsTable.categoryId, categoryName: categoriesTable.name })
        .from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .where(inArray(productsTable.id, productIds))
    : [];

  const catMap = Object.fromEntries(products.map(p => [p.id, p.categoryName || "Uncategorized"]));

  const byCategory: Record<string, { category: string; revenue: number; profit: number }> = {};
  for (const r of rows) {
    const cat = catMap[r.productId] || "Uncategorized";
    if (!byCategory[cat]) byCategory[cat] = { category: cat, revenue: 0, profit: 0 };
    byCategory[cat].revenue += Number(r.revenue);
    byCategory[cat].profit += Number(r.profit ?? 0);
  }

  const result = Object.values(byCategory)
    .map(c => ({ ...c, marginPct: c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0 }))
    .sort((a, b) => b.profit - a.profit);

  res.json(result);
});

export default router;
