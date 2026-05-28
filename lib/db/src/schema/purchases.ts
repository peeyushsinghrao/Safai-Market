import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const purchasesTable = pgTable("purchases", {
  id: serial("id").primaryKey(),
  purchaseNumber: text("purchase_number").notNull().unique(),
  supplierId: integer("supplier_id").notNull(),
  supplierName: text("supplier_name").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentStatus: text("payment_status").notNull().default("pending"), // paid | partial | pending
  invoiceRef: text("invoice_ref"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const purchaseItemsTable = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").notNull().references(() => purchasesTable.id),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).notNull(),
  freeQuantity: numeric("free_quantity", { precision: 10, scale: 2 }).notNull().default("0"),
});

export const insertPurchaseSchema = createInsertSchema(purchasesTable).omit({ id: true, createdAt: true });
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchasesTable.$inferSelect;
