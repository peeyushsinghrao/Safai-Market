import { useParams, useLocation } from "wouter";
import { useGetBill } from "@workspace/api-client-react";
import { ArrowLeft, User, Printer, Share2, Download, Smartphone, BookOpen, Banknote } from "lucide-react";
import { useState } from "react";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { printReceipt, downloadReceiptAsFile } from "@/lib/receipt";
import { useSettingsStore } from "@/stores/settings";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function BillDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { settings } = useSettingsStore();
  const storeName = settings.storeName || "Store Name";
  const { toast } = useToast();

  const { data: bill, isLoading, refetch } = useGetBill(Number(id));
  const [isPrinting, setIsPrinting] = useState(false);

  const buildReceiptData = (freshBill: any) => {
    if (!freshBill) return null;
    const now = new Date(freshBill.createdAt);
    return {
      storeName,
      billNumber: freshBill.billNumber,
      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      items: ((freshBill as any).items || []).map((i: any) => ({
        productName: i.productName,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.quantity) * Number(i.unitPrice),
      })),
      subtotal: Number(freshBill.totalAmount),
      discountAmount: Number(freshBill.discountAmount) || 0,
      totalAmount: Number(freshBill.totalAmount) - (Number(freshBill.discountAmount) || 0),
      cashAmount: Number(freshBill.cashAmount) || 0,
      upiAmount: Number(freshBill.upiAmount) || 0,
      udhaarAmount: Number(freshBill.udhaarAmount) || 0,
      customerName: (freshBill as any).customerName,
      notes: freshBill.notes ?? undefined,
      storeLogo: settings.logoUrl,
    };
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const res = await refetch();
      if (!res.data) throw new Error("Could not fetch bill data");
      const d = buildReceiptData(res.data);
      if (d) printReceipt(d);
    } catch (err: any) {
      toast({ title: "Print Error", description: err.message, variant: "destructive" });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await refetch();
      const d = buildReceiptData(res.data);
      if (d) downloadReceiptAsFile(d);
    } catch {}
  };

  const handleShare = () => {
    if (!bill) return;
    const b = bill as any;
    const items = (b.items || [])
      .map((i: any) => `${i.productName} × ${Number(i.quantity)} — ${formatCurrency(Number(i.quantity) * Number(i.unitPrice))}`)
      .join("\n");
    const finalAmt = Number(b.totalAmount) - (Number(b.discountAmount) || 0);
    const text = [
      `*Bill from ${storeName}*`,
      `Bill No: #${b.billNumber}`,
      `Date: ${new Date(b.createdAt).toLocaleDateString("en-IN")}`,
      b.customerName ? `Customer: ${b.customerName}` : "",
      ``, items, ``,
      `*Total: ${formatCurrency(finalAmt)}*`,
    ].filter(Boolean).join("\n");
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="bg-slate-50 font-sans min-h-full p-4 space-y-4">
        <div className="h-14 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex flex-col min-h-full bg-slate-50 font-sans">
        <div className="sticky top-0 z-40 bg-white border-b border-muted/50 h-14 flex items-center px-4 gap-3 shadow-sm">
          <button onClick={() => setLocation("/bills")} className="text-muted-foreground transition-all active-elevate"><ArrowLeft className="w-6 h-6" /></button>
          <span className="font-bold text-foreground">Bill Not Found</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground py-16">
          <div className="text-center">
            <span className="text-4xl opacity-50 mb-2 block">🧾</span>
            <p>Could not find this bill.</p>
          </div>
        </div>
      </div>
    );
  }

  const b = bill as any;
  const isCancelled = b.status === "cancelled";

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans">
      {/* Header Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-muted/50 shadow-sm">
        <div className="flex items-center px-4 h-14 gap-3">
          <button onClick={() => setLocation("/bills")} className="text-muted-foreground p-1 -ml-1 hover:bg-slate-100 rounded-full transition-all active-elevate">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="font-bold text-[17px] text-foreground">Bill Detail</span>
        </div>
      </div>

      <div className="flex-1 pb-4">
        <div className="mx-4 mt-4 bg-white rounded-3xl border border-muted/50 shadow-sm overflow-hidden relative">
          {/* Top zig-zag edge for receipt feel could go here, but rounded-3xl is fine */}
          
          {/* Receipt header — centered, like a real receipt */}
          <div className="px-6 py-5 text-center border-b border-dashed border-muted">
            {settings.storeName && (
              <p className="text-lg font-bold tracking-wide text-foreground">{settings.storeName}</p>
            )}
            {settings.address && (
              <p className="text-xs text-muted-foreground mt-0.5">{settings.address}</p>
            )}
            {settings.phone && (
              <p className="text-xs text-muted-foreground">{settings.phone}</p>
            )}
            {settings.gstNumber && (
              <p className="text-xs text-muted-foreground font-mono mt-1">GSTIN: {settings.gstNumber}</p>
            )}

            <div className="mt-4 mb-1">
              <span className={cn(
                "text-xs font-bold px-3 py-1 rounded-full",
                isCancelled ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
              )}>
                {isCancelled ? "CANCELLED" : "PAID"}
              </span>
            </div>

            <p className="text-xl font-bold font-mono tracking-wider mt-2 text-foreground">
              {b.billNumber}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(b.createdAt)} · {formatTime(b.createdAt)}
            </p>
            {b.customerName && (
              <div className="flex items-center justify-center gap-1.5 mt-2 text-foreground">
                <User className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">{b.customerName}</p>
              </div>
            )}
          </div>

          {/* Items List — Receipt Style */}
          <div className="px-5 py-4 space-y-3">
            {b.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight text-foreground truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatCurrency(Number(item.unitPrice))} × {Number(item.quantity)}
                    {Number(item.discountAmount) > 0 && (
                      <span className="text-red-500 ml-1.5">
                        (-{formatCurrency(Number(item.discountAmount))})
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-sm font-bold shrink-0 text-foreground">
                  {formatCurrency(Number(item.totalPrice))}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-muted mx-5" />

          {/* Totals Section */}
          <div className="px-5 py-4 space-y-2">
            {Number(b.discountAmount) > 0 && (
              <>
                <div className="flex justify-between text-sm text-foreground">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(Number(b.totalAmount) + Number(b.discountAmount))}</span>
                </div>
                <div className="flex justify-between text-sm text-foreground">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-red-500">-{formatCurrency(Number(b.discountAmount))}</span>
                </div>
                <div className="h-px bg-muted my-2" />
              </>
            )}
            <div className="flex justify-between text-base font-bold text-foreground">
              <span>Total</span>
              <span>{formatCurrency(Number(b.totalAmount))}</span>
            </div>

            {/* Payment breakdown */}
            <div className="h-px bg-muted my-2" />
            <div className="space-y-1.5 pt-1">
              {Number(b.cashAmount) > 0 && (
                <div className="flex justify-between text-sm text-foreground">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Banknote className="w-3.5 h-3.5" /> Cash
                  </span>
                  <span className="font-medium">{formatCurrency(Number(b.cashAmount))}</span>
                </div>
              )}
              {Number(b.upiAmount) > 0 && (
                <div className="flex justify-between text-sm text-foreground">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Smartphone className="w-3.5 h-3.5" /> UPI
                  </span>
                  <span className="font-medium">{formatCurrency(Number(b.upiAmount))}</span>
                </div>
              )}
              {Number(b.udhaarAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                    <BookOpen className="w-3.5 h-3.5" /> Udhaar
                  </span>
                  <span className="text-amber-600 font-bold">
                    {formatCurrency(Number(b.udhaarAmount))}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom receipt edge pattern can be faked with border */}
        </div>
      </div>

      {/* Sticky bottom action bar */}
      <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 z-50">
        <div className="flex gap-3">
          <button 
            className="flex-1 flex flex-col items-center justify-center gap-1.5 h-16 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 active-elevate transition-colors text-slate-700"
            onClick={handleShare}>
            <Share2 className="w-5 h-5" /> 
            <span className="text-xs font-bold">Share</span>
          </button>
          <button 
            className="flex-1 flex flex-col items-center justify-center gap-1.5 h-16 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 active-elevate transition-colors text-slate-700"
            onClick={handlePrint}
            disabled={isPrinting}>
            <Printer className="w-5 h-5" /> 
            <span className="text-xs font-bold">{isPrinting ? "Printing..." : "Reprint"}</span>
          </button>
          <button 
            className="flex-[1.2] flex flex-col items-center justify-center gap-1.5 h-16 rounded-2xl border border-primary/20 bg-primary/10 hover:bg-primary/20 active-elevate transition-colors text-primary"
            onClick={() => toast({ title: "Coming soon", description: "Return items feature will be available shortly." })}>
            <ArrowLeft className="w-5 h-5 -scale-x-100" /> {/* Flip arrow to look like return */}
            <span className="text-xs font-bold">Return</span>
          </button>
        </div>
      </div>
    </div>
  );
}
