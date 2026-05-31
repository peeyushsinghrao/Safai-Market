import { useParams, useLocation } from "wouter";
import { useGetBill } from "@workspace/api-client-react";
import { Receipt, Calendar, Printer, Share2, MessageCircle, Mail, ChevronLeft, X, Download } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { printReceipt, downloadReceiptAsFile } from "@/lib/receipt";
import { useSettingsStore } from "@/stores/settings";
import { cn } from "@/lib/utils";

function generateShareText(bill: any, storeName: string): string {
  const items = (bill.items || [])
    .map((i: any) => `${i.productName} × ${Number(i.quantity)} — ${formatCurrency(Number(i.quantity) * Number(i.unitPrice))}`)
    .join("\n");
  const finalAmt = Number(bill.totalAmount) - (Number(bill.discountAmount) || 0);
  return [
    `*Bill from ${storeName}*`,
    `Bill No: #${bill.billNumber}`,
    `Date: ${new Date(bill.createdAt).toLocaleDateString("en-IN")}`,
    bill.customerName ? `Customer: ${bill.customerName}` : "",
    ``,
    items,
    ``,
    `*Total: ${formatCurrency(finalAmt)}*`,
    Number(bill.cashAmount) > 0 ? `Cash: ${formatCurrency(Number(bill.cashAmount))}` : "",
    Number(bill.upiAmount) > 0 ? `UPI: ${formatCurrency(Number(bill.upiAmount))}` : "",
    Number(bill.udhaarAmount) > 0 ? `Udhaar: ${formatCurrency(Number(bill.udhaarAmount))}` : "",
    ``,
    `Thank you for shopping!`,
  ].filter(Boolean).join("\n");
}

