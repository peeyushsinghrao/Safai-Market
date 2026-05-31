# Safai Market — Phase 6 Implementation Plan
> Generated after full audit of Safai-Market-main__3_.zip
> Covers: Gap Analysis + All New Requirements from prompt
> For AI Agent / Developer — read fully before coding

---

## 1. Gap Analysis — Current State (v3 Codebase)

### ✅ Already Implemented (DO NOT REBUILD)

| Feature | Location | Notes |
|---|---|---|
| GST billing (CGST/SGST/IGST) | `billing/index.tsx`, `receipt.ts`, `stores/settings.ts` | Working |
| Bill Settings page | `settings/bill-settings.tsx` | Working |
| Device Center page | `settings/devices.tsx` | UI only, no real BT connect |
| Barcode label print | `products/barcode-label.tsx`, `lib/barcode-label.ts` | Working |
| Daily closing WhatsApp share | `daily-closing/index.tsx` | Working |
| Udhaar WhatsApp reminder | `customers/detail.tsx` | Working |
| Camera barcode scanner | `components/barcode-scanner-modal.tsx` | Working in billing + product forms |
| CSV Export | `settings/export.tsx`, `lib/csv-export.ts` | Working |
| Sync Center | `settings/sync-center.tsx` | Working |
| Multi-unit variants | `products/variants.tsx` | Working |
| Purchase entry | `purchases/new.tsx`, `purchases/index.tsx` | Working |
| Supplier management | `suppliers/` | Working with payment tracking |
| Animations (Framer Motion) | `lib/animations.ts`, `components/layout.tsx` | Working |
| Sound effects | `lib/sounds.ts` | Working |
| Bill share (WhatsApp/Telegram) | `bills/detail.tsx` | Working |
| Bill print | `bills/detail.tsx` | Working |
| Quick product creation (QuickAddProduct) | `billing/QuickAddProduct.tsx` | Working — triggered when barcode not found |
| `setQty` in cart store | `stores/cart.ts` | Exists but NOT used in UI |
| Udhaar visibility fix | `billing/index.tsx` | Shows only when `udhaarAmount > 0` ✓ |

---

### ❌ Missing / Not Implemented

| # | Feature | Required By | Priority |
|---|---|---|---|
| M1 | Cart quantity chips (+1/+5/+10/+25) + direct input | New requirement | 🔴 High |
| M2 | Receive Stock module (rapid stock-in for 100-200 products) | New requirement | 🔴 High |
| M3 | Continuous barcode scan mode in billing | New requirement | 🔴 High |
| M4 | Product barcode scan on Products screen → open edit/new | New requirement | 🟠 Medium |
| M5 | Product auto-fill from external barcode API | New requirement | 🟠 Medium |
| M6 | Desktop split layout (billing = products+cart side by side) | New requirement | 🟠 Medium |
| M7 | Bill PDF download (currently only print — no file save) | New requirement | 🟠 Medium |
| M8 | Device Center — real BT scanner pair / network printer IP config | New requirement | 🟡 Low |
| M9 | Receipt: store logo upload & display | New requirement | 🟡 Low |

---

### ⚠️ Partially Implemented / Needs Fix

| # | Feature | Problem | Fix |
|---|---|---|---|
| P1 | Cart quantity UX | Only +/- buttons. `setQty` exists in store but UI has no direct input | Add input field + quick chips |
| P2 | Desktop layout | Billing is stretched mobile UI on large screens | Add `lg:` responsive grid |
| P3 | Bill PDF download | Print dialog opens (can "Save as PDF") but no direct download button | Add jsPDF or html2canvas download |
| P4 | Device Center | Shows static list only. No actual BT pairing or IP printer config | Add Web Bluetooth API + IP input |

---

## 2. Architecture Plan

### Database — No New Tables Needed
All required tables exist. Only new columns needed:

```sql
-- Migration 003
ALTER TABLE shops ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
```

### Frontend New Files

```
src/
├── pages/
│   ├── billing/
│   │   └── index.tsx          (MODIFY — qty chips + continuous scan + desktop layout)
│   ├── products/
│   │   └── index.tsx          (MODIFY — camera scan button)
│   ├── stock/
│   │   └── receive.tsx        (NEW — Receive Stock rapid entry)
│   └── settings/
│       └── devices.tsx        (MODIFY — real BT + IP printer config)
├── lib/
│   ├── pdf-download.ts        (NEW — jsPDF bill download)
│   └── barcode-lookup.ts      (NEW — external product API)
└── components/
    └── qty-input.tsx          (NEW — reusable quantity input with chips)
```

### Backend — No New Routes Needed
All required API endpoints exist. Stock receive uses existing `purchases` or
`stock_movements` route.

