import { useState, useMemo, lazy, Suspense, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Camera, QrCode, Save, Barcode } from "lucide-react";
const BarcodeScannerModal = lazy(() => import("@/components/barcode-scanner-modal"));
import { useCreateProduct, useListCategories } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FormCard, FormField } from "@/components/form-card";
import { ArrowLeft } from "lucide-react";

const GST_RATES = [
  { label: "0%", value: "0" },
  { label: "5%", value: "5" },
  { label: "12%", value: "12" },
  { label: "18%", value: "18" },
  { label: "28%", value: "28" },
];

export default function ProductNew() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const { toast } = useToast();
  const { data: categories } = useListCategories();
  const createProduct = useCreateProduct();

  const queryBarcode = useMemo(() => {
    const params = new URLSearchParams(searchStr);
    return params.get("barcode") || "";
  }, [searchStr]);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", brand: "", categoryId: "1", unit: "pcs",
    sellPrice: "", buyPrice: "", mrp: "", wholesalePrice: "",
    lowStockLimit: "5", initialStock: "0", hinglishAliases: "",
    barcode: queryBarcode,
    hsnCode: "", gstRate: "0", gstInclusive: true, supplierId: ""
  });

  useEffect(() => {
    if (queryBarcode) {
      setFormData(prev => ({ ...prev, barcode: queryBarcode }));
    }
  }, [queryBarcode]);

  const handleBarcodeDetected = (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }));
    setScannerOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50 px-4 py-4 flex items-center justify-between shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setLocation("/products")} className="text-[#006b2c] p-1 -ml-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[19px] font-bold text-[#006b2c]">
            Add Product
          </h1>
        </div>
        <button type="button" className="text-[#006b2c]">
          <QrCode className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-5">
        
        {/* Product Basics - No explicit title passed to match UI */}
        <FormCard>
          <FormField label="Product Name" required>
            <Input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Enter product name" 
              className="h-[48px] rounded-2xl text-[15px] border-slate-300 focus:border-[#006b2c] focus:ring-1 focus:ring-[#006b2c] placeholder:text-slate-400" 
            />
          </FormField>

          <FormField label="Barcode">
            <div className="relative">
              <Input
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Scan or enter barcode"
                className="h-[48px] pr-12 rounded-2xl text-[15px] border-slate-300 focus:border-[#006b2c] focus:ring-1 focus:ring-[#006b2c] placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-[#e2e8f0]/60 flex items-center justify-center text-[#1e293b] hover:bg-slate-200 transition-colors"
              >
                <Barcode className="w-5 h-5" />
              </button>
            </div>
            <Suspense fallback={null}>
              <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleBarcodeDetected} />
            </Suspense>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <Select value={formData.categoryId} onValueChange={(val) => setFormData(p => ({ ...p, categoryId: val }))}>
                <SelectTrigger className="h-[48px] rounded-2xl border-slate-300 text-[15px]">
                  <SelectValue placeholder="General" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">General</SelectItem>
                  {categories?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Unit">
              <Select value={formData.unit} onValueChange={(val) => setFormData(p => ({ ...p, unit: val }))}>
                <SelectTrigger className="h-[48px] rounded-2xl border-slate-300 text-[15px]">
                  <SelectValue placeholder="pcs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="litre">litre</SelectItem>
                  <SelectItem value="packet">packet</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </FormCard>

        {/* Pricing & Taxation */}
        <FormCard title="Pricing & Taxation">
          <div className="grid grid-cols-3 gap-3">
            <FormField label="MRP">
              <Input type="number" name="mrp" value={formData.mrp} onChange={handleChange} placeholder="0.00" className="h-[48px] rounded-2xl border-slate-300 text-[15px]" />
            </FormField>
            <FormField label="Sell Price" required>
              <Input type="number" name="sellPrice" value={formData.sellPrice} onChange={handleChange} placeholder="0.00" className="h-[48px] rounded-2xl border-slate-300 text-[15px]" />
            </FormField>
            <FormField label="Buy Price">
              <Input type="number" name="buyPrice" value={formData.buyPrice} onChange={handleChange} placeholder="0.00" className="h-[48px] rounded-2xl border-slate-300 text-[15px]" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="GST Rate">
              <Select value={formData.gstRate} onValueChange={(val) => setFormData(p => ({ ...p, gstRate: val }))}>
                <SelectTrigger className="h-[48px] rounded-2xl border-slate-300 text-[15px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GST_RATES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="HSN Code">
              <Input name="hsnCode" value={formData.hsnCode} onChange={handleChange} placeholder="Enter HSN" className="h-[48px] rounded-2xl border-slate-300 text-[15px]" />
            </FormField>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl border border-dashed border-slate-300 mt-2">
            <span className="text-[15px] text-slate-800">GST Inclusive Pricing</span>
            <Switch
              checked={formData.gstInclusive}
              onCheckedChange={(v) => setFormData(p => ({ ...p, gstInclusive: v }))}
              className="data-[state=checked]:bg-[#006b2c]"
            />
          </div>
        </FormCard>

        {/* Inventory Management */}
        <FormCard title="Inventory Management">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Current Stock">
              <Input type="number" name="initialStock" value={formData.initialStock} onChange={handleChange} placeholder="0" className="h-[48px] rounded-2xl border-slate-300 text-[15px]" />
            </FormField>
            <FormField label="Min Stock Level">
              <Input type="number" name="lowStockLimit" value={formData.lowStockLimit} onChange={handleChange} placeholder="5" className="h-[48px] rounded-2xl border-slate-300 text-[15px]" />
            </FormField>
          </div>

          <FormField label="Supplier">
            <Select value={formData.supplierId} onValueChange={(val) => setFormData(p => ({ ...p, supplierId: val }))}>
              <SelectTrigger className="h-[48px] rounded-2xl border-slate-300 text-[15px]">
                <SelectValue placeholder="Select Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">AgroCorp Bharat Ltd.</SelectItem>
                <SelectItem value="2">HUL Distributor</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </FormCard>

        {/* Image Banner Area (Using custom CSS background gradient to mimic the design) */}
        <div className="w-full h-[140px] rounded-2xl overflow-hidden relative shadow-sm mt-6 bg-gradient-to-br from-[#4ea583] to-[#257657]">
          {/* We'll use a semi-transparent overlay to ensure text readability against the placeholder background */}
          <div className="absolute inset-0 bg-black/10 z-10"></div>
          <div className="absolute inset-x-4 bottom-4 z-20">
            <p className="text-white text-[15px] font-medium leading-snug">
              Add product photos to identify them faster during billing.
            </p>
          </div>
        </div>

      </form>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-40">
        <button 
          onClick={handleSubmit}
          disabled={createProduct.isPending}
          className="w-full h-14 bg-[#006b2c] hover:bg-[#005a24] text-white rounded-2xl font-medium text-[16px] flex items-center justify-center gap-2 transition-all active-elevate shadow-sm disabled:opacity-70"
        >
          <Save className="w-5 h-5" />
          Save Product
        </button>
      </div>
    </div>
  );
}
