import { useState } from "react";
import { Download, Package, Receipt, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListProducts, useListBills, useListCustomers } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { exportProductsCSV, exportBillsCSV, exportCustomersCSV } from "@/lib/csv-export";
import PageHeader from "@/components/page-header";
import { FormCard } from "@/components/form-card";
import { cn } from "@/lib/utils";

type ExportType = "products" | "bills" | "customers";

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
];

export default function ExportPage() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [done, setDone] = useState<ExportType[]>([]);

  const { data: products } = useListProducts({ status: "active", limit: 10000 } as any);
  const { data: bills } = useListBills({ limit: 10000 } as any);
  const { data: customers } = useListCustomers({ limit: 10000 } as any);

  const handleExport = async (type: ExportType) => {
    setExporting(type);
    try {
      await new Promise(r => setTimeout(r, 300));
      if (type === "products") {
        if (!products?.length) { toast({ title: "No products to export", variant: "destructive" }); return; }
        exportProductsCSV(products);
      } else if (type === "bills") {
        if (!bills?.length) { toast({ title: "No bills to export", variant: "destructive" }); return; }
        exportBillsCSV(bills);
      } else if (type === "customers") {
        if (!customers?.length) { toast({ title: "No customers to export", variant: "destructive" }); return; }
        exportCustomersCSV(customers);
      }
      setDone(prev => [...prev.filter(d => d !== type), type]);
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} exported!`, description: "Check your Downloads folder." });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Backup & Export" subtitle="Download your data as CSV" backTo="/more" />

      <div className="p-4 space-y-4 pb-24">
        <FormCard title="Export Data">
          <p className="text-xs text-muted-foreground -mt-1 mb-3">
            CSV files open in Excel, Google Sheets, or any spreadsheet app.
            Download to keep a local backup of your data.
          </p>

          <div className="space-y-3">
            {EXPORT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isDone = done.includes(opt.key);
              const isExporting = exporting === opt.key;

              return (
                <div key={opt.key}
                  className="flex items-center gap-3 bg-white rounded-xl border border-muted/50 p-4"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", opt.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.sub}</p>
                  </div>
                  <Button
                    variant={isDone ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleExport(opt.key)}
                    disabled={isExporting}
                    className="h-9 gap-1.5 rounded-xl text-xs shrink-0"
                  >
                    {isExporting ? (
                      "..."
                    ) : isDone ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Done</>
                    ) : (
                      <><Download className="w-3.5 h-3.5" /> Export</>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </FormCard>

        <FormCard title="How to use exports">
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>📊 <strong>Google Sheets:</strong> Open Sheets → File → Import → Upload the CSV</p>
            <p>📑 <strong>Excel:</strong> Double-click the downloaded CSV file</p>
            <p>💾 <strong>Backup:</strong> Export monthly and save to Google Drive</p>
            <p>⚠️ <strong>Note:</strong> Exports contain all shop data. Keep files secure.</p>
          </div>
        </FormCard>
      </div>
    </div>
  );
}
