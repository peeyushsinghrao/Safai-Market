import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Truck, ShoppingCart, Receipt, BookOpen, Package, TrendingDown,
  BarChart2, FileText, Layers, Settings, Store, LogOut
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSettingsStore } from "@/stores/settings";
import { useAuthStore } from "@/stores/auth";
import { getSupabase } from "@/lib/supabase";

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
    title: "Settings",
    items: [
      { href: "/settings/store", label: "Store Settings", sub: "Name, address, receipt & GST", icon: Store, color: "bg-orange-100 text-orange-700" },
    ]
  },
];

export default function MoreMenu() {
  const { settings } = useSettingsStore();
  const { session } = useAuthStore();
  const [, setLocation] = useLocation();

  const handleSignOut = async () => {
    try {
      const sb = getSupabase();
      if (sb) await sb.auth.signOut();
    } catch { /* ignore */ }
    setLocation("/auth/login");
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">More</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{settings.storeName}</p>
        </div>
        <Link href="/settings/store">
          <button className="w-10 h-10 rounded-xl border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors active-elevate">
            <Settings className="w-5 h-5" />
          </button>
        </Link>
      </div>

      {menuSections.map(section => (
        <div key={section.title}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{section.title}</p>
          <div className="space-y-2">
            {section.items.map(item => (
              <Link key={item.href} href={item.href}>
                <Card className="active-elevate hover:shadow-md transition-shadow border-muted/60 cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Sign Out — only shown when logged in via Supabase */}
      {session && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account</p>
          <button
            className="w-full"
            onClick={handleSignOut}
          >
            <Card className="active-elevate hover:shadow-md transition-shadow border-red-100 cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-50 text-red-500">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm text-red-600">Sign Out</p>
                  <p className="text-xs text-muted-foreground">{session.user.email || session.user.phone || "Signed in"}</p>
                </div>
              </CardContent>
            </Card>
          </button>
        </div>
      )}
    </div>
  );
}
