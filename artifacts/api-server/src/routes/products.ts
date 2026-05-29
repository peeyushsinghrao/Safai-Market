import { Router, type IRouter } from "express";
import { db, productsTable, stockMovementsTable, categoriesTable, activityLogTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  ArchiveProductParams,
  GetProductStockMovementsParams,
} from "@workspace/api-zod";
import { eq, and, asc, desc, isNull, or } from "drizzle-orm";
import { optionalAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/products", optionalAuth, async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search, categoryId, status, lowStockOnly, outOfStockOnly, limit } = query.data as typeof query.data & { limit?: number };

  const shopFilter = req.shopId
    ? eq(productsTable.shopId, req.shopId)
    : isNull(productsTable.shopId);

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
      createdAt: productsTable.createdAt,
      updatedAt: productsTable.updatedAt,
      categoryName: categoriesTable.name,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(shopFilter)
    .orderBy(asc(productsTable.currentStock), asc(productsTable.name));

  if (status) {
    products = products.filter((p) => p.status === status);
  } else {
    products = products.filter((p) => p.status === "active");
  }

  if (categoryId) {
    products = products.filter((p) => p.categoryId === categoryId);
  }

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

  if (lowStockOnly) {
    products = products.filter((p) => Number(p.currentStock) <= Number(p.lowStockLimit) && Number(p.currentStock) > 0);
  }

  if (outOfStockOnly) {
    products = products.filter((p) => Number(p.currentStock) <= 0);
  }

  if (limit) {
    products = products.slice(0, limit);
  }

  res.json(products);
});

router.post("/products", optionalAuth, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { initialStock, ...productData } = parsed.data as typeof parsed.data & { initialStock?: number };

  const [product] = await db
    .insert(productsTable)
    .values({ ...productData, shopId: req.shopId ?? null, currentStock: String(initialStock ?? 0) })
    .returning();

  if (initialStock && initialStock > 0) {
    await db.insert(stockMovementsTable).values({
      productId: product.id,
      productName: product.name,
      movementType: "adjustment",
      quantity: String(initialStock),
      stockBefore: "0",
      stockAfter: String(initialStock),
      reason: "Opening stock",
    });
  }

  res.status(201).json({ ...product, categoryName: null });
});

router.get("/products/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
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
      createdAt: productsTable.createdAt,
      updatedAt: productsTable.updatedAt,
      categoryName: categoriesTable.name,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(product);
});

router.patch("/products/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set(parsed.data)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ ...product, categoryName: null });
});

router.post("/products/:id/archive", optionalAuth, async (req, res): Promise<void> => {
  const params = ArchiveProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set({ status: "archived" })
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ ...product, categoryName: null });
});

router.get("/products/:id/stock-movements", optionalAuth, async (req, res): Promise<void> => {
  const params = GetProductStockMovementsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const movements = await db
    .select()
    .from(stockMovementsTable)
    .where(eq(stockMovementsTable.productId, params.data.id))
    .orderBy(desc(stockMovementsTable.createdAt))
    .limit(50);

  res.json(movements);
});

export default router;
