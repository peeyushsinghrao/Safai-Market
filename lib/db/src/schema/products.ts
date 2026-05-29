import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  skuCode: text("sku_code"),
  name: text("name").notNull(),
  displayName: text("display_name"),
  brand: text("brand"),
  categoryId: integer("category_id").notNull(),
  subcategory: text("subcategory"),
  unit: text("unit").notNull().default("piece"),
  buyPrice: numeric("buy_price", { precision: 10, scale: 2 }).notNull().default("0"),
  sellPrice: numeric("sell_price", { precision: 10, scale: 2 }).notNull().default("0"),
  wholesalePrice: numeric("wholesale_price", { precision: 10, scale: 2 }),
  mrp: numeric("mrp", { precision: 10, scale: 2 }),
  currentStock: numeric("current_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  lowStockLimit: numeric("low_stock_limit", { precision: 10, scale: 2 }).notNull().default("5"),
  reorderQuantity: numeric("reorder_quantity", { precision: 10, scale: 2 }),
  shopId: integer("shop_id"),
  primarySupplierId: integer("primary_supplier_id"),
  hinglishAliases: text("hinglish_aliases"),
  status: text("status").notNull().default("active"),
  barcode: text("barcode"),
  isVariantParent: boolean("is_variant_parent").notNull().default(false),
  parentProductId: integer("parent_product_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
