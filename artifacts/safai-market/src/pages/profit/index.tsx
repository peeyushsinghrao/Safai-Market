import React, { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Package, Tag, BarChart2, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/page-header";
import {
  useGetProfitSummary,
  useGetProfitDaily,
  useGetProfitByProduct,
  useGetProfitByCategory,
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { classifyMarginTier, MARGIN_TIER_CONFIG } from "@/lib/profit";

type Period = "7" | "30" | "90";

function getDateRange(days: number) {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

function MiniBar({ value, max, positive }: { value: number; max: number; positive: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
      <div
        className={cn("h-1.5 rounded-full transition-all", positive ? "bg-green-500" : "bg-red-400")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ProfitReports() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<Period>("30");
  const [tab, setTab] = useState<"overview" | "products" | "categories">("overview");

  const days = Number(period);
  const { from, to } = useMemo(() => getDateRange(days), [days]);

  const { data: summary, isLoading: loadingSummary } = useGetProfitSummary({ from, to });
  const { data: daily, isLoading: loadingDaily } = useGetProfitDaily({ days });
  const { data: byProduct, isLoading: loadingProducts } = useGetProfitByProduct({ from, to, limit: 20 });
  const { data: byCategory, isLoading: loadingCategories } = useGetProfitByCategory({ from, to });

  const maxDailySales = useMemo(() => Math.max(...(daily?.map(d => d.sales) ?? [0])), [daily]);
  const maxDailyProfit = useMemo(() => Math.max(...(daily?.map(d => d.profit) ?? [0])), [daily]);
  const maxProductProfit = useMemo(() => Math.max(...(byProduct?.map(p => Math.abs(p.profit)) ?? [0])), [byProduct]);

  return (
    <div className="flex flex-col min-h-full bg-gray-50/50 pb-20">
      <PageHeader title="Profit Report" subtitle="Estimated margins" backTo="/more" />

      {/* Period Selector */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b px-4 py-2 flex gap-2">
        {(["7", "30", "90"] as Period[]).map(p => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setPeriod(p)}
          >
            {p === "7" ? "This Week" : p === "30" ? "This Month" : "3 Months"}
          </Button>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex border-b bg-background">
        {(["overview", "products", "categories"] as const).map(t => (
          <button
            key={t}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
              tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            )}
            onClick={() => setTab(t)}
          >
            {t === "overview" ? "Overview" : t === "products" ? "Products" : "Categories"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {tab === "overview" && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Sales</p>
                  {loadingSummary ? <Skeleton className="h-7 w-24 mt-1" /> : (
                    <p className="text-xl font-bold text-primary mt-1">{formatCurrency(summary?.totalSales)}</p>
                  )}
                </CardContent>
              </Card>
              <Card className={cn("shadow-sm", (summary?.totalProfit ?? 0) < 0 ? "border-red-200" : "border-green-200")}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Est. Profit</p>
                  {loadingSummary ? <Skeleton className="h-7 w-24 mt-1" /> : (
                    <p className={cn("text-xl font-bold mt-1", (summary?.totalProfit ?? 0) >= 0 ? "text-green-600" : "text-red-600")}>
                      {formatCurrency(summary?.totalProfit)}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Margin</p>
                  {loadingSummary ? <Skeleton className="h-7 w-16 mt-1" /> : (
                    <p className={cn("text-xl font-bold mt-1", (summary?.avgMarginPct ?? 0) >= 10 ? "text-green-600" : (summary?.avgMarginPct ?? 0) >= 0 ? "text-amber-600" : "text-red-600")}>
                      {summary?.avgMarginPct?.toFixed(1)}%
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Bills Tracked</p>
                  {loadingSummary ? <Skeleton className="h-7 w-16 mt-1" /> : (
                    <p className="text-xl font-bold mt-1">{summary?.billsWithProfit} / {summary?.billCount}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coverage Warning */}
            {summary && summary.billsWithProfit < summary.billCount && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>{summary.billCount - summary.billsWithProfit} bills</strong> have no buy price data. Add buy prices to products for complete profit tracking.
                </p>
              </div>
            )}

            {/* Daily Trend */}
            <Card className="shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-muted-foreground" />
                  Daily Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {loadingDaily ? (
                  <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : !daily?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data in this period</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {[...daily].reverse().map(day => (
                      <div key={day.date}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground">{formatDate(day.date)}</span>
                          <div className="flex gap-3">
                            <span className="text-xs text-muted-foreground">{formatCurrency(day.sales)}</span>
                            <span className={cn("text-xs font-semibold", day.profit >= 0 ? "text-green-600" : "text-red-600")}>
                              {day.profit >= 0 ? "+" : ""}{formatCurrency(day.profit)}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <MiniBar value={day.sales} max={maxDailySales} positive={true} />
                          <MiniBar value={day.profit} max={maxDailyProfit} positive={day.profit >= 0} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {tab === "products" && (
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                By Product
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingProducts ? (
                <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !byProduct?.length ? (
                <p className="text-sm text-muted-foreground text-center p-6">No sales data in this period</p>
              ) : (
                <div className="divide-y">
                  {byProduct.map((p, idx) => {
                    const tier = classifyMarginTier(p.marginPct);
                    const cfg = MARGIN_TIER_CONFIG[tier];
                    return (
                      <div key={p.productId} className="p-3 px-4">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
                            <span className="text-sm font-medium truncate">{p.productName}</span>
                          </div>
                          <div className="text-right ml-2 shrink-0">
                            <p className={cn("text-sm font-bold", p.profit >= 0 ? "text-green-600" : "text-red-600")}>
                              {p.profit >= 0 ? "+" : ""}{formatCurrency(p.profit)}
                            </p>
                            {p.hasProfit && (
                              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", cfg.badgeClass)}>
                                {p.marginPct.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-7">
                          <span className="text-xs text-muted-foreground">{p.quantitySold} sold · {formatCurrency(p.revenue)} rev</span>
                        </div>
                        {p.hasProfit && (
                          <div className="ml-7 mt-1">
                            <MiniBar value={Math.abs(p.profit)} max={maxProductProfit} positive={p.profit >= 0} />
                          </div>
                        )}
                        {!p.hasProfit && (
                          <span className="ml-7 text-[10px] text-gray-400">No buy price — profit untracked</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "categories" && (
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                By Category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingCategories ? (
                <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : !byCategory?.length ? (
                <p className="text-sm text-muted-foreground text-center p-6">No sales data in this period</p>
              ) : (
                <div className="divide-y">
                  {byCategory.map(cat => {
                    const tier = classifyMarginTier(cat.marginPct);
                    const cfg = MARGIN_TIER_CONFIG[tier];
                    const maxRev = Math.max(...byCategory.map(c => c.revenue));
                    return (
                      <div key={cat.category} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{cat.category}</span>
                            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", cfg.badgeClass)}>
                              {cat.marginPct.toFixed(0)}%
                            </span>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-sm font-bold", cat.profit >= 0 ? "text-green-600" : "text-red-600")}>
                              {cat.profit >= 0 ? "+" : ""}{formatCurrency(cat.profit)}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Revenue: {formatCurrency(cat.revenue)}</span>
                        </div>
                        <MiniBar value={cat.revenue} max={maxRev} positive={true} />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
