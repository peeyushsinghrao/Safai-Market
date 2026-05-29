import { Router, type IRouter } from "express";
import { db, categoriesTable } from "@workspace/db";
import { CreateCategoryBody } from "@workspace/api-zod";
import { asc, eq, isNull, or } from "drizzle-orm";
import { optionalAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/categories", optionalAuth, async (req, res): Promise<void> => {
  const shopFilter = req.shopId
    ? or(isNull(categoriesTable.shopId), eq(categoriesTable.shopId, req.shopId))
    : isNull(categoriesTable.shopId);

  const categories = await db
    .select()
    .from(categoriesTable)
    .where(shopFilter)
    .orderBy(asc(categoriesTable.name));
  res.json(categories);
});

router.post("/categories", optionalAuth, async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [cat] = await db
    .insert(categoriesTable)
    .values({ ...parsed.data, shopId: req.shopId ?? null })
    .returning();
  res.status(201).json(cat);
});

export default router;
