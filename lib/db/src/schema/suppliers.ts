import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const suppliersTable = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  pendingAmount: numeric("pending_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const supplierLedgerTable = pgTable("supplier_ledger", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliersTable.id),
  entryType: text("entry_type").notNull(), // debit | credit
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  purchaseId: integer("purchase_id"),
  paymentMode: text("payment_mode"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliersTable.$inferSelect;
