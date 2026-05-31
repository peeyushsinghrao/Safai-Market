-- Migration 003: Phase 6 — logo, currency, barcode index
ALTER TABLE shops ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Index for receive stock rapid lookup by barcode
CREATE INDEX IF NOT EXISTS idx_products_barcode_shop
  ON products(barcode, shop_id) WHERE barcode IS NOT NULL;
