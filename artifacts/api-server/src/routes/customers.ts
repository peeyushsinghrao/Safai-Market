import { Router, type IRouter } from "express";
import { db, customersTable, udhaarLedgerTable } from "@workspace/db";
import {
  ListCustomersQueryParams,
  CreateCustomerBody,
  GetCustomerParams,
  UpdateCustomerParams,
  UpdateCustomerBody,
  ReceiveCustomerPaymentParams,
  ReceiveCustomerPaymentBody,
} from "@workspace/api-zod";
import { eq, desc, gt } from "drizzle-orm";

const router: IRouter = Router();

router.get("/customers", async (req, res): Promise<void> => {
  const query = ListCustomersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let customers = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.status, "active"))
    .orderBy(desc(customersTable.udhaarBalance));

  if (query.data.search) {
    const s = query.data.search.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.phone && c.phone.includes(s))
    );
  }

  if (query.data.hasUdhaar) {
    customers = customers.filter((c) => Number(c.udhaarBalance) > 0);
  }

  res.json(customers);
});

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { openingBalance, ...customerData } = parsed.data as typeof parsed.data & { openingBalance?: number };

  const [customer] = await db
    .insert(customersTable)
    .values({ ...customerData, udhaarBalance: String(openingBalance ?? 0) })
    .returning();

  if (openingBalance && openingBalance > 0) {
    await db.insert(udhaarLedgerTable).values({
      customerId: customer.id,
      entryType: "debit",
      amount: String(openingBalance),
      balanceAfter: String(openingBalance),
      description: "Opening balance",
    });
  }

  res.status(201).json(customer);
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, params.data.id));

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const ledger = await db
    .select()
    .from(udhaarLedgerTable)
    .where(eq(udhaarLedgerTable.customerId, params.data.id))
    .orderBy(desc(udhaarLedgerTable.createdAt))
    .limit(50);

  res.json({ ...customer, ledger });
});

router.patch("/customers/:id", async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [customer] = await db
    .update(customersTable)
    .set(parsed.data)
    .where(eq(customersTable.id, params.data.id))
    .returning();

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json(customer);
});

router.post("/customers/:id/payments", async (req, res): Promise<void> => {
  const params = ReceiveCustomerPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ReceiveCustomerPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, params.data.id));

  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const newBalance = Number(customer.udhaarBalance) - Number(parsed.data.amount);
  await db
    .update(customersTable)
    .set({ udhaarBalance: String(newBalance) })
    .where(eq(customersTable.id, params.data.id));

  const [entry] = await db.insert(udhaarLedgerTable).values({
    customerId: params.data.id,
    entryType: "credit",
    amount: String(parsed.data.amount),
    balanceAfter: String(newBalance),
    description: `Payment received (${parsed.data.paymentMode})${parsed.data.notes ? ` - ${parsed.data.notes}` : ""}`,
  }).returning();

  res.status(201).json(entry);
});

export default router;
