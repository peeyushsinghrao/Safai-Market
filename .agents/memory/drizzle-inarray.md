---
name: Drizzle inArray vs ANY
description: How to do WHERE id IN (array) queries in Drizzle ORM — raw sql ANY() does not work.
---

**Rule:** Use `inArray(column, array)` from `drizzle-orm` for array membership queries. Never use `sql\`${col} = ANY(${arr})\`` — Drizzle serialises JS arrays as tuple syntax `($1, $2)` which PostgreSQL rejects in an `ANY()` context.

**Why:** Drizzle's parameter binding for arrays with raw SQL produces invalid PostgreSQL syntax: `ANY(($1, $2))` instead of the required `= ANY(ARRAY[$1, $2])` or `IN ($1, $2)`.

**How to apply:** Import `inArray` alongside `eq`, `and`, etc. and use `where(inArray(table.column, ids))`. Guard with `ids.length > 0` before calling to avoid empty-array errors.
