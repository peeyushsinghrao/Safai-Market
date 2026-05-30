# Safai Market — Phase 1 & 2 Implementation Guide
> For AI Agent / Developer use only.
> Apply these changes exactly as described. Do NOT rewrite unrelated code.

---

## Overview

**Phase 1** — Critical bug fixes (security, data integrity, billing correctness)
**Phase 2** — GST billing (HSN codes, CGST/SGST/IGST, Tax Invoice receipt)

**14 files modified. 1 new file created (SQL migration).**

---

## Step 0 — Run DB Migration First

Create and run this migration before any code changes:

**File:** `lib/db/migrations/001_gst_and_fixes.sql`

```sql
-- Migration: 001_gst_and_fixes
-- Phase 1 + 2 fixes: GST fields, activity_log shop isolation, indexes

-- 1. Add GST fields to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS hsn_code TEXT,
  ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_inclusive BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Add shop_id to activity_log (BUG-009)
ALTER TABLE activity_log
  ADD COLUMN IF NOT EXISTS shop_id INTEGER;

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_products_shop_status ON products(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bills_shop_created ON bills(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_shop_id ON activity_log(shop_id);

-- 4. Add cancel_reason to bills if missing
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
```

Run with:
```bash
psql $DATABASE_URL < lib/db/migrations/001_gst_and_fixes.sql
# OR using drizzle:
cd lib/db && pnpm push
```

---

## Step 1 — Update DB Schema Files

### File: `lib/db/src/schema/products.ts`

**Change:** Add `hsnCode`, `gstRate`, `gstInclusive` columns.

Add these 3 fields inside `pgTable("products", { ... })` after the `parentProductId` field:

```typescript
// GST fields — Phase 2
hsnCode: text("hsn_code"),
gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).default("0"),
gstInclusive: boolean("gst_inclusive").notNull().default(true),
```

Add `boolean` to the drizzle import at the top:
```typescript
import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
```

---

### File: `lib/db/src/schema/activity_log.ts`

**Change:** Add `shopId` column for multi-shop data isolation (BUG-009).

Add this field inside `pgTable("activity_log", { ... })` before `eventType`:

```typescript
shopId: integer("shop_id"),
```

Add `integer` to the drizzle import:
```typescript
import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
```

---

## Step 2 — Fix Bills API Route

### File: `artifacts/api-server/src/routes/bills.ts`

**Changes:** Fix 5 critical bugs — stock race condition, shop isolation on GET/CANCEL, bill number collision, walk-in customer, profit with bill discount.

**Full replacement of the file.** Replace entire contents with:

