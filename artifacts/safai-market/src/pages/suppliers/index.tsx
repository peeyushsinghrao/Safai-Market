import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListSuppliers } from "@workspace/api-client-react";
import { Search, Plus, Phone, Package, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

export default function SuppliersList() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { data: suppliers, isLoading } = useListSuppliers(); // api doesn't have search param for suppliers yet

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
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            className="pl-10 h-12 bg-background border-muted shadow-sm text-base rounded-xl"
            placeholder="Search suppliers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Card className="bg-amber-50 border-amber-100 shadow-sm">
          <CardContent className="p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-amber-800">
              <Package className="w-4 h-4" />
              <span className="text-sm font-semibold">Total Pending to Pay</span>
            </div>
            <div className="text-lg font-bold text-amber-700">
              {formatCurrency(totalPending)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 p-4 pb-20">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {filteredSuppliers?.length || 0} Suppliers
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : filteredSuppliers?.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No suppliers found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSuppliers?.map(supplier => (
              <Link key={supplier.id} href={`/suppliers/${supplier.id}`}>
                <Card className="active-elevate border-muted/60 shadow-sm hover:border-amber-300 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{supplier.name}</h3>
                      {supplier.phone && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                          <Phone className="w-3 h-3" /> {supplier.phone}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Pending</div>
                        <div className={`font-bold ${supplier.pendingAmount > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {formatCurrency(supplier.pendingAmount)}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 right-4 z-40">
        <Link href="/suppliers/new">
          <Button size="icon" className="w-14 h-14 rounded-full shadow-lg shadow-amber-500/30 bg-amber-600 hover:bg-amber-700 text-white active-elevate">
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
