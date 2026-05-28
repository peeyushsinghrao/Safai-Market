import { useListStockMovements } from "@workspace/api-client-react";
import { formatDate, formatTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, History } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StockMovements() {
  const { data: movements, isLoading } = useListStockMovements();

  const getColor = (type: string) => {
    switch(type) {
      case 'sale': return 'text-orange-600 bg-orange-50';
      case 'purchase': return 'text-green-600 bg-green-50';
      case 'adjustment': return 'text-blue-600 bg-blue-50';
      case 'return': return 'text-teal-600 bg-teal-50';
      case 'damage': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pb-20">
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur p-4 border-b">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <History className="w-5 h-5 text-primary" /> Stock History
        </h1>
      </div>

      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : movements?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No stock movements found.</div>
        ) : (
          <div className="space-y-3">
            {movements?.map((m) => (
              <Card key={m.id} className="shadow-sm">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      m.quantity > 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                    )}>
                      {m.quantity > 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate">{m.productName}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium capitalize whitespace-nowrap", getColor(m.movementType))}>
                          {m.movementType}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(m.createdAt)} {formatTime(m.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className={cn(
                      "text-base font-bold",
                      m.quantity > 0 ? "text-primary" : "text-destructive"
                    )}>
                      {m.quantity > 0 ? "+" : ""}{m.quantity}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {m.stockBefore} → {m.stockAfter}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
