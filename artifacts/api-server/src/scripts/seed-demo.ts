import { db, categoriesTable, productsTable, customersTable, suppliersTable, billsTable, billItemsTable, expensesTable, activityLogTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seedDemo() {
  console.log("🌱 Seeding demo data for Anupurna Traders (Safai Market)...");

  // ── Categories ──────────────────────────────────────────────────
  const catRows = await db.insert(categoriesTable).values([
    { name: "Soap & Detergent", description: "Cleaning agents" },
    { name: "Oil & Ghee", description: "Cooking oils and ghee" },
    { name: "Atta & Flour", description: "Wheat flour and grain products" },
    { name: "Spices", description: "Masalas and spices" },
    { name: "Beverages", description: "Tea, coffee, drinks" },
    { name: "Personal Care", description: "Shampoo, cream, toothpaste" },
    { name: "Dairy", description: "Milk, butter, paneer" },
  ]).returning();
  console.log(`  ✔ ${catRows.length} categories`);

  const catMap = Object.fromEntries(catRows.map(c => [c.name, c.id]));

  // ── Products (with buy prices for profit tracking) ────────────
  const now = new Date();
  const productData = [
    // Soap & Detergent — HIGH margin
    { name: "Surf Excel 1kg", brand: "HUL", categoryId: catMap["Soap & Detergent"], unit: "kg", buyPrice: "85", sellPrice: "120", mrp: "130", currentStock: 45, lowStockLimit: 10 },
    { name: "Vim Bar 200g", brand: "HUL", categoryId: catMap["Soap & Detergent"], unit: "pc", buyPrice: "18", sellPrice: "26", mrp: "28", currentStock: 80, lowStockLimit: 20 },
    { name: "Ariel 500g", brand: "P&G", categoryId: catMap["Soap & Detergent"], unit: "pc", buyPrice: "72", sellPrice: "98", mrp: "105", currentStock: 30, lowStockLimit: 8 },
    { name: "Dettol Soap 75g", brand: "Reckitt", categoryId: catMap["Soap & Detergent"], unit: "pc", buyPrice: "28", sellPrice: "40", mrp: "45", currentStock: 60, lowStockLimit: 15 },
    { name: "Phenyl 500ml", brand: "Generic", categoryId: catMap["Soap & Detergent"], unit: "bottle", buyPrice: "35", sellPrice: "52", mrp: "55", currentStock: 3, lowStockLimit: 5 },

    // Oil & Ghee — GOOD margin
    { name: "Fortune Sunflower Oil 1L", brand: "Fortune", categoryId: catMap["Oil & Ghee"], unit: "bottle", buyPrice: "120", sellPrice: "148", mrp: "155", currentStock: 25, lowStockLimit: 8 },
    { name: "Patanjali Mustard Oil 1L", brand: "Patanjali", categoryId: catMap["Oil & Ghee"], unit: "bottle", buyPrice: "115", sellPrice: "140", mrp: "145", currentStock: 18, lowStockLimit: 5 },
    { name: "Amul Ghee 500g", brand: "Amul", categoryId: catMap["Oil & Ghee"], unit: "jar", buyPrice: "245", sellPrice: "290", mrp: "300", currentStock: 12, lowStockLimit: 4 },
    { name: "Saffola Gold 1L", brand: "Marico", categoryId: catMap["Oil & Ghee"], unit: "bottle", buyPrice: "155", sellPrice: "188", mrp: "195", currentStock: 10, lowStockLimit: 4 },

    // Atta & Flour — LOW margin (tight commodity)
    { name: "Aashirvaad Atta 5kg", brand: "ITC", categoryId: catMap["Atta & Flour"], unit: "bag", buyPrice: "205", sellPrice: "225", mrp: "235", currentStock: 20, lowStockLimit: 5 },
    { name: "Chakki Fresh Atta 10kg", brand: "Local", categoryId: catMap["Atta & Flour"], unit: "bag", buyPrice: "370", sellPrice: "400", mrp: "410", currentStock: 8, lowStockLimit: 3 },
    { name: "Besan 1kg", brand: "Rajdhani", categoryId: catMap["Atta & Flour"], unit: "kg", buyPrice: "60", sellPrice: "72", mrp: "75", currentStock: 22, lowStockLimit: 6 },

    // Spices — HIGH margin
    { name: "MDH Garam Masala 100g", brand: "MDH", categoryId: catMap["Spices"], unit: "pc", buyPrice: "35", sellPrice: "55", mrp: "60", currentStock: 35, lowStockLimit: 10 },
    { name: "Everest Rajma Masala 50g", brand: "Everest", categoryId: catMap["Spices"], unit: "pc", buyPrice: "22", sellPrice: "35", mrp: "38", currentStock: 28, lowStockLimit: 8 },
    { name: "Haldi 100g", brand: "Local", categoryId: catMap["Spices"], unit: "pc", buyPrice: "14", sellPrice: "22", mrp: "25", currentStock: 45, lowStockLimit: 10 },
    { name: "Red Chilli Powder 200g", brand: "Local", categoryId: catMap["Spices"], unit: "pc", buyPrice: "28", sellPrice: "42", mrp: "45", currentStock: 2, lowStockLimit: 5 },

    // Beverages — GOOD margin
    { name: "Tata Tea Premium 250g", brand: "Tata", categoryId: catMap["Beverages"], unit: "pack", buyPrice: "82", sellPrice: "108", mrp: "115", currentStock: 20, lowStockLimit: 5 },
    { name: "Bru Coffee 50g", brand: "HUL", categoryId: catMap["Beverages"], unit: "jar", buyPrice: "75", sellPrice: "98", mrp: "105", currentStock: 15, lowStockLimit: 4 },
    { name: "Nestle Milo 400g", brand: "Nestle", categoryId: catMap["Beverages"], unit: "jar", buyPrice: "210", sellPrice: "268", mrp: "280", currentStock: 8, lowStockLimit: 3 },

    // Personal Care — HIGH margin
    { name: "Colgate MaxFresh 150g", brand: "Colgate", categoryId: catMap["Personal Care"], unit: "pc", buyPrice: "48", sellPrice: "72", mrp: "78", currentStock: 25, lowStockLimit: 8 },
    { name: "Head & Shoulders 180ml", brand: "P&G", categoryId: catMap["Personal Care"], unit: "bottle", buyPrice: "155", sellPrice: "210", mrp: "225", currentStock: 12, lowStockLimit: 4 },
    { name: "Vaseline Body Lotion 200ml", brand: "HUL", categoryId: catMap["Personal Care"], unit: "bottle", buyPrice: "105", sellPrice: "148", mrp: "155", currentStock: 10, lowStockLimit: 3 },
    { name: "Fair & Lovely 25g", brand: "HUL", categoryId: catMap["Personal Care"], unit: "tube", buyPrice: "22", sellPrice: "35", mrp: "38", currentStock: 0, lowStockLimit: 5 },

    // Dairy
    { name: "Amul Butter 100g", brand: "Amul", categoryId: catMap["Dairy"], unit: "pc", buyPrice: "50", sellPrice: "62", mrp: "65", currentStock: 15, lowStockLimit: 5 },
    { name: "Mother Dairy Paneer 200g", brand: "Mother Dairy", categoryId: catMap["Dairy"], unit: "pack", buyPrice: "78", sellPrice: "95", mrp: "100", currentStock: 6, lowStockLimit: 4 },
  ];

  const prodRows = await db.insert(productsTable).values(
    productData.map(p => ({
      ...p,
      status: "active" as const,
      aliases: [],
    }))
  ).returning();
  console.log(`  ✔ ${prodRows.length} products`);

  // ── Customers ───────────────────────────────────────────────────
  const custRows = await db.insert(customersTable).values([
    { name: "Ramu Kaka", phone: "9876543210", udhaarBalance: "0", status: "active" as const },
    { name: "Sunita Devi", phone: "9123456789", udhaarBalance: "0", status: "active" as const },
    { name: "Ramesh Sharma", phone: "9012345678", udhaarBalance: "0", status: "active" as const },
    { name: "Preeti Gupta", phone: "9988776655", udhaarBalance: "0", status: "active" as const },
    { name: "Mohan Lal", phone: "9911223344", udhaarBalance: "0", status: "active" as const },
  ]).returning();
  console.log(`  ✔ ${custRows.length} customers`);

  // ── Suppliers ───────────────────────────────────────────────────
  await db.insert(suppliersTable).values([
    { name: "Mahavir Distributors", contactName: "Ramesh", phone: "9000100200", pendingAmount: "4500", status: "active" as const },
    { name: "Shree Ram Wholesale", contactName: "Vijay", phone: "9000200300", pendingAmount: "12000", status: "active" as const },
    { name: "HUL Direct", contactName: "Suresh", phone: "9000300400", pendingAmount: "0", status: "active" as const },
  ]);
  console.log("  ✔ 3 suppliers");

  // ── Bills (last 10 days) ─────────────────────────────────────
  const productMap = Object.fromEntries(prodRows.map(p => [p.name, p]));

  const billTemplates = [
    // Today
    {
      daysAgo: 0, hoursAgo: 1, cashAmount: 310, upiAmount: 0, udhaarAmount: 0, customerId: null,
      items: [
        { name: "Surf Excel 1kg", qty: 2 },
        { name: "Vim Bar 200g", qty: 3 },
        { name: "Haldi 100g", qty: 1 },
      ]
    },
    {
      daysAgo: 0, hoursAgo: 2, cashAmount: 0, upiAmount: 280, udhaarAmount: 0, customerId: null,
      items: [
        { name: "Fortune Sunflower Oil 1L", qty: 1 },
        { name: "Aashirvaad Atta 5kg", qty: 1 },
      ]
    },
    {
      daysAgo: 0, hoursAgo: 3, cashAmount: 100, upiAmount: 0, udhaarAmount: 148, customerId: custRows[0].id,
      items: [
        { name: "Tata Tea Premium 250g", qty: 1 },
        { name: "Amul Butter 100g", qty: 2 },
      ]
    },
    // Yesterday
    {
      daysAgo: 1, hoursAgo: 4, cashAmount: 450, upiAmount: 100, udhaarAmount: 0, customerId: null,
      items: [
        { name: "Fortune Sunflower Oil 1L", qty: 2 },
        { name: "MDH Garam Masala 100g", qty: 2 },
        { name: "Dettol Soap 75g", qty: 2 },
      ]
    },
    {
      daysAgo: 1, hoursAgo: 5, cashAmount: 300, upiAmount: 0, udhaarAmount: 0, customerId: null,
      items: [
        { name: "Head & Shoulders 180ml", qty: 1 },
        { name: "Colgate MaxFresh 150g", qty: 1 },
      ]
    },
    // 2 days ago
    {
      daysAgo: 2, hoursAgo: 2, cashAmount: 520, upiAmount: 0, udhaarAmount: 0, customerId: null,
      items: [
        { name: "Amul Ghee 500g", qty: 1 },
        { name: "Besan 1kg", qty: 2 },
        { name: "Everest Rajma Masala 50g", qty: 2 },
      ]
    },
    {
      daysAgo: 2, hoursAgo: 6, cashAmount: 0, upiAmount: 190, udhaarAmount: 0, customerId: null,
      items: [
        { name: "Patanjali Mustard Oil 1L", qty: 1 },
        { name: "Tata Tea Premium 250g", qty: 1 },
      ]
    },
    // 3 days ago
    {
      daysAgo: 3, hoursAgo: 3, cashAmount: 600, upiAmount: 0, udhaarAmount: 0, customerId: null,
      items: [
        { name: "Surf Excel 1kg", qty: 3 },
        { name: "Ariel 500g", qty: 1 },
        { name: "Vim Bar 200g", qty: 4 },
      ]
    },
    // 5 days ago
    {
      daysAgo: 5, hoursAgo: 2, cashAmount: 380, upiAmount: 0, udhaarAmount: 0, customerId: null,
      items: [
        { name: "Saffola Gold 1L", qty: 1 },
        { name: "Chakki Fresh Atta 10kg", qty: 1 },
      ]
    },
    {
      daysAgo: 5, hoursAgo: 4, cashAmount: 200, upiAmount: 108, udhaarAmount: 95, customerId: custRows[1].id,
      items: [
        { name: "Mother Dairy Paneer 200g", qty: 1 },
        { name: "Nestle Milo 400g", qty: 1 },
        { name: "Bru Coffee 50g", qty: 1 },
      ]
    },
    // 7 days ago
    {
      daysAgo: 7, hoursAgo: 1, cashAmount: 420, upiAmount: 0, udhaarAmount: 0, customerId: null,
      items: [
        { name: "Fortune Sunflower Oil 1L", qty: 2 },
        { name: "Aashirvaad Atta 5kg", qty: 1 },
        { name: "Red Chilli Powder 200g", qty: 2 },
      ]
    },
    // 10 days ago
    {
      daysAgo: 10, hoursAgo: 3, cashAmount: 550, upiAmount: 0, udhaarAmount: 0, customerId: null,
      items: [
        { name: "Head & Shoulders 180ml", qty: 1 },
        { name: "Vaseline Body Lotion 200ml", qty: 1 },
        { name: "Colgate MaxFresh 150g", qty: 2 },
      ]
    },
  ];

  let billCount = 0;
  let billNumCounter = 1;
  for (const tmpl of billTemplates) {
    const billDate = new Date(now.getTime() - tmpl.daysAgo * 86400000 - tmpl.hoursAgo * 3600000);
    const billItems = tmpl.items
      .map(i => ({ product: productMap[i.name], qty: i.qty }))
      .filter(i => i.product);

    const totalAmount = billItems.reduce((s, i) => s + Number(i.product.sellPrice) * i.qty, 0);
    const udhaarAmt = totalAmount - tmpl.cashAmount - tmpl.upiAmount;

    let estimatedProfit = 0;
    let hasProfit = false;
    for (const bi of billItems) {
      if (bi.product.buyPrice) {
        estimatedProfit += (Number(bi.product.sellPrice) - Number(bi.product.buyPrice)) * bi.qty;
        hasProfit = true;
      }
    }

    const billNumber = `BILL-${String(billNumCounter++).padStart(4, "0")}`;

    const [bill] = await db.insert(billsTable).values({
      billNumber,
      customerId: tmpl.customerId,
      totalAmount: String(totalAmount),
      discountAmount: "0",
      cashAmount: String(tmpl.cashAmount),
      upiAmount: String(tmpl.upiAmount),
      udhaarAmount: String(Math.max(0, udhaarAmt)),
      estimatedProfit: hasProfit ? String(estimatedProfit) : null,
      status: "active",
      createdAt: billDate,
      updatedAt: billDate,
    }).returning();

    await db.insert(billItemsTable).values(
      billItems.map(bi => ({
        billId: bill.id,
        productId: bi.product.id,
        productName: bi.product.name,
        quantity: bi.qty,
        unitPrice: String(bi.product.sellPrice),
        totalPrice: String(Number(bi.product.sellPrice) * bi.qty),
        discountAmount: "0",
        buyPriceSnapshot: bi.product.buyPrice,
        profitAmount: bi.product.buyPrice
          ? String((Number(bi.product.sellPrice) - Number(bi.product.buyPrice)) * bi.qty)
          : null,
        createdAt: billDate,
        updatedAt: billDate,
      }))
    );

    // Update customer udhaar if applicable
    if (tmpl.customerId && udhaarAmt > 0) {
      const cust = custRows.find(c => c.id === tmpl.customerId);
      if (cust) {
        await db.update(customersTable)
          .set({ udhaarBalance: String(Number(cust.udhaarBalance) + udhaarAmt) })
          .where(eq(customersTable.id, tmpl.customerId));
      }
    }

    billCount++;
  }
  console.log(`  ✔ ${billCount} bills with items`);

  // ── Expenses ─────────────────────────────────────────────────
  await db.insert(expensesTable).values([
    { description: "Electricity bill", amount: "1800", category: "Utilities", createdAt: new Date(now.getTime() - 2 * 86400000) },
    { description: "Store rent", amount: "8000", category: "Rent", createdAt: new Date(now.getTime() - 5 * 86400000) },
    { description: "Shopkeeper tea & snacks", amount: "120", category: "Misc", createdAt: new Date(now.getTime() - 1 * 86400000) },
    { description: "Packaging bags", amount: "350", category: "Supplies", createdAt: new Date(now.getTime() - 3 * 86400000) },
  ]);
  console.log("  ✔ 4 expenses");

  // ── Activity log entries ─────────────────────────────────────
  await db.insert(activityLogTable).values([
    { eventType: "bill_created", description: "Bill created — Walk-in ₹310", amount: "310", createdAt: new Date(now.getTime() - 1 * 3600000) },
    { eventType: "bill_created", description: "Bill created — Walk-in ₹280", amount: "280", createdAt: new Date(now.getTime() - 2 * 3600000) },
    { eventType: "bill_created", description: "Bill created — Ramu Kaka ₹248", amount: "248", createdAt: new Date(now.getTime() - 3 * 3600000) },
    { eventType: "expense_added", description: "Expense: Store rent ₹8,000", amount: "8000", createdAt: new Date(now.getTime() - 5 * 86400000) },
    { eventType: "expense_added", description: "Expense: Electricity bill ₹1,800", amount: "1800", createdAt: new Date(now.getTime() - 2 * 86400000) },
  ]);
  console.log("  ✔ activity log seeded");

  console.log("\n✅ Demo data seeded successfully!");
  console.log("   Store: Anupurna Traders | Safai Market");
  console.log(`   Products: ${prodRows.length} | Customers: ${custRows.length} | Bills: ${billCount}`);
}

seedDemo().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
}).finally(() => process.exit(0));
