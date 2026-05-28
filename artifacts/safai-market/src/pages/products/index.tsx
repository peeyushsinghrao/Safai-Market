import React, { useState } from "react";
import { Link } from "wouter";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Plus, Search, Filter, AlertTriangle, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function ProductsList() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<"name" | "stock" | "category">("name");

  const { data: categories } = useListCategories();
  const { data: products, isLoading } = useListProducts({ 
    search: search.length >= 2 ? search : undefined,
    categoryId,
  });

  const sortedProducts = React.useMemo(() => {
    if (!products) return [];
    return [...products].sort((a, b) => {
      if (sortBy === "stock") return a.currentStock - b.currentStock;
      if (sortBy === "category") return (a.categoryName || "").localeCompare(b.categoryName || "");
      return a.name.localeCompare(b.name);
    });
  }, [products, sortBy]);

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            className="pl-10 h-12 bg-background border-muted shadow-sm text-base rounded-xl"
            placeholder="Search products, brands, aliases..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Badge 
            variant={categoryId === undefined ? "default" : "outline"} 
            className="rounded-full px-4 py-1.5 whitespace-nowrap cursor-pointer text-sm font-medium"
            onClick={() => setCategoryId(undefined)}
          >
            All Items
          </Badge>
          {categories?.map(cat => (
            <Badge 
              key={cat.id}
              variant={categoryId === cat.id ? "default" : "outline"} 
              className="rounded-full px-4 py-1.5 whitespace-nowrap cursor-pointer text-sm font-medium bg-background"
              onClick={() => setCategoryId(cat.id)}
            >
              {cat.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {products?.length || 0} Products
          </h2>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => setSortBy(s => s === "name" ? "stock" : "name")}>
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-muted-foreground text-sm mt-1">Try a different search term or category.</p>
          </div>
        ) : (
          <div className="space-y-3 pb-20">
            {sortedProducts.map(product => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="active-elevate border-muted/60 shadow-sm overflow-hidden hover:border-primary/30 transition-colors">
                  <CardContent className="p-0 flex">
                    <div className={cn(
                      "w-1.5 shrink-0",
                      product.currentStock <= 0 ? "bg-destructive" :
                      product.currentStock <= (product.lowStockLimit || 5) ? "bg-amber-500" : "bg-primary"
                    )} />
                    <div className="p-4 flex-1 flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900 leading-tight">{product.name}</h3>
                          {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-primary">{formatCurrency(product.sellPrice)}</span>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sell Price</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted/40">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5 rounded">
                            {product.currentStock} {product.unit}
                          </Badge>
                          {product.currentStock <= (product.lowStockLimit || 5) && (
                            <span className="flex items-center text-[10px] font-medium text-amber-600 gap-1 bg-amber-50 px-1.5 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-medium bg-muted/50 px-2 py-1 rounded-md text-muted-foreground">
                          {product.categoryName}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 right-4 z-40">
        <Link href="/products/new">
          <Button size="icon" className="w-14 h-14 rounded-full shadow-lg shadow-primary/30 active-elevate">
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
