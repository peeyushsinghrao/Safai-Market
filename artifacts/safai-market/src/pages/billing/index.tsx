import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle2, X } from "lucide-react";
import {
  useListProducts,
  useListCustomers,
  useCreateBill,
  getListBillsQueryKey,
  getGetDashboardSummaryQueryKey,
  getListProductsQueryKey,
  getListCustomersQueryKey,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default function Billing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createBill = useCreateBill();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [billSuccess, setBillSuccess] = useState<string | null>(null);

  const { data: products, isLoading: loadingProducts } = useListProducts({
    search: search.length >= 2 ? search : undefined,
  });

  const { data: customers } = useListCustomers();

  const cartTotal = useMemo(() => cart.reduce((s, item) => s + item.quantity * item.unitPrice, 0), [cart]);
  const cashNum = Number(cashAmount) || 0;
  const upiNum = Number(upiAmount) || 0;
  const udhaarAmount = Math.max(0, cartTotal - cashNum - upiNum);

  const addToCart = (product: { id: number; name: string; sellPrice: number | string }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, productName: product.name, quantity: 1, unitPrice: Number(product.sellPrice) }];
    });
    setSearch("");
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => i.productId === productId ? { ...i, quantity: newQty } : i);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleConfirmBill = () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", description: "Add products to the cart first.", variant: "destructive" });
      return;
    }

    if (udhaarAmount > 0 && !customerId) {
      toast({ title: "Customer required", description: "Select a customer for udhaar amount.", variant: "destructive" });
      return;
    }

    createBill.mutate({
      data: {
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountAmount: 0,
        })),
        customerId: customerId ? Number(customerId) : undefined,
        totalAmount: cartTotal,
        cashAmount: cashNum,
        upiAmount: upiNum,
        udhaarAmount,
        discountAmount: 0,
        notes: notes || undefined,
      },
    }, {
      onSuccess: (bill) => {
        toast({ title: "Bill created!", description: `Bill ${(bill as any).billNumber}` });
        setBillSuccess((bill as any).billNumber);
        queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const resetBill = () => {
    setCart([]);
    setCashAmount("");
    setUpiAmount("");
    setNotes("");
    setCustomerId("");
    setSearch("");
    setBillSuccess(null);
  };

  if (billSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <CheckCircle2 className="w-20 h-20 text-primary mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-1">Bill Created!</h2>
        <p className="text-muted-foreground text-sm mb-2">Bill Number: <span className="font-mono font-bold">{billSuccess}</span></p>
        <div className="text-3xl font-bold mb-6">{formatCurrency(cartTotal)}</div>
        <Button className="w-full h-12 text-lg active-elevate mb-3" onClick={resetBill} data-testid="button-new-bill">
          <Plus className="w-5 h-5 mr-2" /> New Bill
        </Button>
        <Button variant="outline" className="w-full h-12" onClick={() => setLocation("/")} data-testid="button-go-home">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pb-4">
      {/* Product Search */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            className="pl-10 h-12 bg-background border-muted shadow-sm text-base rounded-xl"
            placeholder="Search product to add..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-product-search"
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setSearch("")}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {search.length >= 2 && (
          <div className="mt-2 bg-background rounded-xl border shadow-lg max-h-52 overflow-y-auto">
            {loadingProducts ? (
              <div className="p-3 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : products?.length === 0 ? (
              <div className="p-4 text-sm text-center text-muted-foreground">No products found</div>
            ) : (
              products?.filter((p) => p.status === "active").slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 active:bg-muted border-b last:border-0 text-left"
                  onClick={() => addToCart(p)}
                  data-testid={`button-add-product-${p.id}`}
                >
                  <div>
                    <div className="font-medium text-sm">{p.name}</div>
                    {p.brand && <div className="text-xs text-muted-foreground">{p.brand}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary text-sm">{formatCurrency(Number(p.sellPrice))}</div>
                    <div className={cn("text-xs", Number(p.currentStock) <= 0 ? "text-destructive" : "text-muted-foreground")}>
                      Stock: {p.currentStock} {p.unit}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Cart */}
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Search and add products above</p>
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="p-0 divide-y">
              {cart.map((item) => (
                <div key={item.productId} className="p-3 flex items-center gap-3" data-testid={`cart-item-${item.productId}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.productName}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} each</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQty(item.productId, -1)} data-testid={`button-qty-minus-${item.productId}`}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQty(item.productId, 1)} data-testid={`button-qty-plus-${item.productId}`}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-right w-16">
                    <div className="font-bold text-sm">{formatCurrency(item.quantity * item.unitPrice)}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/60 hover:text-destructive" onClick={() => removeFromCart(item.productId)} data-testid={`button-remove-${item.productId}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {cart.length > 0 && (
          <>
            {/* Total */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
              <span className="font-bold text-primary">Total</span>
              <span className="text-2xl font-bold text-primary" data-testid="text-cart-total">{formatCurrency(cartTotal)}</span>
            </div>

            {/* Payment Split */}
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Payment</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Cash (₹)</label>
                    <Input type="number" min="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} className="h-12 text-base font-semibold" placeholder="0" data-testid="input-cash" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">UPI (₹)</label>
                    <Input type="number" min="0" value={upiAmount} onChange={(e) => setUpiAmount(e.target.value)} className="h-12 text-base font-semibold" placeholder="0" data-testid="input-upi" />
                  </div>
                </div>

                {udhaarAmount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-amber-700 font-medium text-sm">Udhaar</span>
                    <span className="text-amber-700 font-bold">{formatCurrency(udhaarAmount)}</span>
                  </div>
                )}

                {udhaarAmount > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Customer (for Udhaar) *</label>
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger className="h-12" data-testid="select-customer">
                        <SelectValue placeholder="Select customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name} {Number(c.udhaarBalance) > 0 ? `(Bal: ${formatCurrency(Number(c.udhaarBalance))})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {udhaarAmount === 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Customer (optional)</label>
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger className="h-12" data-testid="select-customer-optional">
                        <SelectValue placeholder="Walk-in customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Walk-in</SelectItem>
                        {customers?.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Notes (optional)</label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bill notes..." className="h-10" data-testid="input-notes" />
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full h-14 text-lg font-bold active-elevate shadow-md shadow-primary/30"
              onClick={handleConfirmBill}
              disabled={createBill.isPending}
              data-testid="button-confirm-bill"
            >
              {createBill.isPending ? "Creating Bill..." : `Confirm Bill — ${formatCurrency(cartTotal)}`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