```typescript
import { Router, type IRouter } from "express";
import { db, billsTable, billItemsTable, productsTable, customersTable, udhaarLedgerTable, stockMovementsTable, activityLogTable } from "@workspace/db";
import {
  ListBillsQueryParams,
  CreateBillBody,
  GetBillParams,
  CancelBillParams,
  CancelBillBody,
} from "@workspace/api-zod";
import { eq, desc, and, inArray, sql, isNull } from "drizzle-orm";
import { optionalAuth } from "../middleware/auth";
import { randomBytes } from "crypto";

// FIX BUG-005: crypto random suffix prevents bill number collision under concurrent requests
function generateBillNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `BL-${datePart}-${suffix}`;
}

const router: IRouter = Router();

// GET /bills — list bills with SQL-level filtering (FIX BUG-007)
router.get("/bills", optionalAuth, async (req, res): Promise<void> => {
  const query = ListBillsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const limit = query.data.limit ?? 50;
  const shopFilter = req.shopId ? eq(billsTable.shopId, req.shopId) : isNull(billsTable.shopId);

  const conditions: any[] = [shopFilter];
  if (query.data.status) conditions.push(eq(billsTable.status, query.data.status));
  if (query.data.customerId) conditions.push(eq(billsTable.customerId, query.data.customerId));

  const bills = await db
    .select({
      id: billsTable.id,
      billNumber: billsTable.billNumber,
      customerId: billsTable.customerId,
      customerName: billsTable.customerName,
      totalAmount: billsTable.totalAmount,
      cashAmount: billsTable.cashAmount,
      upiAmount: billsTable.upiAmount,
      udhaarAmount: billsTable.udhaarAmount,
      discountAmount: billsTable.discountAmount,
      estimatedProfit: billsTable.estimatedProfit,
      status: billsTable.status,
      notes: billsTable.notes,
      createdAt: billsTable.createdAt,
    })
    .from(billsTable)
    .where(and(...conditions))
    .orderBy(desc(billsTable.createdAt))
    .limit(limit);

  const billIds = bills.map((b) => b.id);
  let itemCounts: Record<number, number> = {};
  if (billIds.length > 0) {
    const counts = await db
      .select({ billId: billItemsTable.billId, count: sql<number>`count(*)::int` })
      .from(billItemsTable)
      .where(inArray(billItemsTable.billId, billIds))
      .groupBy(billItemsTable.billId);
    itemCounts = Object.fromEntries(counts.map((c) => [c.billId, c.count]));
  }

  res.json(bills.map((b) => ({ ...b, itemCount: itemCounts[b.id] ?? 0 })));
});

// POST /bills — create bill
router.post("/bills", optionalAuth, async (req, res): Promise<void> => {
  const parsed = CreateBillBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { items, customerId: rawCustomerId, totalAmount, cashAmount, upiAmount, udhaarAmount, discountAmount, notes } = parsed.data;

  // FIX BUG-003 + BUG-018: 0 and null both mean Walk-in
  const customerId = rawCustomerId && rawCustomerId !== 0 ? rawCustomerId : null;

  // FIX BUG-016: Validate non-negative discounts
  if ((discountAmount ?? 0) < 0) { res.status(400).json({ error: "Discount cannot be negative" }); return; }
  for (const item of items) {
    if ((item.discountAmount ?? 0) < 0) {
      res.status(400).json({ error: `Discount for item ${item.productId} cannot be negative` });
      return;
    }
  }

  let customerName: string | null = null;
  if (customerId) {
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, customerId));
    customerName = customer?.name ?? null;
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [bill] = await tx.insert(billsTable).values({
        billNumber: generateBillNumber(),
        customerId: customerId ?? null,
        customerName,
        shopId: req.shopId ?? null,
        totalAmount: String(totalAmount),
        cashAmount: String(cashAmount),
        upiAmount: String(upiAmount),
        udhaarAmount: String(udhaarAmount),
        discountAmount: String(discountAmount ?? 0),
        notes: notes ?? null,
      }).returning();

      let totalEstimatedProfit = 0;

      for (const item of items) {
        // FIX BUG-001 + BUG-008: SELECT FOR UPDATE inside transaction prevents race condition
        const [product] = await tx
          .select()
          .from(productsTable)
          .where(eq(productsTable.id, item.productId))
          .for("update");

        if (!product) throw new Error(`Product ${item.productId} not found`);

        const stockBefore = Number(product.currentStock);
        const stockNeeded = Number(item.quantity);

        if (stockBefore < stockNeeded) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${stockBefore}, needed: ${stockNeeded}`);
        }

        const stockAfter = stockBefore - stockNeeded;
        const itemDiscAmt = Number(item.discountAmount ?? 0);
        const totalPrice = stockNeeded * Number(item.unitPrice) - itemDiscAmt;
        const buyPriceSnapshot = product.buyPrice != null ? Number(product.buyPrice) : null;
        let profitAmount: number | null = null;

        if (buyPriceSnapshot != null) {
          profitAmount = (Number(item.unitPrice) - buyPriceSnapshot) * stockNeeded - itemDiscAmt;
          totalEstimatedProfit += profitAmount;
        }

        await tx.insert(billItemsTable).values({
          billId: bill.id,
          productId: item.productId,
          productName: product.name,
          quantity: String(stockNeeded),
          unitPrice: String(item.unitPrice),
          totalPrice: String(totalPrice),
          discountAmount: String(itemDiscAmt),
          buyPriceSnapshot: buyPriceSnapshot != null ? String(buyPriceSnapshot) : null,
          profitAmount: profitAmount != null ? String(profitAmount) : null,
        });

        await tx.update(productsTable)
          .set({ currentStock: String(stockAfter) })
          .where(eq(productsTable.id, item.productId));

        await tx.insert(stockMovementsTable).values({
          productId: item.productId,
          productName: product.name,
          movementType: "sale",
          quantity: String(-stockNeeded),
          stockBefore: String(stockBefore),
          stockAfter: String(stockAfter),
          referenceId: bill.id,
          referenceType: "bill",
        });
      }

      // FIX BUG-004: Deduct bill-level discount from profit
      if (discountAmount && Number(discountAmount) > 0) {
        totalEstimatedProfit -= Number(discountAmount);
      }

      // Udhaar — only for real customers (not Walk-in)
      if (udhaarAmount && Number(udhaarAmount) > 0 && customerId) {
        const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, customerId));
        if (customer) {
          const newBalance = Number(customer.udhaarBalance) + Number(udhaarAmount);
          await tx.update(customersTable)
            .set({ udhaarBalance: String(newBalance) })
            .where(eq(customersTable.id, customerId));
          await tx.insert(udhaarLedgerTable).values({
            customerId,
            entryType: "debit",
            amount: String(udhaarAmount),
            balanceAfter: String(newBalance),
            description: `Bill ${bill.billNumber}`,
            billId: bill.id,
          });
        }
      }

      const [updatedBill] = await tx
        .update(billsTable)
        .set({ estimatedProfit: String(totalEstimatedProfit) })
        .where(eq(billsTable.id, bill.id))
        .returning();

      // FIX BUG-009: Pass shopId to activity log
      await tx.insert(activityLogTable).values({
        shopId: req.shopId ?? null,
        eventType: "bill_created",
        description: `Bill ${bill.billNumber} - ₹${totalAmount}${customerName ? ` (${customerName})` : ""}`,
        amount: String(totalAmount),
      });

      return { ...updatedBill, itemCount: items.length };
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error("Bill creation failed:", err);
    const isClientError = err?.message?.includes("Insufficient stock") || err?.message?.includes("not found") || err?.message?.includes("negative");
    res.status(isClientError ? 400 : 500).json({
      error: err?.message ?? "Bill creation failed. Please try again.",
    });
  }
});

