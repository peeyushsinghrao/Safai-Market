import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ChevronDown, Package, FileText, QrCode } from "lucide-react";
import {
  useGetProfitSummary,
  useGetProfitDaily,
  useGetProfitByProduct,
  useGetProfitByCategory,
} from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type Period = "7" | "30" | "90";
type ViewMode = "Daily" | "Weekly" | "Monthly";

function getDateRange(days: number) {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

const CATEGORY_COLORS = ["bg-primary", "bg-blue-600", "bg-red-500", "bg-amber-500", "bg-purple-600"];

export default function ProfitReports() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<Period>("30");
  const [viewMode, setViewMode] = useState<ViewMode>("Monthly");

  const days = Number(period);
  const { from, to } = useMemo(() => getDateRange(days), [days]);

  const { data: summary, isLoading: loadingSummary } = useGetProfitSummary({ from, to });
  const { data: daily, isLoading: loadingDaily } = useGetProfitDaily({ days });
  const { data: byProduct, isLoading: loadingProducts } = useGetProfitByProduct({ from, to, limit: 10 });
  const { data: byCategory, isLoading: loadingCategories } = useGetProfitByCategory({ from, to });

  const maxDailySales = useMemo(() => Math.max(...(daily?.map((d) => d.sales) ?? [0])), [daily]);

  const now = new Date();
  const monthYear = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-muted/50 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/more")} className="text-muted-foreground p-1 -ml-1 hover:bg-slate-100 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[19px] text-foreground">Profit Report</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="border border-muted rounded-full px-3 py-1.5 text-[13px] font-medium text-foreground flex items-center gap-1 active:scale-95 transition-transform">
              {monthYear} <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-muted/50 rounded-full p-1 flex">
          {(["Daily", "Weekly", "Monthly"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={cn(
                "flex-1 py-2 rounded-full text-[13px] font-bold transition-all",
                viewMode === mode ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              )}
              onClick={() => {
                setViewMode(mode);
                if (mode === "Daily") setPeriod("7");
                else if (mode === "Weekly") setPeriod("30");
                else setPeriod("90");
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Headline Card */}
      <div className="mx-4 mt-2 rounded-2xl bg-primary text-primary-foreground p-5 shadow-sm relative overflow-hidden">
        {/* Decorator circles */}
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-black/10 rounded-full blur-xl" />
        
        <p className="text-primary-foreground/80 text-xs font-bold uppercase tracking-wider relative z-10">
          {period}-Day Summary
        </p>
        
        {loadingSummary ? (
          <div className="h-10 w-40 bg-white/20 rounded animate-pulse mt-2" />
        ) : (
          <p className="text-4xl font-bold mt-1 relative z-10 tracking-tight">
            {formatCurrency(summary?.totalProfit ?? 0)}
          </p>
        )}
        
        <div className="flex gap-6 mt-4 pt-4 border-t border-primary-foreground/20 relative z-10 text-sm">
          <div>
            <p className="text-primary-foreground/70 text-[11px] uppercase tracking-wider font-semibold mb-0.5">Revenue</p>
            <p className="font-bold">{formatCurrency(summary?.totalSales ?? 0)}</p>
          </div>
          <div>
            <p className="text-primary-foreground/70 text-[11px] uppercase tracking-wider font-semibold mb-0.5">Avg Margin</p>
            <p className="font-bold">
              {(summary?.totalSales || 0) > 0
                ? (((summary?.totalProfit || 0) / (summary?.totalSales || 1)) * 100).toFixed(1) + "%"
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-primary-foreground/70 text-[11px] uppercase tracking-wider font-semibold mb-0.5">Bills</p>
            <p className="font-bold">{summary?.billCount ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-5 pb-6">
        {/* Daily Bar Chart */}
        {daily && daily.length > 0 && (
          <div className="mx-4 bg-white rounded-2xl border border-muted/50 p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Daily Sales
            </p>
            <div className="flex items-end gap-1.5 h-20">
              {daily.slice(-14).map((d, idx) => {
                const pct = maxDailySales > 0 ? (d.sales / maxDailySales) * 100 : 0;
                const isToday = idx === daily.slice(-14).length - 1;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className={cn(
                        "w-full rounded-t-[3px] transition-all",
                        isToday ? "bg-primary" : "bg-primary/20"
                      )}
                      style={{ height: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-[10px] text-muted-foreground font-medium">{new Date(daily.slice(-14)[0]?.date || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Today</p>
            </div>
          </div>
        )}

        {/* Top Products */}
        <div className="mx-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Top Profitable Items</p>
          </div>
          <div className="space-y-2">
            {loadingProducts ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-muted/50 h-[70px] animate-pulse" />
              ))
            ) : !byProduct?.length ? (
              <p className="text-center text-muted-foreground py-6 text-sm bg-white rounded-xl border border-muted/50">No sales data</p>
            ) : (
              byProduct.slice(0, 5).map((p, idx) => (
                <div key={p.productId} className="flex items-center gap-3 bg-white rounded-xl border border-muted/50 px-4 py-3 shadow-sm">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    idx === 0 ? "bg-yellow-100 text-yellow-700"
                    : idx === 1 ? "bg-gray-100 text-gray-600"
                    : idx === 2 ? "bg-orange-100 text-orange-600"
                    : "bg-muted text-muted-foreground"
                  )}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-foreground">{p.productName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.quantitySold} sold</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-base font-bold", p.profit >= 0 ? "text-green-600" : "text-red-500")}>
                      +{formatCurrency(p.profit)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">profit</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Profit Share */}
        <div className="mx-4 bg-white rounded-2xl border border-muted/50 shadow-sm p-4">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Category Share</p>
          {loadingCategories ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-6 bg-slate-100 rounded animate-pulse" />)}
            </div>
          ) : !byCategory?.length ? (
            <p className="text-center text-muted-foreground py-4 text-sm">No category data</p>
          ) : (
            <div className="space-y-4">
              {byCategory.slice(0, 5).map((cat, idx) => {
                const totalProfit = byCategory.reduce((sum, c) => sum + Math.abs(c.profit), 0);
                const pct = totalProfit > 0 ? ((Math.abs(cat.profit) / totalProfit) * 100).toFixed(0) : "0";
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-foreground">{cat.category}</span>
                      <span className="text-sm font-bold text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", CATEGORY_COLORS[idx % CATEGORY_COLORS.length])}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tax Ready Report */}
        <div className="mx-4 bg-[#f0fdf4] rounded-2xl p-4 flex items-center gap-4 border border-[#bbf7d0] shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#bbf7d0] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-green-900">Tax Ready Report</p>
            <p className="text-xs text-green-700 mt-0.5">Ready for {monthYear}</p>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0 active-elevate transition-colors">
            PDF
          </button>
        </div>
      </div>
    </div>
  );
}
