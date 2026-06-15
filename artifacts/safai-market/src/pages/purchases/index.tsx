import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListPurchases } from "@workspace/api-client-react";
import { Plus, Search, Calendar, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function PurchasesList() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { data: purchases, isLoading } = useListPurchases();

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/more")} className="text-primary p-1 -ml-1 hover:bg-slate-100 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[19px] text-primary">Purchases</h1>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              className="pl-10 h-12 bg-white border-slate-300 shadow-sm text-[15px] rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Search purchases..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 pb-20">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Recent Purchases
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
          </div>
        ) : purchases?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border shadow-sm">
            <p className="text-slate-500 font-semibold text-[15px]">No purchases found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases?.map(purchase => (
              <Link key={purchase.id} href={purchase.status === 'draft' ? `/purchases/${purchase.id}/edit` : `/purchases/${purchase.id}`}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 active-elevate mt-3 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-[16px] text-slate-800 flex items-center gap-2">
                        {purchase.supplierName}
                        {purchase.status === 'draft' && (
                          <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">DRAFT</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">Invoice: {purchase.invoiceRef || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[17px] text-primary">{formatCurrency(purchase.totalAmount)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {formatDate(purchase.createdAt)}
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border",
                      purchase.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
                      purchase.paymentStatus === 'partial' ? "bg-blue-50 text-blue-600 border-blue-200" : 
                      "bg-red-50 text-red-600 border-red-200"
                    )}>
                      {purchase.paymentStatus}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 right-4 z-40">
        <Link href="/purchases/new">
          <Button size="icon" className="w-14 h-14 rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-white active-elevate transition-transform">
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
