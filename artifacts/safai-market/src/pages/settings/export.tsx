import { useState } from "react";
import { Download, Package, Receipt, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListProducts, useListBills, useListCustomers, useListPurchases } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { exportProductsCSV, exportBillsCSV, exportCustomersCSV, exportPurchasesCSV } from "@/lib/csv-export";
import PageHeader from "@/components/page-header";
import { FormCard } from "@/components/form-card";
import { cn } from "@/lib/utils";

type ExportType = "products" | "bills" | "customers" | "purchases";

const EXPORT_OPTIONS = [
  {
    key: "products" as ExportType,
    label: "Products",
    sub: "All products with price, stock, GST, barcode",
    icon: Package,
    color: "bg-blue-100 text-blue-700",
  },
  {
    key: "bills" as ExportType,
    label: "Bills",
    sub: "All bills with amount, customer, payment mode",
    icon: Receipt,
    color: "bg-green-100 text-green-700",
  },
  {
    key: "customers" as ExportType,
    label: "Customers",
    sub: "All customers with udhaar balance and contact",
    icon: Users,
    color: "bg-purple-100 text-purple-700",
  },
  {
    key: "purchases" as ExportType,
    label: "Purchases",
    sub: "All purchases with supplier and amount",
    icon: Package,
    color: "bg-orange-100 text-orange-700",
  },
];

export default function ExportPage() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [done, setDone] = useState<ExportType[]>([]);
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const { data: products } = useListProducts({ status: "active", limit: 10000 } as any);
  const { data: bills } = useListBills({ limit: 10000 } as any);
  const { data: customers } = useListCustomers({ limit: 10000 } as any);
  const { data: purchases } = useListPurchases({ limit: 10000 } as any);

  const handleExport = async (type: ExportType) => {
    setExporting(type);
    try {
      await new Promise(r => setTimeout(r, 300));
      if (type === "products") {
        if (!products?.length) { toast({ title: "No products to export", variant: "destructive" }); return; }
        exportProductsCSV(products);
      } else if (type === "bills") {
        if (!bills?.length) { toast({ title: "No bills to export", variant: "destructive" }); return; }
        const filtered = bills.filter(b => b.createdAt.startsWith(selectedMonth));
        if (!filtered.length) { toast({ title: "No bills for selected month", variant: "destructive" }); return; }
        exportBillsCSV(filtered);
      } else if (type === "customers") {
        if (!customers?.length) { toast({ title: "No customers to export", variant: "destructive" }); return; }
        exportCustomersCSV(customers);
      } else if (type === "purchases") {
        if (!purchases?.length) { toast({ title: "No purchases to export", variant: "destructive" }); return; }
        const filtered = purchases.filter(p => p.createdAt.startsWith(selectedMonth));
        if (!filtered.length) { toast({ title: "No purchases for selected month", variant: "destructive" }); return; }
        exportPurchasesCSV(filtered);
      }
      setDone(prev => [...prev.filter(d => d !== type), type]);
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} exported!`, description: "Check your Downloads folder." });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans">
      <PageHeader title="Backup & Export" subtitle="Download your data as CSV" backTo="/more" />

      <div className="p-4 space-y-4 pb-24">
        <FormCard title="Export Data">
          <p className="text-xs text-muted-foreground -mt-1 mb-3">
            CSV files open in Excel, Google Sheets, or any spreadsheet app.
            Download to keep a local backup of your data.
          </p>

          <div className="mb-4">
            <label className="text-[13px] font-bold text-slate-500 mb-1.5 block">Month to Export (Bills/Purchases)</label>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="h-14 w-full rounded-2xl border border-slate-300 px-4 text-[15px] focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-3">
            {EXPORT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isDone = done.includes(opt.key);
              const isExporting = exporting === opt.key;

              return (
                <div key={opt.key}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", opt.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-slate-800">{opt.label}</p>
                    <p className="text-[12px] font-medium text-slate-500 mt-0.5">{opt.sub}</p>
                  </div>
                  <Button
                    variant={isDone ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleExport(opt.key)}
                    disabled={isExporting}
                    className={cn(
                      "h-10 px-4 rounded-xl text-[13px] font-bold shrink-0 transition-transform active-elevate",
                      isDone ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : ""
                    )}
                  >
                    {isExporting ? (
                      "..."
                    ) : isDone ? (
                      <><CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" /> Done</>
                    ) : (
                      <><Download className="w-4 h-4 mr-1.5" /> Export</>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </FormCard>

        <FormCard title="How to use exports">
          <div className="space-y-3 text-[13px] font-medium text-slate-500 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="flex gap-2"><span className="text-xl">📊</span> <span><strong className="text-slate-700 font-bold">Google Sheets:</strong> Open Sheets → File → Import → Upload the CSV</span></p>
            <p className="flex gap-2"><span className="text-xl">📑</span> <span><strong className="text-slate-700 font-bold">Excel:</strong> Double-click the downloaded CSV file</span></p>
            <p className="flex gap-2"><span className="text-xl">💾</span> <span><strong className="text-slate-700 font-bold">Backup:</strong> Export monthly and save to Google Drive</span></p>
            <p className="flex gap-2"><span className="text-xl">⚠️</span> <span><strong className="text-amber-600 font-bold">Note:</strong> Exports contain all shop data. Keep files secure.</span></p>
          </div>
        </FormCard>
      </div>
    </div>
  );
}