function ShareSheet({ bill, storeName, onClose }: { bill: any; storeName: string; onClose: () => void }) {
  const text = generateShareText(bill, storeName);
  const encoded = encodeURIComponent(text);
  const phone = bill.customerPhone?.replace(/\D/g, "");

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3 border-b">
          <h2 className="font-bold text-base">Share Bill #{bill.billNumber}</h2>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => window.open(phone ? `whatsapp://send?phone=91${phone}&text=${encoded}` : `whatsapp://send?text=${encoded}`, "_blank")}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-green-50 border-green-200 active:scale-95 transition-transform"
            >
              <MessageCircle className="w-6 h-6 text-green-600" />
              <span className="text-xs font-semibold text-green-700">WhatsApp</span>
            </button>
            <button
              onClick={() => window.open(`https://t.me/share/url?url=&text=${encoded}`, "_blank")}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-blue-50 border-blue-200 active:scale-95 transition-transform"
            >
              <MessageCircle className="w-6 h-6 text-blue-500" />
              <span className="text-xs font-semibold text-blue-600">Telegram</span>
            </button>
            <button
              onClick={() => {
                const subject = encodeURIComponent(`Bill from ${storeName} — #${bill.billNumber}`);
                const to = bill.customerEmail ? encodeURIComponent(bill.customerEmail) : "";
                window.open(`mailto:${to}?subject=${subject}&body=${encoded}`, "_blank");
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-gray-50 border-gray-200 active:scale-95 transition-transform"
            >
              <Mail className="w-6 h-6 text-gray-600" />
              <span className="text-xs font-semibold text-gray-700">Email</span>
            </button>
          </div>
          {navigator.share && (
            <Button variant="outline" className="w-full h-11 gap-2" onClick={() => navigator.share({ title: `Bill #${bill.billNumber}`, text }).catch(() => {})}>
              <Share2 className="w-4 h-4" />
              More options...
            </Button>
          )}
          <Button variant="ghost" className="w-full h-10 text-muted-foreground" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>
  );
}

export default function BillDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [shareOpen, setShareOpen] = useState(false);
  const { settings } = useSettingsStore();
  const storeName = settings.storeName;

  const { data: bill, isLoading } = useGetBill(Number(id));

  const buildReceiptData = () => {
    if (!bill) return null;
    const now = new Date(bill.createdAt);
    return {
      storeName,
      billNumber: bill.billNumber,
      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      items: ((bill as any).items || []).map((i: any) => ({
        productName: i.productName,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.quantity) * Number(i.unitPrice),
      })),
      subtotal: Number(bill.totalAmount),
      discountAmount: Number(bill.discountAmount) || 0,
      totalAmount: Number(bill.totalAmount) - (Number(bill.discountAmount) || 0),
      cashAmount: Number(bill.cashAmount) || 0,
      upiAmount: Number(bill.upiAmount) || 0,
      udhaarAmount: Number(bill.udhaarAmount) || 0,
      customerName: (bill as any).customerName,
      notes: bill.notes ?? undefined,
      storeLogo: settings.logoUrl,
    };
  };

  const handlePrint = () => {
    const d = buildReceiptData();
    if (d) printReceipt(d);
  };

  const handleDownload = () => {
    const d = buildReceiptData();
    if (d) downloadReceiptAsFile(d);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50/50">
        <div className="h-14 bg-primary" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50/50">
        <div className="h-14 bg-primary flex items-center px-4 gap-3">
          <button onClick={() => setLocation("/bills")} className="text-primary-foreground">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-primary-foreground font-bold text-lg">Bill Not Found</span>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 text-center text-muted-foreground py-16">
          <Receipt className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm">This bill does not exist.</p>
        </div>
      </div>
    );
  }

  const b = bill as any;
  const items: any[] = b.items || [];
  const totalAmt = Number(b.totalAmount);
  const discount = Number(b.discountAmount) || 0;
  const finalAmt = totalAmt - discount;
  const profit = b.estimatedProfit != null ? Number(b.estimatedProfit) : null;

  const paymentModes: { label: string; amount: number; color: string }[] = [
    ...(Number(b.cashAmount) > 0 ? [{ label: "Cash", amount: Number(b.cashAmount), color: "text-green-700" }] : []),
    ...(Number(b.upiAmount) > 0 ? [{ label: "UPI", amount: Number(b.upiAmount), color: "text-blue-700" }] : []),
    ...(Number(b.udhaarAmount) > 0 ? [{ label: "Udhaar", amount: Number(b.udhaarAmount), color: "text-amber-700" }] : []),
  ];

  const isCancelled = b.status === "cancelled";

  return (
    <div className="flex flex-col min-h-full bg-gray-50/50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground h-14 flex items-center px-4 gap-3 shadow-sm">
        <button onClick={() => setLocation("/bills")} className="text-primary-foreground p-1 -ml-1">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-tight">Bill #{b.billNumber}</h1>
          {b.customerName && <p className="text-xs text-primary-foreground/70 truncate">{b.customerName}</p>}
        </div>
        {isCancelled && (
          <Badge className="bg-red-500/20 text-red-100 border-red-400/30 text-[10px]">Cancelled</Badge>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Bill Meta */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(b.createdAt)}</span>
                <span>·</span>
                <span>{formatTime(b.createdAt)}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{formatCurrency(finalAmt)}</div>
                {discount > 0 && (
                  <div className="text-xs text-muted-foreground line-through">{formatCurrency(totalAmt)}</div>
                )}
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="flex flex-wrap gap-2 mt-2">
              {paymentModes.map(pm => (
                <div key={pm.label} className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                  pm.label === "Udhaar" ? "bg-amber-50 text-amber-700" :
                  pm.label === "UPI" ? "bg-blue-50 text-blue-700" :
                  "bg-green-50 text-green-700"
                )}>
                  <span>{pm.label}</span>
                  <span className="font-bold">{formatCurrency(pm.amount)}</span>
                </div>
              ))}
              {profit != null && (
                <div className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ml-auto",
                  profit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                )}>
                  <span>{profit >= 0 ? "+" : ""}{formatCurrency(profit)} profit</span>
                </div>
              )}
            </div>

            {b.cancelReason && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-100 p-2.5 text-xs text-red-700">
                <strong>Cancelled:</strong> {b.cancelReason}
              </div>
            )}
            {b.notes && (
              <div className="mt-3 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
                <strong>Note:</strong> {b.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">Items ({items.length})</h3>
            </div>
            <div className="divide-y divide-muted/40">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{item.productName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {Number(item.quantity)} × {formatCurrency(Number(item.unitPrice))}
                      {Number(item.discountAmount) > 0 && (
                        <span className="text-amber-600"> − {formatCurrency(Number(item.discountAmount))} disc</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-semibold text-sm">{formatCurrency(Number(item.totalPrice))}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-muted/50 px-4 py-3 space-y-1.5">
              {discount > 0 && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totalAmt)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-amber-700">
                    <span>Discount</span>
                    <span>−{formatCurrency(discount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-muted/40">
                <span>Total</span>
                <span>{formatCurrency(finalAmt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12 gap-2 rounded-xl font-semibold" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button variant="outline" className="flex-1 h-12 gap-2 rounded-xl font-semibold" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button variant="outline" className="flex-1 h-12 gap-2 rounded-xl font-semibold" onClick={() => setShareOpen(true)}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {shareOpen && (
        <ShareSheet bill={b} storeName={storeName} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}
