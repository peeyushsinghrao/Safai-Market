import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetProduct } from "@workspace/api-client-react";
import { Printer, Tag, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settings";
import { printBarcodeLabel } from "@/lib/barcode-label";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function BarcodeLabelPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { settings } = useSettingsStore();
  const { data: product, isLoading } = useGetProduct(Number(id));

  const [copies, setCopies] = useState(1);
  const [labelsPerRow, setLabelsPerRow] = useState<"1" | "2">("2");
  const [showStoreName, setShowStoreName] = useState(true);
  const [showMrp, setShowMrp] = useState(true);

  const handlePrint = () => {
    if (!product) return;
    if (!product.barcode) {
      toast({
        title: "No barcode",
        description: "This product has no barcode. Add a barcode in the edit screen first.",
        variant: "destructive",
      });
      return;
    }
    const labels = Array.from({ length: copies }, () => ({
      productName: product.name,
      barcode: product.barcode!,
      price: Number(product.sellPrice),
      storeName: showStoreName ? settings.storeName : undefined,
      unit: product.unit || undefined,
      mrp: showMrp && product.mrp ? Number(product.mrp) : undefined,
    }));
    printBarcodeLabel(labels, Number(labelsPerRow));
    toast({ title: `Printing ${copies} label${copies > 1 ? "s" : ""}...` });
  };

  if (isLoading) return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );

  if (!product) return (
    <div className="p-6 text-center text-muted-foreground">Product not found.</div>
  );

  const hasBarcode = Boolean(product.barcode);

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Print Barcode Label" subtitle={product.name} backTo={`/products/${id}`} />

      <div className="p-4 space-y-4 pb-24">

        {!hasBarcode ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Tag className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700">No barcode set</p>
              <p className="text-xs text-amber-600 mt-1">
                This product has no barcode. Go to Edit Product to add one first.
              </p>
              <button
                className="text-xs font-bold text-amber-700 underline mt-2"
                onClick={() => setLocation(`/products/${id}/edit`)}
              >
                Edit Product →
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <Tag className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-700">Barcode: {product.barcode}</p>
              <p className="text-xs text-green-600">Ready to print</p>
            </div>
          </div>
        )}

        <FormCard title="Label Preview">
          <div className="flex justify-center py-4">
            <div className="border-2 border-dashed border-muted rounded-xl p-4 w-48 text-center bg-white shadow-sm">
              {showStoreName && (
                <p className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase mb-1">
                  {settings.storeName}
                </p>
              )}
              <p className="text-xs font-bold leading-tight mb-2">{product.name}</p>
              <div className="flex justify-center gap-[1px] mb-1 h-8">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-black"
                    style={{ width: i % 3 === 0 ? 3 : 1.5 }}
                  />
                ))}
              </div>
              <p className="text-[8px] font-mono text-muted-foreground mb-2">
                {product.barcode || "NO BARCODE"}
              </p>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-lg font-bold">₹{Number(product.sellPrice).toFixed(0)}</span>
                {showMrp && product.mrp && Number(product.mrp) > Number(product.sellPrice) && (
                  <span className="text-[9px] text-muted-foreground line-through">
                    ₹{Number(product.mrp).toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Approximate preview — actual print may vary by paper size
          </p>
        </FormCard>

        <FormCard title="Print Options">
          <FormField label="Number of Copies">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCopies(Math.max(1, copies - 1))}
                className="w-10 h-10 rounded-xl border border-muted bg-white flex items-center justify-center active:scale-95 transition-transform"
              >
                <Minus className="w-4 h-4" />
              </button>
              <Input
                type="number"
                value={copies}
                onChange={e => setCopies(Math.max(1, Math.min(100, Number(e.target.value))))}
                className="h-10 rounded-xl text-center font-bold text-lg border-muted w-20"
              />
              <button
                onClick={() => setCopies(Math.min(100, copies + 1))}
                className="w-10 h-10 rounded-xl border border-muted bg-white flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </FormField>

          <FormField label="Labels Per Row">
            <Select value={labelsPerRow} onValueChange={(v) => setLabelsPerRow(v as "1" | "2")}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 per row (large label)</SelectItem>
                <SelectItem value="2">2 per row (standard)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <div className="space-y-2">
            {[
              { key: "showStoreName", label: "Show store name", value: showStoreName, set: setShowStoreName },
              { key: "showMrp", label: "Show MRP (strikethrough)", value: showMrp, set: setShowMrp },
            ].map(opt => (
              <div key={opt.key}
                className="flex items-center justify-between rounded-xl border border-muted/50 bg-background px-4 py-3"
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <button
                  onClick={() => opt.set(!opt.value)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    opt.value ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    opt.value ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>
            ))}
          </div>
        </FormCard>

        <Button
          onClick={handlePrint}
          disabled={!hasBarcode}
          className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 gap-2"
        >
          <Printer className="w-5 h-5" />
          Print {copies} Label{copies > 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
