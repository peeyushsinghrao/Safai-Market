import React from "react";
import { Link } from "wouter";
import { 
  useGetDashboardSummary, 
  useGetLowStockProducts, 
  useGetRecentActivity 
} from "@workspace/api-client-react";
import { 
  ChevronRight, TrendingUp, TrendingDown, BarChart2,
  Receipt, ArrowDownToLine, IndianRupee, Plus, Store, Clock, Package
} from "lucide-react";
import { formatCurrency, formatTime } from "@/lib/format";
import { useSettingsStore } from "@/stores/settings";
import { cn } from "@/lib/utils";

export default function Home() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: lowStock, isLoading: isLoadingLowStock } = useGetLowStockProducts();
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity();
  const { settings } = useSettingsStore();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dayName = new Date().toLocaleDateString("en-IN", { weekday: "long" });
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" });

  const sellPrice = summary?.todayTotalSales || 0;
  const buyPrice = (summary?.todayTotalSales || 0) - (summary?.todayEstimatedProfit || 0);
  const marginPct = sellPrice > 0 ? ((sellPrice - buyPrice) / sellPrice) * 100 : 0;

  return (
    <div className="flex flex-col pb-8 bg-slate-50 font-sans min-h-screen">
      {/* 1. Greeting Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">
            {greeting} 👋
          </p>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {settings.storeName || "My Store"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dayName}, {dateStr}
          </p>
        </div>
        <Link href="/settings/store">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
        </Link>
      </div>

      {/* 2. Hero Sales Card */}
      <Link href="/profit">
        <div className="mx-4 mt-2 mb-4 rounded-3xl bg-primary text-primary-foreground p-5 shadow-xl shadow-primary/25 relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer">
          {/* Background decoration */}
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -right-2 top-8 w-20 h-20 bg-white/5 rounded-full" />

          {/* Label + change */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider">
              Today's Sales
            </p>
            {/* vs yesterday — show if data available */}
            {summary?.yesterdayTotalSales !== undefined && summary.yesterdayTotalSales > 0 && (
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                summary.todayTotalSales >= summary.yesterdayTotalSales
                  ? "bg-white/20 text-white"
                  : "bg-black/20 text-white/80"
              )}>
                {summary.todayTotalSales >= summary.yesterdayTotalSales
                  ? <TrendingUp className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />
                }
                {Math.abs(((summary.todayTotalSales - summary.yesterdayTotalSales)
                  / summary.yesterdayTotalSales) * 100).toFixed(0)}% vs yesterday
              </div>
            )}
          </div>

          {/* Big number */}
          {isLoadingSummary ? (
            <div className="h-12 w-40 bg-white/20 rounded-xl animate-pulse mb-3" />
          ) : (
            <p className="text-5xl font-bold tracking-tight mb-3 relative z-10">
              {formatCurrency(summary?.todayTotalSales ?? 0)}
            </p>
          )}

          {/* Payment breakdown row */}
          <div className="grid grid-cols-4 gap-2 relative z-10">
            {[
              { label: "Cash",   value: summary?.todayCashReceived },
              { label: "UPI",    value: summary?.todayUpiReceived  },
              { label: "Udhaar", value: summary?.todayUdhaarGiven  },
              { label: "Bills",  value: summary?.todayBillCount, isCnt: true },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] text-primary-foreground/60 font-medium">{item.label}</p>
                <p className="text-sm font-bold">
                  {item.isCnt ? (item.value ?? 0) : formatCurrency(item.value ?? 0)}
                </p>
              </div>
            ))}
          </div>

          {/* Profit strip */}
          {summary?.todayEstimatedProfit != null && (
            <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-primary-foreground/60" />
                <span className="text-primary-foreground/60 text-xs">Est. Profit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">
                  {formatCurrency(summary.todayEstimatedProfit)}
                </span>
                {marginPct > 0 && (
                  <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">
                    {marginPct.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* 3. Quick Actions — 2×2 Grid */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/billing",       icon: Receipt,         label: "New Bill",      sub: "Start billing",   color: "bg-primary text-white shadow-lg shadow-primary/30" },
            { href: "/stock/receive", icon: ArrowDownToLine, label: "Receive Stock", sub: "Add inventory",   color: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" },
            { href: "/customers",     icon: IndianRupee,     label: "Get Payment",   sub: "Collect udhaar",  color: "bg-blue-500 text-white shadow-lg shadow-blue-500/25" },
            { href: "/products/new",  icon: Plus,            label: "Add Product",   sub: "New item",        color: "bg-violet-500 text-white shadow-lg shadow-violet-500/25" },
          ].map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div className={cn(
                  "rounded-2xl p-4 flex items-center gap-3 transition-all active-elevate",
                  action.color
                )}>
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{action.label}</p>
                    <p className="text-[11px] opacity-75 mt-0.5 truncate">{action.sub}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Low Stock Alert Strip */}
      {!isLoadingLowStock && lowStock && lowStock.length > 0 && (
        <div className="mx-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
                Low Stock — {lowStock.length} items
              </p>
            </div>
            <Link href="/low-stock">
              <span className="text-xs text-primary font-semibold flex items-center">
                See all <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </Link>
          </div>
          <div className="space-y-1.5">
            {lowStock.slice(0, 3).map(p => (
              <Link key={p.id} href={`/products/${p.id}`}>
                <div className={cn(
                  "flex items-center justify-between rounded-2xl border px-3 py-2.5 bg-white transition-all active-elevate shadow-sm",
                  Number(p.currentStock) <= 0
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
                )}>
                  <p className="text-sm font-semibold truncate flex-1 pr-2">{p.name}</p>
                  <div className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full shrink-0",
                    Number(p.currentStock) <= 0
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  )}>
                    {Number(p.currentStock) <= 0 ? "Out of Stock" : `${p.currentStock} left`}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {/* 5. Recent Activity */}
      {!isLoadingActivity && activity && activity.length > 0 && (
        <div className="mx-4 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Activity
          </p>
          <div className="bg-white rounded-2xl p-4 shadow-sm border space-y-4">
            {activity.map(event => {
              let color = "bg-slate-500";
              let href = "";
              if (event.type === "sale") { color = "bg-primary"; href = "/bills"; }
              else if (event.type === "expense") { color = "bg-red-500"; href = "/expenses"; }
              else if (event.type === "purchase") { color = "bg-blue-500"; href = "/purchases"; }
              else if (event.type === "stock") { color = "bg-amber-500"; href = "/stock-movements"; }

              const Content = (
                <div className="flex items-center">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-slate-900 text-[14px] truncate">
                        {event.description.split("•")[0]?.trim() || event.description}
                      </span>
                      <span className="text-xs text-slate-500 font-medium whitespace-nowrap ml-2">
                        {formatTime(event.createdAt)}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-snug">
                      {event.description.includes("•") 
                        ? event.description.split("•").slice(1).join("•").trim() 
                        : "Updated just now"}
                    </p>
                  </div>
                  {href && <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />}
                </div>
              );

              return (
                <div key={event.id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 top-3 w-3 h-3 rounded-full border-2 border-white ${color} z-10 shadow-sm`} />
                  
                  {href ? (
                    <Link href={href} className="block transition-all active-elevate">
                      {Content}
                    </Link>
                  ) : (
                    Content
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