---

## 3. Feature Roadmap

### Phase 6A — Billing UX (Highest Impact, Fastest) — 1-2 days
- M1: Cart quantity chips + direct input
- M3: Continuous barcode scan mode
- Desktop billing split layout

### Phase 6B — Inventory Speed — 2-3 days
- M2: Receive Stock rapid module
- M4: Products screen barcode scan button

### Phase 6C — Product Intelligence — 1-2 days
- M5: External barcode product lookup API
- M9: Store logo on receipt

### Phase 6D — Polish — 1 day
- M7: Bill PDF download
- M8: Device Center improvements

---

## 4. Detailed Implementation Plan

---

## Step 1 — Cart Quantity Chips + Direct Input

### File: `artifacts/safai-market/src/pages/billing/index.tsx`

**Problem:** Cart items only have +/- buttons. Adding 25 items = 25 taps.
**Solution:** Add quick chips (+1/+5/+10/+25) and a direct number input.

**Find the cart item Stepper section:**
```tsx
{/* Stepper */}
<div className="flex items-center gap-2">
  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0"
    onClick={() => updateQty(item.productId, -1)} disabled={item.quantity <= 1}>
    <Minus className="w-3 h-3" />
  </Button>
  <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0"
    onClick={() => updateQty(item.productId, 1)} disabled={item.quantity >= item.availableStock}>
    <Plus className="w-3 h-3" />
  </Button>
```

**Replace entirely with:**
```tsx
{/* Quantity controls — chips + direct input */}
<div className="space-y-2">
  {/* Direct qty input + stepper row */}
  <div className="flex items-center gap-1.5">
    <Button variant="outline" size="icon"
      className="h-8 w-8 rounded-full shrink-0"
      onClick={() => updateQty(item.productId, -1)}
      disabled={item.quantity <= 1}>
      <Minus className="w-3 h-3" />
    </Button>

    {/* Direct editable quantity input */}
    <input
      type="number"
      min="1"
      max={item.availableStock}
      value={item.quantity}
      onChange={(e) => {
        const v = Math.max(1, Math.min(Number(e.target.value) || 1, item.availableStock));
        setQty(item.productId, v);
      }}
      className="w-12 h-8 text-center font-bold text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
    />

    <Button variant="outline" size="icon"
      className="h-8 w-8 rounded-full shrink-0"
      onClick={() => updateQty(item.productId, 1)}
      disabled={item.quantity >= item.availableStock}>
      <Plus className="w-3 h-3" />
    </Button>
  </div>

  {/* Quick add chips */}
  <div className="flex gap-1">
    {[1, 5, 10, 25].map(delta => {
      const wouldExceed = item.quantity + delta > item.availableStock;
      return (
        <button
          key={delta}
          disabled={wouldExceed}
          onClick={() => {
            const newQty = Math.min(item.quantity + delta, item.availableStock);
            setQty(item.productId, newQty);
          }}
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all active:scale-95",
            wouldExceed
              ? "opacity-30 cursor-not-allowed border-muted text-muted-foreground"
              : "border-primary/30 text-primary hover:bg-primary/10 hover:border-primary"
          )}
        >
          +{delta}
        </button>
      );
    })}
  </div>
</div>
```

**Add `setQty` to the destructure** at the top of CartDrawer component:
```typescript
const { items, customerId, notes, setCustomerId, setNotes,
  updateQty, setQty, removeItem, setItemDiscount,
  getSubtotal, getDiscountAmount, getTotal,
  billDiscount, billDiscountType, setBillDiscount, setBillDiscountType,
  clearCart } = useCartStore();
```

---

## Step 2 — Continuous Barcode Scan Mode

### File: `artifacts/safai-market/src/pages/billing/index.tsx`

**Problem:** After scanning a product, the cashier must tap again to scan next.
**Solution:** Add a toggle for "Bulk Scan Mode" that auto-resets scanner and
immediately opens camera again after each successful scan.

**Add state** (near other billing states):
```typescript
const [continuousScan, setContinuousScan] = useState(false);
const [lastScannedName, setLastScannedName] = useState<string | null>(null);
```

**Update the `BarcodeScannerModal`'s `onDetected` handler:**

