import React from "react";
import { useLocation, useParams } from "wouter";
import { 
  useGetProduct, 
  useUpdateProduct, 
  useGetProductStockMovements, 
  getGetProductQueryKey,
  getGetProductStockMovementsQueryKey,
  useCreateStockAdjustment,
  getListProductsQueryKey
} from "@workspace/api-client-react";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { computeMargin, MARGIN_TIER_CONFIG } from "@/lib/profit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, AlertTriangle, ArrowDown, ArrowUp, Plus, Minus, Package, History } from "lucide-react";
import PageHeader from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(id, { 
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id) } 
  });

  const { data: movements, isLoading: isLoadingMovements } = useGetProductStockMovements(id, {
    query: { enabled: !!id, queryKey: getGetProductStockMovementsQueryKey(id) }
  });

  const [isAdjustOpen, setIsAdjustOpen] = React.useState(false);
  const [adjustType, setAdjustType] = React.useState<"add" | "remove">("add");
  const [adjustQty, setAdjustQty] = React.useState("1");
  const [adjustReason, setAdjustReason] = React.useState("Manual adjustment");

  const adjustStock = useCreateStockAdjustment();

  const handleAdjustStock = () => {
    const qty = Number(adjustQty);
    if (!qty || qty <= 0) return;

    adjustStock.mutate({
      data: {
        productId: id,
        quantity: adjustType === "add" ? qty : -qty,
        reason: adjustReason
      }
    }, {
      onSuccess: () => {
        toast({ title: "Stock adjusted successfully" });
        setIsAdjustOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetProductStockMovementsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
      onError: (error: any) => {
        toast({ 
          title: "Failed to adjust stock", 
          description: error?.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) {
    return <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-60 w-full" />
    </div>;
  }

  if (!product) {
    return <div className="p-4 text-center">Product not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50/50 pb-20">
      <PageHeader
        title={product.name}
        backTo="/products"
        right={
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9 rounded-xl" onClick={() => toast({ title: "Edit product (WIP)" })}>
            <Edit className="w-4 h-4" />
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Main Details */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Badge className="mb-2 bg-muted text-muted-foreground hover:bg-muted">{product.categoryName}</Badge>
                {product.brand && <p className="text-sm font-medium text-muted-foreground">{product.brand}</p>}
                <p className="text-xs text-muted-foreground mt-1">Alias: {product.hinglishAliases || "None"}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{formatCurrency(product.sellPrice)}</div>
                <div className="text-xs text-muted-foreground">Sell Price</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-muted/50 mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Buy Price</p>
                <p className="font-semibold">{Number(product.buyPrice) > 0 ? formatCurrency(Number(product.buyPrice)) : <span className="text-muted-foreground text-sm">Not set</span>}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">MRP</p>
                <p className="font-semibold">{product.mrp ? formatCurrency(Number(product.mrp)) : <span className="text-muted-foreground text-sm">N/A</span>}</p>
              </div>
            </div>

            {/* Margin Badge */}
            {(() => {
              const margin = computeMargin(Number(product.buyPrice), Number(product.sellPrice));
              if (!margin) return null;
              const cfg = MARGIN_TIER_CONFIG[margin.tier];
              return (
                <div className={cn("rounded-lg border px-3 py-2.5 flex items-center justify-between mb-4", cfg.badgeClass)}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Margin</p>
                    <p className="text-sm font-bold">{cfg.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{margin.marginPct.toFixed(1)}%</p>
                    <p className="text-xs opacity-80">₹{margin.profitPerUnit.toFixed(0)} profit/unit</p>
                  </div>
                </div>
              );
            })()}

            {/* Stock Level Display */}
            <div className="bg-card border rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
              <div className={cn(
                "absolute inset-0 opacity-10",
                product.currentStock <= 0 ? "bg-destructive" :
                product.currentStock <= (product.lowStockLimit || 5) ? "bg-amber-500" : "bg-primary"
              )} />
              
              <Package className={cn(
                "w-8 h-8 mb-2",
                product.currentStock <= 0 ? "text-destructive" :
                product.currentStock <= (product.lowStockLimit || 5) ? "text-amber-500" : "text-primary"
              )} />
              
              <div className="text-4xl font-bold tracking-tight">
                {product.currentStock} <span className="text-xl font-normal text-muted-foreground">{product.unit}</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-1">Current Stock</p>

              {product.currentStock <= (product.lowStockLimit || 5) && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {product.currentStock <= 0 ? "Out of Stock" : "Low Stock Alert"}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full active-elevate" onClick={() => setAdjustType("add")}>
                    <Plus className="w-4 h-4 mr-2" /> Add Stock
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[90vw] max-w-md rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Adjust Stock: {product.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                      <Button 
                        variant={adjustType === "add" ? "default" : "outline"} 
                        className="flex-1"
                        onClick={() => setAdjustType("add")}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                      <Button 
                        variant={adjustType === "remove" ? "destructive" : "outline"} 
                        className="flex-1"
                        onClick={() => setAdjustType("remove")}
                      >
                        <Minus className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Quantity ({product.unit})</label>
                      <Input type="number" min="1" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} className="h-12 text-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Reason</label>
                      <Input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} />
                    </div>
                    <Button 
                      className="w-full h-12 text-lg active-elevate" 
                      onClick={handleAdjustStock}
                      disabled={adjustStock.isPending || !adjustQty || Number(adjustQty) <= 0}
                    >
                      {adjustStock.isPending ? "Saving..." : "Confirm Adjustment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="w-full active-elevate" onClick={() => { setAdjustType("remove"); setIsAdjustOpen(true); }}>
                <Minus className="w-4 h-4 mr-2" /> Reduce
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stock Movement History */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              Stock History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingMovements ? (
              <div className="p-4 space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
            ) : movements?.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No stock history found.</div>
            ) : (
              <div className="divide-y">
                {movements?.map((m) => (
                  <div key={m.id} className="p-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        m.quantity > 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                      )}>
                        {m.quantity > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium capitalize">{m.movementType}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(m.createdAt)} {formatTime(m.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-sm font-bold",
                        m.quantity > 0 ? "text-primary" : "text-destructive"
                      )}>
                        {m.quantity > 0 ? "+" : ""}{m.quantity}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {m.stockBefore} → {m.stockAfter}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
