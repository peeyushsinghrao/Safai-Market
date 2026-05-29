import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Plus, Trash2 } from "lucide-react";
import { useListSuppliers, useListProducts, useCreatePurchase, getListPurchasesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";

export default function PurchaseNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers } = useListSuppliers();
  const { data: products } = useListProducts();
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
        notes: notes || undefined
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

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="New Purchase Entry" subtitle="Record stock from supplier" backTo="/purchases" />

      <div className="p-4 space-y-4 pb-24">
        <FormCard title="Supplier">
          <FormField label="Supplier" required>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="h-12 rounded-xl">
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
              <Input value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} className="h-12 rounded-xl border-muted focus:border-primary" placeholder="e.g. INV-123" />
            </FormField>
            <FormField label="Paid Now (₹)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                <Input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="h-12 pl-7 rounded-xl border-muted focus:border-primary" placeholder="0" />
              </div>
            </FormField>
          </div>
        </FormCard>

        <FormCard title="Add Item">
          <FormField label="Product">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Select Product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Qty</label>
              <Input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} min="1" className="h-11 rounded-xl border-muted focus:border-primary text-center font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Cost/Unit (₹)</label>
              <Input type="number" value={itemCost} onChange={e => setItemCost(e.target.value)} className="h-11 rounded-xl border-muted focus:border-primary" placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Free Qty</label>
              <Input type="number" value={freeQty} onChange={e => setFreeQty(e.target.value)} min="0" className="h-11 rounded-xl border-muted focus:border-primary text-center" />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl border-primary/40 text-primary font-semibold"
            onClick={addItem}
            disabled={!selectedProductId || !itemQty || !itemCost}
          >
            <Plus className="w-4 h-4 mr-2" /> Add to List
          </Button>
        </FormCard>

        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 px-1">Items Added ({items.length})</p>
            {items.map((item, idx) => (
              <Card key={idx} className="border-muted/60">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{item.product.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} × {formatCurrency(item.unitCost)}
                      {item.freeQuantity > 0 && <span className="text-primary ml-2 font-medium">+{item.freeQuantity} free</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="font-bold text-sm">{formatCurrency(item.quantity * item.unitCost)}</div>
                    <Button variant="ghost" size="icon" className="text-destructive/60 hover:text-destructive h-8 w-8" onClick={() => removeItem(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary text-sm">Total Amount</span>
                <span className="font-bold text-2xl text-primary">{formatCurrency(totalAmount)}</span>
              </div>
              {pendingAmount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-amber-700 font-medium">Pending to Pay</span>
                  <span className="text-amber-700 font-bold">{formatCurrency(pendingAmount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 active-elevate"
          onClick={handleSave}
          disabled={createPurchase.isPending || items.length === 0}
        >
          {createPurchase.isPending ? "Saving..." : items.length > 0 ? `Save Purchase — ${formatCurrency(totalAmount)}` : "Save Purchase"}
        </Button>
      </div>
    </div>
  );
}
