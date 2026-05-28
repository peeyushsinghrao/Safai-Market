import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityLogTable = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // bill_created | bill_cancelled | payment_received | purchase_created | expense_recorded | stock_adjusted
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  referenceId: text("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogTable).omit({ id: true, createdAt: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogTable.$inferSelect;