// GET /bills/:id — FIX BUG-002: Add shop isolation
router.get("/bills/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetBillParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const shopFilter = req.shopId
    ? and(eq(billsTable.id, params.data.id), eq(billsTable.shopId, req.shopId))
    : and(eq(billsTable.id, params.data.id), isNull(billsTable.shopId));

  const [bill] = await db.select().from(billsTable).where(shopFilter);
  if (!bill) { res.status(404).json({ error: "Bill not found" }); return; }

  const items = await db.select().from(billItemsTable).where(eq(billItemsTable.billId, params.data.id));
  res.json({ ...bill, items });
});

// POST /bills/:id/cancel — FIX BUG-002: Add shop isolation
router.post("/bills/:id/cancel", optionalAuth, async (req, res): Promise<void> => {
  const params = CancelBillParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = CancelBillBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const shopFilter = req.shopId
    ? and(eq(billsTable.id, params.data.id), eq(billsTable.shopId, req.shopId))
    : and(eq(billsTable.id, params.data.id), isNull(billsTable.shopId));

  const [bill] = await db.select().from(billsTable).where(shopFilter);
  if (!bill) { res.status(404).json({ error: "Bill not found" }); return; }
  if (bill.status === "cancelled") { res.status(400).json({ error: "Bill is already cancelled" }); return; }

  const items = await db.select().from(billItemsTable).where(eq(billItemsTable.billId, bill.id));

  try {
    const result = await db.transaction(async (tx) => {
      for (const item of items) {
        const [product] = await tx.select().from(productsTable)
          .where(eq(productsTable.id, item.productId)).for("update");

        if (product) {
          const stockBefore = Number(product.currentStock);
          const stockAfter = stockBefore + Number(item.quantity);
          await tx.update(productsTable).set({ currentStock: String(stockAfter) }).where(eq(productsTable.id, item.productId));
          await tx.insert(stockMovementsTable).values({
            productId: item.productId,
            productName: item.productName,
            movementType: "return",
            quantity: item.quantity,
            stockBefore: String(stockBefore),
            stockAfter: String(stockAfter),
            referenceId: bill.id,
            referenceType: "bill_cancel",
            reason: `Bill ${bill.billNumber} cancelled`,
          });
        }
      }

      if (Number(bill.udhaarAmount) > 0 && bill.customerId) {
        const [customer] = await tx.select().from(customersTable).where(eq(customersTable.id, bill.customerId));
        if (customer) {
          const newBalance = Math.max(0, Number(customer.udhaarBalance) - Number(bill.udhaarAmount));
          await tx.update(customersTable).set({ udhaarBalance: String(newBalance) }).where(eq(customersTable.id, bill.customerId));
          await tx.insert(udhaarLedgerTable).values({
            customerId: bill.customerId,
            entryType: "credit",
            amount: bill.udhaarAmount,
            balanceAfter: String(newBalance),
            description: `Bill ${bill.billNumber} cancelled`,
            billId: bill.id,
          });
        }
      }

      const [updated] = await tx
        .update(billsTable)
        .set({ status: "cancelled", cancelReason: parsed.data.reason })
        .where(eq(billsTable.id, params.data.id))
        .returning();

      await tx.insert(activityLogTable).values({
        shopId: req.shopId ?? null,
        eventType: "bill_cancelled",
        description: `Bill ${bill.billNumber} cancelled`,
        amount: bill.totalAmount,
      });

      return { ...updated, itemCount: items.length };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Cancellation failed.", detail: err?.message });
  }
});

export default router;
```

---

## Step 3 — Fix Products API Route

### File: `artifacts/api-server/src/routes/products.ts`

**Change:** Push `status` and `categoryId` filters into SQL WHERE clause instead of filtering in JavaScript (BUG-006). Also return new GST fields.

**Replace the GET /products handler** — find the block starting with:
```typescript
const { search, categoryId, status, lowStockOnly, outOfStockOnly, limit } = query.data
```

Replace everything from that line until `res.json(products)` with:

```typescript
  const { search, categoryId, status, lowStockOnly, outOfStockOnly, limit } = query.data as typeof query.data & { limit?: number };

  const shopFilter = req.shopId
    ? eq(productsTable.shopId, req.shopId)
    : isNull(productsTable.shopId);

  // Push status + category into SQL — not JS (FIX BUG-006)
  const activeStatus = status ?? "active";
  const conditions: any[] = [shopFilter, eq(productsTable.status, activeStatus)];
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));

  let products = await db
    .select({
      id: productsTable.id,
      skuCode: productsTable.skuCode,
      name: productsTable.name,
      displayName: productsTable.displayName,
      brand: productsTable.brand,
      categoryId: productsTable.categoryId,
      subcategory: productsTable.subcategory,
      unit: productsTable.unit,
      buyPrice: productsTable.buyPrice,
      sellPrice: productsTable.sellPrice,
      wholesalePrice: productsTable.wholesalePrice,
      mrp: productsTable.mrp,
      currentStock: productsTable.currentStock,
      lowStockLimit: productsTable.lowStockLimit,
      reorderQuantity: productsTable.reorderQuantity,
      shopId: productsTable.shopId,
      primarySupplierId: productsTable.primarySupplierId,
      hinglishAliases: productsTable.hinglishAliases,
      barcode: productsTable.barcode,
      status: productsTable.status,
      isVariantParent: productsTable.isVariantParent,
      parentProductId: productsTable.parentProductId,
      hsnCode: productsTable.hsnCode,
      gstRate: productsTable.gstRate,
      gstInclusive: productsTable.gstInclusive,
      createdAt: productsTable.createdAt,
      updatedAt: productsTable.updatedAt,
      categoryName: categoriesTable.name,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(and(...conditions))
    .orderBy(asc(productsTable.currentStock), asc(productsTable.name));

  // Search remains in JS (multi-field across name/brand/aliases/barcode)
  if (search) {
    const s = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.brand && p.brand.toLowerCase().includes(s)) ||
        (p.hinglishAliases && p.hinglishAliases.toLowerCase().includes(s)) ||
        (p.displayName && p.displayName.toLowerCase().includes(s)) ||
        (p.barcode && p.barcode.toLowerCase().includes(s))
    );
  }

  if (lowStockOnly) products = products.filter((p) => Number(p.currentStock) <= Number(p.lowStockLimit) && Number(p.currentStock) > 0);
  if (outOfStockOnly) products = products.filter((p) => Number(p.currentStock) <= 0);
  if (limit) products = products.slice(0, limit);

  res.json(products);
