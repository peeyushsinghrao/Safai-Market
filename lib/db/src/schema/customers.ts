import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  udhaarBalance: numeric("udhaar_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const udhaarLedgerTable = pgTable("udhaar_ledger", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id),
  entryType: text("entry_type").notNull(), // debit | credit
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  billId: integer("bill_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;

export const insertUdhaarLedgerSchema = createInsertSchema(udhaarLedgerTable).omit({ id: true, createdAt: true });
export type InsertUdhaarLedger = z.infer<typeof insertUdhaarLedgerSchema>;
export type UdhaarLedger = typeof udhaarLedgerTable.$inferSelect;