Find the existing barcode scanner modal usage and update:
```tsx
<BarcodeScannerModal
  open={scannerOpen}
  onClose={() => {
    setScannerOpen(false);
    if (!continuousScan) setLastScannedName(null);
  }}
  onDetected={(barcode) => {
    const match = allProducts?.find((p: any) => p.barcode === barcode);
    if (match) {
      cartStore.addItem(match as any);
      playSound("scanSuccess");
      setLastScannedName(match.name);

      if (continuousScan) {
        // Auto re-open scanner after 800ms (so user sees the confirmation)
        setTimeout(() => {
          if (continuousScan) setScannerOpen(true);
        }, 800);
      } else {
        setScannerOpen(false);
      }
    } else {
      // Product not found — exit continuous mode and show quick-add
      setScannerOpen(false);
      setContinuousScan(false);
      setQuickAddBarcode(barcode);
      setQuickAddOpen(true);
    }
  }}
/>
```

**Add Continuous Scan toggle button** near the camera scan button in the billing header:
```tsx
{/* Continuous scan toggle */}
<button
  onClick={() => {
    const next = !continuousScan;
    setContinuousScan(next);
    if (next) setScannerOpen(true); // auto-start scan
  }}
  className={cn(
    "flex items-center gap-1.5 h-10 px-3 rounded-xl border text-xs font-semibold transition-all",
    continuousScan
      ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
      : "bg-background border-muted text-muted-foreground"
  )}
>
  <ScanLine className="w-4 h-4" />
  {continuousScan ? "Scan: ON" : "Scan"}
</button>

{/* Last scanned confirmation */}
{continuousScan && lastScannedName && (
  <div className="text-xs text-green-600 font-medium animate-pulse">
    ✓ {lastScannedName}
  </div>
)}
```

---

## Step 3 — Desktop Split Layout for Billing

### File: `artifacts/safai-market/src/pages/billing/index.tsx`

**Problem:** On tablets/desktops, the billing page is a stretched mobile UI.
**Solution:** On `lg:` screens, show products grid and cart side-by-side.

**Find the main billing return JSX** — the outermost `<div>` of the BillingPage component.

**Wrap with a responsive grid:**
```tsx
// BEFORE (current):
<div className="flex flex-col h-full ...">
  {/* product grid */}
  ...
  {/* cart FAB - mobile only */}
  ...
</div>

// AFTER:
<div className="flex flex-col h-full lg:flex-row lg:overflow-hidden">
  {/* LEFT: Product browsing (full width mobile, 60% desktop) */}
  <div className="flex-1 flex flex-col lg:w-[60%] lg:border-r overflow-y-auto">
    {/* Search bar */}
    {/* Category chips */}
    {/* Product grid */}
  </div>

  {/* RIGHT: Cart panel — hidden on mobile (uses drawer instead), visible on desktop */}
  <div className="hidden lg:flex lg:flex-col lg:w-[40%] lg:min-w-[320px] lg:max-w-[420px] bg-background">
    {/* Cart header */}
    <div className="px-4 py-3 border-b flex items-center justify-between">
      <h2 className="font-bold text-base">Cart</h2>
      <span className="text-xs text-muted-foreground">{itemCount} items</span>
    </div>
    {/* Cart items (same JSX as CartDrawer, reused inline) */}
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {/* Cart items list */}
    </div>
    {/* Checkout button */}
    <div className="p-4 border-t">
      <Button className="w-full h-14 text-base font-bold"
        onClick={() => setCheckoutOpen(true)}
        disabled={items.length === 0}>
        Checkout — {formatCurrency(getTotal())}
      </Button>
    </div>
  </div>

  {/* Mobile: cart FAB (hidden on desktop) */}
  <div className="lg:hidden fixed left-0 right-0 z-30 px-3"
    style={{ bottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}>
    {items.length > 0 && (
      <Button className="w-full h-14 ..." onClick={() => setCartOpen(true)}>
        View Cart ({itemCount}) — {formatCurrency(getTotal())}
      </Button>
    )}
  </div>
</div>
```

> **Note:** Extract cart item JSX into a shared `<CartItemRow item={item} />` component
> so it can be used in both the mobile drawer and the desktop panel without duplication.

---

## Step 4 — Receive Stock Module (Rapid Inventory Entry)

### New File: `artifacts/safai-market/src/pages/stock/receive.tsx`

**Goal:** Shopkeeper can process 100-200 products in 15-30 minutes.
**Flow:** Scan barcode → auto-fill product → enter qty → save → auto-focus next.

