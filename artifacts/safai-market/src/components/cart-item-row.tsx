import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
  itemDiscount: number;
  unit: string;
}

interface CartItemRowProps {
  item: CartItem;
  updateQty: (productId: number, delta: number) => void;
  setQty: (productId: number, qty: number) => void;
  removeItem: (productId: number) => void;
  setItemDiscount: (productId: number, discount: number) => void;
  layout?: "drawer" | "sidebar";
}

export function CartItemRow({
  item,
  updateQty,
  setQty,
  removeItem,
  setItemDiscount,
  layout = "drawer"
}: CartItemRowProps) {
  const lineTotal = (item.unitPrice - item.itemDiscount) * item.quantity;

  if (layout === "sidebar") {
    return (
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{item.productName}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} each</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-sm">{formatCurrency(lineTotal)}</p>
            <button onClick={() => removeItem(item.productId)} className="text-destructive/60 hover:text-destructive mt-0.5">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {/* Stepper + qty chips */}
        <div className="flex flex-col gap-1.5">
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
            <input
              type="number"
              min="1"
              max={item.availableStock}
              value={item.quantity}
              onChange={(e) => {
                const v = Math.max(1, Math.min(Number(e.target.value) || 1, item.availableStock));
                setQty(item.productId, v);
              }}
              className="w-12 h-9 text-center font-bold text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full shrink-0"
              onClick={() => updateQty(item.productId, 1)}
              disabled={item.quantity >= item.availableStock}
            >
              <Plus className="w-3 h-3" />
            </Button>
            {/* Qty chips */}
            <div className="flex gap-1 flex-wrap">
              {[1, 5, 10, 25].map((chip) => {
                const wouldExceed = item.quantity + chip > item.availableStock;
                return (
                  <button
                    key={chip}
                    className={cn(
                      "h-7 px-2 rounded-md text-[11px] font-semibold border transition-colors",
                      wouldExceed
                        ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground border-muted"
                        : "bg-primary/5 text-primary border-primary/20 active:scale-95 hover:bg-primary/10"
                    )}
                    onClick={() => {
                      if (!wouldExceed) {
                        setQty(item.productId, item.quantity + chip);
                      }
                    }}
                    disabled={wouldExceed}
                  >
                    +{chip}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-1">
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
  }

  // Drawer Layout (Mobile)
  return (
    <div className="p-4 flex flex-col gap-2">
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
      {/* Stepper + qty chips */}
      <div className="flex flex-col gap-1.5">
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
          <input
            type="number"
            min="1"
            max={item.availableStock}
            value={item.quantity}
            onChange={(e) => {
              const v = Math.max(1, Math.min(Number(e.target.value) || 1, item.availableStock));
              setQty(item.productId, v);
            }}
            className="w-12 h-9 text-center font-bold text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full shrink-0"
            onClick={() => updateQty(item.productId, 1)}
            disabled={item.quantity >= item.availableStock}
          >
            <Plus className="w-3 h-3" />
          </Button>
          {/* Qty chips */}
          <div className="flex gap-1 flex-wrap">
            {[1, 5, 10, 25].map((chip) => {
              const wouldExceed = item.quantity + chip > item.availableStock;
              return (
                <button
                  key={chip}
                  className={cn(
                    "h-7 px-2 rounded-md text-[11px] font-semibold border transition-colors",
                    wouldExceed
                      ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground border-muted"
                      : "bg-primary/5 text-primary border-primary/20 active:scale-95 hover:bg-primary/10"
                  )}
                  onClick={() => {
                    if (!wouldExceed) {
                      setQty(item.productId, item.quantity + chip);
                    }
                  }}
                  disabled={wouldExceed}
                >
                  +{chip}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-1">
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
}
