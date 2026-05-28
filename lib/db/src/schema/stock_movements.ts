import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stockMovementsTable = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  movementType: text("movement_type").notNull(), // sale | purchase | adjustment | return | damage
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  stockBefore: numeric("stock_before", { precision: 10, scale: 2 }).notNull(),
  stockAfter: numeric("stock_after", { precision: 10, scale: 2 }).notNull(),
  referenceId: integer("reference_id"),
  referenceType: text("reference_type"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStockMovementSchema = createInsertSchema(stockMovementsTable).omit({ id: true, createdAt: true });
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovementsTable.$inferSelect;