```tsx
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { ScanLine, Camera, Check, ArrowRight, Package } from "lucide-react";
import { useListProducts, useCreateStockMovement } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sounds";
import { formatCurrency } from "@/lib/format";
import PageHeader from "@/components/page-header";
import { cn } from "@/lib/utils";

const BarcodeScannerModal = lazy(() => import("@/components/barcode-scanner-modal"));

interface StockEntry {
  productId: number;
  productName: string;
  qty: number;
  barcode?: string;
  saved: boolean;
}

export default function ReceiveStock() {
  const { toast } = useToast();
  const { data: allProducts } = useListProducts({ limit: 10000 } as any);
  const createMovement = useCreateStockMovement();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [currentBarcode, setCurrentBarcode] = useState("");
  const [currentProduct, setCurrentProduct] = useState<any | null>(null);
  const [currentQty, setCurrentQty] = useState("1");
  const [saving, setSaving] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const handleBarcodeInput = (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return;
    setCurrentBarcode(trimmed);

    const found = allProducts?.find((p: any) => p.barcode === trimmed);
    if (found) {
      setCurrentProduct(found);
      playSound("scanSuccess");
      // Auto-focus qty field
      setTimeout(() => qtyInputRef.current?.focus(), 50);
    } else {
      setCurrentProduct(null);
      toast({
        title: "Product not found",
        description: `No product with barcode: ${trimmed}`,
        variant: "destructive"
      });
    }
  };

  const handleSaveEntry = async () => {
    if (!currentProduct || !currentQty || Number(currentQty) <= 0) return;
    setSaving(true);

    try {
      await createMovement.mutateAsync({
        data: {
          productId: currentProduct.id,
          movementType: "stock_in",
          quantity: Number(currentQty),
          reason: "Stock received",
        }
      });

      setEntries(prev => [{
        productId: currentProduct.id,
        productName: currentProduct.name,
        qty: Number(currentQty),
        barcode: currentBarcode,
        saved: true,
      }, ...prev]);

      playSound("cartAdd");

      // Reset for next scan
      setCurrentBarcode("");
      setCurrentProduct(null);
      setCurrentQty("1");

      // Auto-focus barcode input for next scan
      setTimeout(() => barcodeInputRef.current?.focus(), 50);
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Enter key on barcode field → look up product
  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBarcodeInput(currentBarcode);
  };

  // Enter key on qty field → save entry
  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveEntry();
  };

  const totalItems = entries.reduce((sum, e) => sum + e.qty, 0);

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader
        title="Receive Stock"
        subtitle={entries.length > 0 ? `${entries.length} products · ${totalItems} units` : "Scan products to add stock"}
        backTo="/products"
      />

      <div className="p-4 space-y-4 pb-24">
        {/* Scan input */}
        <div className="bg-white rounded-2xl border border-muted/50 p-4 space-y-3 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Step 1 — Scan or type barcode
          </p>
          <div className="flex gap-2">
            <Input
              ref={barcodeInputRef}
              value={currentBarcode}
              onChange={e => setCurrentBarcode(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Scan barcode or type and press Enter..."
              className="h-12 rounded-xl font-mono text-base border-muted flex-1"
              autoComplete="off"
            />
            <button
              onClick={() => setScannerOpen(true)}
              className="w-12 h-12 rounded-xl border border-muted bg-white flex items-center justify-center text-muted-foreground hover:text-primary active:scale-95 transition-all"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {/* Product found display */}
          {currentProduct ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-green-800">{currentProduct.name}</p>
                <p className="text-xs text-green-600">
                  Current stock: {Number(currentProduct.currentStock)} · {formatCurrency(Number(currentProduct.sellPrice))}
                </p>
              </div>
            </div>
          ) : currentBarcode ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600">Product not found for this barcode</p>
            </div>
          ) : null}
        </div>

        {/* Quantity entry */}
        {currentProduct && (
          <div className="bg-white rounded-2xl border border-muted/50 p-4 space-y-3 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Step 2 — Enter quantity received
            </p>

            {/* Quick quantity chips */}
            <div className="flex gap-2 flex-wrap">
              {[1, 5, 10, 12, 24, 50, 100].map(q => (
                <button
                  key={q}
                  onClick={() => setCurrentQty(String(q))}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm font-bold transition-all active:scale-95",
                    currentQty === String(q)
                      ? "bg-primary text-white border-primary"
                      : "bg-background border-muted text-muted-foreground hover:border-primary/40 hover:text-primary"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Input
                ref={qtyInputRef}
                type="number"
                min="1"
                value={currentQty}
                onChange={e => setCurrentQty(e.target.value)}
                onKeyDown={handleQtyKeyDown}
                placeholder="Qty"
                className="h-14 text-2xl font-bold text-center rounded-xl border-muted flex-1"
              />
              <Button
                onClick={handleSaveEntry}
                disabled={saving || !currentQty || Number(currentQty) <= 0}
                className="h-14 px-6 rounded-xl font-bold text-base gap-2 shadow-md shadow-primary/20"
              >
                {saving ? "..." : <><Check className="w-5 h-5" /> Save</>}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Press Enter to save and scan next product
            </p>
          </div>
        )}

        {/* Saved entries */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Received ({entries.length} products)
            </p>
            {entries.map((entry, idx) => (
              <div key={idx}
                className="bg-white rounded-xl border border-green-200 px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{entry.productName}</p>
                  {entry.barcode && (
                    <p className="text-xs text-muted-foreground font-mono">{entry.barcode}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">+{entry.qty}</p>
                  <p className="text-[10px] text-green-500">Added</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Camera scanner */}
      <Suspense fallback={null}>
        <BarcodeScannerModal
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onDetected={(barcode) => {
            setScannerOpen(false);
            setCurrentBarcode(barcode);
            handleBarcodeInput(barcode);
          }}
        />
      </Suspense>
    </div>
  );
}
```

