import { useLocation } from "wouter";
import { useListStockMovements } from "@workspace/api-client-react";
import { formatDate, formatTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, History, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StockMovements() {
  const [, setLocation] = useLocation();
  const { data: movements, isLoading } = useListStockMovements();

  const getColor = (type: string) => {
    switch(type) {
      case 'sale': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'purchase': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'adjustment': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'return': return 'text-teal-700 bg-teal-50 border-teal-200';
      case 'damage': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

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
              <History className="w-5 h-5 text-primary" /> Stock History
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : movements?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <History className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-sm">No stock movements found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {movements?.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex items-center justify-between active-elevate">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                    m.quantity > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                  )}>
                    {m.quantity > 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[15px] font-bold text-slate-800 truncate">{m.productName}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-bold capitalize whitespace-nowrap", getColor(m.movementType))}>
                        {m.movementType}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(m.createdAt)} {formatTime(m.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className={cn(
                    "text-lg font-bold",
                    m.quantity > 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {m.quantity > 0 ? "+" : ""}{m.quantity}
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                    {m.stockBefore} → {m.stockAfter}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
