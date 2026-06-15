import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useListBills } from "@workspace/api-client-react";
import { ArrowLeft, Search, QrCode, Receipt, Clock, Banknote, Smartphone, AlertTriangle, ChevronDown } from "lucide-react";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings";

const getDatesForFilter = (filterType: "Today" | "Yesterday" | "This Week" | "This Month") => {
  const now = new Date();
  let from = new Date();
  let to = new Date();

  if (filterType === "Today") {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else if (filterType === "Yesterday") {
    from.setDate(now.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    to.setDate(now.getDate() - 1);
    to.setHours(23, 59, 59, 999);
  } else if (filterType === "This Week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    from.setDate(diff);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else if (filterType === "This Month") {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  }

  return { from: from.toISOString(), to: to.toISOString() };
};

export default function BillsHistory() {
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"Today" | "Yesterday" | "This Week" | "This Month">("Today");
  const [, setLocation] = useLocation();
  const { settings } = useSettingsStore();

  const dates = getDatesForFilter(selectedFilter);
  const { data: bills, isLoading } = useListBills({
    from: dates.from,
    to: dates.to,
  });

  const filtered = bills?.filter((b) => {
    if (!search) return true;
    return (
      b.billNumber?.toLowerCase().includes(search.toLowerCase()) ||
      (b as any).customerName?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const groupedBills = filtered?.reduce((acc: any, bill: any) => {
    const d = formatDate(bill.createdAt);
    if (!acc[d]) acc[d] = [];
    acc[d].push(bill);
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/more")} className="text-primary p-1 -ml-1 hover:bg-slate-100 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[19px] text-primary">Bills History</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-primary p-2 hover:bg-slate-100 rounded-full active:scale-95 transition-transform">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-primary p-2 hover:bg-slate-100 rounded-full active:scale-95 transition-transform">
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {(["Today", "Yesterday", "This Week", "This Month"] as const).map((filter) => (
            <button
              key={filter}
              className={cn(
                "shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95",
                selectedFilter === filter ? "bg-primary text-white shadow-sm" : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Bar */}
      {filtered && (
        <div className="mx-4 grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Total",    value: formatCurrency(filtered.reduce((s, b) => s + (Number((b as any).totalAmount) - (Number((b as any).discountAmount) || 0)), 0)), color: "text-foreground" },
            { label: "Bills",    value: filtered.length, color: "text-primary" },
            { label: "Udhaar",   value: formatCurrency(filtered.reduce((s, b) => s + Number((b as any).udhaarAmount), 0)), color: "text-amber-600" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border p-3 text-center shadow-sm">
              <p className={cn("text-base font-bold", stat.color)}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bills List */}
      <div className="px-4 space-y-4 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border h-[80px] animate-pulse" />
            ))}
          </div>
        ) : !filtered?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border shadow-sm mt-2">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Receipt className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{search ? "No bills match your search" : "No bills yet"}</p>
          </div>
        ) : (
          Object.entries(groupedBills || {}).map(([date, dayBills]: [string, any]) => {
            const dailyTotal = dayBills.reduce((s: number, b: any) => s + (Number(b.totalAmount) - (Number(b.discountAmount) || 0)), 0);
            return (
              <div key={date} className="space-y-2">
                <div className="sticky top-14 z-30 bg-slate-50 py-2 flex items-center justify-between border-b border-slate-200">
                  <p className="text-sm font-bold text-slate-700">{date}</p>
                  <p className="text-sm font-bold text-primary">{formatCurrency(dailyTotal)}</p>
                </div>
                <div className="space-y-2">
                  {dayBills.map((bill: any) => {
                    const hasUdhaar = Number(bill.udhaarAmount) > 0;
                    const isCancelled = bill.status === "cancelled";

                    return (
                      <Link key={bill.id} href={`/bills/${bill.id}`} className="block active-elevate">
                        <div className="bg-white rounded-2xl border px-4 py-3 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              isCancelled ? "bg-red-50 text-red-500" : hasUdhaar ? "bg-amber-50 text-amber-500" : "bg-primary/10 text-primary"
                            )}>
                              <Receipt className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">#{bill.billNumber}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                {bill.customerName || "Walk-in"} · {(bill.items?.length || "?")} items
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                {formatTime(bill.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={cn("text-base font-bold", isCancelled ? "text-muted-foreground line-through" : hasUdhaar ? "text-amber-600" : "text-foreground")}>
                              {formatCurrency(Number(bill.totalAmount) - (Number(bill.discountAmount) || 0))}
                            </p>
                            {hasUdhaar && !isCancelled && (
                              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded bg-amber-50 inline-block border border-amber-100">
                                Udhaar {formatCurrency(Number(bill.udhaarAmount))}
                              </p>
                            )}
                            {isCancelled && (
                              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded bg-red-50 inline-block border border-red-100">Cancelled</p>
                            )}
                            {!hasUdhaar && !isCancelled && (
                              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded bg-emerald-50 inline-block border border-emerald-100">
                                {Number(bill.upiAmount) > 0 ? "UPI" : "CASH"} PAID
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Load Older */}
        {filtered && filtered.length > 0 && (
          <div className="flex flex-col items-center py-6 gap-2">
            <button className="text-primary font-bold text-sm flex items-center gap-1 active:scale-95 transition-transform bg-primary/10 px-4 py-2 rounded-full">
              Load Older History <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