### Register route in `App.tsx`

**Add import:**
```typescript
import ReceiveStock from "./pages/stock/receive";
```

**Add route:**
```tsx
<Route path="/stock/receive" component={() => <Layout><ReceiveStock /></Layout>} />
```

### Add "Receive Stock" button to Products list page

### File: `artifacts/safai-market/src/pages/products/index.tsx`

Find the header area (near the `+ Add Product` button) and add:
```tsx
import { ArrowDownToLine } from "lucide-react";

// In the header, alongside the + button:
<Link href="/stock/receive">
  <Button variant="outline" className="h-10 gap-2 rounded-xl text-sm font-semibold">
    <ArrowDownToLine className="w-4 h-4" />
    Receive Stock
  </Button>
</Link>
```

---

## Step 5 — Products Screen Camera Scan Button

### File: `artifacts/safai-market/src/pages/products/index.tsx`

**Flow:** Scan barcode → if product exists → open edit page. If not → open new product page with barcode pre-filled.

**Add imports:**
```typescript
import { lazy, Suspense, useState } from "react";
import { Camera } from "lucide-react";
import { useLocation } from "wouter";

const BarcodeScannerModal = lazy(() => import("@/components/barcode-scanner-modal"));
```

**Add state:**
```typescript
const [scannerOpen, setScannerOpen] = useState(false);
const [, setLocation] = useLocation();
```

**Add scan handler:**
```typescript
const handleProductScan = (barcode: string) => {
  setScannerOpen(false);
  const found = sortedProducts?.find((p: any) => p.barcode === barcode);
  if (found) {
    setLocation(`/products/${found.id}/edit`);
  } else {
    setLocation(`/products/new?barcode=${encodeURIComponent(barcode)}`);
  }
};
```

**Add Camera button** next to the search input:
```tsx
<div className="flex gap-2">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
    <Input
      className="pl-10 h-12 ..."
      placeholder="Search products..."
      value={search}
      onChange={e => setSearch(e.target.value)}
    />
  </div>
  <button
    onClick={() => setScannerOpen(true)}
    className="w-12 h-12 rounded-xl border border-muted bg-white flex items-center justify-center text-muted-foreground hover:text-primary active:scale-95 transition-all shrink-0"
  >
    <Camera className="w-5 h-5" />
  </button>
</div>

<Suspense fallback={null}>
  <BarcodeScannerModal
    open={scannerOpen}
    onClose={() => setScannerOpen(false)}
    onDetected={handleProductScan}
  />
</Suspense>
```

**Handle barcode pre-fill in Product New page:**

### File: `artifacts/safai-market/src/pages/products/new.tsx`

At the top, read query params to pre-fill barcode:
```typescript
import { useSearch } from "wouter";

// Inside component:
const search = useSearch();
const params = new URLSearchParams(search);
const prefilledBarcode = params.get("barcode") ?? "";

// In useState init, use prefilledBarcode:
const [formData, setFormData] = useState({
  ...otherFields,
  barcode: prefilledBarcode,
  // ... rest
});
```

---

## Step 6 — External Barcode Product Lookup API

### Architecture

When a barcode is scanned and product is not found locally, attempt to fetch
product details from a public database to auto-fill name, brand, category.

**Recommended APIs (Free tier):**

| API | Coverage | Free Limit | Best For |
|---|---|---|---|
| **Open Food Facts** | Food products | Unlimited (CC license) | Kirana: atta, oil, biscuits, soap |
| **UPC Item DB** | General retail | 100 req/day free | Electronics, general |
| **Barcodelookup.com** | General | Paid ($9/mo) | Best coverage, not free |
| **Go UPC** | General | 100 free/month | Moderate coverage |

**Recommended strategy:**
1. Try **Open Food Facts** first (free, no key needed, best for Indian kirana products)
2. Fallback: **UPC Item DB** (requires free API key)
3. If both fail: show QuickAddProduct with just the barcode pre-filled

### New File: `artifacts/safai-market/src/lib/barcode-lookup.ts`

