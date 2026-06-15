import { useState } from "react";
import { Link } from "wouter";
import { Package, Plus, ChevronRight, Layers, Power, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useBundles, useDeactivateBundle } from "@/hooks/use-bundles";
import PageHeader from "@/components/page-header";
import BarcodeScannerModal from "@/components/barcode-scanner-modal";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ScanBarcode } from "lucide-react";

export default function BundlesList() {
  const { data: bundles, isLoading } = useBundles();
  const deactivateBundle = useDeactivateBundle();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const active = bundles?.filter((b) => b.isActive) ?? [];
  const inactive = bundles?.filter((b) => !b.isActive) ?? [];

  const handleScan = (barcode: string) => {
    const found = bundles?.find(b => b.barcode === barcode);
    if (found) {
      setLocation(`/bundles/${found.id}`);
    } else {
      toast({ title: "Bundle Not Found", description: `No bundle with barcode ${barcode}`, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-20">
      <PageHeader 
        title="Product Bundles" 
        subtitle="Combo packs & kits" 
        backTo="/more" 
        right={
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsScannerOpen(true)}>
            <ScanBarcode className="w-5 h-5" />
          </Button>
        }
      />

      <div className="flex-1 p-3 pb-24 space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : bundles?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border shadow-sm text-center text-slate-500">
            <Layers className="w-14 h-14 mb-4 opacity-20" />
            <p className="font-bold text-[16px] mb-1">No bundles yet</p>
            <p className="text-[14px] mb-6">Create combo packs to sell multiple products together</p>
            <Link href="/bundles/new">
              <Button className="gap-2 h-12 rounded-xl text-[15px] font-bold active-elevate bg-primary hover:bg-primary/90 text-white transition-transform">
                <Plus className="w-4 h-4" />
                Create First Bundle
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="space-y-2">
                {active.map((bundle) => (
                  <BundleCard key={bundle.id} bundle={bundle} onDeactivate={() => deactivateBundle.mutate(bundle.id)} />
                ))}
              </div>
            )}
            {inactive.length > 0 && (
              <div>
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Inactive</p>
                <div className="space-y-2 opacity-60">
                  {inactive.map((bundle) => (
                    <BundleCard key={bundle.id} bundle={bundle} onDeactivate={() => deactivateBundle.mutate(bundle.id)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Link href="/bundles/new">
        <button className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-2xl shadow-sm flex items-center justify-center active-elevate transition-transform z-30 hover:bg-primary/90">
          <Plus className="w-6 h-6" />
        </button>
      </Link>

      <BarcodeScannerModal
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleScan}
      />
    </div>
  );
}

function BundleCard({ bundle, onDeactivate }: { bundle: any; onDeactivate: () => void }) {
  const sellPrice = Number(bundle.sellPrice);
  const buyPrice = Number(bundle.buyPriceComputed);
  const profit = sellPrice - buyPrice;
  const marginPct = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col active-elevate transition-colors hover:border-primary/30">
      <Link href={`/bundles/${bundle.id}`}>
        <div className="p-4 cursor-pointer flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Layers className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold text-[16px] text-slate-800">{bundle.name}</span>
                {!bundle.isActive && (
                  <span className="px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">Inactive</span>
                )}
              </div>
              <p className="text-[13px] font-medium text-slate-500 mb-2">
                {bundle.items?.length ?? 0} components · Stock: {bundle.availableStock} kits
              </p>
              <div className="flex flex-wrap gap-1">
                {(bundle.items ?? []).slice(0, 3).map((item: any) => (
                  <span key={item.id} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-bold">
                    {item.productNameSnapshot} ×{item.quantity}
                  </span>
                ))}
                {(bundle.items?.length ?? 0) > 3 && (
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-bold">
                    +{bundle.items.length - 3} more
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <div className="font-bold text-[16px] text-primary">{formatCurrency(sellPrice)}</div>
              <div className={cn(
                "text-[12px] font-bold mt-0.5",
                marginPct >= 20 ? "text-emerald-600" : marginPct >= 10 ? "text-amber-600" : "text-red-600"
              )}>
                {marginPct.toFixed(1)}% margin
              </div>
            </div>
          </div>
        </div>
      </Link>
      <div className="border-t border-slate-100 flex bg-slate-50/50">
        <button
          className="flex-1 h-10 text-[13px] font-bold text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors"
          onClick={onDeactivate}
        >
          <Power className="w-3.5 h-3.5" />
          {bundle.isActive ? "Deactivate" : "Activate"}
        </button>
        <div className="w-px bg-slate-200" />
        <Link href={`/bundles/${bundle.id}`} className="flex-1">
          <button className="w-full h-10 text-[13px] font-bold text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors">
            Edit
            <ChevronRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}
