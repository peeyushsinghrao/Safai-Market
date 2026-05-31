import { useState, useEffect } from "react";
import { X, TrendingUp, Loader2 } from "lucide-react";
import { useListCategories, useCreateProduct } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { computeMargin, MARGIN_TIER_CONFIG } from "@/lib/profit";
import { formatCurrency } from "@/lib/format";
import { lookupBarcodeProduct } from "@/lib/barcode-lookup";

interface QuickAddProductProps {
  open: boolean;
  onClose: () => void;
  onSaved: (product: { id: number; name: string; sellPrice: number; buyPrice: number | null; currentStock: number; unit: string }) => void;
  prefilledBarcode?: string;
  showAddToCart?: boolean;
}

export default function QuickAddProduct({
  open,
  onClose,
  onSaved,
  prefilledBarcode = "",
  showAddToCart = false,
}: QuickAddProductProps) {
  const [name, setName] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [addToCart, setAddToCart] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const { data: categories } = useListCategories();
  const createProduct = useCreateProduct();

  useEffect(() => {
    if (!open) {
      setName("");
      setSellPrice("");
      setBuyPrice("");
      setStock("");
      setCategoryId("");
      setAddToCart(false);
      setLookingUp(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && prefilledBarcode) {
      setLookingUp(true);
      lookupBarcodeProduct(prefilledBarcode)
        .then((info) => {
          if (info?.name) setName((prev) => prev || info.name!);
          else if (info?.brand) setName((prev) => prev || info.brand!);
          setLookingUp(false);
        })
        .catch(() => setLookingUp(false));
    }
  }, [open, prefilledBarcode]);

  const margin = computeMargin(
    buyPrice ? Number(buyPrice) : null,
    sellPrice ? Number(sellPrice) : null
  );

  const handleSave = (withCart: boolean) => {
    if (!name.trim() || !sellPrice) return;

    const catId = categoryId ? Number(categoryId) : (categories?.[0]?.id ?? 1);
    createProduct.mutate(
      {
        data: {
          name: name.trim(),
          sellPrice: Number(sellPrice),
          buyPrice: buyPrice ? Number(buyPrice) : 0,
          unit: "pcs",
          categoryId: catId,
          initialStock: stock ? Number(stock) : 0,
          lowStockLimit: 5,
        },
      },
      {
        onSuccess: (product) => {
          const p = product as any;
          onSaved({
            id: p.id,
            name: p.name,
            sellPrice: Number(p.sellPrice),
            buyPrice: p.buyPrice ? Number(p.buyPrice) : null,
            currentStock: Number(p.currentStock ?? p.initialStock ?? 0),
            unit: p.unit ?? "pcs",
          });
          if (!withCart) onClose();
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
        <div className="flex items-center justify-between px-4 pb-3 border-b shrink-0">
          <div>
            <h2 className="font-bold text-base">Quick Add Product</h2>
            {prefilledBarcode && (
              <p className="text-xs text-muted-foreground font-mono">Barcode: {prefilledBarcode}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {lookingUp && (
            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Looking up product info...
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Product Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Harpic 500ml"
              className="h-12 text-base"
              autoFocus
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Buy Price (₹) <span className="text-muted-foreground/60">(for profit)</span>
              </label>
              <Input
                type="number"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0"
                className="h-12 text-base font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Sell Price (₹) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="0"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0"
                className="h-12 text-base font-semibold"
              />
            </div>
          </div>

          {/* Live margin preview */}
          {margin && (
            <div
              className={cn(
                "flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border",
                MARGIN_TIER_CONFIG[margin.tier].badgeClass
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Margin: {margin.marginPct.toFixed(1)}% —{" "}
              {MARGIN_TIER_CONFIG[margin.tier].label}
              <span className="ml-auto text-muted-foreground font-normal">
                Profit: {formatCurrency(margin.profitPerUnit)}/unit
              </span>
            </div>
          )}

          {/* Stock */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Opening Stock (units)
            </label>
            <Input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
              className="h-12 text-base font-semibold"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Category (optional)
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-12 border rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select category...</option>
              {categories?.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 border-t space-y-2 shrink-0">
          {showAddToCart ? (
            <>
              <Button
                className="w-full h-12 font-bold"
                onClick={() => handleSave(true)}
                disabled={!name.trim() || !sellPrice || createProduct.isPending}
              >
                {createProduct.isPending ? "Saving..." : "Save & Add to Cart"}
              </Button>
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => handleSave(false)}
                disabled={!name.trim() || !sellPrice || createProduct.isPending}
              >
                Save Product Only
              </Button>
            </>
          ) : (
            <Button
              className="w-full h-12 font-bold"
              onClick={() => handleSave(false)}
              disabled={!name.trim() || !sellPrice || createProduct.isPending}
            >
              {createProduct.isPending ? "Saving..." : "Save Product"}
            </Button>
          )}
          <Button variant="ghost" className="w-full h-10 text-muted-foreground" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}