```typescript
export interface BarcodeProductInfo {
  name?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  source: string;
}

// Open Food Facts — free, no API key, covers Indian products well
async function lookupOpenFoodFacts(barcode: string): Promise<BarcodeProductInfo | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    return {
      name: p.product_name_en || p.product_name || undefined,
      brand: p.brands || undefined,
      category: p.categories?.split(",")[0]?.trim() || undefined,
      imageUrl: p.image_front_thumb_url || undefined,
      source: "Open Food Facts",
    };
  } catch {
    return null;
  }
}

// UPC Item DB — 100 free lookups/day, requires signup for API key
async function lookupUpcItemDb(barcode: string, apiKey: string): Promise<BarcodeProductInfo | null> {
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
      {
        headers: { "user_key": apiKey },
        signal: AbortSignal.timeout(3000)
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    return {
      name: item.title || undefined,
      brand: item.brand || undefined,
      category: item.category || undefined,
      imageUrl: item.images?.[0] || undefined,
      source: "UPC Item DB",
    };
  } catch {
    return null;
  }
}

// Main lookup function — tries sources in order
export async function lookupBarcodeProduct(
  barcode: string,
  upcApiKey?: string
): Promise<BarcodeProductInfo | null> {
  // Try Open Food Facts first (free, no key)
  const offResult = await lookupOpenFoodFacts(barcode);
  if (offResult?.name) return offResult;

  // Try UPC Item DB if API key provided
  if (upcApiKey) {
    const upcResult = await lookupUpcItemDb(barcode, upcApiKey);
    if (upcResult?.name) return upcResult;
  }

  return null;
}
```

### Integrate lookup into `QuickAddProduct.tsx` and billing barcode scan

When barcode is not found locally, show a loading state while fetching,
then pre-fill the QuickAddProduct form:

### File: `artifacts/safai-market/src/pages/billing/QuickAddProduct.tsx`

Add a lookup on mount when `prefilledBarcode` is provided:
```typescript
import { lookupBarcodeProduct } from "@/lib/barcode-lookup";

// In useEffect when open changes:
useEffect(() => {
  if (open && prefilledBarcode) {
    setLookingUp(true);
    lookupBarcodeProduct(prefilledBarcode).then(info => {
      if (info?.name) setName(info.name);
      if (info?.brand) setName(prev => prev || info.brand!);
      setLookingUp(false);
    }).catch(() => setLookingUp(false));
  }
}, [open, prefilledBarcode]);
```

**Add `lookingUp` state and show a spinner/note:**
```tsx
{lookingUp && (
  <p className="text-xs text-blue-600 animate-pulse">
    🔍 Looking up product info...
  </p>
)}
```

**Cost Analysis:**
- Open Food Facts: FREE forever, CC-BY-SA license, ~3M products including Indian
- UPC Item DB free tier: 100/day (enough for ~3000 new products/month)
- Monthly cost for most kirana shops: **₹0**
- If shop scans many new products: UPC Item DB paid = $9/month (~₹750)

---

## Step 7 — Bill PDF Download

**Problem:** Print dialog requires user to "Save as PDF" manually.
**Solution:** Generate actual downloadable PDF file.

### New File: `artifacts/safai-market/src/lib/pdf-download.ts`

```typescript
// Uses html2canvas + jsPDF approach
// OR: simpler approach using print CSS + blob URL

export async function downloadBillAsPdf(receiptData: any): Promise<void> {
  // Strategy: Create the receipt HTML, render it in a hidden iframe,
  // then use browser's print-to-PDF via a Blob URL.
  // This avoids needing jsPDF or canvas — works purely with HTML.

  const { printReceipt } = await import("./receipt");

  // Create receipt HTML string (same as printReceipt but as blob)
  // We modify printReceipt to optionally return HTML instead of opening window
  const html = buildReceiptHtml(receiptData);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // Open in new tab — user can Ctrl+P → Save as PDF
  // OR use showSaveFilePicker if browser supports it
  if ("showSaveFilePicker" in window) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: `bill-${receiptData.billNumber}.pdf`,
        types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
      });
      // Convert to PDF via print dialog
      window.open(url, "_blank");
    } catch {
      window.open(url, "_blank");
    }
  } else {
    window.open(url, "_blank");
  }

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function buildReceiptHtml(data: any): string {
  // Import and reuse the receipt.ts HTML generation logic
  // Extract the HTML string building part from printReceipt
  // into a separate exported function `buildReceiptHtmlString(data)`
  // Then call it here
  return ""; // placeholder — implement after extracting from receipt.ts
}
```

**Simpler approach — extract HTML builder from receipt.ts:**

### File: `artifacts/safai-market/src/lib/receipt.ts`

