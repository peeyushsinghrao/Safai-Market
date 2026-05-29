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

export default function BundlesList() {
  const { data: bundles, isLoading } = useBundles();
  const deactivateBundle = useDeactivateBundle();

  const active = bundles?.filter((b) => b.isActive) ?? [];
  const inactive = bundles?.filter((b) => !b.isActive) ?? [];

  return (
    <div className="flex flex-col min-h-full bg-gray-50/50">
      <PageHeader title="Product Bundles" subtitle="Combo packs & kits" backTo="/more" />

      <div className="flex-1 p-3 pb-24 space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : bundles?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Layers className="w-14 h-14 mb-4 opacity-20" />
            <p className="font-semibold text-base mb-1">No bundles yet</p>
            <p className="text-sm mb-6">Create combo packs to sell multiple products together</p>
            <Link href="/bundles/new">
              <Button className="gap-2">
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Inactive</p>
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
        <button className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30">
          <Plus className="w-6 h-6" />
        </button>
      </Link>
    </div>
  );
}

function BundleCard({ bundle, onDeactivate }: { bundle: any; onDeactivate: () => void }) {
  const sellPrice = Number(bundle.sellPrice);
  const buyPrice = Number(bundle.buyPriceComputed);
  const profit = sellPrice - buyPrice;
  const marginPct = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;

  return (
    <Card className="shadow-sm border-muted/60 overflow-hidden">
      <CardContent className="p-0">
        <Link href={`/bundles/${bundle.id}`}>
          <div className="p-4 pb-3 cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-bold text-sm">{bundle.name}</span>
                  {!bundle.isActive && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground">Inactive</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {bundle.items?.length ?? 0} components · Stock: {bundle.availableStock} kits
                </p>
                <div className="flex flex-wrap gap-1">
                  {(bundle.items ?? []).slice(0, 3).map((item: any) => (
                    <Badge key={item.id} variant="secondary" className="text-[10px] h-5 px-1.5">
                      {item.productNameSnapshot} ×{item.quantity}
                    </Badge>
                  ))}
                  {(bundle.items?.length ?? 0) > 3 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      +{bundle.items.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="font-bold text-base">{formatCurrency(sellPrice)}</div>
                <div className={cn(
                  "text-xs font-semibold mt-0.5",
                  marginPct >= 20 ? "text-green-600" : marginPct >= 10 ? "text-amber-600" : "text-red-600"
                )}>
                  {marginPct.toFixed(1)}% margin
                </div>
              </div>
            </div>
          </div>
        </Link>
        <div className="border-t border-muted/50 flex">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-9 rounded-none text-xs text-muted-foreground gap-1.5 hover:bg-muted/50"
            onClick={onDeactivate}
          >
            <Power className="w-3.5 h-3.5" />
            {bundle.isActive ? "Deactivate" : "Activate"}
          </Button>
          <div className="w-px bg-muted/50" />
          <Link href={`/bundles/${bundle.id}`} className="flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-9 rounded-none text-xs text-muted-foreground gap-1.5 hover:bg-muted/50"
            >
              Edit
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
