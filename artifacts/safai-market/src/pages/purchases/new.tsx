import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Plus, Minus, Trash2 } from "lucide-react";
import { useListSuppliers, useListProducts, useCreatePurchase, getListPurchasesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";

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
      toast({ title: "Validation Error", description: "Supplier and at least one item are required.", variant: "destructive" });
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
        toast({ title: "Success", description: "Purchase recorded successfully" });
        queryClient.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
        setLocation("/purchases");
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pb-20">
      <div className="sticky top-14 z-30 bg-primary text-primary-foreground border-b p-4 flex items-center shadow-sm">
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 mr-2" onClick={() => setLocation("/purchases")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg">New Purchase</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-4 bg-card p-4 rounded-xl shadow-sm border">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Supplier *</label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select Supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Invoice Ref</label>
              <Input value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} className="h-12" placeholder="e.g. INV-123" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Paid Amount (₹)</label>
              <Input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="h-12" placeholder="0" />
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-card p-4 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-900">Add Item</h3>
          <div className="space-y-3">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select Product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Qty</label>
                <Input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} min="1" className="h-10" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Cost/Unit</label>
                <Input type="number" value={itemCost} onChange={e => setItemCost(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Free Qty</label>
                <Input type="number" value={freeQty} onChange={e => setFreeQty(e.target.value)} min="0" className="h-10" />
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={addItem} disabled={!selectedProductId || !itemQty || !itemCost}>
              <Plus className="w-4 h-4 mr-2" /> Add to List
            </Button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-sm">Items Added ({items.length})</h3>
            {items.map((item, idx) => (
              <Card key={idx}>
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-sm">{item.product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.unitCost)} 
                      {item.freeQuantity > 0 && <span className="text-primary ml-1">(+{item.freeQuantity} free)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-bold">{formatCurrency(item.quantity * item.unitCost)}</div>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeItem(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="bg-primary/10 p-4 rounded-xl flex justify-between items-center mt-4">
              <span className="font-bold text-primary">Total Amount</span>
              <span className="font-bold text-2xl text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        )}

        <Button 
          className="w-full h-14 text-lg mt-4 active-elevate" 
          onClick={handleSave}
          disabled={createPurchase.isPending || items.length === 0}
        >
          {createPurchase.isPending ? "Saving..." : "Save Purchase"}
        </Button>
      </div>
    </div>
  );
}
