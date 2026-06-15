import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { Plus, Trash2, Package, Search, Layers, Power } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useListProducts } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useBundle, useUpdateBundle } from "@/hooks/use-bundles";
import PageHeader from "@/components/page-header";

interface BundleItem {
  productId: number;
  name: string;
  buyPrice: number;
  sellPrice: number;
  unit: string;
  quantity: number;
}

export default function BundleDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const updateBundle = useUpdateBundle(id);

  const { data: bundle, isLoading } = useBundle(id);
  const { data: allProducts } = useListProducts({ limit: 200 });

  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [sellPrice, setSellPrice] = useState<string | null>(null);
  const [items, setItems] = useState<BundleItem[] | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  const effectiveName = name ?? bundle?.name ?? "";
  const effectiveDescription = description ?? bundle?.description ?? "";
  const effectiveSellPrice = sellPrice ?? bundle?.sellPrice ?? "";
  const effectiveItems: BundleItem[] = items ?? (bundle?.items?.map((i) => ({
    productId: i.productId,
    name: i.productNameSnapshot,
    buyPrice: Number(i.buyPriceSnapshot),
    sellPrice: 0,
    unit: "piece",
    quantity: Number(i.quantity),
  })) ?? []);

  const activeProducts = useMemo(() => (allProducts ?? []).filter(p => p.status === "active"), [allProducts]);

  const searchResults = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return activeProducts
      .filter(p => p.name.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q))
      .filter(p => !effectiveItems.find((i: BundleItem) => i.productId === p.id))
      .slice(0, 6);
  }, [productSearch, activeProducts, effectiveItems]);

  const computedBuyPrice = effectiveItems.reduce((sum, item) => sum + item.buyPrice * item.quantity, 0);
  const parsedSellPrice = parseFloat(effectiveSellPrice as string) || 0;
  const profit = parsedSellPrice - computedBuyPrice;
  const marginPct = parsedSellPrice > 0 ? (profit / parsedSellPrice) * 100 : 0;

  const addItem = (product: any) => {
    setItems(prev => [...(prev ?? effectiveItems), {
      productId: product.id,
      name: product.name,
      buyPrice: Number(product.buyPrice),
      sellPrice: Number(product.sellPrice),
      unit: product.unit ?? "piece",
      quantity: 1,
    }]);
    setProductSearch("");
    setShowProductSearch(false);
  };

  const removeItem = (productId: number) => {
    setItems(effectiveItems.filter(i => i.productId !== productId));
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) return;
    setItems(effectiveItems.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const handleSave = () => {
    if (!effectiveName.trim()) { toast({ title: "Bundle name is required", variant: "destructive" }); return; }
    if (effectiveItems.length === 0) { toast({ title: "Add at least one product", variant: "destructive" }); return; }
    if (!parsedSellPrice || parsedSellPrice <= 0) { toast({ title: "Set a sell price", variant: "destructive" }); return; }

    updateBundle.mutate({
      name: effectiveName.trim(),
      description: effectiveDescription.trim() || undefined,
      sellPrice: parsedSellPrice,
      items: effectiveItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
    }, {
      onSuccess: () => {
        toast({ title: "Bundle updated!" });
        setLocation("/bundles");
      },
      onError: (err: any) => {
        toast({ title: "Failed to update bundle", description: err?.message, variant: "destructive" });
      },
    });
  };

  const handleToggleActive = () => {
    updateBundle.mutate({ isActive: !bundle?.isActive }, {
      onSuccess: () => {
        toast({ title: bundle?.isActive ? "Bundle deactivated" : "Bundle activated" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full bg-slate-50 font-sans">
        <PageHeader title="Edit Bundle" subtitle="Combo pack or kit" backTo="/bundles" />
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="flex flex-col min-h-full bg-slate-50 font-sans">
        <PageHeader title="Bundle Not Found" backTo="/bundles" />
        <div className="p-8 text-center text-muted-foreground">This bundle does not exist.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans">
      <PageHeader title="Edit Bundle" subtitle="Combo pack or kit" backTo="/bundles" />

      <div className="flex-1 p-4 pb-32 space-y-4">
        <div className="space-y-3">
          <div>
            <Label className="text-[13px] font-bold text-slate-500 mb-1.5 block">Bundle Name *</Label>
            <Input
              className="h-14 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g. Bathroom Cleaning Kit"
              value={effectiveName}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[13px] font-bold text-slate-500 mb-1.5 block mt-3">Description</Label>
            <Input
              className="h-14 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Optional description"
              value={effectiveDescription}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider",
              bundle.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
            )}>
              {bundle.isActive ? "Active" : "Inactive"}
            </span>
            <Button variant="ghost" size="sm" className="text-[13px] font-bold gap-1 h-8 text-slate-500 hover:bg-slate-200" onClick={handleToggleActive}>
              <Power className="w-3.5 h-3.5" />
              {bundle.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <Label className="text-[14px] font-bold text-slate-800">Components *</Label>
            <button
              onClick={() => setShowProductSearch(!showProductSearch)}
              className="flex items-center gap-1 text-[13px] text-primary font-bold active-elevate"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>

          {showProductSearch && (
            <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden mb-3">
              <div className="relative p-2 border-b border-slate-100">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  autoFocus
                  className="pl-8 h-10 text-[14px] border-0 bg-slate-50 rounded-xl focus-visible:ring-0"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between transition-colors"
                      onClick={() => addItem(p)}
                    >
                      <div>
                        <p className="text-[14px] font-bold text-slate-800">{p.name}</p>
                        <p className="text-[12px] font-medium text-slate-500 mt-0.5">Buy: {formatCurrency(Number(p.buyPrice))}</p>
                      </div>
                      <span className="text-[12px] text-primary font-bold px-3 py-1 bg-primary/10 rounded-full">+ Add</span>
                    </button>
                  ))}
                </div>
              )}
              {productSearch.trim() && searchResults.length === 0 && (
                <p className="p-4 text-[13px] font-medium text-slate-500 text-center">No products found</p>
              )}
            </div>
          )}

          {effectiveItems.length === 0 ? (
            <div className="border-dashed border-2 border-slate-200 rounded-2xl bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center text-slate-400">
              <Package className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-[14px] font-bold">No components added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {effectiveItems.map(item => (
                <div key={item.productId} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                      {formatCurrency(item.buyPrice)} / {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-base font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors active:scale-95"
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                    >−</button>
                    <span className="w-6 text-center text-[15px] font-bold">{item.quantity}</span>
                    <button
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-base font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors active:scale-95"
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                    >+</button>
                  </div>
                  <button
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {effectiveItems.length > 0 && (
            <div className="bg-slate-100 rounded-2xl p-4 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-slate-500">Total Component Cost</span>
                <span className="font-bold text-[16px] text-slate-800">{formatCurrency(computedBuyPrice)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <Label className="text-[13px] font-bold text-slate-500 mb-1.5 block">Bundle Sell Price *</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
            <Input
              className="pl-8 h-14 rounded-2xl text-[16px] font-bold border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              value={effectiveSellPrice}
              onChange={e => setSellPrice(e.target.value)}
            />
          </div>

          {parsedSellPrice > 0 && effectiveItems.length > 0 && (
            <div className={cn(
              "border rounded-2xl p-4 mt-3 flex justify-between items-center shadow-sm",
              marginPct >= 20 ? "bg-emerald-50 border-emerald-200" :
              marginPct >= 10 ? "bg-amber-50 border-amber-200" :
              "bg-red-50 border-red-200"
            )}>
              <span className="text-[13px] font-bold text-slate-600">Bundle Profit</span>
              <div className="text-right">
                <span className={cn(
                  "font-bold text-[16px]",
                  marginPct >= 20 ? "text-emerald-700" : marginPct >= 10 ? "text-amber-700" : "text-red-700"
                )}>
                  {formatCurrency(profit)}
                </span>
                <span className={cn(
                  "ml-1.5 text-[12px] font-bold",
                  marginPct >= 20 ? "text-emerald-600" : marginPct >= 10 ? "text-amber-600" : "text-red-600"
                )}>
                  ({marginPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-safe z-40">
        <Button
          className="w-full h-14 text-[16px] font-bold rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-white active-elevate transition-transform"
          onClick={handleSave}
          disabled={updateBundle.isPending}
        >
          <Layers className="w-5 h-5 mr-2" />
          {updateBundle.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
