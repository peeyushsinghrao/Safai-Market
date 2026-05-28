import {
  db,
  categoriesTable,
  productsTable,
  customersTable,
  suppliersTable,
  activityLogTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.execute(sql`TRUNCATE activity_log, daily_closings, expenses, stock_movements, purchase_items, purchases, supplier_ledger, bill_items, bills, udhaar_ledger, customers, suppliers, products, categories RESTART IDENTITY CASCADE`);

  // Categories
  const [cleaning, washing, household, personal, tools] = await db
    .insert(categoriesTable)
    .values([
      { name: "Cleaning Supplies", subcategories: ["Floor Cleaner", "Toilet Cleaner", "Kitchen Cleaner", "Glass Cleaner"] },
      { name: "Washing & Laundry", subcategories: ["Detergent", "Fabric Softener", "Bleach"] },
      { name: "Household Items", subcategories: ["Dustbin", "Mop", "Broom", "Bucket"] },
      { name: "Personal Care", subcategories: ["Hand Wash", "Soap", "Sanitizer"] },
      { name: "Tools & Equipment", subcategories: ["Scrubber", "Sponge", "Gloves"] },
    ])
    .returning();

  // Products
  await db.insert(productsTable).values([
    // Cleaning Supplies
    { name: "Phenyl Floor Cleaner 1L", brand: "Lizol", categoryId: cleaning.id, unit: "bottle", buyPrice: "68", sellPrice: "85", currentStock: "24", lowStockLimit: "10", hinglishAliases: "phenyl,floor cleaner,lizol" },
    { name: "Toilet Cleaner 500ml", brand: "Harpic", categoryId: cleaning.id, unit: "bottle", buyPrice: "55", sellPrice: "70", currentStock: "3", lowStockLimit: "8", hinglishAliases: "harpic,toilet cleaner,bathroom cleaner" },
    { name: "Glass Cleaner Spray 500ml", brand: "Colin", categoryId: cleaning.id, unit: "bottle", buyPrice: "80", sellPrice: "99", currentStock: "0", lowStockLimit: "5", hinglishAliases: "colin,glass cleaner,mirror spray" },
    { name: "Multi-Surface Cleaner 1L", brand: "Domex", categoryId: cleaning.id, unit: "bottle", buyPrice: "72", sellPrice: "95", currentStock: "18", lowStockLimit: "6", hinglishAliases: "domex,surface cleaner,multipurpose" },
    { name: "Kitchen Degreaser 750ml", brand: "Vim", categoryId: cleaning.id, unit: "bottle", buyPrice: "60", sellPrice: "78", currentStock: "12", lowStockLimit: "6", hinglishAliases: "vim,kitchen cleaner,degreaser" },

    // Washing & Laundry
    { name: "Detergent Powder 1kg", brand: "Surf Excel", categoryId: washing.id, unit: "packet", buyPrice: "95", sellPrice: "120", currentStock: "35", lowStockLimit: "15", hinglishAliases: "surf,detergent,kapde dhone wala" },
    { name: "Detergent Powder 500g", brand: "Tide", categoryId: washing.id, unit: "packet", buyPrice: "48", sellPrice: "62", currentStock: "4", lowStockLimit: "10", hinglishAliases: "tide,washing powder,sabun" },
    { name: "Liquid Detergent 1L", brand: "Ariel", categoryId: washing.id, unit: "bottle", buyPrice: "140", sellPrice: "175", currentStock: "8", lowStockLimit: "5", hinglishAliases: "ariel,liquid detergent" },
    { name: "Fabric Softener 800ml", brand: "Comfort", categoryId: washing.id, unit: "bottle", buyPrice: "110", sellPrice: "138", currentStock: "6", lowStockLimit: "4", hinglishAliases: "comfort,softener,fabric softener" },

    // Household Items
    { name: "Plastic Bucket 15L", brand: "Nilkamal", categoryId: household.id, unit: "piece", buyPrice: "110", sellPrice: "145", currentStock: "20", lowStockLimit: "8", hinglishAliases: "bucket,balti" },
    { name: "Cotton Mop", brand: "Scotch Brite", categoryId: household.id, unit: "piece", buyPrice: "130", sellPrice: "165", currentStock: "2", lowStockLimit: "5", hinglishAliases: "mop,pochha,swab" },
    { name: "Dustbin 10L", brand: "Steelo", categoryId: household.id, unit: "piece", buyPrice: "85", sellPrice: "110", currentStock: "14", lowStockLimit: "6", hinglishAliases: "dustbin,bin,kachrapeti" },
    { name: "Broom (Soft)", brand: "Navrang", categoryId: household.id, unit: "piece", buyPrice: "42", sellPrice: "55", currentStock: "9", lowStockLimit: "5", hinglishAliases: "broom,jhadu" },

    // Personal Care
    { name: "Hand Wash 200ml", brand: "Dettol", categoryId: personal.id, unit: "bottle", buyPrice: "55", sellPrice: "70", currentStock: "22", lowStockLimit: "10", hinglishAliases: "dettol,handwash,haath dhone wala" },
    { name: "Hand Sanitizer 100ml", brand: "Dettol", categoryId: personal.id, unit: "bottle", buyPrice: "65", sellPrice: "85", currentStock: "11", lowStockLimit: "8", hinglishAliases: "sanitizer,handrub" },
    { name: "Bathing Soap 100g", brand: "Lifebuoy", categoryId: personal.id, unit: "piece", buyPrice: "20", sellPrice: "28", currentStock: "50", lowStockLimit: "20", hinglishAliases: "soap,sabun,lifebuoy" },

    // Tools
    { name: "Scrubber Pad (Pack of 3)", brand: "Scotch Brite", categoryId: tools.id, unit: "pack", buyPrice: "35", sellPrice: "48", currentStock: "30", lowStockLimit: "12", hinglishAliases: "scrubber,scotchbrite,scrub pad" },
    { name: "Rubber Gloves (M)", brand: "Bodyguard", categoryId: tools.id, unit: "pair", buyPrice: "28", sellPrice: "38", currentStock: "1", lowStockLimit: "6", hinglishAliases: "gloves,dastana,rubber gloves" },
    { name: "Kitchen Sponge (Pack of 2)", brand: "Scotch Brite", categoryId: tools.id, unit: "pack", buyPrice: "22", sellPrice: "32", currentStock: "25", lowStockLimit: "10", hinglishAliases: "sponge,kitchen sponge" },
  ]);

  // Customers
  await db.insert(customersTable).values([
    { name: "Sharma Ji", phone: "9876543210", address: "Shop No. 4, Near Temple", udhaarBalance: "1250" },
    { name: "Meena Agrawal", phone: "9871234567", address: "B-12, Vikas Nagar", udhaarBalance: "450" },
    { name: "Ramesh Hotel", phone: "9812345678", address: "MG Road", udhaarBalance: "3200" },
    { name: "Gupta Sweets", phone: "9765432100", address: "Main Bazar", udhaarBalance: "0" },
    { name: "Priya Sharma", phone: "9998887776", address: "Colony B", udhaarBalance: "780" },
    { name: "Sunita Ben", phone: "9877654321", address: "Near School", udhaarBalance: "0" },
  ]);

  // Suppliers
  await db.insert(suppliersTable).values([
    { name: "Reckitt Distributer", contactName: "Ajay Verma", phone: "9811223344", pendingAmount: "12500" },
    { name: "HUL Wholesale", contactName: "Sunil Kumar", phone: "9988776655", pendingAmount: "8200" },
    { name: "P&G Distributor", contactName: "Mahesh Joshi", phone: "9877665544", pendingAmount: "0" },
    { name: "Local Supplier - Ramesh", contactName: "Ramesh Gupta", phone: "9765432198", pendingAmount: "3400" },
  ]);

  // Activity Log
  await db.insert(activityLogTable).values([
    { eventType: "bill_created", description: "Bill BL-260528-1001 - ₹340 (Sharma Ji)", amount: "340" },
    { eventType: "bill_created", description: "Bill BL-260528-1002 - ₹175 (Meena Agrawal)", amount: "175" },
    { eventType: "expense_recorded", description: "Expense: Auto rickshaw fare", amount: "80" },
    { eventType: "purchase_created", description: "Purchase PO-260528-2001 from Reckitt Distributer", amount: "15000" },
    { eventType: "bill_created", description: "Bill BL-260527-1010 - ₹520 (Ramesh Hotel)", amount: "520" },
    { eventType: "stock_adjusted", description: "Stock adjusted: Toilet Cleaner 500ml (-2) - Damaged goods", amount: null },
    { eventType: "bill_created", description: "Bill BL-260527-1009 - ₹96 (Walk-in customer)", amount: "96" },
    { eventType: "expense_recorded", description: "Expense: Electricity bill advance", amount: "500" },
  ]);

  console.log("Database seeded successfully!");
}

seed().catch(console.error).finally(() => process.exit(0));