Refactor `printReceipt` to separate concerns:

```typescript
// Export this new function
export function buildReceiptHtml(data: ReceiptData): string {
  // Move all the HTML string building logic here
  // Return the HTML string
  return `<!DOCTYPE html>...`; // full HTML
}

// Keep printReceipt as a wrapper
export function printReceipt(data: ReceiptData) {
  const html = buildReceiptHtml(data);
  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) { alert("Please allow popups to print receipts."); return; }
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

// New: download as HTML file (user can print → Save as PDF)
export function downloadReceiptAsFile(data: ReceiptData) {
  const html = buildReceiptHtml(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bill-${data.billNumber}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### File: `artifacts/safai-market/src/pages/bills/detail.tsx`

Add a Download button alongside the Print button:
```tsx
import { downloadReceiptAsFile } from "@/lib/receipt";

// Add download button:
<Button
  variant="outline"
  className="flex-1 h-12 gap-2 rounded-xl font-semibold"
  onClick={() => downloadReceiptAsFile(receiptData)}
>
  <Download className="w-4 h-4" />
  Download
</Button>
```

---

## Step 8 — Store Logo on Receipt

### File: `artifacts/safai-market/src/pages/settings/bill-settings.tsx`

Add a logo URL field:
```tsx
<FormField label="Store Logo URL" hint="Paste image URL or upload">
  <Input
    value={form.logoUrl || ""}
    onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))}
    placeholder="https://... or leave blank"
    className="h-12 rounded-xl border-muted"
  />
  {form.logoUrl && (
    <img src={form.logoUrl} alt="Logo preview"
      className="h-12 w-auto mt-2 rounded object-contain" />
  )}
</FormField>
```

Add `logoUrl` to `ShopSettings` in `stores/settings.ts`:
```typescript
logoUrl?: string;
```

In `receipt.ts` `buildReceiptHtml`, add logo display:
```html
${data.storeLogo
  ? `<div class="logo"><img src="${data.storeLogo}" alt="logo" /></div>`
  : ""
}
```

### File: `lib/db/migrations/003_phase6.sql`

```sql
-- Migration 003: Phase 6
ALTER TABLE shops ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Index for receive stock rapid lookup by barcode
CREATE INDEX IF NOT EXISTS idx_products_barcode_shop
  ON products(barcode, shop_id) WHERE barcode IS NOT NULL;
