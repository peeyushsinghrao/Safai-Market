import { Router, type IRouter } from "express";
import { db, expensesTable, activityLogTable } from "@workspace/db";
import { ListExpensesQueryParams, CreateExpenseBody, DeleteExpenseParams } from "@workspace/api-zod";
import { eq, desc, gte, lte, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/expenses", async (req, res): Promise<void> => {
  const query = ListExpensesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 50;
  const expenses = await db
    .select()
    .from(expensesTable)
    .orderBy(desc(expensesTable.createdAt))
    .limit(limit);

  res.json(expenses);
});

router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [expense] = await db.insert(expensesTable).values(parsed.data).returning();

  await db.insert(activityLogTable).values({
    eventType: "expense_recorded",
    description: `Expense: ${expense.description}`,
    amount: expense.amount,
  });

  res.status(201).json(expense);
});

router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [expense] = await db
    .delete(expensesTable)
    .where(eq(expensesTable.id, params.data.id))
    .returning();

  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
