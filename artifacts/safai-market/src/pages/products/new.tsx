import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useCreateProduct, useListCategories } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { computeMargin, MARGIN_TIER_CONFIG } from "@/lib/profit";
import { cn } from "@/lib/utils";

export default function ProductNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories } = useListCategories();
  const createProduct = useCreateProduct();

  const [formData, setFormData] = useState({
    name: "", brand: "", categoryId: "", unit: "",
    sellPrice: "", buyPrice: "", mrp: "", wholesalePrice: "",
    lowStockLimit: "5", initialStock: "0", hinglishAliases: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const marginInfo = useMemo(() => {
    return computeMargin(
      formData.buyPrice ? Number(formData.buyPrice) : null,
      formData.sellPrice ? Number(formData.sellPrice) : null
    );
  }, [formData.buyPrice, formData.sellPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sellPrice) {
      toast({ title: "Validation Error", description: "Name and Sell Price are required", variant: "destructive" });
      return;
    }

    createProduct.mutate({
      data: {
        name: formData.name,
        brand: formData.brand || undefined,
        categoryId: Number(formData.categoryId) || 1,
        unit: formData.unit || "piece",
        sellPrice: Number(formData.sellPrice),
        buyPrice: formData.buyPrice ? Number(formData.buyPrice) : 0,
        mrp: formData.mrp ? Number(formData.mrp) : undefined,
        wholesalePrice: formData.wholesalePrice ? Number(formData.wholesalePrice) : undefined,
        lowStockLimit: Number(formData.lowStockLimit),
        initialStock: Number(formData.initialStock),
        hinglishAliases: formData.hinglishAliases || undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Product created successfully" });
        setLocation("/products");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pb-20">
      <div className="sticky top-14 z-30 bg-primary text-primary-foreground border-b p-4 flex items-center shadow-sm">
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 mr-2" onClick={() => setLocation("/products")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Product Name *</label>
          <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Harpic 500ml" required className="h-12" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Brand</label>
            <Input name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. Reckitt" className="h-12" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Category</label>
            <Select value={formData.categoryId} onValueChange={(val) => setFormData(p => ({ ...p, categoryId: val }))}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {categories?.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="rounded-xl border bg-white p-4 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pricing</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Buy Price / Cost (₹)</label>
              <Input type="number" name="buyPrice" value={formData.buyPrice} onChange={handleChange} placeholder="0" className="h-12" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sell Price (₹) *</label>
              <Input type="number" name="sellPrice" value={formData.sellPrice} onChange={handleChange} required placeholder="0" className="h-12" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">MRP (₹)</label>
              <Input type="number" name="mrp" value={formData.mrp} onChange={handleChange} placeholder="Optional" className="h-12" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Wholesale Price (₹)</label>
              <Input type="number" name="wholesalePrice" value={formData.wholesalePrice} onChange={handleChange} placeholder="Optional" className="h-12" />
            </div>
          </div>

          {/* Live Margin Preview */}
          {marginInfo ? (
            <div className={cn(
              "rounded-lg border px-3 py-2.5 flex items-center justify-between",
              MARGIN_TIER_CONFIG[marginInfo.tier].badgeClass
            )}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Estimated Margin</p>
                <p className="text-sm font-bold">{MARGIN_TIER_CONFIG[marginInfo.tier].label}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{marginInfo.marginPct.toFixed(1)}%</p>
                <p className="text-xs opacity-80">₹{marginInfo.profitPerUnit.toFixed(0)} / unit</p>
              </div>
            </div>
          ) : formData.buyPrice && !formData.sellPrice ? (
            <p className="text-xs text-muted-foreground text-center py-1">Enter sell price to see margin</p>
          ) : formData.sellPrice && !formData.buyPrice ? (
            <p className="text-xs text-muted-foreground text-center py-1">Enter buy price to see margin</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Unit</label>
            <Select value={formData.unit} onValueChange={(val) => setFormData(p => ({ ...p, unit: val }))}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="piece">Piece</SelectItem>
                <SelectItem value="bottle">Bottle</SelectItem>
                <SelectItem value="packet">Packet</SelectItem>
                <SelectItem value="kg">Kg</SelectItem>
                <SelectItem value="litre">Litre</SelectItem>
                <SelectItem value="pair">Pair</SelectItem>
                <SelectItem value="pack">Pack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Initial Stock</label>
            <Input type="number" name="initialStock" value={formData.initialStock} onChange={handleChange} className="h-12" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Low Stock Alert Limit</label>
          <Input type="number" name="lowStockLimit" value={formData.lowStockLimit} onChange={handleChange} className="h-12" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Search Aliases (Hinglish)</label>
          <Input name="hinglishAliases" value={formData.hinglishAliases} onChange={handleChange} placeholder="e.g. toilet cleaner, bathroom saaf" className="h-12" />
        </div>

        <Button type="submit" className="w-full h-12 text-lg mt-4 active-elevate" disabled={createProduct.isPending}>
          {createProduct.isPending ? "Saving..." : "Save Product"}
        </Button>
      </form>
    </div>
  );
}
