import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/stores/settings";
import {
  Search, X, ShoppingCart, Plus, Minus, Trash2,
  CheckCircle2, TrendingUp, AlertTriangle, Printer,
  Package, Tag, PlusCircle, Layers,
} from "lucide-react";
import { useBundles } from "@/hooks/use-bundles";
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
  const margin = computeMargin(product.buyPrice, product.sellPrice);

  return (
    <div
      className={cn(
        "bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden",
        outOfStock && "opacity-60"
      )}
    >
      {/* Product icon area */}
      <div className="bg-primary/5 h-14 flex items-center justify-center relative">
        <Package className="w-7 h-7 text-primary/30" />
        {margin && (
          <span
            className={cn(
              "absolute top-1 right-1 text-[9px] font-bold px-1 py-0.5 rounded border",
              MARGIN_TIER_CONFIG[margin.tier].badgeClass
            )}
          >
            {margin.marginPct.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2 flex-1 flex flex-col gap-0.5">
        <p className="text-xs font-semibold leading-tight line-clamp-2 min-h-[2rem]">
          {product.name}
        </p>
        <p className="text-sm font-bold text-primary">
          {formatCurrency(Number(product.sellPrice))}
        </p>
        <p
          className={cn(
            "text-[10px]",
            outOfStock
              ? "text-destructive font-semibold"
              : stock <= 5
              ? "text-amber-600"
              : "text-muted-foreground"
          )}
        >
          {outOfStock ? "Out of stock" : `Stock: ${stock}`}
        </p>
      </div>

      {/* Add / Stepper */}
      <div className="px-2 pb-2">
        {qty === 0 ? (
          <button
            className={cn(
              "w-full h-9 rounded-lg text-xs font-bold transition-all",
              outOfStock
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground active:scale-95"
            )}
            onClick={outOfStock ? undefined : onAdd}
            disabled={outOfStock}
          >
            + Add
          </button>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <button
              className="w-9 h-9 rounded-lg border border-primary/30 flex items-center justify-center active:scale-95"
              onClick={onDec}
            >
              <Minus className="w-3 h-3 text-primary" />
            </button>
            <span className="flex-1 text-center font-bold text-sm text-primary">
              {qty}
            </span>
            <button
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center active:scale-95",
                qty >= stock
                  ? "bg-amber-100 border border-amber-300"
                  : "bg-primary"
              )}
              onClick={qty < stock ? onInc : undefined}
              disabled={qty >= stock}
            >
              <Plus className={cn("w-3 h-3", qty >= stock ? "text-amber-600" : "text-white")} />
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
            const lineTotal =
              (item.unitPrice - item.itemDiscount) * item.quantity;
            return (
              <div key={item.productId} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(item.unitPrice)} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      {formatCurrency(lineTotal)}
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-destructive/60 hover:text-destructive mt-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Stepper */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full shrink-0"
                    onClick={() => updateQty(item.productId, -1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-10 text-center font-bold text-sm">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full shrink-0"
                    onClick={() => updateQty(item.productId, 1)}
                    disabled={item.quantity >= item.availableStock}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  {/* Item discount */}
                  <div className="flex-1 flex items-center gap-1 ml-2">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      Disc ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={item.unitPrice}
                      value={item.itemDiscount || ""}
                      onChange={(e) =>
                        setItemDiscount(
                          item.productId,
                          Math.min(Number(e.target.value) || 0, item.unitPrice)
                        )
                      }
                      className="w-16 text-xs h-7 border rounded px-1.5 text-right"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
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
              className="flex-1 h-11 font-bold"
              onClick={onCheckout}
            >
              Checkout →
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function CheckoutSheet({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (bill: BillSuccessData) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createBill = useCreateBill();
  const {
    items,
    customerId,
    setCustomerId,
    notes,
    setNotes,
    getTotal,
    getDiscountAmount,
    getSubtotal,
    clearCart,
  } = useCartStore();

  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");

  const total = getTotal();
  const discountAmt = getDiscountAmount();
  const cashNum = Number(cashAmount) || 0;
  const upiNum = Number(upiAmount) || 0;
  const udhaarAmount = Math.max(0, total - cashNum - upiNum);

  const { data: customers } = useListCustomers();

  const handleConfirm = () => {
    if (items.length === 0) return;
    if (udhaarAmount > 0 && !customerId) {
      toast({
        title: "Customer required",
        description: "Select a customer for udhaar.",
        variant: "destructive",
      });
      return;
    }

    createBill.mutate(
      {
        data: {
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountAmount: i.itemDiscount * i.quantity,
          })),
          customerId: customerId ? Number(customerId) : undefined,
          totalAmount: total,
          cashAmount: cashNum,
          upiAmount: upiNum,
          udhaarAmount,
          discountAmount: discountAmt,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: (bill) => {
          const b = bill as any;
          const selectedCustomer = customers?.find(
            (c) => String(c.id) === customerId
          );
          queryClient.invalidateQueries({
            queryKey: getListBillsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetDashboardSummaryQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getListProductsQueryKey(),
          });

          const billItems = items.map((i) => ({
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: (i.unitPrice - i.itemDiscount) * i.quantity,
          }));

          onSuccess({
            billNumber: b.billNumber,
            profit: b.estimatedProfit != null ? Number(b.estimatedProfit) : null,
            totalAmount: total,
            cashAmount: cashNum,
            upiAmount: upiNum,
            udhaarAmount,
            customerName: selectedCustomer?.name,
            notes: notes || undefined,
            items: billItems,
          });
          clearCart();
          setCashAmount("");
          setUpiAmount("");
        },
        onError: (err) => {
          toast({
            title: "Error creating bill",
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      )}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-4 pb-2 border-b shrink-0">
          <h2 className="font-bold text-base">
            Checkout — {formatCurrency(total)}
          </h2>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Payment */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payment
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Cash (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="h-12 text-base font-semibold"
                  placeholder="0"
                  data-testid="input-cash"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  UPI (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={upiAmount}
                  onChange={(e) => setUpiAmount(e.target.value)}
                  className="h-12 text-base font-semibold"
                  placeholder="0"
                  data-testid="input-upi"
                />
              </div>
            </div>

            {udhaarAmount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex justify-between items-center">
                <span className="text-amber-700 font-medium text-sm">
                  Udhaar
                </span>
                <span className="text-amber-700 font-bold">
                  {formatCurrency(udhaarAmount)}
                </span>
              </div>
            )}

            {/* Customer */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {udhaarAmount > 0 ? "Customer (required)*" : "Customer (optional)"}
              </label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-12" data-testid="select-customer">
                  <SelectValue placeholder="Walk-in customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Walk-in</SelectItem>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                      {Number(c.udhaarBalance) > 0
                        ? ` (Bal: ${formatCurrency(Number(c.udhaarBalance))})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Notes (optional)
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bill notes..."
                className="h-10"
                data-testid="input-notes"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t shrink-0">
          <Button
            className="w-full h-14 text-lg font-bold shadow-md shadow-primary/30"
            onClick={handleConfirm}
            disabled={createBill.isPending || items.length === 0}
            data-testid="button-confirm-bill"
          >
            {createBill.isPending
              ? "Saving..."
              : `Confirm Bill — ${formatCurrency(total)}`}
          </Button>
        </div>
      </div>
    </>
  );
}

type BillSuccessData = {
  billNumber: string;
  profit: number | null;
  totalAmount: number;
  cashAmount: number;
  upiAmount: number;
  udhaarAmount: number;
  customerName?: string;
  notes?: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
};

function BillSuccessScreen({
  bill,
  onNewBill,
  onHome,
}: {
  bill: BillSuccessData;
  onNewBill: () => void;
  onHome: () => void;
}) {
  const { settings } = useSettingsStore();
  const storeName = settings.storeName;

  const handlePrint = () => {
    const now = new Date();
    printReceipt({
      storeName,
      billNumber: bill.billNumber,
      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      items: bill.items,
      subtotal: bill.totalAmount,
      totalAmount: bill.totalAmount,
      cashAmount: bill.cashAmount,
      upiAmount: bill.upiAmount,
      udhaarAmount: bill.udhaarAmount,
      customerName: bill.customerName,
      notes: bill.notes,
      estimatedProfit: bill.profit,
    });
  };

  const handleShare = () => {
    const lines = [
      `*Bill from ${storeName}*`,
      `Bill No: ${bill.billNumber}`,
      ``,
      ...bill.items.map(
        (i) =>
          `${i.productName} × ${i.quantity} — ${formatCurrency(i.totalPrice)}`
      ),
      ``,
      `*Total: ${formatCurrency(bill.totalAmount)}*`,
      bill.cashAmount > 0 ? `Cash: ${formatCurrency(bill.cashAmount)}` : "",
      bill.upiAmount > 0 ? `UPI: ${formatCurrency(bill.upiAmount)}` : "",
      bill.udhaarAmount > 0
        ? `Udhaar: ${formatCurrency(bill.udhaarAmount)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const encoded = encodeURIComponent(lines);
    window.open(`whatsapp://send?text=${encoded}`, "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-green-700 mb-1">Bill Saved!</h2>
      <p className="text-muted-foreground text-sm font-mono mb-1">
        {bill.billNumber}
      </p>
      {bill.customerName && (
        <p className="text-sm text-muted-foreground mb-3">
          Customer: {bill.customerName}
        </p>
      )}
      <div className="text-3xl font-bold mb-1">
        {formatCurrency(bill.totalAmount)}
      </div>
      <div className="flex gap-3 text-sm text-muted-foreground mb-4">
        {bill.cashAmount > 0 && (
          <span>Cash {formatCurrency(bill.cashAmount)}</span>
        )}
        {bill.upiAmount > 0 && (
          <span>UPI {formatCurrency(bill.upiAmount)}</span>
        )}
        {bill.udhaarAmount > 0 && (
          <span className="text-amber-600 font-medium">
            Udhaar {formatCurrency(bill.udhaarAmount)}
          </span>
        )}
      </div>

      {bill.profit != null && (
        <div
          className={cn(
            "rounded-xl border px-5 py-2.5 mb-6 text-sm font-semibold flex items-center gap-2",
            bill.profit >= 0
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Est. Profit: {formatCurrency(bill.profit)}
        </div>
      )}

      <div className="w-full space-y-2 max-w-sm">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-12 gap-2" onClick={handleShare}>
            <span>💬</span> Share
          </Button>
          <Button
            variant="outline"
            className="h-12 gap-2"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
        <Button
          className="w-full h-14 text-lg font-bold"
          onClick={onNewBill}
          data-testid="button-new-bill"
        >
          <Plus className="w-5 h-5 mr-2" /> New Bill
        </Button>
        <Button
          variant="outline"
          className="w-full h-11"
          onClick={onHome}
          data-testid="button-go-home"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

export default function Billing() {
  const [, setLocation] = useLocation();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [billSuccess, setBillSuccess] = useState<BillSuccessData | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"products" | "bundles">("products");
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
      : { limit: 200 }
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
  };

  const handleAddBundle = (bundle: any) => {
    for (const item of bundle.items) {
      cartStore.addItem({
        id: item.productId,
        name: `${item.productNameSnapshot} (${bundle.name})`,
        sellPrice: Number(bundle.sellPrice) / bundle.items.length,
        buyPrice: Number(item.buyPriceSnapshot),
        currentStock: 999,
        unit: "piece",
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

  const handleCheckoutOpen = () => {
    setCartOpen(false);
    setTimeout(() => setCheckoutOpen(true), 300);
  };

  const handleBillSuccess = (bill: BillSuccessData) => {
    setCheckoutOpen(false);
    setBillSuccess(bill);
  };

  const handleNewBill = () => {
    setBillSuccess(null);
    setSearch("");
    setActiveCategory("all");
  };

  if (billSuccess) {
    return (
      <BillSuccessScreen
        bill={billSuccess}
        onNewBill={handleNewBill}
        onHome={() => setLocation("/")}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Search Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              ref={searchInputRef}
              className="w-full pl-10 pr-10 h-12 rounded-xl border bg-white shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-product-search"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setSearch("")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="px-3 pb-2 flex items-center gap-2">
          <div className="flex bg-muted/60 rounded-xl p-0.5 gap-0.5">
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === "products"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground"
              )}
              onClick={() => setViewMode("products")}
            >
              <Package className="w-3.5 h-3.5" />
              Products
            </button>
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === "bundles"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground"
              )}
              onClick={() => setViewMode("bundles")}
            >
              <Layers className="w-3.5 h-3.5" />
              Bundles
              {activeBundles.length > 0 && (
                <span className={cn(
                  "text-[10px] rounded-full px-1 min-w-[16px] text-center",
                  viewMode === "bundles" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {activeBundles.length}
                </span>
              )}
            </button>
          </div>

          {/* Category chips — only in products view when not searching */}
          {viewMode === "products" && !debouncedSearch && (
            <div className="flex-1 overflow-x-auto flex gap-1.5 scrollbar-none">
              <button
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  activeCategory === "all"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-muted-foreground border-muted-foreground/20"
                )}
                onClick={() => setActiveCategory("all")}
              >
                All
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                    activeCategory === cat.name
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-muted-foreground border-muted-foreground/20"
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

      {/* Sticky Cart Footer */}
      {itemCount > 0 && (
        <div className="fixed bottom-[60px] left-0 right-0 z-30 px-3 pb-2">
          <button
            className="w-full bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 flex items-center px-4 py-3 gap-3 active:scale-[0.98] transition-transform"
            onClick={() => setCartOpen(true)}
            data-testid="cart-footer"
          >
            <div className="bg-white/20 rounded-xl w-10 h-10 flex items-center justify-center shrink-0 relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-white text-primary text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs text-white/70">
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </p>
              <p className="text-base font-bold leading-tight">
                {formatCurrency(cartTotal)}
              </p>
            </div>
            <div className="bg-white text-primary text-sm font-bold px-4 py-2 rounded-xl">
              Checkout →
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

      {/* Checkout Sheet */}
      <CheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handleBillSuccess}
      />

      {/* Quick Add Product Sheet */}
      <QuickAddProduct
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSaved={handleQuickAddSaved}
        showAddToCart={true}
      />
    </div>
  );
}
