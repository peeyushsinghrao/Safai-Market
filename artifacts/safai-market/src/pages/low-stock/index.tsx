import { useState } from "react";
import { useGetLowStockProducts, useCreateStockAdjustment, getGetLowStockProductsQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Package, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function LowStock() {
  const { data: products, isLoading } = useGetLowStockProducts();
  const createAdjustment = useCreateStockAdjustment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [qty, setQty] = useState("");

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
        toast({ title: "Stock updated" });
        setSelectedProductId(null);
        setQty("");
        queryClient.invalidateQueries({ queryKey: getGetLowStockProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      }
    });
  };

  if (isLoading) {
    return <div className="p-4 space-y-4"><Skeleton className="h-24 w-full"/><Skeleton className="h-24 w-full"/></div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pb-20">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" /> What Is Finishing
        </h1>

        {products?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">All stock levels look good!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {outOfStock.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-destructive uppercase tracking-wider mb-3">Out of Stock ({outOfStock.length})</h2>
                <div className="space-y-3">
                  {outOfStock.map(p => (
                    <StockCard key={p.id} p={p} setSelected={setSelectedProductId} />
                  ))}
                </div>
              </div>
            )}
            
            {lowStock.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3">Running Low ({lowStock.length})</h2>
                <div className="space-y-3">
                  {lowStock.map(p => (
                    <StockCard key={p.id} p={p} setSelected={setSelectedProductId} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Dialog open={!!selectedProductId} onOpenChange={(o) => !o && setSelectedProductId(null)}>
          <DialogContent className="w-[90vw] max-w-md rounded-xl">
            <DialogHeader><DialogTitle>Quick Restock</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Add Quantity</label>
                <Input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} className="h-12 text-lg" />
              </div>
              <Button className="w-full h-12" onClick={handleAdjust} disabled={createAdjustment.isPending || !qty}>Save Stock</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function StockCard({ p, setSelected }: { p: any, setSelected: (id: number) => void }) {
  return (
    <Card className={cn("border-l-4", p.currentStock <= 0 ? "border-l-destructive" : "border-l-amber-500")}>
      <CardContent className="p-3 flex justify-between items-center">
        <div>
          <div className="font-semibold text-sm">{p.name}</div>
          <div className="text-xs text-muted-foreground">Alert when below {p.lowStockLimit}</div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={p.currentStock <= 0 ? "destructive" : "secondary"}>{p.currentStock} {p.unit}</Badge>
          <Button size="sm" variant="outline" className="h-8" onClick={() => setSelected(p.id)}><Plus className="w-4 h-4 mr-1"/> Add</Button>
        </div>
      </CardContent>
    </Card>
  );
}
