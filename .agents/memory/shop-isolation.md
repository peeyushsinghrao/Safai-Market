---
name: Shop isolation pattern (multi-tenant)
description: How shop_id multi-tenancy is implemented across the Safai Market schema and API routes
---

## Rule
All data tables use a nullable `shop_id` integer column for multi-shop isolation.

**Schema tables with shop_id:** products, bills, customers, categories

**Why nullable:** Backward compat — existing demo/seed rows have shop_id = NULL and belong to no shop. When a user is NOT logged in (no req.shopId), they see the NULL-shop rows (demo data). When logged in, they see only their shop's rows.

**Filter pattern in routes:**
```typescript
const shopFilter = req.shopId
  ? eq(table.shopId, req.shopId)
  : isNull(table.shopId);
```

**Exception — categories:** Shows both global (NULL shop_id) AND shop-specific rows, so every shop sees the system categories:
```typescript
const shopFilter = req.shopId
  ? or(isNull(categoriesTable.shopId), eq(categoriesTable.shopId, req.shopId))
  : isNull(categoriesTable.shopId);
```

**On create:** Always stamp `shopId: req.shopId ?? null` on new records.

**Middleware:** All routes use `optionalAuth` (not `requireAuth`) so the app still works in demo mode without login.

**How to apply:** Any new data table that should be shop-scoped needs: (1) `shopId: integer("shop_id")` in schema, (2) run `pnpm --filter @workspace/db run push`, (3) add shopFilter to list/create routes.
