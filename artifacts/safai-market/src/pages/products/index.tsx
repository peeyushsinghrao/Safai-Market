import React, { useState, lazy, Suspense } from "react";
import { Link, useLocation } from "wouter";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Plus, Search, Camera, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { computeMargin } from "@/lib/profit";

const BarcodeScannerModal = lazy(() => import("@/components/barcode-scanner-modal"));

export default function ProductsList() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: categories } = useListCategories();
  const { data: products, isLoading } = useListProducts({ 
    search: search.length >= 2 ? search : undefined,
    categoryId,
  });

  const handleBarcodeDetected = (barcode: string) => {
    setScannerOpen(false);
    const match = products?.find((p: any) => p.barcode === barcode);
    if (match) {
      setLocation(`/products/${match.id}`);
    } else {
      setLocation(`/products/new?barcode=${encodeURIComponent(barcode)}`);
    }
  };

  // Mock images based on name keywords for beautiful UI matching the design
  const getProductImage = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('lizol') || n.includes('clean')) return 'https://images.unsplash.com/photo-1584820927498-cafe4c12659e?auto=format&fit=crop&q=80&w=200&h=200';
    if (n.includes('milk') || n.includes('amul')) return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=200&h=200';
    if (n.includes('vim') || n.includes('gel') || n.includes('liquid')) return 'https://images.unsplash.com/photo-1606168094056-bb98fdb5148b?auto=format&fit=crop&q=80&w=200&h=200';
    if (n.includes('roll') || n.includes('paper') || n.includes('selpak')) return 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&q=80&w=200&h=200';
    // default generic
    return 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=200&h=200';
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-sans pb-24">
      {/* Search & Categories Sticky Header */}
      <div className="sticky top-14 z-30 bg-[#f8fafc] border-b border-slate-200 px-4 py-3 space-y-4 shadow-sm">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500" />
          <Input 
            className="pl-11 pr-12 h-[48px] bg-white border border-slate-300 shadow-sm text-[15px] rounded-2xl focus:border-[#006b2c] focus:ring-1 focus:ring-[#006b2c]"
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-[#006b2c] hover:bg-green-50 transition-colors"
            onClick={() => setScannerOpen(true)}
          >
            <Camera className="w-[20px] h-[20px]" />
          </button>
        </div>
        
        {/* Categories Pill Nav */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          <button
            onClick={() => setCategoryId(undefined)}
            className={cn(
              "whitespace-nowrap px-5 py-[7px] rounded-full text-[13px] font-medium border transition-colors",
              categoryId === undefined 
                ? "bg-[#006b2c] text-white border-[#006b2c]" 
                : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
            )}
          >
            All
          </button>
          {categories?.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                "whitespace-nowrap px-5 py-[7px] rounded-full text-[13px] font-medium border transition-colors",
                categoryId === cat.id 
                  ? "bg-[#006b2c] text-white border-[#006b2c]" 
                  : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[140px] w-full rounded-2xl bg-white border border-slate-200" />
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-[17px] font-semibold text-slate-800">No products found</h3>
            <p className="text-slate-500 text-[14px] mt-1">Try searching for something else.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products?.map(product => {
              const margin = computeMargin(product.buyPrice, product.sellPrice);
              const marginValue = margin ? Math.round(margin.marginPct) : 0;
              const isLowStock = product.currentStock <= (product.lowStockLimit || 5);
              const isMarginLow = marginValue < 15;

              return (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex gap-4 transition-all active-elevate cursor-pointer relative overflow-hidden">
                    {/* Image Area */}
                    <div className="w-[100px] h-[100px] shrink-0 rounded-2xl overflow-hidden relative bg-slate-100 border border-slate-100">
                      <img src={getProductImage(product.name)} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
                      {isLowStock && (
                        <div className="absolute top-[50%] -translate-y-1/2 left-0 w-full bg-[#c53030] text-white text-[9px] font-bold py-1 px-1 text-center shadow-sm">
                          LOW STOCK
                        </div>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="text-[12px] text-slate-500 font-medium">{product.categoryName || "General"}</span>
                          {marginValue > 0 && (
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ml-2",
                              isMarginLow ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                            )}>
                              {marginValue}% Margin
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-[15px] text-slate-900 leading-tight mb-1">{product.name}</h3>
                        <div className="font-bold text-[18px] text-[#006b2c]">
                          {formatCurrency(product.sellPrice)}
                        </div>
                      </div>

                      <div className="flex items-end justify-between mt-1">
                        <span className={cn(
                          "text-[13px] font-medium",
                          isLowStock ? "text-[#c53030]" : "text-slate-600"
                        )}>
                          Stock: {product.currentStock} {product.unit}s
                        </span>
                        
                        <button className="w-9 h-9 bg-[#006b2c] hover:bg-[#005a24] text-white rounded-[10px] flex items-center justify-center shadow-sm transition-colors">
                          <ShoppingCart className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB - Add Product */}
      <div className="fixed bottom-20 right-4 z-40">
        <Link href="/products/new">
          <button className="w-14 h-14 bg-[#006b2c] text-white rounded-full shadow-lg shadow-[#006b2c]/30 flex items-center justify-center transition-all active-elevate">
            <Plus className="w-[28px] h-[28px]" strokeWidth={2.5} />
          </button>
        </Link>
      </div>

      <Suspense fallback={null}>
        <BarcodeScannerModal
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onDetected={handleBarcodeDetected}
        />
      </Suspense>
    </div>
  );
}
