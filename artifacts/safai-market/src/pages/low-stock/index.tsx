import { useState } from "react";
import { useLocation } from "wouter";
import { useGetLowStockProducts, useCreateStockAdjustment, getGetLowStockProductsQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Package, AlertTriangle, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function LowStock() {
  const [, setLocation] = useLocation();
  const { data: products, isLoading } = useGetLowStockProducts();
  const createAdjustment = useCreateStockAdjustment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [qty, setQty] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "out" | "low">("all");

  const outOfStock = products?.filter(p => p.currentStock <= 0) || [];
  const lowStock = products?.filter(p => p.currentStock > 0) || [];

  const handleAdjust = () => {
    if (!selectedProductId || !qty) return;
    createAdjustment.mutate({
      data: {
        productId: selectedProductId,
        quantity: Number(qty),
        reason: "Quick restock"
      }
    }, {
      onSuccess: () => {
        toast({ title: "Stock updated!" });
        setSelectedProductId(null);
        setQty("");
        queryClient.invalidateQueries({ queryKey: getGetLowStockProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      }
    });
  };

  if (isLoading) {
    return <div className="p-4 space-y-4 bg-slate-50 min-h-full"><Skeleton className="h-24 w-full rounded-2xl"/><Skeleton className="h-24 w-full rounded-2xl"/></div>;
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/more")} className="text-primary p-1 -ml-1 hover:bg-slate-100 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[19px] text-primary flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Low Stock
            </h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex bg-slate-200 p-1 rounded-full mb-6 gap-1 border border-slate-200/50">
          <button
            className={cn("flex-1 py-2 text-sm font-bold rounded-full transition-colors active:scale-95", activeTab === "all" ? "bg-white shadow-sm text-primary" : "text-slate-600 hover:text-slate-900")}
            onClick={() => setActiveTab("all")}
          >
            All ({products?.length || 0})
          </button>
          <button
            className={cn("flex-1 py-2 text-sm font-bold rounded-full transition-colors active:scale-95", activeTab === "out" ? "bg-red-50 shadow-sm text-red-600" : "text-slate-600 hover:text-slate-900")}
            onClick={() => setActiveTab("out")}
          >
            Out ({outOfStock.length})
          </button>
          <button
            className={cn("flex-1 py-2 text-sm font-bold rounded-full transition-colors active:scale-95", activeTab === "low" ? "bg-amber-50 shadow-sm text-amber-600" : "text-slate-600 hover:text-slate-900")}
            onClick={() => setActiveTab("low")}
          >
            Low ({lowStock.length})
          </button>
        </div>

        {products?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-sm">All stock levels look good!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(activeTab === "all" || activeTab === "out") && outOfStock.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">Out of Stock ({outOfStock.length})</h2>
                <div className="space-y-3">
                  {outOfStock.map(p => (
                    <StockCard key={p.id} p={p} setSelected={setSelectedProductId} />
                  ))}
                </div>
              </div>
            )}
            
            {(activeTab === "all" || activeTab === "low") && lowStock.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">Running Low ({lowStock.length})</h2>
                <div className="space-y-3">
                  {lowStock.map(p => (
                    <StockCard key={p.id} p={p} setSelected={setSelectedProductId} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === "out" && outOfStock.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm font-medium">No out of stock items!</div>
            )}
            {activeTab === "low" && lowStock.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm font-medium">No items currently running low!</div>
            )}
          </div>
        )}

        <Dialog open={!!selectedProductId} onOpenChange={(o) => !o && setSelectedProductId(null)}>
          <DialogContent className="w-[90vw] max-w-sm rounded-2xl p-5">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-left text-lg font-bold">Quick Restock</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Add Quantity</label>
                <Input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} className="h-14 text-xl font-bold rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="e.g. 50" />
              </div>
              <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold active-elevate transition-transform shadow-sm" onClick={handleAdjust} disabled={createAdjustment.isPending || !qty}>
                {createAdjustment.isPending ? "Saving..." : "Save Stock"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function StockCard({ p, setSelected }: { p: any, setSelected: (id: number) => void }) {
  const isOut = p.currentStock <= 0;
  return (
    <div className={cn(
      "bg-white rounded-2xl border-l-[6px] border p-4 shadow-sm active-elevate flex justify-between items-center",
      isOut ? "border-l-red-500 border-t-red-100 border-r-red-100 border-b-red-100" : "border-l-amber-500 border-t-amber-100 border-r-amber-100 border-b-amber-100"
    )}>
      <div>
        <div className="font-bold text-[15px] text-slate-800">{p.name}</div>
        <div className="text-xs text-slate-500 mt-0.5 font-medium">Alert when below {p.lowStockLimit}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={cn(
          "px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap",
          isOut ? "bg-red-50 text-red-600 border border-red-200" : "bg-amber-50 text-amber-600 border border-amber-200"
        )}>
          {p.currentStock} {p.unit}
        </span>
        <button 
          className="h-9 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center shadow-sm active-elevate" 
          onClick={() => setSelected(p.id)}
        >
          <Plus className="w-3.5 h-3.5 mr-1"/> Add
        </button>
      </div>
    </div>
  );
}