```

Also ensure `and` is in the drizzle import at the top of the file:
```typescript
import { eq, and, asc, desc, isNull, or } from "drizzle-orm";
```

---

## Step 4 — Fix Auth Guard

### File: `artifacts/safai-market/src/components/auth-guard.tsx`

**Change:** Add `/auth/onboarding` to `PUBLIC_PATHS` to fix infinite redirect loop (BUG-012).

Find:
```typescript
const PUBLIC_PATHS = ["/auth/login", "/auth/register"];
```

Replace with:
```typescript
// FIX BUG-012: /auth/onboarding must be public or guard redirects to itself infinitely
const PUBLIC_PATHS = ["/auth/login", "/auth/register", "/auth/onboarding"];
```

---

## Step 5 — Fix Auth Provider (Settings Sync)

### File: `artifacts/safai-market/src/components/auth-provider.tsx`

**Change:** After fetching the shop from server, call `syncFromShop()` to populate settings store. This fixes BUG-013 where settings reset on device switch.

Find the `loadShop` function and replace it:

```typescript
const loadShop = async (token: string) => {
  try {
    const res = await fetch("/api/shops/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const shop = await res.json();
      setShop(shop);
      // FIX BUG-013: Sync server shop data into settings so storeName/gstNumber
      // survive device switching
      useSettingsStore.getState().syncFromShop(shop);
    } else {
      setShop(null);
    }
  } catch {
    setShop(null);
  }
};
```

Add import at top of file:
```typescript
import { useSettingsStore } from "@/stores/settings";
```

---

## Step 6 — Fix Onboarding Redirect

### File: `artifacts/safai-market/src/pages/auth/onboarding.tsx`

**Change:** After shop creation, explicitly redirect to `/` dashboard. Currently it just sets shop in store and stays on the onboarding page.

Add `useLocation` import:
```typescript
import { useLocation } from "wouter";
```

Add inside component:
```typescript
const [, setLocation] = useLocation();
```

In the `handleSubmit` success block, after `setShop(shop)`:
```typescript
setShop({
  id: shop.id,
  name: shop.name,
  ownerId: shop.ownerId,
  phone: shop.phone,
  address: shop.address,
  gstNumber: shop.gstNumber,
});
toast({ title: "Shop created!", description: `Welcome to ${shop.name} 🎉` });
// FIX: Explicit redirect to dashboard after shop creation
setLocation("/");
```

---

## Step 7 — Fix Cart Store

### File: `artifacts/safai-market/src/stores/cart.ts`

**Changes:**
1. BUG-010: Key localStorage by `shopId` so different shop accounts don't share cart
2. BUG-016: Clamp item discount to `[0, unitPrice]`
3. H2: Add `_submitKey` for double-submit prevention
4. Phase 2: Add GST fields to `CartItem` and `getGstBreakdown()` method

**Add to `CartItem` interface:**
```typescript
// GST fields
gstRate: number;
gstInclusive: boolean;
```

**In `addItem`**, when creating a new item, add:
```typescript
gstRate: Number(product.gstRate ?? 0),
gstInclusive: product.gstInclusive ?? true,
```

**Replace `setItemDiscount`:**
```typescript
setItemDiscount: (productId, discount) => {
  // FIX BUG-016: Clamp to [0, unitPrice], no negative discounts
  const item = get().items.find((i) => i.productId === productId);
  const clamped = Math.max(0, Math.min(discount, item?.unitPrice ?? discount));
  set({
    items: get().items.map((i) =>
      i.productId === productId ? { ...i, itemDiscount: clamped } : i
    ),
  });
},
```

**Add `_submitKey` to state and `clearCart`:**
```typescript
// In initial state
_submitKey: `sk-${Date.now()}`,

