import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListCustomers } from "@workspace/api-client-react";
import { Search, Plus, Phone, IndianRupee, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

export default function CustomersList() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { data: customers, isLoading } = useListCustomers({
    search: search.length >= 2 ? search : undefined,
  });

  const totalUdhaar = customers?.reduce((sum, c) => sum + Number(c.udhaarBalance), 0) || 0;

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            className="pl-10 h-12 bg-background border-muted shadow-sm text-base rounded-xl"
            placeholder="Search customers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Card className="bg-blue-50 border-blue-100 shadow-sm">
          <CardContent className="p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-blue-800">
              <IndianRupee className="w-4 h-4" />
              <span className="text-sm font-semibold">Total Market Udhaar</span>
            </div>
            <div className="text-lg font-bold text-blue-700">
              {formatCurrency(totalUdhaar)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 p-4 pb-20">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {customers?.length || 0} Customers
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : customers?.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No customers found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customers?.map(customer => (
              <Link key={customer.id} href={`/customers/${customer.id}`}>
                <Card className="active-elevate border-muted/60 shadow-sm hover:border-blue-300 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{customer.name}</h3>
                      {customer.phone && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                          <Phone className="w-3 h-3" /> {customer.phone}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Udhaar</div>
                        <div className={`font-bold ${Number(customer.udhaarBalance) > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {formatCurrency(customer.udhaarBalance)}
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
        <Link href="/customers/new">
          <Button size="icon" className="w-14 h-14 rounded-full shadow-lg shadow-blue-500/30 bg-blue-600 hover:bg-blue-700 text-white active-elevate">
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
