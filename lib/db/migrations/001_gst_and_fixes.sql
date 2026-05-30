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
