import { pgTable, text, serial, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bundlesTable = pgTable("bundles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sellPrice: numeric("sell_price", { precision: 10, scale: 2 }).notNull(),
  buyPriceComputed: numeric("buy_price_computed", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const bundleItemsTable = pgTable("bundle_items", {
  id: serial("id").primaryKey(),
  bundleId: integer("bundle_id").notNull().references(() => bundlesTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull(),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  buyPriceSnapshot: numeric("buy_price_snapshot", { precision: 10, scale: 2 }).notNull().default("0"),
});

export const insertBundleSchema = createInsertSchema(bundlesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBundle = z.infer<typeof insertBundleSchema>;
export type Bundle = typeof bundlesTable.$inferSelect;

export const insertBundleItemSchema = createInsertSchema(bundleItemsTable).omit({ id: true });
export type InsertBundleItem = z.infer<typeof insertBundleItemSchema>;
export type BundleItem = typeof bundleItemsTable.$inferSelect;
