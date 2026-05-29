import { useState, useMemo } from "react";
import { X, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SuggestedProduct {
  id: number;
  name: string;
  sellPrice: number;
  currentStock: number;
  unit?: string;
  buyPrice?: number | null;
}

interface Association {
  productBId: number;
  strength: number;
  triggerName: string;
}

interface FrequentlySoldTogetherProps {
  cartProductIds: number[];
  allProducts: SuggestedProduct[];
  associations: Association[];
  onAdd: (product: SuggestedProduct) => void;
}

export default function FrequentlySoldTogether({
  cartProductIds,
  allProducts,
  associations,
  onAdd,
}: FrequentlySoldTogetherProps) {
  const [dismissed, setDismissed] = useState(false);

  const suggestions = useMemo(() => {
    if (dismissed || cartProductIds.length === 0) return [];

    const seen = new Set<number>();
    const result: Array<{ product: SuggestedProduct; triggerName: string; strength: number }> = [];

    for (const assoc of associations.sort((a, b) => b.strength - a.strength)) {
      if (seen.has(assoc.productBId)) continue;
      if (cartProductIds.includes(assoc.productBId)) continue;

      const product = allProducts.find((p) => p.id === assoc.productBId);
      if (!product) continue;

      seen.add(assoc.productBId);
      result.push({ product, triggerName: assoc.triggerName, strength: assoc.strength });

      if (result.length >= 3) break;
    }

    return result;
  }, [cartProductIds, allProducts, associations, dismissed]);

  if (suggestions.length === 0) return null;

  const triggerName = suggestions[0]?.triggerName;

  return (
    <div className="mx-3 mb-2">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-amber-800">
            Often bought with {triggerName}
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-amber-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {suggestions.map(({ product }) => (
            <div
              key={product.id}
              className="shrink-0 bg-white border border-amber-100 rounded-xl p-2.5 w-28 flex flex-col gap-1"
            >
              <p className="text-xs font-semibold line-clamp-2 min-h-[2rem] leading-tight">
                {product.name}
              </p>
              <p className="text-sm font-bold text-primary">
                {formatCurrency(product.sellPrice)}
              </p>
              <p
                className={cn(
                  "text-[10px]",
                  product.currentStock <= 0
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {product.currentStock <= 0 ? "Out of stock" : `${product.currentStock} left`}
              </p>
              <button
                onClick={() => onAdd(product)}
                disabled={product.currentStock <= 0}
                className={cn(
                  "w-full h-7 rounded-lg text-xs font-bold flex items-center justify-center gap-1 mt-auto",
                  product.currentStock <= 0
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-white active:scale-95 transition-transform"
                )}
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
