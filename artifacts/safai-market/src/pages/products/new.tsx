import { useState, useMemo, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { Camera } from "lucide-react";
const BarcodeScannerModal = lazy(() => import("@/components/barcode-scanner-modal"));
import { useCreateProduct, useListCategories } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { computeMargin, MARGIN_TIER_CONFIG } from "@/lib/profit";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";
import { useSettingsStore } from "@/stores/settings";

const GST_RATES = [
  { label: "0% (Exempt)", value: "0" },
  { label: "5%", value: "5" },
  { label: "12%", value: "12" },
  { label: "18%", value: "18" },
  { label: "28%", value: "28" },
];

export default function ProductNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories } = useListCategories();
  const createProduct = useCreateProduct();
  const { settings } = useSettingsStore();
  const gstEnabled = Boolean(settings.gstNumber?.trim());

  const [scannerOpen, setScannerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", brand: "", categoryId: "", unit: "",
    sellPrice: "", buyPrice: "", mrp: "", wholesalePrice: "",
    lowStockLimit: "5", initialStock: "0", hinglishAliases: "", barcode: "",
    hsnCode: "", gstRate: "0", gstInclusive: true,
  });

  const handleBarcodeDetected = (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }));
    setScannerOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const marginInfo = useMemo(() => {
    return computeMargin(
      formData.buyPrice ? Number(formData.buyPrice) : null,
      formData.sellPrice ? Number(formData.sellPrice) : null
    );
  }, [formData.buyPrice, formData.sellPrice]);

  const gstPreview = useMemo(() => {
    const rate = Number(formData.gstRate);
    const price = Number(formData.sellPrice);
    if (!rate || !price) return null;
    if (formData.gstInclusive) {
      const base = price * 100 / (100 + rate);
      const gst = price - base;
      return { base: base.toFixed(2), gst: gst.toFixed(2) };
    } else {
      const gst = price * rate / 100;
      return { base: price.toFixed(2), gst: gst.toFixed(2) };
    }
  }, [formData.gstRate, formData.sellPrice, formData.gstInclusive]);

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
        hinglishAliases: formData.hinglishAliases || undefined,
        barcode: formData.barcode || undefined,
        hsnCode: formData.hsnCode || undefined,
        gstRate: Number(formData.gstRate),
        gstInclusive: formData.gstInclusive,
      } as any
    }, {
      onSuccess: () => {
        toast({ title: "Product created!" });
        setLocation("/products");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Add Product" subtitle="New product to catalog" backTo="/products" />

      <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4 pb-24">
        <FormCard title="Product Info">
          <FormField label="Product Name" required>
            <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Harpic 500ml" required autoFocus className="h-12 rounded-xl text-base border-muted focus:border-primary" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Brand">
              <Input name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. Reckitt" className="h-12 rounded-xl text-sm border-muted focus:border-primary" />
            </FormField>
            <FormField label="Category">
              <Select value={formData.categoryId} onValueChange={(val) => setFormData(p => ({ ...p, categoryId: val }))}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </FormCard>

        <FormCard title="Pricing">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Buy Price / Cost (₹)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                <Input type="number" name="buyPrice" value={formData.buyPrice} onChange={handleChange} placeholder="0" className="h-12 pl-7 rounded-xl border-muted focus:border-primary" />
              </div>
            </FormField>
            <FormField label="Sell Price (₹)" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                <Input type="number" name="sellPrice" value={formData.sellPrice} onChange={handleChange} required placeholder="0" className="h-12 pl-7 rounded-xl border-muted focus:border-primary" />
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="MRP (₹)" hint="Optional">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                <Input type="number" name="mrp" value={formData.mrp} onChange={handleChange} placeholder="—" className="h-12 pl-7 rounded-xl border-muted focus:border-primary" />
              </div>
            </FormField>
            <FormField label="Wholesale (₹)" hint="Optional">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                <Input type="number" name="wholesalePrice" value={formData.wholesalePrice} onChange={handleChange} placeholder="—" className="h-12 pl-7 rounded-xl border-muted focus:border-primary" />
              </div>
            </FormField>
          </div>

          {/* Live Margin Preview */}
          {marginInfo ? (
            <div className={cn(
              "rounded-xl border px-4 py-3 flex items-center justify-between",
              MARGIN_TIER_CONFIG[marginInfo.tier].badgeClass
            )}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">Est. Margin</p>
                <p className="text-sm font-bold mt-0.5">{MARGIN_TIER_CONFIG[marginInfo.tier].label}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{marginInfo.marginPct.toFixed(1)}%</p>
                <p className="text-xs opacity-80">+₹{marginInfo.profitPerUnit.toFixed(0)} / unit</p>
              </div>
            </div>
          ) : (formData.buyPrice || formData.sellPrice) ? (
            <p className="text-xs text-muted-foreground text-center py-1">
              {!formData.buyPrice ? "Add buy price" : "Add sell price"} to see margin
            </p>
          ) : null}
        </FormCard>

        <FormCard title="Stock & Unit">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Unit">
              <Select value={formData.unit} onValueChange={(val) => setFormData(p => ({ ...p, unit: val }))}>
                <SelectTrigger className="h-12 rounded-xl">
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
            </FormField>
            <FormField label="Initial Stock">
              <Input type="number" name="initialStock" value={formData.initialStock} onChange={handleChange} className="h-12 rounded-xl border-muted focus:border-primary" />
            </FormField>
          </div>

          <FormField label="Low Stock Alert" hint="Alert when below this">
            <Input type="number" name="lowStockLimit" value={formData.lowStockLimit} onChange={handleChange} className="h-12 rounded-xl border-muted focus:border-primary" />
          </FormField>
        </FormCard>

        {gstEnabled && (
          <FormCard title="GST / Tax">
            <p className="text-xs text-muted-foreground -mt-1 mb-1">
              Your shop has GST enabled. Set tax rate per product.
            </p>

            <FormField label="GST Rate">
              <Select value={formData.gstRate} onValueChange={(val) => setFormData(p => ({ ...p, gstRate: val }))}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GST_RATES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="HSN / SAC Code" hint="Optional — for tax compliance">
              <Input
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleChange}
                placeholder="e.g. 3402 (cleaning products)"
                className="h-12 rounded-xl border-muted focus:border-primary font-mono"
              />
            </FormField>

            {Number(formData.gstRate) > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-muted/50 bg-background px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Price includes GST</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.gstInclusive ? "Sell price already includes tax" : "GST added on top of sell price"}
                  </p>
                </div>
                <Switch
                  checked={formData.gstInclusive}
                  onCheckedChange={(v) => setFormData(p => ({ ...p, gstInclusive: v }))}
                />
              </div>
            )}

            {gstPreview && Number(formData.gstRate) > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">GST Preview</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Price</span>
                  <span className="font-semibold">₹{gstPreview.base}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CGST ({Number(formData.gstRate)/2}%)</span>
                  <span className="font-semibold text-blue-700">₹{(Number(gstPreview.gst)/2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SGST ({Number(formData.gstRate)/2}%)</span>
                  <span className="font-semibold text-blue-700">₹{(Number(gstPreview.gst)/2).toFixed(2)}</span>
                </div>
              </div>
            )}
          </FormCard>
        )}

        <FormCard title="Search & Barcode">
          <FormField label="Barcode" hint="Optional — for scanner support">
            <div className="flex gap-2">
              <Input
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Scan or type barcode..."
                className="h-12 rounded-xl border-muted focus:border-primary font-mono tracking-widest flex-1"
              />
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="w-12 h-12 rounded-xl border border-muted bg-white flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 active:scale-95 transition-all shrink-0"
                title="Scan barcode with camera"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <Suspense fallback={null}>
              <BarcodeScannerModal
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onDetected={handleBarcodeDetected}
              />
            </Suspense>
          </FormField>
          <FormField label="Hinglish / Search Aliases" hint="Optional">
            <Input name="hinglishAliases" value={formData.hinglishAliases} onChange={handleChange} placeholder="e.g. toilet cleaner, bathroom saaf" className="h-12 rounded-xl border-muted focus:border-primary" />
          </FormField>
          <p className="text-xs text-muted-foreground">Add alternate names to make searching faster during billing.</p>
        </FormCard>

        <Button type="submit" className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 active-elevate mt-2" disabled={createProduct.isPending}>
          {createProduct.isPending ? "Saving..." : "Save Product"}
        </Button>
      </form>
    </div>
  );
}
