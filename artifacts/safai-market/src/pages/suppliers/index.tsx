import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListSuppliers } from "@workspace/api-client-react";
import { Search, Plus, Phone, Package, ChevronRight, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

export default function SuppliersList() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { data: suppliers, isLoading } = useListSuppliers(); 

  const filteredSuppliers = React.useMemo(() => {
    if (!suppliers) return [];
    if (!search) return suppliers;
    const lowerSearch = search.toLowerCase();
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(lowerSearch) || 
      (s.contactName && s.contactName.toLowerCase().includes(lowerSearch))
    );
  }, [suppliers, search]);

  const totalPending = suppliers?.reduce((sum, s) => sum + s.pendingAmount, 0) || 0;

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/more")} className="text-primary p-1 -ml-1 hover:bg-slate-100 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[19px] text-primary">Suppliers</h1>
          </div>
        </div>
        <div className="px-4 pb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              className="pl-10 h-12 bg-white border-slate-300 shadow-sm text-[15px] rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Search suppliers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="bg-amber-50 border border-amber-200 shadow-sm rounded-2xl p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-amber-800">
              <Package className="w-5 h-5" />
              <span className="text-[15px] font-bold">Total Pending to Pay</span>
            </div>
            <div className="text-[18px] font-bold text-amber-700">
              {formatCurrency(totalPending)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 pb-20">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          {filteredSuppliers?.length || 0} Suppliers
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : filteredSuppliers?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border shadow-sm">
            <p className="text-slate-500 font-semibold text-[15px]">No suppliers found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSuppliers?.map(supplier => (
              <Link key={supplier.id} href={`/suppliers/${supplier.id}`}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between active-elevate transition-colors hover:border-primary/30 mt-3">
                  <div>
                    <h3 className="font-bold text-[16px] text-slate-800">{supplier.name}</h3>
                    {supplier.phone && (
                      <div className="flex items-center text-[13px] text-slate-500 mt-1 gap-1 font-medium">
                        <Phone className="w-3.5 h-3.5" /> {supplier.phone}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Pending</div>
                      <div className={`font-bold text-[15px] ${supplier.pendingAmount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                        {formatCurrency(supplier.pendingAmount)}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 right-4 z-40">
        <Link href="/suppliers/new">
          <Button size="icon" className="w-14 h-14 rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-white active-elevate transition-transform">
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
