import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Check,
  Printer,
  Share,
  FileText,
  ArrowLeft,
  Banknote
} from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import { formatCurrency } from "@/lib/format";
import { printReceipt, downloadReceiptAsFile } from "@/lib/receipt";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface BillResult {
  billNumber: string;
  profit: number | null;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  cashAmount: number;
  upiAmount: number;
  udhaarAmount: number;
  customerName?: string;
  notes?: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  gstBreakdown?: {
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    isInterState: boolean;
  };
  storeGstNumber?: string;
  showGst?: boolean;
}

export default function CheckoutSuccess() {
  const [, navigate] = useLocation();
  const { settings } = useSettingsStore();
  const [bill, setBill] = useState<BillResult | null>(null);

  // Load bill from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("safai-last-bill");
      if (stored) {
        setBill(JSON.parse(stored));
        sessionStorage.removeItem("safai-last-bill");
      }
    } catch {}
  }, []);

  // Play success sound on mount
  useEffect(() => {
    playSound("billSuccess");
  }, []);

  // If no bill data, redirect
  if (!bill) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center">
          <div className="w-[80px] h-[80px] rounded-full bg-primary mx-auto flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-primary-foreground" strokeWidth={3} />
          </div>
          <p className="text-primary font-bold text-[24px]">Bill Created!</p>
          <button
            className="mt-6 h-[48px] px-6 border-2 border-muted-foreground/30 rounded-2xl font-bold text-foreground flex items-center justify-center gap-2 mx-auto transition-all active-elevate"
            onClick={() => navigate("/billing")}
          >
            <ArrowLeft className="w-5 h-5" /> Back to Billing
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    const now = new Date();
    printReceipt({
      storeName: settings.storeName,
      billNumber: bill.billNumber,
      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      items: bill.items,
      subtotal: bill.subtotal,
      discountAmount:
        bill.discountAmount > 0 ? bill.discountAmount : undefined,
      totalAmount: bill.totalAmount,
      cashAmount: bill.cashAmount,
      upiAmount: bill.upiAmount,
      udhaarAmount: bill.udhaarAmount,
      customerName: bill.customerName,
      notes: bill.notes,
      estimatedProfit: bill.profit,
      gstBreakdown: bill.gstBreakdown,
      showGst: bill.showGst,
      storeGstNumber: bill.storeGstNumber,
      storeAddress: settings.address,
      storePhone: settings.phone,
      paperSize: settings.paperSize,
    });
  };

  const handleShare = () => {
    const lines = [
      `*Bill from ${settings.storeName}*`,
      `Bill No: ${bill.billNumber}`,
      ``,
      ...bill.items.map(
        (i) =>
          `${i.productName} × ${i.quantity} — ${formatCurrency(i.totalPrice)}`
      ),
      ``,
      `*Total: ${formatCurrency(bill.totalAmount)}*`,
      bill.cashAmount > 0 ? `Cash: ${formatCurrency(bill.cashAmount)}` : "",
      bill.upiAmount > 0 ? `UPI: ${formatCurrency(bill.upiAmount)}` : "",
      bill.udhaarAmount > 0
        ? `Udhaar: ${formatCurrency(bill.udhaarAmount)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const encoded = encodeURIComponent(lines);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handleDownload = () => {
    const now = new Date();
    downloadReceiptAsFile({
      storeName: settings.storeName,
      billNumber: bill.billNumber,
      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      items: bill.items,
      subtotal: bill.subtotal,
      discountAmount:
        bill.discountAmount > 0 ? bill.discountAmount : undefined,
      totalAmount: bill.totalAmount,
      cashAmount: bill.cashAmount,
      upiAmount: bill.upiAmount,
      udhaarAmount: bill.udhaarAmount,
      customerName: bill.customerName,
      notes: bill.notes,
    });
  };

  const handleBackToBilling = () => {
    navigate("/billing");
  };

  const getPrimaryPaymentMethod = () => {
    if (bill.upiAmount > 0) return "UPI";
    if (bill.cashAmount > 0) return "Cash";
    if (bill.udhaarAmount > 0) return "Udhaar";
    return "Unknown";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-16 px-6 relative overflow-hidden font-sans">
      {/* Background decoration elements */}
      <div className="absolute bottom-[-100px] right-[-50px] w-[300px] h-[300px] bg-muted/50 rounded-full blur-[40px] pointer-events-none" />
      <div className="absolute bottom-[-50px] left-[-100px] w-[250px] h-[250px] bg-green-100/50 rounded-full blur-[40px] pointer-events-none" />

      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-[100px] h-[100px] bg-primary rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/20 z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
        >
          <div className="w-[44px] h-[44px] rounded-full border-4 border-primary-foreground flex items-center justify-center">
             <Check className="w-6 h-6 text-primary-foreground" strokeWidth={4} />
          </div>
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-[28px] font-bold text-primary mb-2 z-10"
      >
        Bill Created!
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase mb-8 z-10 border border-primary/20"
      >
        {bill.billNumber}
      </motion.div>

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-primary rounded-3xl w-full max-w-sm p-6 text-primary-foreground shadow-xl z-10 mb-8"
      >
        <div className="flex justify-between items-start mb-1">
          <p className="text-primary-foreground/80 text-[13px] font-bold tracking-wider uppercase mt-1">
            Total Amount
          </p>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
             <Banknote className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
        
        <p className="text-[42px] font-bold leading-none tracking-tight mb-6">
          {formatCurrency(bill.totalAmount)}
        </p>
        
        <div className="h-[1px] bg-white/20 w-full mb-5" />

        <div className="grid grid-cols-2 gap-y-4">
          <div>
            <p className="text-primary-foreground/80 text-[13px] mb-1">Customer</p>
            <p className="font-bold text-[15px] truncate pr-2">
              {bill.customerName ? bill.customerName.length > 15 ? bill.customerName.substring(0, 15) + "..." : bill.customerName : "Walk-in"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-primary-foreground/80 text-[13px] mb-1">Payment</p>
            <p className="font-bold text-[15px] flex items-center justify-end gap-1">
              {getPrimaryPaymentMethod()} <Check className="w-3.5 h-3.5" />
            </p>
          </div>
          {bill.profit != null && (
            <div>
              <p className="text-primary-foreground/80 text-[13px] mb-1">Profit Earned</p>
              <p className="font-bold text-[15px]">{formatCurrency(bill.profit)}</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-primary-foreground/80 text-[13px] mb-1">Items</p>
            <p className="font-bold text-[15px]">{bill.items.length} Skus</p>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm grid grid-cols-3 gap-3 mb-6 z-10"
      >
        <button
          className="bg-primary/10 text-primary h-[80px] rounded-2xl flex flex-col items-center justify-center gap-2 transition-transform active-elevate"
          onClick={handlePrint}
          id="btn-print"
        >
          <Printer className="w-6 h-6" />
          <span className="text-[13px] font-bold">Print</span>
        </button>
        <button
          className="bg-primary/10 text-primary h-[80px] rounded-2xl flex flex-col items-center justify-center gap-2 transition-transform active-elevate"
          onClick={handleShare}
          id="btn-share"
        >
          <Share className="w-6 h-6" />
          <span className="text-[13px] font-bold">Share</span>
        </button>
        <button
          className="bg-primary/10 text-primary h-[80px] rounded-2xl flex flex-col items-center justify-center gap-2 transition-transform active-elevate"
          onClick={handleDownload}
          id="btn-download"
        >
          <FileText className="w-6 h-6" />
          <span className="text-[13px] font-bold">PDF</span>
        </button>
      </motion.div>

      {/* Back to Billing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full max-w-sm z-10"
      >
        <button
          className="w-full h-[56px] border border-foreground rounded-[12px] font-bold text-foreground text-[15px] flex items-center justify-center gap-2 transition-transform active-elevate mb-10"
          onClick={handleBackToBilling}
          id="btn-back-billing"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Billing
        </button>
      </motion.div>
    </div>
  );
}