```

---

## Step 9 — Update More Menu + Routes

### File: `artifacts/safai-market/src/App.tsx`

**Add imports:**
```typescript
import ReceiveStock from "./pages/stock/receive";
```

**Add route:**
```tsx
<Route path="/stock/receive" component={() => <Layout><ReceiveStock /></Layout>} />
```

### File: `artifacts/safai-market/src/pages/more/index.tsx`

**Add to Inventory section** (create section if doesn't exist):
```typescript
{
  title: "Inventory",
  items: [
    {
      href: "/stock/receive",
      label: "Receive Stock",
      sub: "Rapid stock-in for multiple products",
      icon: ArrowDownToLine,
      color: "bg-emerald-100 text-emerald-700"
    },
    // existing purchase entry link if present
  ]
}
```

Add import: `import { ArrowDownToLine } from "lucide-react";`

---

## 5. Risk Analysis

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Barcode API rate limits (Open Food Facts) | Low | Medium | Cache results in localStorage by barcode, 7-day TTL |
| Camera scanner not working on all Android browsers | Medium | High | Always show manual barcode input as fallback |
| Desktop layout breaks on mid-size tablets | Medium | Medium | Test at 768px, 1024px, 1280px breakpoints |
| Continuous scan infinite loop if scanner fires twice | Medium | High | Add `detectedRef` lock (already in scanner modal) + debounce |
| `createStockMovement` API endpoint might not exist | Low | High | Check API route first; fallback to direct product update |

### Scalability Risks

| Risk | When | Mitigation |
|---|---|---|
| Receive Stock: 200 products × API call = slow | At scale | Batch the stock movements, save locally, send in one request |
| allProducts limit:10000 in ReceiveStock | 10k+ products | Add server-side barcode lookup endpoint instead |
| Open Food Facts lookup latency (2-3s) | Always | Show "Looking up..." UI; don't block product creation |

### UX Risks

| Risk | Impact | Fix |
|---|---|---|
| Quantity chips overlap on small phones | Medium | Wrap chips in flex-wrap, max 2 rows |
| Continuous scan auto-opens camera unexpectedly | High | Add clear visual indicator "Scan Mode ON" + easy OFF button |
| Desktop cart panel too narrow | Medium | Min-width 320px, max-width 420px |

---

## 6. Recommendations

### Performance
- **Cache barcode lookups:** `localStorage.setItem("barcode-cache-{barcode}", JSON.stringify({info, ts}))`
  with 7-day TTL. Avoid re-fetching known barcodes.
- **Virtual scroll in Receive Stock entries:** If 200 products are received, rendering all = slow.
  Use windowing or limit to last 50 visible.
- **Debounce barcode input:** 300ms debounce on the keyboard wedge so rapid typing doesn't fire multiple lookups.

### Best Practices
- **Receive Stock keyboard flow:** Tab key should jump barcode → qty → save button.
  Add `tabIndex` props explicitly.
- **Continuous scan indicator:** Make it unmistakable when scan mode is ON (colored header bar,
  not just a button state change).
- **Quantity chip memory:** Remember last used chip value per session
  (`sessionStorage.setItem("lastQtyChip", "10")`) for speed.

### Future Enhancements (Phase 7+)
- **Offline billing:** IndexedDB queue for bills created without internet
- **Staff accounts:** Role-based — cashier can't see profit margins
- **Analytics dashboard:** Revenue chart, top products, slow movers
- **Customer loyalty:** Purchase count, repeat customer badge
- **GST return filing helper:** Monthly GSTR-1 data export

---

## Summary of All Phase 6 Changes

### New Files Created

| File | Purpose |
|---|---|
| `src/pages/stock/receive.tsx` | Rapid stock receiving module |
| `src/lib/barcode-lookup.ts` | External product API (Open Food Facts + UPC Item DB) |
| `lib/db/migrations/003_phase6.sql` | logo_url column + indexes |

### Modified Files

| File | Change |
|---|---|
| `src/pages/billing/index.tsx` | M1: qty chips + M3: continuous scan + M6: desktop layout |
| `src/pages/products/index.tsx` | M4: camera scan button → edit/new |
| `src/pages/products/new.tsx` | Read `?barcode=` query param to pre-fill |
| `src/pages/billing/QuickAddProduct.tsx` | M5: barcode lookup auto-fill |
| `src/lib/receipt.ts` | Extract `buildReceiptHtml()`, add `downloadReceiptAsFile()` |
| `src/pages/bills/detail.tsx` | M7: Download button |
| `src/pages/settings/bill-settings.tsx` | M9: Logo URL field |
| `src/stores/settings.ts` | Add `logoUrl` field |
| `src/App.tsx` | New route `/stock/receive` |
| `src/pages/more/index.tsx` | Add Receive Stock menu item |

---

## Verification Checklist

**Billing Quantity UX**
- [ ] Cart item shows +1/+5/+10/+25 chips below the stepper
- [ ] Tapping +10 adds 10 to current quantity (capped at availableStock)
- [ ] Quantity field is directly editable — type "25" and it updates immediately
- [ ] Chips are grayed out when adding would exceed stock

**Continuous Scan Mode**
- [ ] "Scan" button in billing header toggles continuous mode ON/OFF
- [ ] When ON, camera re-opens automatically ~800ms after successful scan
- [ ] Last scanned product name shown briefly in header
- [ ] When product NOT found, continuous mode stops and QuickAddProduct opens

**Desktop Layout**
- [ ] On screen ≥ 1024px, billing shows products on left, cart on right
- [ ] Cart panel is always visible on desktop (no FAB needed)
- [ ] Mobile (< 1024px) works exactly as before with FAB

**Receive Stock**
- [ ] `/stock/receive` page accessible from Products screen and More menu
- [ ] Barcode scan auto-fills product name and shows current stock
- [ ] Enter key on barcode field → product lookup
- [ ] Enter key on qty field → saves and resets for next scan
- [ ] Quick chips (1/5/10/12/24/50/100) update qty field
- [ ] Saved entries list grows with each successful entry
- [ ] Camera scanner button works for scanning

**Products Screen Scan**
- [ ] Camera icon in Products screen search bar
- [ ] Scanning known barcode → opens edit page for that product
- [ ] Scanning unknown barcode → opens new product form with barcode pre-filled

**Barcode Lookup**
- [ ] When unknown barcode scanned → QuickAddProduct shows "Looking up..."
- [ ] If Open Food Facts has the product → name/brand auto-fills
- [ ] If not found → empty form (user types manually)
- [ ] Lookup doesn't block form from being used

**Bill Download**
- [ ] "Download" button on bill detail page
- [ ] Downloads `.html` file named `bill-XXXXX.html`
- [ ] File opens in browser and prints correctly

**Store Logo**
- [ ] Logo URL field in Bill Settings
- [ ] Preview shown below the field
- [ ] Logo appears at top of printed receipt

- [ ] `pnpm build` passes with no TypeScript errors
