import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { Plus, Trash2, ScanBarcode } from "lucide-react";
import { useListSuppliers, useListProducts, useCreatePurchase, getListPurchasesQueryKey, useListCategories } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";
import { Badge } from "@/components/ui/badge";
import BarcodeScannerModal from "@/components/barcode-scanner-modal";

export default function PurchaseNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers } = useListSuppliers();
  const { data: products } = useListProducts();
  const { data: categories } = useListCategories();
  const createPurchase = useCreatePurchase();

  const [supplierId, setSupplierId] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  
  const [items, setItems] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemCost, setItemCost] = useState("");
  const [freeQty, setFreeQty] = useState("0");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!selectedCategoryId) return products;
    return products.filter(p => (p as any).categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0), [items]);
  const pendingAmount = Math.max(0, totalAmount - (Number(paidAmount) || 0));

  const addItem = () => {
    if (!selectedProductId || !itemQty || !itemCost) return;
    const prod = products?.find(p => p.id === Number(selectedProductId));
    if (!prod) return;

    setItems(prev => [...prev, {
      product: prod,
      productId: prod.id,
      quantity: Number(itemQty),
      unitCost: Number(itemCost),
      freeQuantity: Number(freeQty) || 0
    }]);

    setSelectedProductId("");
    setItemQty("1");
    setItemCost("");
    setFreeQty("0");
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    if (!supplierId || items.length === 0) {
      toast({ title: "Validation Error", description: "Select supplier and add at least one item.", variant: "destructive" });
      return;
    }

    createPurchase.mutate({
      data: {
        supplierId: Number(supplierId),
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
          freeQuantity: i.freeQuantity
        })),
        totalAmount,
        paidAmount: Number(paidAmount) || 0,
        invoiceRef: invoiceRef || undefined,
        invoiceNumber: undefined,
        notes: notes || undefined,
        status: "draft"
      }
    }, {
      onSuccess: () => {
        toast({ title: "Draft saved!" });
        queryClient.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
        setLocation("/purchases");
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  const handleSave = () => {
    if (!supplierId || items.length === 0) {
      toast({ title: "Validation Error", description: "Select supplier and add at least one item.", variant: "destructive" });
      return;
    }

    createPurchase.mutate({
      data: {
        supplierId: Number(supplierId),
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
          freeQuantity: i.freeQuantity
        })),
        totalAmount,
        paidAmount: Number(paidAmount) || 0,
        invoiceRef: invoiceRef || undefined,
        invoiceNumber: undefined,
        notes: notes || undefined,
        status: "confirmed"
      }
    }, {
      onSuccess: () => {
        toast({ title: "Purchase recorded!", description: `${items.length} item(s) stocked.` });
        queryClient.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
        setLocation("/purchases");
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  const handleScan = (barcode: string) => {
    const foundProduct = products?.find(p => p.skuCode === barcode || (p as any).hinglishAliases?.includes(barcode));
    if (foundProduct) {
      setSelectedProductId(foundProduct.id.toString());
      toast({ title: "Product Found", description: foundProduct.name, className: "bg-green-50 text-green-900 border-green-200" });
    } else {
      toast({ title: "Product Not Found", description: `No product with barcode ${barcode}`, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <PageHeader 
        title="New Purchase Entry" 
        subtitle="Record stock from supplier" 
        backTo="/purchases" 
        right={
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsScannerOpen(true)}>
            <ScanBarcode className="w-5 h-5" />
          </Button>
        }
      />

      <div className="p-4 space-y-4 pb-24">
        <FormCard title="Supplier">
          <FormField label="Supplier" required>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="h-14 rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                <SelectValue placeholder="Select Supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Invoice Ref" hint="Optional">
              <Input value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} className="h-14 rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="e.g. INV-123" />
            </FormField>
            <FormField label="Paid Now (₹)">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                <Input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="h-14 pl-8 rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="0" />
              </div>
            </FormField>
          </div>
        </FormCard>

        <FormCard title="Add Item">
          {categories && categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
              <Badge
                variant={selectedCategoryId === null ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap rounded-full px-3 py-1 transition-colors"
                onClick={() => setSelectedCategoryId(null)}
              >
                All
              </Badge>
              {categories.map((c: any) => (
                <Badge
                  key={c.id}
                  variant={selectedCategoryId === c.id ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap rounded-full px-3 py-1 bg-white transition-colors"
                  onClick={() => setSelectedCategoryId(c.id)}
                >
                  {c.name}
                </Badge>
              ))}
            </div>
          )}

          <FormField label="Product">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="h-14 rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                <SelectValue placeholder="Select Product" />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts?.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Qty</label>
              <Input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} min="1" className="h-14 rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent text-center font-bold transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Cost/Unit (₹)</label>
              <Input type="number" value={itemCost} onChange={e => setItemCost(e.target.value)} className="h-14 rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Free Qty</label>
              <Input type="number" value={freeQty} onChange={e => setFreeQty(e.target.value)} min="0" className="h-14 rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent text-center transition-all" />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-14 rounded-2xl border-primary/40 text-primary font-bold active-elevate transition-transform"
            onClick={addItem}
            disabled={!selectedProductId || !itemQty || !itemCost}
          >
            <Plus className="w-5 h-5 mr-2" /> Add to List
          </Button>
        </FormCard>

        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Items Added ({items.length})</p>
            {items.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px] text-slate-800 truncate">{item.product.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">
                    {item.quantity} × {formatCurrency(item.unitCost)}
                    {item.freeQuantity > 0 && <span className="text-emerald-600 ml-2 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">+{item.freeQuantity} free</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="font-bold text-[16px] text-primary">{formatCurrency(item.quantity * item.unitCost)}</div>
                  <Button variant="ghost" size="icon" className="text-red-500/60 hover:text-red-500 h-9 w-9 rounded-xl active-elevate bg-red-50 hover:bg-red-100" onClick={() => removeItem(idx)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary text-[15px]">Total Amount</span>
                <span className="font-bold text-3xl text-primary">{formatCurrency(totalAmount)}</span>
              </div>
              {pendingAmount > 0 && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-primary/10">
                  <span className="text-amber-700 font-bold">Pending to Pay</span>
                  <span className="text-amber-700 font-bold text-[16px]">{formatCurrency(pendingAmount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="w-1/3 h-14 font-bold rounded-2xl border-primary/20 text-primary active-elevate"
            onClick={handleSaveDraft}
            disabled={items.length === 0}
          >
            Save Draft
          </Button>
          <Button
            className="flex-1 h-14 text-[16px] font-bold rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-white active-elevate transition-transform"
            onClick={handleSave}
            disabled={createPurchase.isPending || items.length === 0}
          >
            {createPurchase.isPending ? "Saving..." : items.length > 0 ? `Save Purchase` : "Save Purchase"}
          </Button>
        </div>
      </div>

      <BarcodeScannerModal
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleScan}
      />
    </div>
  );
}
