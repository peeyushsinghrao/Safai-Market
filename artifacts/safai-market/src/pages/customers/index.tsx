import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListCustomers } from "@workspace/api-client-react";
import { Search, UserPlus, Phone, Clock, Mail, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const filterTabs = ["All", "With Udhaar", "Regulars", "Recent"] as const;
type FilterTab = (typeof filterTabs)[number];

export default function CustomersList() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [, setLocation] = useLocation();
  const { data: customers, isLoading } = useListCustomers({
    search: search.length >= 2 ? search : undefined,
  });

  const filteredCustomers = customers?.filter((c) => {
    if (activeFilter === "With Udhaar") return Number(c.udhaarBalance) > 0;
    return true;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColors = (name: string) => {
    const colors = [
      { bg: "bg-[#38bdf8]", text: "text-white" },
      { bg: "bg-[#f472b6]", text: "text-white" },
      { bg: "bg-[#a78bfa]", text: "text-white" },
      { bg: "bg-[#fb923c]", text: "text-white" },
      { bg: "bg-[#34d399]", text: "text-white" },
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-20">
      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            className="w-full pl-11 pr-4 h-14 rounded-2xl border bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground shadow-sm"
            placeholder="Search customer or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              className={cn(
                "shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap active:scale-95",
                activeFilter === tab
                  ? "bg-primary text-white shadow-sm"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              onClick={() => setActiveFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="flex-1 px-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border h-[100px] animate-pulse" />
            ))}
          </div>
        ) : filteredCustomers?.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-muted-foreground text-[15px]">No customers found.</p>
          </div>
        ) : (
          filteredCustomers?.map((customer) => {
            const udhaar = Number(customer.udhaarBalance);
            const hasUdhaar = udhaar > 0;
            const colors = getAvatarColors(customer.name);
            const borderColor = hasUdhaar ? "border-red-200" : "border-primary/20";

            return (
              <Link key={customer.id} href={`/customers/${customer.id}`} className="block active-elevate">
                <div className="bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-lg font-bold border-2",
                      colors.bg,
                      colors.text,
                      borderColor
                    )}
                  >
                    {getInitials(customer.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-base font-bold text-slate-900 truncate">{customer.name}</p>
                      {/* Badge */}
                      {hasUdhaar ? (
                        <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-100 shrink-0 whitespace-nowrap">
                          ₹ {udhaar.toLocaleString("en-IN")} Owed
                        </span>
                      ) : (
                        <span className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-green-100 shrink-0">
                          Settled
                        </span>
                      )}
                    </div>
                    {customer.phone && (
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                        <Phone className="w-3.5 h-3.5" />
                        {customer.phone}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Last visit: Recently
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 right-5 z-40">
        <Link href="/customers/new" className="active-elevate block">
          <button className="w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </button>
        </Link>
      </div>
    </div>
  );
}
