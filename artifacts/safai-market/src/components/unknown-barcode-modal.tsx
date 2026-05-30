import React, { useState, useMemo } from "react";
import { X, PackagePlus, Search, ChevronRight, Barcode } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface Product {
  id: number;
  name: string;
  sellPrice: number | string;
  barcode?: string | null;
  brand?: string | null;
  unit?: string | null;
  status?: string | null;
}

interface Props {
  barcode: string | null;
  onClose: () => void;
  onCreateProduct: (barcode: string) => void;
  onAssignProduct: (product: Product, barcode: string) => void;
  products: Product[];
}

export default function UnknownBarcodeModal({
  barcode,
  onClose,
  onCreateProduct,
  onAssignProduct,
  products,
}: Props) {
  const [mode, setMode] = useState<"menu" | "assign">("menu");
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products.filter((p) => p.status === "active").slice(0, 20);
    const q = search.toLowerCase();
    return products
      .filter((p) => p.status === "active" && (
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      ))
      .slice(0, 20);
  }, [products, search]);

  if (!barcode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Barcode className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-base">Unknown Barcode</p>
              <p className="text-xs text-muted-foreground font-mono">{barcode}</p>
            </div>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode === "menu" ? (
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              This barcode is not linked to any product. What would you like to do?
            </p>

            {/* Create new product */}
            <button
              className="w-full flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl text-left active:bg-primary/10 transition-colors"
              onClick={() => { onClose(); onCreateProduct(barcode); }}
            >
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <PackagePlus className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Create New Product</p>
                <p className="text-xs text-muted-foreground">Add product with this barcode</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>

            {/* Assign to existing */}
            <button
              className="w-full flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-left active:bg-blue-100 transition-colors"
              onClick={() => setMode("assign")}
            >
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Assign to Existing Product</p>
                <p className="text-xs text-muted-foreground">Link this barcode to a product</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>

            <button
              className="w-full py-3 text-sm text-muted-foreground"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {/* Assign mode — search + pick product */}
            <div className="px-4 pt-3 pb-2 border-b">
              <div className="flex items-center gap-2 mb-2">
                <button
                  className="text-sm text-primary font-medium"
                  onClick={() => setMode("menu")}
                >
                  ← Back
                </button>
                <p className="text-sm font-semibold flex-1 text-center">Select Product</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  autoFocus
                  className="w-full pl-9 pr-3 h-10 rounded-xl border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Search product name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No products found</p>
              ) : (
                filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted active:bg-muted text-left transition-colors"
                    onClick={() => { onAssignProduct(p, barcode); onClose(); }}
                  >
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      {p.brand && <p className="text-xs text-muted-foreground truncate">{p.brand}</p>}
                    </div>
                    <p className="text-sm font-bold text-primary shrink-0">
                      {formatCurrency(Number(p.sellPrice))}
                    </p>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
