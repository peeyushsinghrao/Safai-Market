import React from "react";
import { Link } from "wouter";
import { 
  Truck, ShoppingCart, Receipt, BookOpen, Package, TrendingDown,
  BarChart2, FileText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
    title: "Operations",
    items: [
      { href: "/suppliers", label: "Suppliers", sub: "Manage vendors", icon: Truck, color: "bg-slate-100 text-slate-700" },
      { href: "/purchases", label: "Purchase Entry", sub: "Record stock purchase", icon: ShoppingCart, color: "bg-slate-100 text-slate-700" },
      { href: "/expenses", label: "Expenses", sub: "Record daily expenses", icon: Receipt, color: "bg-slate-100 text-slate-700" },
    ]
  },
];

export default function MoreMenu() {
  return (
    <div className="p-4 pb-20 space-y-6">
      <h1 className="text-2xl font-bold">More</h1>
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
    </div>
  );
}
