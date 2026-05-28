import { useState } from "react";
import { Link } from "wouter";
import { useListPurchases } from "@workspace/api-client-react";
import { Plus, Search, ChevronRight, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";

export default function PurchasesList() {
  const [search, setSearch] = useState("");
  const { data: purchases, isLoading } = useListPurchases();

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            className="pl-10 h-12 bg-background border-muted shadow-sm text-base rounded-xl"
            placeholder="Search purchases..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 p-4 pb-20">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Recent Purchases
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : purchases?.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No purchases found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases?.map(purchase => (
              <Card key={purchase.id} className="active-elevate border-muted/60 shadow-sm transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-gray-900">{purchase.supplierName}</div>
                      <div className="text-xs text-muted-foreground mt-1">Invoice: {purchase.invoiceRef || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{formatCurrency(purchase.totalAmount)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-muted/40">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(purchase.createdAt)}
                    </div>
                    <Badge variant={purchase.paymentStatus === 'paid' ? 'default' : purchase.paymentStatus === 'partial' ? 'secondary' : 'destructive'}>
                      {purchase.paymentStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 right-4 z-40">
        <Link href="/purchases/new">
          <Button size="icon" className="w-14 h-14 rounded-full shadow-lg shadow-primary/30 active-elevate">
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