// In clearCart — generate new key after clearing
clearCart: () =>
  set({
    items: [],
    billDiscount: 0,
    billDiscountType: "flat",
    customerId: "",
    notes: "",
    _submitKey: `sk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }),
```

**Add `getGstBreakdown` method:**
```typescript
getGstBreakdown: () => {
  const { items } = get();
  const isInterState = false; // Future: derive from shop vs customer state
  let totalGst = 0;

  for (const item of items) {
    if (!item.gstRate || item.gstRate === 0) continue;
    const lineTotal = (item.unitPrice - item.itemDiscount) * item.quantity;
    if (item.gstInclusive) {
      totalGst += lineTotal * item.gstRate / (100 + item.gstRate);
    } else {
      totalGst += lineTotal * item.gstRate / 100;
    }
  }

  // Proportionally reduce GST by bill discount
  const sub = get().getSubtotal();
  const discountRatio = sub > 0 ? get().getDiscountAmount() / sub : 0;
  totalGst = totalGst * (1 - discountRatio);

  const half = totalGst / 2;
  return {
    isInterState,
    totalGst,
    cgst: isInterState ? 0 : half,
    sgst: isInterState ? 0 : half,
    igst: isInterState ? totalGst : 0,
  };
},
```

**Fix localStorage key (BUG-010):**
```typescript
// Replace the persist name from static string to shop-scoped
// At the bottom of the persist config:
{
  name: (() => {
    // Lazy-evaluated at store init time
    const { useAuthStore } = require("./auth");
    const shop = useAuthStore.getState().shop;
    return shop ? `safai-cart-${shop.id}` : "safai-cart-guest";
  })(),
  partialize: (state) => ({
    items: state.items,
    billDiscount: state.billDiscount,
    billDiscountType: state.billDiscountType,
    customerId: state.customerId,
    notes: state.notes,
  }),
}
```

> **Note:** If the lazy require causes issues in your bundler, use a static key `"safai-cart"` and call `clearCart()` explicitly on logout instead.

---

## Step 8 — Fix Settings Store

### File: `artifacts/safai-market/src/stores/settings.ts`

**Changes:** Add `syncFromShop()` and `persistToServer()` methods (BUG-013).

Add to `SettingsStore` interface:
```typescript
syncFromShop: (shop: { name?: string | null; phone?: string | null; address?: string | null; gstNumber?: string | null }) => void;
persistToServer: () => Promise<void>;
```

Add implementations in the store:
```typescript
syncFromShop: (shop) => {
  set((state) => ({
    settings: {
      ...state.settings,
      storeName: shop.name?.trim() || state.settings.storeName,
      phone: shop.phone?.trim() || state.settings.phone,
      address: shop.address?.trim() || state.settings.address,
      gstNumber: shop.gstNumber?.trim() || state.settings.gstNumber,
      // Auto-enable GST display if GST number is present
      showGst: Boolean(shop.gstNumber?.trim()) || state.settings.showGst,
    },
  }));
},

persistToServer: async () => {
  const { settings } = get();
  const { useAuthStore } = await import("./auth");
  const token = useAuthStore.getState().getToken();
  if (!token) return;
  try {
    await fetch("/api/shops/my", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: settings.storeName,
        phone: settings.phone || null,
        address: settings.address || null,
        gstNumber: settings.gstNumber || null,
      }),
    });
  } catch {
    // Fail silently — settings still saved in localStorage
  }
},
```

---

## Step 9 — Fix Store Settings Page

### File: `artifacts/safai-market/src/pages/settings/store.tsx`

**Change:** Call `persistToServer()` on save so settings sync to server (BUG-013).

Change `handleSave` from sync to async:
```typescript
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!form.storeName.trim()) {
    toast({ title: "Store name is required", variant: "destructive" });
    return;
  }
  updateSettings({
    storeName: form.storeName.trim(),
    storeTagline: form.storeTagline.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
    gstNumber: form.gstNumber.trim(),
    footerMessage: form.footerMessage.trim(),
    paperSize: form.paperSize as "58mm" | "A4" | "A5",
    showDiscount: form.showDiscount,
    showGst: form.showGst,
  });
  // FIX BUG-013: Persist to server so settings survive device switch
  await useSettingsStore.getState().persistToServer();
  toast({ title: "Settings saved!", description: "Your store settings have been updated." });
  setLocation("/more");
};
```

---

## Step 10 — Fix Billing Page

### File: `artifacts/safai-market/src/pages/billing/index.tsx`

**Changes:** Walk-in fix, double-submit guard, GST checkout summary, safe-area button fix.

#### Change 1 — Walk-in SelectItem value (BUG-003/018)
Find:
```tsx
<SelectItem value="0">Walk-in</SelectItem>
```
Replace with:
```tsx
<SelectItem value="">Walk-in</SelectItem>
```

#### Change 2 — Cart FAB positioning (safe-area fix)
Find:
```tsx
className="fixed bottom-[60px] left-0 right-0 z-30 px-3 pb-2"
```
Replace with:
```tsx
className="fixed left-0 right-0 z-30 px-3"
style={{ bottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
```

#### Change 3 — CheckoutSheet: Add double-submit guard + GST summary

In `CheckoutSheet` component, add state:
```typescript
const [submitted, setSubmitted] = useState(false);
const { settings } = useSettingsStore();
const gstBreakdown = useCartStore().getGstBreakdown();
```

Add `useEffect` to reset on open:
```typescript
useEffect(() => {
  if (open) setSubmitted(false);
}, [open]);
```

Add guard at start of `handleConfirm`:
```typescript
// FIX H2: Prevent double-submit
if (submitted || createBill.isPending) return;

// FIX BUG-003: Only validate udhaar against real customer (not Walk-in empty string)
const hasRealCustomer = Boolean(customerId && customerId !== "");
if (udhaarAmount > 0 && !hasRealCustomer) {
  toast({ title: "Customer required", description: "Select a customer to record udhaar.", variant: "destructive" });
  return;
}

setSubmitted(true);
```

Change `customerId` in the mutate call:
```typescript
// Before: customerId: customerId ? Number(customerId) : undefined
// After:
customerId: hasRealCustomer ? Number(customerId) : undefined,
```

Add `setSubmitted(false)` in both `onSuccess` and `onError` callbacks.

Add GST summary before the Confirm button:
```tsx
{gstBreakdown.totalGst > 0 && (
  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm mb-2">
    <div className="flex justify-between text-blue-700 font-medium mb-1">
      <span>Taxable Amount</span>
      <span>{formatCurrency(total - gstBreakdown.totalGst)}</span>
    </div>
    {gstBreakdown.isInterState ? (
      <div className="flex justify-between text-blue-600 text-xs">
        <span>IGST</span><span>{formatCurrency(gstBreakdown.igst)}</span>
      </div>
    ) : (
      <>
        <div className="flex justify-between text-blue-600 text-xs">
          <span>CGST</span><span>{formatCurrency(gstBreakdown.cgst)}</span>
        </div>
        <div className="flex justify-between text-blue-600 text-xs">
          <span>SGST</span><span>{formatCurrency(gstBreakdown.sgst)}</span>
        </div>
      </>
    )}
  </div>
)}
```

Update Confirm button disabled condition:
```tsx
disabled={createBill.isPending || submitted || items.length === 0}
```

#### Change 4 — Pass GST data to BillSuccessData and handlePrint

Update `BillSuccessData` type to include:
```typescript
gstBreakdown?: { cgst: number; sgst: number; igst: number; totalGst: number; isInterState: boolean };
storeGstNumber?: string;
showGst?: boolean;
```

In `onSuccess` callback, add to the `onSuccess(...)` call:
```typescript
gstBreakdown: gstBreakdown.totalGst > 0 ? gstBreakdown : undefined,
storeGstNumber: settings.gstNumber,
showGst: settings.showGst,
```

In `handlePrint` inside `BillSuccessScreen`, add:
```typescript
storeGstNumber: bill.storeGstNumber,
gstBreakdown: bill.gstBreakdown,
showGst: bill.showGst,
storeAddress: settings.address,
storePhone: settings.phone,
paperSize: settings.paperSize,
```

---

## Step 11 — Add GST Fields to Product Forms

### File: `artifacts/safai-market/src/pages/products/new.tsx`

**Change:** Add GST section to new product form. Section only appears when shop has a GST number set.

Add constant at top of file:
```typescript
const GST_RATES = [
  { label: "0% (Exempt)", value: "0" },
  { label: "5%", value: "5" },
  { label: "12%", value: "12" },
  { label: "18%", value: "18" },
  { label: "28%", value: "28" },
];
```

Add to `formData` state:
```typescript
hsnCode: "", gstRate: "0", gstInclusive: true,
```

Add to settings destructuring:
```typescript
const { settings } = useSettingsStore();
const gstEnabled = Boolean(settings.gstNumber?.trim());
```

Add GST preview computation (useMemo):
```typescript
const gstPreview = useMemo(() => {
  const rate = Number(formData.gstRate);
  const price = Number(formData.sellPrice);
  if (!rate || !price) return null;
  if (formData.gstInclusive) {
    const base = price * 100 / (100 + rate);
    const gst = price - base;
    return { base: base.toFixed(2), gst: gst.toFixed(2) };
  } else {
    const gst = price * rate / 100;
    return { base: price.toFixed(2), gst: gst.toFixed(2) };
  }
}, [formData.gstRate, formData.sellPrice, formData.gstInclusive]);
```

Add to submit data:
```typescript
hsnCode: formData.hsnCode || undefined,
gstRate: Number(formData.gstRate),
gstInclusive: formData.gstInclusive,
```

Add this `FormCard` in the JSX, **after the Stock & Unit card and before Search & Barcode**:
```tsx
{gstEnabled && (
  <FormCard title="GST / Tax">
    <p className="text-xs text-muted-foreground -mt-1 mb-1">
      Your shop has GST enabled. Set tax rate per product.
    </p>

    <FormField label="GST Rate">
      <Select value={formData.gstRate} onValueChange={(val) => setFormData(p => ({ ...p, gstRate: val }))}>
        <SelectTrigger className="h-12 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GST_RATES.map(r => (
            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>

    <FormField label="HSN / SAC Code" hint="Optional — for tax compliance">
      <Input
        name="hsnCode"
        value={formData.hsnCode}
        onChange={handleChange}
        placeholder="e.g. 3402 (cleaning products)"
        className="h-12 rounded-xl border-muted focus:border-primary font-mono"
      />
    </FormField>

    {Number(formData.gstRate) > 0 && (
      <div className="flex items-center justify-between rounded-xl border border-muted/50 bg-background px-4 py-3">
        <div>
          <p className="text-sm font-medium">Price includes GST</p>
          <p className="text-xs text-muted-foreground">
            {formData.gstInclusive ? "Sell price already includes tax" : "GST added on top of sell price"}
          </p>
        </div>
        <Switch
          checked={formData.gstInclusive}
          onCheckedChange={(v) => setFormData(p => ({ ...p, gstInclusive: v }))}
        />
      </div>
    )}

    {gstPreview && Number(formData.gstRate) > 0 && (
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">GST Preview</p>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base Price</span>
          <span className="font-semibold">₹{gstPreview.base}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">CGST ({Number(formData.gstRate)/2}%)</span>
          <span className="font-semibold text-blue-700">₹{(Number(gstPreview.gst)/2).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">SGST ({Number(formData.gstRate)/2}%)</span>
          <span className="font-semibold text-blue-700">₹{(Number(gstPreview.gst)/2).toFixed(2)}</span>
        </div>
      </div>
    )}
  </FormCard>
)}
```

---

### File: `artifacts/safai-market/src/pages/products/edit.tsx`

**Change:** Load and save GST fields in the edit form. Same GST card as `new.tsx`.

Add to `formData` initial state:
```typescript
hsnCode: "", gstRate: "0", gstInclusive: true as boolean,
```

In the `useEffect` that populates from `product`, add:
```typescript
hsnCode: (product as any).hsnCode ?? "",
gstRate: (product as any).gstRate != null ? String(Number((product as any).gstRate)) : "0",
gstInclusive: (product as any).gstInclusive ?? true,
```

In `updateProduct.mutate` data, add:
```typescript
hsnCode: (formData as any).hsnCode || undefined,
gstRate: Number((formData as any).gstRate ?? 0),
gstInclusive: (formData as any).gstInclusive ?? true,
```

Add the same GST `FormCard` JSX as in `new.tsx` (copy exactly).

---

## Step 12 — Update Receipt (GST Tax Invoice)

### File: `artifacts/safai-market/src/lib/receipt.ts`

**Change:** Full replacement. The receipt now generates "TAX INVOICE" with CGST/SGST/IGST breakdown when GST is enabled, and "RETAIL BILL" when not.

**Key changes to the `ReceiptData` interface — add:**
```typescript
gstBreakdown?: {
  cgst: number; sgst: number; igst: number;
  totalGst: number; isInterState: boolean;
};
showGst?: boolean;
storeGstNumber?: string;
customerGstin?: string; // For B2B
```

**Key changes to `printReceipt` function:**
1. Set `invoiceTitle` to `"TAX INVOICE"` when GST is enabled, else `"RETAIL BILL"`
2. Show GSTIN line in store header
3. Add HSN row under each item when GST enabled
4. Add CGST/SGST/IGST rows in totals section
5. Show taxable amount separately from total

The logic for `hasGst`:
```typescript
const hasGst = data.showGst && data.storeGstNumber && data.gstBreakdown && data.gstBreakdown.totalGst > 0;
```

Tax rows in the totals table:
```html
<!-- Taxable amount row -->
<tr><td>Taxable Amount</td><td>₹X</td></tr>
<!-- CGST / SGST or IGST based on isInterState -->
<tr><td>CGST</td><td>₹X</td></tr>
<tr><td>SGST</td><td>₹X</td></tr>
<!-- Or for inter-state: -->
<tr><td>IGST</td><td>₹X</td></tr>
```

---

## Summary of All Changes

| File | Type | Bugs Fixed |
|---|---|---|
| `lib/db/migrations/001_gst_and_fixes.sql` | NEW | Migration |
| `lib/db/src/schema/products.ts` | MODIFIED | Phase 2 GST fields |
| `lib/db/src/schema/activity_log.ts` | MODIFIED | BUG-009 shop_id |
| `artifacts/api-server/src/routes/bills.ts` | MODIFIED | BUG-001,002,003,004,005,007,009,016 |
| `artifacts/api-server/src/routes/products.ts` | MODIFIED | BUG-006 SQL filters |
| `artifacts/safai-market/src/components/auth-guard.tsx` | MODIFIED | BUG-012 redirect loop |
| `artifacts/safai-market/src/components/auth-provider.tsx` | MODIFIED | BUG-013 settings sync |
| `artifacts/safai-market/src/pages/auth/onboarding.tsx` | MODIFIED | Onboarding redirect |
| `artifacts/safai-market/src/pages/billing/index.tsx` | MODIFIED | BUG-003,018,H2, safe-area, GST |
| `artifacts/safai-market/src/pages/products/new.tsx` | MODIFIED | Phase 2 GST form |
| `artifacts/safai-market/src/pages/products/edit.tsx` | MODIFIED | Phase 2 GST form |
| `artifacts/safai-market/src/pages/settings/store.tsx` | MODIFIED | BUG-013 server persist |
| `artifacts/safai-market/src/stores/cart.ts` | MODIFIED | BUG-010,016,H2, Phase 2 GST |
| `artifacts/safai-market/src/stores/settings.ts` | MODIFIED | BUG-013 syncFromShop |
| `artifacts/safai-market/src/lib/receipt.ts` | MODIFIED | Phase 2 Tax Invoice |

---

## Verification Checklist

After applying all changes, verify:

- [ ] `pnpm build` completes without TypeScript errors
- [ ] Migration runs without errors on the DB
- [ ] Create a bill with Walk-in customer — no DB error
- [ ] Create two bills simultaneously — both get unique bill numbers
- [ ] Cancel a bill — stock is restored correctly
- [ ] Try to GET `/api/bills/1` from a different shop's token — returns 404
- [ ] Add a product with GST 18% — HSN and rate saved in DB
- [ ] Create bill with GST product — checkout shows CGST/SGST breakdown
- [ ] Print receipt — shows "TAX INVOICE" with GSTIN when GST enabled
- [ ] Print receipt without GST — shows "RETAIL BILL"
- [ ] Login on a second device — store name appears correctly from server
- [ ] Save settings — changes reflected after logout/login on fresh device
