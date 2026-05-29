import { useState } from "react";
import { useListBills } from "@workspace/api-client-react";
import { Receipt, Search, Printer, ChevronRight, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { printReceipt } from "@/lib/receipt";
import PageHeader from "@/components/page-header";

export default function BillsHistory() {
  const [search, setSearch] = useState("");
  const { data: bills, isLoading } = useListBills();

  const filtered = bills?.filter(b => {
    if (!search) return true;
    return (
      b.billNumber?.toLowerCase().includes(search.toLowerCase()) ||
      (b as any).customerName?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleReprint = (bill: any) => {
    const now = new Date(bill.createdAt);
    printReceipt({
      billNumber: bill.billNumber,
      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      items: (bill.items || []).map((i: any) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: i.quantity * Number(i.unitPrice),
      })),
      subtotal: Number(bill.totalAmount),
      discountAmount: Number(bill.discountAmount) || 0,
      totalAmount: Number(bill.totalAmount) - (Number(bill.discountAmount) || 0),
      cashAmount: Number(bill.cashAmount) || 0,
      upiAmount: Number(bill.upiAmount) || 0,
      udhaarAmount: Number(bill.udhaarAmount) || 0,
      customerName: bill.customerName,
      notes: bill.notes,
      estimatedProfit: bill.estimatedProfit != null ? Number(bill.estimatedProfit) : null,
    });
  };

  const getPaymentBadge = (bill: any) => {
    const modes: string[] = [];
    if (Number(bill.cashAmount) > 0) modes.push("Cash");
    if (Number(bill.upiAmount) > 0) modes.push("UPI");
    if (Number(bill.udhaarAmount) > 0) modes.push("Udhaar");
    return modes;
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50/50">
      <PageHeader title="Bills History" subtitle="All transactions" backTo="/more" />

      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11 bg-background border-muted rounded-xl text-sm"
            placeholder="Search by bill number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 p-3 pb-24 space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : !filtered?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Receipt className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">{search ? "No bills match your search" : "No bills yet"}</p>
          </div>
        ) : (
          filtered.map(bill => {
            const b = bill as any;
            const modes = getPaymentBadge(b);
            const totalAmt = Number(b.totalAmount);
            const discount = Number(b.discountAmount) || 0;
            const finalAmt = totalAmt - discount;
            const profit = b.estimatedProfit != null ? Number(b.estimatedProfit) : null;
            const date = new Date(b.createdAt);

            return (
              <Card key={b.id} className="shadow-sm border-muted/60 overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm font-mono text-primary">#{b.billNumber}</span>
                          {b.customerName && (
                            <span className="text-xs text-muted-foreground truncate">{b.customerName}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(b.createdAt)}</span>
                          {b.createdAt && (
                            <span>· {formatTime(b.createdAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="font-bold text-base">{formatCurrency(finalAmt)}</div>
                        {discount > 0 && (
                          <div className="text-[10px] text-muted-foreground line-through">{formatCurrency(totalAmt)}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {modes.map(m => (
                        <Badge key={m} variant="outline" className={cn(
                          "text-[10px] h-5 px-1.5 font-medium",
                          m === "Udhaar" ? "border-amber-300 text-amber-700 bg-amber-50" :
                          m === "UPI" ? "border-blue-200 text-blue-700 bg-blue-50" :
                          "border-green-200 text-green-700 bg-green-50"
                        )}>
                          {m}
                        </Badge>
                      ))}
                      {profit != null && (
                        <Badge variant="outline" className={cn(
                          "text-[10px] h-5 px-1.5 font-medium ml-auto",
                          profit >= 0 ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-red-200 text-red-700 bg-red-50"
                        )}>
                          {profit >= 0 ? "+" : ""}{formatCurrency(profit)} profit
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-muted/50 flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-9 rounded-none text-xs text-muted-foreground gap-1.5 hover:bg-muted/50"
                      onClick={() => handleReprint(b)}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Reprint
                    </Button>
                    <div className="w-px bg-muted/50" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-9 rounded-none text-xs text-muted-foreground gap-1.5 hover:bg-muted/50"
                    >
                      View Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
