import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetProduct, useListProducts, useCreateProduct } from "@workspace/api-client-react";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";
import { Skeleton } from "@/components/ui/skeleton";

const QUICK_SIZES = ["100g", "250g", "500g", "1kg", "2kg", "5kg", "100ml", "200ml", "500ml", "1L", "2L", "Small", "Medium", "Large"];

interface VariantDraft {
  name: string;
  sellPrice: string;
  buyPrice: string;
  stock: string;
  barcode: string;
}

function emptyVariant(parentName: string, size: string = ""): VariantDraft {
  return { name: size ? `${parentName} ${size}` : "", sellPrice: "", buyPrice: "", stock: "0", barcode: "" };
}

export default function ProductVariants() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: parent, isLoading } = useGetProduct(Number(id));
  const createProduct = useCreateProduct();

  const { data: allProducts } = useListProducts({ status: "active" } as any);
  const existingVariants = (allProducts ?? []).filter(
    (p: any) => String(p.parentProductId) === id
  );

  const [drafts, setDrafts] = useState<VariantDraft[]>([
    emptyVariant(parent?.name ?? ""),
  ]);
  const [saving, setSaving] = useState(false);

  const addDraft = () => setDrafts(prev => [...prev, emptyVariant(parent?.name ?? "")]);
  const removeDraft = (idx: number) => setDrafts(prev => prev.filter((_, i) => i !== idx));
  const updateDraft = (idx: number, field: keyof VariantDraft, value: string) => {
    setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const handleQuickSize = (idx: number, size: string) => {
    const base = parent?.name ?? "";
    setDrafts(prev => prev.map((d, i) =>
      i === idx ? { ...d, name: `${base} ${size}` } : d
    ));
  };

  const handleSave = async () => {
    const valid = drafts.filter(d => d.name.trim() && d.sellPrice);
    if (valid.length === 0) {
      toast({ title: "Add at least one variant with name and price", variant: "destructive" });
      return;
    }
    setSaving(true);
    let saved = 0;
    for (const draft of valid) {
      try {
        await createProduct.mutateAsync({
          data: {
            name: draft.name.trim(),
            categoryId: parent?.categoryId ?? 1,
            unit: parent?.unit ?? "piece",
            sellPrice: Number(draft.sellPrice),
            buyPrice: draft.buyPrice ? Number(draft.buyPrice) : 0,
            initialStock: Number(draft.stock) || 0,
            barcode: draft.barcode || undefined,
            parentProductId: Number(id),
            isVariantParent: false,
          } as any,
        });
        saved++;
      } catch (err: any) {
        toast({ title: `Failed to save "${draft.name}"`, description: err.message, variant: "destructive" });
      }
    }
    setSaving(false);
    if (saved > 0) {
      toast({ title: `${saved} variant${saved > 1 ? "s" : ""} created!` });
      setLocation(`/products/${id}`);
    }
  };

  if (isLoading) return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );

  if (!parent) return <div className="p-6 text-center text-muted-foreground">Product not found.</div>;

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Manage Variants" subtitle={parent.name} backTo={`/products/${id}`} />

      <div className="p-4 space-y-4 pb-24">

        {existingVariants.length > 0 && (
          <FormCard title={`Existing Variants (${existingVariants.length})`}>
            <div className="space-y-2">
              {existingVariants.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between bg-background rounded-xl border border-muted/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {Number(v.currentStock)} · {formatCurrency(Number(v.sellPrice))}
                    </p>
                  </div>
                  <button onClick={() => setLocation(`/products/${v.id}/edit`)} className="text-primary text-xs font-semibold">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </FormCard>
        )}

        <FormCard title="Add New Variants">
          <p className="text-xs text-muted-foreground -mt-1 mb-2">
            Example: Harpic 500ml, Harpic 1L, Harpic 200ml — each tracked separately.
          </p>

          {drafts.map((draft, idx) => (
            <div key={idx} className="border border-muted/60 rounded-xl p-3 space-y-3 bg-background relative">
              {drafts.length > 1 && (
                <button
                  onClick={() => removeDraft(idx)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="flex flex-wrap gap-1.5">
                {QUICK_SIZES.slice(0, 8).map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleQuickSize(idx, size)}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-muted/60 text-muted-foreground border border-muted/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    {size}
                  </button>
                ))}
              </div>

              <FormField label={`Variant ${idx + 1} Name`} required>
                <Input
                  value={draft.name}
                  onChange={e => updateDraft(idx, "name", e.target.value)}
                  placeholder={`e.g. ${parent.name} 500ml`}
                  className="h-11 rounded-xl text-sm border-muted"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Sell Price (₹)" required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={draft.sellPrice}
                      onChange={e => updateDraft(idx, "sellPrice", e.target.value)}
                      placeholder="0"
                      className="h-11 pl-6 rounded-xl text-sm border-muted"
                    />
                  </div>
                </FormField>
                <FormField label="Buy Price (₹)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={draft.buyPrice}
                      onChange={e => updateDraft(idx, "buyPrice", e.target.value)}
                      placeholder="0"
                      className="h-11 pl-6 rounded-xl text-sm border-muted"
                    />
                  </div>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Opening Stock">
                  <Input
                    type="number"
                    value={draft.stock}
                    onChange={e => updateDraft(idx, "stock", e.target.value)}
                    className="h-11 rounded-xl text-sm border-muted"
                  />
                </FormField>
                <FormField label="Barcode" hint="Optional">
                  <Input
                    value={draft.barcode}
                    onChange={e => updateDraft(idx, "barcode", e.target.value)}
                    placeholder="Scan or type"
                    className="h-11 rounded-xl text-sm border-muted font-mono"
                  />
                </FormField>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addDraft}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Another Variant
          </button>
        </FormCard>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20"
        >
          {saving ? "Saving..." : `Save ${drafts.filter(d => d.name && d.sellPrice).length} Variant${drafts.filter(d => d.name && d.sellPrice).length !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}
