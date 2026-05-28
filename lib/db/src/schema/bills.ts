import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const billsTable = pgTable("bills", {
  id: serial("id").primaryKey(),
  billNumber: text("bill_number").notNull().unique(),
  customerId: integer("customer_id"),
  customerName: text("customer_name"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  cashAmount: numeric("cash_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  upiAmount: numeric("upi_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  udhaarAmount: numeric("udhaar_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("active"), // active | cancelled
  cancelReason: text("cancel_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const billItemsTable = pgTable("bill_items", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").notNull().references(() => billsTable.id),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).notNull().default("0"),
});

export const insertBillSchema = createInsertSchema(billsTable).omit({ id: true, createdAt: true });
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof billsTable.$inferSelect;

export const insertBillItemSchema = createInsertSchema(billItemsTable).omit({ id: true });
export type InsertBillItem = z.infer<typeof insertBillItemSchema>;
export type BillItem = typeof billItemsTable.$inferSelect;
