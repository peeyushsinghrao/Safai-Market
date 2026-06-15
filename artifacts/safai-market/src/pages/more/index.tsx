import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Truck, ShoppingCart, Receipt, BookOpen, Package, TrendingDown,
  BarChart2, FileText, Layers, Settings, Store, LogOut, Smartphone,
  Download, RefreshCw, ArrowDownToLine, Users, ChevronRight
} from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import { useAuthStore } from "@/stores/auth";
import { getSupabase } from "@/lib/supabase";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const menuSections = [
  {
    title: "Reports & Insights",
    items: [
      { href: "/profit", label: "Profit Report", sub: "Margins by product & category", icon: BarChart2, color: "bg-green-100 text-green-700" },
      { href: "/bills", label: "Bills History", sub: "View & reprint past bills", icon: FileText, color: "bg-indigo-100 text-indigo-700" },
      { href: "/daily-closing", label: "Daily Closing", sub: "End-of-day summary", icon: BookOpen, color: "bg-blue-100 text-blue-700" },
      { href: "/stock-movements", label: "Stock Movements", sub: "In / out history", icon: TrendingDown, color: "bg-purple-100 text-purple-700" },
      { href: "/low-stock", label: "Finishing Stock", sub: "Items running low", icon: Package, color: "bg-amber-100 text-amber-700" },
    ]
  },
  {
    title: "Inventory",
    items: [
      { href: "/stock/receive", label: "Receive Stock", sub: "Rapid stock-in for multiple products", icon: ArrowDownToLine, color: "bg-emerald-100 text-emerald-700" },
    ]
  },
  {
    title: "Products",
    items: [
      { href: "/bundles", label: "Product Bundles", sub: "Combo packs & kits", icon: Layers, color: "bg-violet-100 text-violet-700" },
    ]
  },
  {
    title: "Operations",
    items: [
      { href: "/suppliers", label: "Suppliers", sub: "Manage vendors", icon: Truck, color: "bg-slate-100 text-slate-700" },
      { href: "/purchases", label: "Purchase Entry", sub: "Record stock purchase", icon: ShoppingCart, color: "bg-slate-100 text-slate-700" },
      { href: "/expenses", label: "Expenses", sub: "Record daily expenses", icon: Receipt, color: "bg-slate-100 text-slate-700" },
    ]
  },
  {
    title: "Settings & Tools",
    items: [
      { href: "/settings/store", label: "Store Settings", sub: "Name, address, receipt & GST", icon: Store, color: "bg-orange-100 text-orange-700" },
      { href: "/settings/bill-settings", label: "Bill Settings", sub: "Paper size, footer, GST on receipt", icon: Receipt, color: "bg-rose-100 text-rose-700" },
      { href: "/settings/devices", label: "Device Center", sub: "Scanners, printers & connections", icon: Smartphone, color: "bg-cyan-100 text-cyan-700" },
      { href: "/settings/members", label: "Shop Members", sub: "Manage team access", icon: Users, color: "bg-fuchsia-100 text-fuchsia-700" },
      { href: "/settings/export", label: "Backup & Export", sub: "Download data as CSV", icon: Download, color: "bg-indigo-100 text-indigo-700" },
      { href: "/settings/sync-center", label: "Sync Center", sub: "Data sync status & force sync", icon: RefreshCw, color: "bg-teal-100 text-teal-700" },
    ]
  },
];

export default function MoreMenu() {
  const { settings } = useSettingsStore();
  const { session } = useAuthStore();
  const [, setLocation] = useLocation();
  const { data: summary } = useGetDashboardSummary();

  const handleSignOut = async () => {
    try {
      const sb = getSupabase();
      if (sb) await sb.auth.signOut();
    } catch { /* ignore */ }
    setLocation("/auth/login");
  };

  return (
    <div className="pb-24 space-y-6">
      {/* Shop hero card */}
      <div className="mx-0 rounded-none bg-primary px-5 pt-12 pb-5 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full" />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider">
              Your Shop
            </p>
            <h1 className="text-2xl font-bold text-white mt-0.5">
              {settings.storeName || "My Store"}
            </h1>
            {summary && (
              <p className="text-primary-foreground/80 text-sm mt-1.5 font-medium">
                Today: {formatCurrency(summary.todayTotalSales)} · {summary.todayBillCount} bills
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
            <Store className="w-6 h-6 text-white" />
          </div>
        </div>

        <Link href="/settings/store">
          <button className="relative z-10 mt-5 flex items-center gap-2 bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active-elevate">
            <Settings className="w-4 h-4" />
            Edit Store Settings
          </button>
        </Link>
      </div>

      {menuSections.map(section => (
        <div key={section.title} className="px-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {section.title}
          </p>
          <div className="bg-white rounded-2xl border border-muted/50 overflow-hidden divide-y divide-muted/30">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 px-4 py-3.5 active:bg-muted/50 transition-colors cursor-pointer">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", item.color)}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Sign Out */}
      {session && (
        <div className="px-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Account</p>
          <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-red-50/50 transition-colors text-left"
              onClick={handleSignOut}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-50 text-red-500">
                <LogOut className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-600 leading-tight">Sign Out</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {session.user.email || session.user.phone || "Signed in"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-red-500/40 shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

