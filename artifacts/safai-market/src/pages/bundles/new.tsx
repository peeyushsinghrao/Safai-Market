import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Plus, Trash2, Package, Search, X, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useListProducts } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCreateBundle } from "@/hooks/use-bundles";
import PageHeader from "@/components/page-header";

interface BundleItem {
  productId: number;
  name: string;
  buyPrice: number;
  sellPrice: number;
  unit: string;
  quantity: number;
}

export default function BundleNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createBundle = useCreateBundle();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [items, setItems] = useState<BundleItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  const { data: allProducts } = useListProducts({ limit: 200 });

  const activeProducts = useMemo(() => (allProducts ?? []).filter(p => p.status === "active"), [allProducts]);

  const searchResults = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return activeProducts
      .filter(p => p.name.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q))
      .filter(p => !items.find(i => i.productId === p.id))
      .slice(0, 6);
  }, [productSearch, activeProducts, items]);

  const computedBuyPrice = items.reduce((sum, item) => sum + item.buyPrice * item.quantity, 0);
  const parsedSellPrice = parseFloat(sellPrice) || 0;
  const profit = parsedSellPrice - computedBuyPrice;
  const marginPct = parsedSellPrice > 0 ? (profit / parsedSellPrice) * 100 : 0;

  const addItem = (product: any) => {
    setItems(prev => [...prev, {
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
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) return;
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const handleSave = () => {
    if (!name.trim()) { toast({ title: "Bundle name is required", variant: "destructive" }); return; }
    if (items.length === 0) { toast({ title: "Add at least one product", variant: "destructive" }); return; }
    if (!parsedSellPrice || parsedSellPrice <= 0) { toast({ title: "Set a sell price", variant: "destructive" }); return; }

    createBundle.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      sellPrice: parsedSellPrice,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
    }, {
      onSuccess: () => {
        toast({ title: "Bundle created!" });
        setLocation("/bundles");
      },
      onError: (err: any) => {
        toast({ title: "Failed to create bundle", description: err?.message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50/50">
      <PageHeader title="Create Bundle" subtitle="Combo pack or kit" backTo="/bundles" />

      <div className="flex-1 p-4 pb-32 space-y-4">
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-semibold">Bundle Name *</Label>
            <Input
              className="mt-1 h-11"
              placeholder="e.g. Bathroom Cleaning Kit"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-semibold">Description</Label>
            <Input
              className="mt-1 h-11"
              placeholder="Optional description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Components *</Label>
            <button
              onClick={() => setShowProductSearch(!showProductSearch)}
              className="flex items-center gap-1 text-xs text-primary font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>

          {showProductSearch && (
            <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="relative p-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  autoFocus
                  className="pl-8 h-9 text-sm border-0 bg-gray-50"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="border-t divide-y max-h-52 overflow-y-auto">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      className="w-full text-left p-3 hover:bg-gray-50 flex items-center justify-between"
                      onClick={() => addItem(p)}
                    >
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Buy: {formatCurrency(Number(p.buyPrice))}</p>
                      </div>
                      <span className="text-xs text-primary font-semibold">+ Add</span>
                    </button>
                  ))}
                </div>
              )}
              {productSearch.trim() && searchResults.length === 0 && (
                <p className="p-3 text-xs text-muted-foreground text-center border-t">No products found</p>
              )}
            </div>
          )}

          {items.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent shadow-none">
              <CardContent className="p-6 flex flex-col items-center text-muted-foreground">
                <Package className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No components added yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.productId} className="bg-white border rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.buyPrice)} / {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-7 h-7 rounded-full border flex items-center justify-center text-base font-bold hover:bg-gray-100"
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                    >−</button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      className="w-7 h-7 rounded-full border flex items-center justify-center text-base font-bold hover:bg-gray-100"
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                    >+</button>
                  </div>
                  <button
                    className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="bg-gray-50 border rounded-xl p-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Component Cost</span>
                <span className="font-semibold text-foreground">{formatCurrency(computedBuyPrice)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Bundle Sell Price *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
            <Input
              className="pl-7 h-11 text-base"
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              value={sellPrice}
              onChange={e => setSellPrice(e.target.value)}
            />
          </div>

          {parsedSellPrice > 0 && items.length > 0 && (
            <Card className={cn(
              "border shadow-none",
              marginPct >= 20 ? "bg-green-50 border-green-200" :
              marginPct >= 10 ? "bg-amber-50 border-amber-200" :
              "bg-red-50 border-red-200"
            )}>
              <CardContent className="p-3 flex justify-between text-sm">
                <span className="text-muted-foreground">Bundle Profit</span>
                <div className="text-right">
                  <span className={cn(
                    "font-bold",
                    marginPct >= 20 ? "text-green-700" : marginPct >= 10 ? "text-amber-700" : "text-red-700"
                  )}>
                    {formatCurrency(profit)}
                  </span>
                  <span className={cn(
                    "ml-1.5 text-xs font-semibold",
                    marginPct >= 20 ? "text-green-600" : marginPct >= 10 ? "text-amber-600" : "text-red-600"
                  )}>
                    ({marginPct.toFixed(1)}%)
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-safe">
        <Button
          className="w-full h-12 text-base font-bold gap-2"
          onClick={handleSave}
          disabled={createBundle.isPending}
        >
          <Layers className="w-5 h-5" />
          {createBundle.isPending ? "Saving..." : "Save Bundle"}
        </Button>
      </div>
    </div>
  );
}
