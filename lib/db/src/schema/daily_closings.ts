import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyClosingsTable = pgTable("daily_closings", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // YYYY-MM-DD
  expectedCash: numeric("expected_cash", { precision: 10, scale: 2 }).notNull(),
  actualCash: numeric("actual_cash", { precision: 10, scale: 2 }).notNull(),
  difference: numeric("difference", { precision: 10, scale: 2 }).notNull(),
  totalSales: numeric("total_sales", { precision: 10, scale: 2 }).notNull(),
  totalExpenses: numeric("total_expenses", { precision: 10, scale: 2 }).notNull(),
  totalUdhaarGiven: numeric("total_udhaar_given", { precision: 10, scale: 2 }).notNull().default("0"),
  totalUpiReceived: numeric("total_upi_received", { precision: 10, scale: 2 }).notNull().default("0"),
  billCount: integer("bill_count").notNull().default(0),
  status: text("status").notNull().default("closed"), // closed | reopened
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDailyClosingSchema = createInsertSchema(dailyClosingsTable).omit({ id: true, createdAt: true });
export type InsertDailyClosing = z.infer<typeof insertDailyClosingSchema>;
export type DailyClosing = typeof dailyClosingsTable.$inferSelect;
