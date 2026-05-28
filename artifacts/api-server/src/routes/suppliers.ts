import { Router, type IRouter } from "express";
import { db, suppliersTable, supplierLedgerTable } from "@workspace/db";
import {
  CreateSupplierBody,
  GetSupplierParams,
  UpdateSupplierParams,
  UpdateSupplierBody,
  MakeSupplierPaymentParams,
  MakeSupplierPaymentBody,
} from "@workspace/api-zod";
import { eq, desc, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/suppliers", async (req, res): Promise<void> => {
  const suppliers = await db
    .select()
    .from(suppliersTable)
    .where(eq(suppliersTable.status, "active"))
    .orderBy(desc(suppliersTable.pendingAmount));
  res.json(suppliers);
});

router.post("/suppliers", async (req, res): Promise<void> => {
  const parsed = CreateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { openingBalance, ...supplierData } = parsed.data as typeof parsed.data & { openingBalance?: number };

  const [supplier] = await db
    .insert(suppliersTable)
    .values({ ...supplierData, pendingAmount: String(openingBalance ?? 0) })
    .returning();

  res.status(201).json(supplier);
});

router.get("/suppliers/:id", async (req, res): Promise<void> => {
  const params = GetSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [supplier] = await db
    .select()
    .from(suppliersTable)
    .where(eq(suppliersTable.id, params.data.id));

  if (!supplier) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }

  res.json(supplier);
});

router.patch("/suppliers/:id", async (req, res): Promise<void> => {
  const params = UpdateSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [supplier] = await db
    .update(suppliersTable)
    .set(parsed.data)
    .where(eq(suppliersTable.id, params.data.id))
    .returning();

  if (!supplier) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }

  res.json(supplier);
});

router.post("/suppliers/:id/payments", async (req, res): Promise<void> => {
  const params = MakeSupplierPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = MakeSupplierPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [supplier] = await db
    .select()
    .from(suppliersTable)
    .where(eq(suppliersTable.id, params.data.id));

  if (!supplier) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }

  const newBalance = Math.max(0, Number(supplier.pendingAmount) - Number(parsed.data.amount));
  await db
    .update(suppliersTable)
    .set({ pendingAmount: String(newBalance) })
    .where(eq(suppliersTable.id, params.data.id));

  const [entry] = await db.insert(supplierLedgerTable).values({
    supplierId: params.data.id,
    entryType: "credit",
    amount: String(parsed.data.amount),
    balanceAfter: String(newBalance),
    description: `Payment made (${parsed.data.paymentMode})${parsed.data.notes ? ` - ${parsed.data.notes}` : ""}`,
    paymentMode: parsed.data.paymentMode,
  }).returning();

  res.status(201).json(entry);
});

export default router;
