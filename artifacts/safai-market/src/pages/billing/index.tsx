import { useState, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { successVariants, staggerContainer, staggerItem } from "@/lib/animations";
import { playSound } from "@/lib/sounds";
import { useSettingsStore } from "@/stores/settings";
import {
  Search, X, ShoppingCart, Plus, Minus, Trash2,
  CheckCircle2, TrendingUp, AlertTriangle, Printer,
  Package, Tag, PlusCircle, Layers, Camera, ScanLine, Info
} from "lucide-react";
import { useBundles } from "@/hooks/use-bundles";

import { CartItemRow } from "@/components/cart-item-row";
import { printReceipt } from "@/lib/receipt";
import {
  useListProducts,
  useListCustomers,
  useListCategories,
  useCreateBill,
  getListBillsQueryKey,
  getGetDashboardSummaryQueryKey,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import QuickAddProduct from "./QuickAddProduct";
import FrequentlySoldTogether from "./FrequentlySoldTogether";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  calculateBillProfit,
  computeMargin,
  MARGIN_TIER_CONFIG,
} from "@/lib/profit";
import { useCartStore } from "@/stores/cart";

const BarcodeScannerModal = lazy(() => import("@/components/barcode-scanner-modal"));

type ProductItem = {
  id: number;
  name: string;
  sellPrice: number | string;
  buyPrice?: number | string | null;
  currentStock: number | string;
  unit?: string | null;
  category?: string | null;
  brand?: string | null;
  status?: string | null;
};

function ProductCard({
  product,
  qty,
  onAdd,
  onInc,
  onDec,
}: {
  product: ProductItem;
  qty: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
}) {
  const stock = Number(product.currentStock);
  const outOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;
  const margin = computeMargin(product.buyPrice, product.sellPrice);

  const getProductImage = (name: string) => {
    return 'https://images.unsplash.com/photo-1585565804112-f201f68c48b4?auto=format&fit=crop&q=80&w=400&h=400';
  };

  return (
    <div
      className={cn(
        "bg-white rounded-[16px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative",
        outOfStock && "opacity-60"
      )}
    >
      {/* Product Image Area */}
      <div className="h-[140px] w-full bg-[#f8fafc] relative overflow-hidden flex items-center justify-center p-4">
        <img src={getProductImage(product.name)} alt={product.name} className="h-full w-auto object-contain mix-blend-multiply" />
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="mb-2">
          {outOfStock ? (
             <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-[4px]">Out of Stock</span>
          ) : isLowStock ? (
             <span className="bg-red-50 text-red-600 text-[11px] font-medium px-2 py-0.5 rounded-[4px]">Low Stock</span>
          ) : (
             <span className="bg-[#e0f2fe] text-[#0284c7] text-[11px] font-medium px-2 py-0.5 rounded-[4px]">In Stock</span>
          )}
        </div>
        
        <p className="text-[14px] font-medium leading-tight text-slate-900 mb-1 flex-1">
          {product.name}
        </p>
        <p className="text-[15px] font-bold text-[#006b2c] mb-3">
          {formatCurrency(Number(product.sellPrice))}
        </p>

        {/* Add / Stepper */}
        {qty === 0 ? (
          <button
            className={cn(
              "w-full h-[40px] rounded-[8px] text-[15px] font-medium flex items-center justify-center gap-2 transition-all",
              outOfStock
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-[#006b2c] text-white active:scale-95"
            )}
            onClick={outOfStock ? undefined : onAdd}
            disabled={outOfStock}
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        ) : (
          <div className="flex items-center justify-between gap-1 w-full h-[40px] bg-[#006b2c] rounded-[8px] text-white px-1">
            <button
              className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-white/20 active:scale-95"
              onClick={onDec}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center font-bold text-[15px]">
              {qty}
            </span>
            <button
              className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-white/20 active:scale-95"
              onClick={qty < stock ? onInc : undefined}
              disabled={qty >= stock}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CartDrawer({
  open,
  onClose,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const {
    items,
    billDiscount,
    billDiscountType,
    updateQty,
    setQty,
    removeItem,
    setItemDiscount,
    setBillDiscount,
    setBillDiscountType,
    getSubtotal,
    getDiscountAmount,
    getTotal,
  } = useCartStore();

  const subtotal = getSubtotal();
  const discountAmt = getDiscountAmount();
  const total = getTotal();

  const profitSummary = useMemo(
    () =>
      calculateBillProfit(
        items.map((i) => ({
          buyPrice: i.buyPrice,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          discountAmount: i.itemDiscount * i.quantity,
        }))
      ),
    [items]
  );

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2 shrink-0">
          <h2 className="font-bold text-base">
            Your Cart{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({items.length} items)
            </span>
          </h2>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Items */}
        <div className="overflow-y-auto flex-1 divide-y border-t">
          {items.map((item) => {
            return (
              <CartItemRow
                key={item.productId}
                item={item}
                layout="drawer"
                updateQty={updateQty}
                setQty={setQty}
                removeItem={removeItem}
                setItemDiscount={setItemDiscount}
              />
            );
          })}
        </div>

        {/* Totals + Bill Discount */}
        <div className="border-t p-4 space-y-3 shrink-0">
          {/* Bill Discount */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex-1">
              Bill Discount
            </span>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                className={cn(
                  "px-2 py-1 text-xs font-semibold",
                  billDiscountType === "flat"
                    ? "bg-primary text-white"
                    : "text-muted-foreground"
                )}
                onClick={() => setBillDiscountType("flat")}
              >
                ₹
              </button>
              <button
                className={cn(
                  "px-2 py-1 text-xs font-semibold",
                  billDiscountType === "pct"
                    ? "bg-primary text-white"
                    : "text-muted-foreground"
                )}
                onClick={() => setBillDiscountType("pct")}
              >
                %
              </button>
            </div>
            <input
              type="number"
              min="0"
              value={billDiscount || ""}
              onChange={(e) => setBillDiscount(Number(e.target.value) || 0)}
              className="w-20 text-xs h-8 border rounded px-2 text-right"
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            {discountAmt > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-600 font-medium">Discount</span>
                  <span className="text-amber-600 font-bold">
                    −{formatCurrency(discountAmt)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="font-bold text-primary">Total</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Profit preview */}
          {profitSummary.totalProfit != null && (
            <div
              className={cn(
                "flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border",
                profitSummary.totalProfit >= 0
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Est. Profit: {formatCurrency(profitSummary.totalProfit)}
              {profitSummary.hasUntracked && (
                <span className="ml-1 text-amber-600 font-normal">
                  (partial)
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-11" onClick={onClose}>
              ← Add More
            </Button>
            <Button
              className="flex-1 h-11 font-bold bg-[#006b2c] hover:bg-[#005a24] text-white"
              onClick={onCheckout}
            >
              Pay →
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}


function BundleDetailDrawer({
  open,
  bundle,
  onClose,
  onAdd
}: {
  open: boolean;
  bundle: any | null;
  onClose: () => void;
  onAdd: (bundle: any) => void;
}) {
  if (!bundle) return null;
  const sellPrice = Number(bundle.sellPrice);
  const buyPrice = Number(bundle.buyPriceComputed);
  const marginPct = sellPrice > 0 ? ((sellPrice - buyPrice) / sellPrice) * 100 : 0;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}
      >
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-4 pb-2 shrink-0 border-b">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              {bundle.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bundle.items?.length ?? 0} components
            </p>
          </div>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          <div className="flex justify-between items-end border-b pb-3 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-bold text-xl">{formatCurrency(sellPrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Margin</p>
              <p className={cn("font-bold text-sm", marginPct >= 20 ? "text-green-600" : marginPct >= 10 ? "text-amber-600" : "text-muted-foreground")}>
                {marginPct.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <h3 className="font-bold text-sm mb-2">Bundle Contents</h3>
          <div className="space-y-2">
            {(bundle.items || []).map((item: any) => (
              <div key={item.id} className="flex justify-between items-center bg-slate-50 font-sans rounded-2xl p-2 border">
                <div>
                  <p className="font-semibold text-sm">{item.productNameSnapshot}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t shrink-0">
          <Button 
            className="w-full h-11 font-bold" 
            onClick={() => { onAdd(bundle); onClose(); }}
            disabled={bundle.availableStock <= 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </>
  );
}

export default function Billing() {
  const [, setLocation] = useLocation();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddBarcode, setQuickAddBarcode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [continuousScan, setContinuousScan] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const continuousScanRef = useRef(false);
  const [viewMode, setViewMode] = useState<"products" | "bundles">("products");
  const [selectedBundleForInfo, setSelectedBundleForInfo] = useState<any | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const cartStore = useCartStore();
  const itemCount = cartStore.getItemCount();
  const cartTotal = cartStore.getTotal();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  const { data: allProducts, isLoading: loadingProducts } = useListProducts(
    debouncedSearch.length >= 2
      ? { search: debouncedSearch }
      : { limit: 500 }
  );

  const { data: categories } = useListCategories();
  const { data: allBundles } = useBundles();

  const activeProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter((p) => p.status === "active");
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (debouncedSearch.length >= 2) return activeProducts;
    if (activeCategory === "all") return activeProducts;
    return activeProducts.filter((p) => p.categoryName === activeCategory);
  }, [activeProducts, activeCategory, debouncedSearch]);

  // FG3: External barcode scanner support (keyboard wedge / USB scanner mode)
  // Hardware scanners type barcode characters + Enter in rapid succession (< 100ms/char)
  useEffect(() => {
    let barcodeBuffer = "";
    let bufferTimer: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key.length > 1 && e.key !== "Enter") return;

      if (e.key === "Enter") {
        if (barcodeBuffer.length >= 4) {
          const barcode = barcodeBuffer;
          barcodeBuffer = "";
          if (bufferTimer) clearTimeout(bufferTimer);
          const match = allProducts?.find((p: any) => p.barcode === barcode);
          if (match && match.status === "active") {
            cartStore.addItem(match as any);
            playSound("scanSuccess");
            toast({ title: `Added: ${match.name}`, description: formatCurrency(Number(match.sellPrice)) });
          } else {
            setSearch(barcode);
            searchInputRef.current?.focus();
          }
          e.preventDefault();
        }
        return;
      }

      barcodeBuffer += e.key;
      if (bufferTimer) clearTimeout(bufferTimer);
      bufferTimer = setTimeout(() => { barcodeBuffer = ""; }, 100);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [allProducts, cartStore, toast]);

  const activeBundles = useMemo(() => {
    if (!allBundles) return [];
    return allBundles.filter((b) => b.isActive);
  }, [allBundles]);

  const filteredBundles = useMemo(() => {
    if (!debouncedSearch) return activeBundles;
    const q = debouncedSearch.toLowerCase();
    return activeBundles.filter((b) => b.name.toLowerCase().includes(q));
  }, [activeBundles, debouncedSearch]);

  const handleAddProduct = (p: ProductItem) => {
    cartStore.addItem(p as any);
    playSound("cartAdd");
  };

  const handleAddBundle = (bundle: any) => {
    // Check real stock for each item before adding (B3 fix — no more hardcoded 999)
    const outOfStockItems: string[] = [];
    for (const item of bundle.items) {
      const realProduct = allProducts?.find((p) => p.id === item.productId);
      if (realProduct && Number(realProduct.currentStock) <= 0) {
        outOfStockItems.push(item.productNameSnapshot);
      }
    }
    if (outOfStockItems.length > 0) {
      toast({
        title: "Stock unavailable",
        description: `Out of stock: ${outOfStockItems.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    for (const item of bundle.items) {
      const realProduct = allProducts?.find((p) => p.id === item.productId);
      cartStore.addItem({
        id: item.productId,
        name: `${item.productNameSnapshot} (${bundle.name})`,
        sellPrice: Number(bundle.sellPrice) / bundle.items.length,
        buyPrice: Number(item.buyPriceSnapshot),
        currentStock: realProduct ? Number(realProduct.currentStock) : 0,
        unit: realProduct?.unit ?? "piece",
      });
    }
    toast({ title: `Bundle added: ${bundle.name}`, description: formatCurrency(Number(bundle.sellPrice)) });
  };

  const handleQuickAddSaved = (product: { id: number; name: string; sellPrice: number; buyPrice: number | null; currentStock: number; unit: string }) => {
    cartStore.addItem({
      id: product.id,
      name: product.name,
      sellPrice: product.sellPrice,
      buyPrice: product.buyPrice,
      currentStock: product.currentStock,
      unit: product.unit,
    });
    setQuickAddOpen(false);
    setQuickAddBarcode("");
  };

  const fstAssociations = useMemo(() => {
    const cartIds = cartStore.items.map((i) => i.productId);
    if (cartIds.length === 0 || !allProducts) return [];

    const productMap = new Map(allProducts.map((p) => [p.id, p]));
    const assocResult: Array<{ productBId: number; strength: number; triggerName: string }> = [];
    const seen = new Set<number>();

    for (const cartItem of cartStore.items) {
      const triggerProduct = productMap.get(cartItem.productId);
      if (!triggerProduct) continue;

      for (const p of allProducts) {
        if (cartIds.includes(p.id)) continue;
        if (seen.has(p.id)) continue;
        if (p.status !== "active") continue;

        const triggerCat = triggerProduct.category;
        if (triggerCat && p.category === triggerCat) {
          seen.add(p.id);
          assocResult.push({
            productBId: p.id,
            strength: 0.5,
            triggerName: triggerProduct.name,
          });
          if (assocResult.length >= 3) break;
        }
      }
      if (assocResult.length >= 3) break;
    }

    return assocResult;
  }, [cartStore.items, allProducts]);

  const toggleContinuousScan = () => {
    if (continuousScan) {
      setContinuousScan(false);
      continuousScanRef.current = false;
      setScannerOpen(false);
      setLastScanned(null);
    } else {
      setContinuousScan(true);
      continuousScanRef.current = true;
      setScannerOpen(true);
    }
  };

  const handleCheckoutOpen = () => {
    setCartOpen(false);
    navigate("/billing/checkout/review");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans lg:flex-row">
      {/* LEFT PANEL: search + products */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      {/* Search Bar */}
      <div className="sticky top-0 z-30 bg-[#f8fafc] border-b border-slate-200">
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={searchInputRef}
              className="w-full pl-11 pr-12 h-[48px] rounded-[16px] border border-slate-300 bg-white text-[15px] focus:outline-none focus:border-[#006b2c] focus:ring-1 focus:ring-[#006b2c] transition-shadow placeholder:text-slate-500"
              placeholder="Search products or scan barcode"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-product-search"
            />
            {search ? (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                onClick={() => setSearch("")}
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors",
                  continuousScan ? "text-[#006b2c]" : "text-[#006b2c]"
                )}
                onClick={toggleContinuousScan}
                data-testid="btn-barcode-scan"
              >
                <ScanLine className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Continuous Scan Mode Banner */}
        {continuousScan && (
          <div className="bg-[#006b2c] text-white px-4 py-2 flex items-center gap-2 text-[13px] font-bold mx-4 mb-2 rounded-[12px]">
            <ScanLine className="w-4 h-4 animate-pulse" />
            Scan Mode ON — point camera at barcode
            {lastScanned && (
              <span className="ml-auto opacity-90 truncate max-w-[120px]">Last: {lastScanned}</span>
            )}
            <button
              className="ml-auto shrink-0 bg-white/20 rounded-[6px] px-2.5 py-1 hover:bg-white/30"
              onClick={toggleContinuousScan}
            >
              Stop
            </button>
          </div>
        )}
        {/* Category chips */}
        <div className="px-4 pb-3 flex items-center gap-2">
          {viewMode === "products" && !debouncedSearch && (
            <div className="flex-1 overflow-x-auto flex gap-2 scrollbar-none pb-1">
              <button
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-colors",
                  activeCategory === "all"
                    ? "bg-[#006b2c] text-white"
                    : "bg-[#e0f2fe] text-[#0369a1]"
                )}
                onClick={() => setActiveCategory("all")}
              >
                All Items
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  className={cn(
                    "shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-colors whitespace-nowrap",
                    activeCategory === cat.name
                      ? "bg-[#006b2c] text-white"
                      : "bg-[#e0f2fe] text-[#0369a1]"
                  )}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Frequently Sold Together */}
      {itemCount > 0 && fstAssociations.length > 0 && (
        <FrequentlySoldTogether
          cartProductIds={cartStore.items.map((i) => i.productId)}
          allProducts={(allProducts ?? []) as any}
          associations={fstAssociations}
          onAdd={(p) => cartStore.addItem({ ...p, id: p.id, name: p.name, sellPrice: p.sellPrice, buyPrice: p.buyPrice, currentStock: p.currentStock, unit: p.unit ?? "pcs" } as any)}
        />
      )}

      {/* Product / Bundle Grid */}
      <div
        className="flex-1 overflow-y-auto p-3"
        style={{ paddingBottom: itemCount > 0 ? "80px" : "16px" }}
      >
        {viewMode === "bundles" ? (
          filteredBundles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Layers className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm mb-2">
                {debouncedSearch ? `No bundles matching "${debouncedSearch}"` : "No active bundles"}
              </p>
              <p className="text-xs opacity-70">Create bundles from More → Product Bundles</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBundles.map((bundle) => {
                const sellPrice = Number(bundle.sellPrice);
                const buyPrice = Number(bundle.buyPriceComputed);
                const marginPct = sellPrice > 0 ? ((sellPrice - buyPrice) / sellPrice) * 100 : 0;
                return (
                  <div key={bundle.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3">
                    <div className="bg-primary/8 rounded-lg p-2 shrink-0">
                      <Layers className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{bundle.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {bundle.items?.length ?? 0} items · Stock: {bundle.availableStock} kits
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(bundle.items ?? []).slice(0, 2).map((item: any) => (
                          <span key={item.id} className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-md">
                            {item.productNameSnapshot} ×{item.quantity}
                          </span>
                        ))}
                        {(bundle.items?.length ?? 0) > 2 && (
                          <span className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-md">
                            +{bundle.items.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right flex flex-col items-end gap-2">
                      <div>
                        <p className="font-bold text-base">{formatCurrency(sellPrice)}</p>
                        <p className={cn("text-xs font-semibold",
                          marginPct >= 20 ? "text-green-600" : marginPct >= 10 ? "text-amber-600" : "text-muted-foreground"
                        )}>
                          {marginPct.toFixed(1)}% margin
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedBundleForInfo(bundle)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 active:scale-95 transition-all"
                        title="View Bundle Details"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAddBundle(bundle)}
                        disabled={bundle.availableStock <= 0}
                        className={cn(
                          "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95",
                          bundle.availableStock > 0
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : loadingProducts ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Tag className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm mb-4">
              {debouncedSearch
                ? `No products matching "${debouncedSearch}"`
                : "No products in this category"}
            </p>
            {debouncedSearch && (
              <button
                className="flex items-center gap-2 text-sm font-semibold text-primary border border-primary/30 px-4 py-2 rounded-xl active:scale-95 transition-transform"
                onClick={() => setQuickAddOpen(true)}
              >
                <PlusCircle className="w-4 h-4" />
                Create "{debouncedSearch}" as new product
              </button>
            )}
          </div>
        ) : (
          <>
            {debouncedSearch && (
              <p className="text-xs text-muted-foreground mb-2">
                {filteredProducts.length} result
                {filteredProducts.length !== 1 ? "s" : ""} for "{debouncedSearch}"
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p as ProductItem}
                  qty={cartStore.getQtyForProduct(p.id)}
                  onAdd={() => handleAddProduct(p as ProductItem)}
                  onInc={() => cartStore.updateQty(p.id, 1)}
                  onDec={() => cartStore.updateQty(p.id, -1)}
                />
              ))}
            </div>

            {/* Quick Add new product link at bottom */}
            <button
              className="w-full mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground py-3 border border-dashed rounded-xl hover:bg-muted/30 active:scale-[0.98] transition-all"
              onClick={() => setQuickAddOpen(true)}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Can't find a product? Quick Add
            </button>
          </>
        )}
      </div>

      </div>{/* end LEFT PANEL */}

      {/* RIGHT PANEL: desktop cart (hidden on mobile) */}
      <div className="hidden lg:flex flex-col lg:w-[40%] max-w-[480px] shrink-0 border-l bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h2 className="font-bold text-base">
            Cart{" "}
            <span className="text-muted-foreground font-normal text-sm">({itemCount} items)</span>
          </h2>
          {itemCount > 0 && (
            <span className="text-sm font-bold text-primary">{formatCurrency(cartTotal)}</span>
          )}
        </div>
        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-8 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs mt-1">Tap a product to add it</p>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 divide-y border-t">
              {cartStore.items.map((item) => {
                return (
                  <CartItemRow
                    key={item.productId}
                    item={item}
                    layout="sidebar"
                    updateQty={cartStore.updateQty}
                    setQty={cartStore.setQty}
                    removeItem={cartStore.removeItem}
                    setItemDiscount={cartStore.setItemDiscount}
                  />
                );
              })}
            </div>
            <div className="border-t p-3 space-y-2 shrink-0">
              <div className="flex justify-between font-bold text-primary">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(cartTotal)}</span>
              </div>
              <Button className="w-full h-11 font-bold" onClick={handleCheckoutOpen}>
                Checkout →
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Sticky Cart Footer — mobile only */}
      {itemCount > 0 && (
        <div className="fixed left-0 right-0 z-40 px-4 lg:hidden" style={{ bottom: "calc(64px + env(safe-area-inset-bottom, 16px))" }}>
          <button
            className="w-full bg-[#006b2c] hover:bg-[#005a24] text-white rounded-full shadow-lg h-[64px] flex items-center justify-between px-6 active:scale-[0.98] transition-transform"
            onClick={handleCheckoutOpen}
            data-testid="place-order"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] font-bold rounded-full w-[20px] h-[20px] flex items-center justify-center border-2 border-[#006b2c]"
                  >
                    {itemCount}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="text-[14px] font-bold tracking-wide">VIEW BILL</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[20px] font-bold">{formatCurrency(cartTotal)}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckoutOpen}
      />



      {/* Quick Add Product Sheet */}
      <QuickAddProduct
        open={quickAddOpen}
        onClose={() => { setQuickAddOpen(false); setQuickAddBarcode(""); }}
        onSaved={handleQuickAddSaved}
        prefilledBarcode={quickAddBarcode}
        showAddToCart={true}
      />

      {/* Camera Barcode Scanner */}
      <Suspense fallback={null}>
        <BarcodeScannerModal
          open={scannerOpen}
          continuous={continuousScanRef.current}
          onClose={() => {
            setScannerOpen(false);
            if (continuousScanRef.current) {
              setContinuousScan(false);
              continuousScanRef.current = false;
              setLastScanned(null);
            }
          }}
          onDetected={(barcode) => {
            const exactMatch = allProducts?.find(
              (p: any) => p.barcode === barcode && p.status === "active"
            );
            
            if (exactMatch) {
              cartStore.addItem(exactMatch as any);
              playSound("scanSuccess");
              setLastScanned(exactMatch.name);
              toast({
                title: `Added: ${exactMatch.name}`,
                description: formatCurrency(Number(exactMatch.sellPrice)),
              });
              
              if (!continuousScanRef.current) {
                setScannerOpen(false);
              }
            } else {
              setScannerOpen(false);
              if (continuousScanRef.current) {
                setContinuousScan(false);
                continuousScanRef.current = false;
                setLastScanned(null);
              }
              setQuickAddBarcode(barcode);
              setQuickAddOpen(true);
            }
          }}
        />
      </Suspense>

      {/* Bundle Info Drawer */}
      <BundleDetailDrawer
        open={selectedBundleForInfo !== null}
        bundle={selectedBundleForInfo}
        onClose={() => setSelectedBundleForInfo(null)}
        onAdd={handleAddBundle}
      />
    </div>
  );
}
