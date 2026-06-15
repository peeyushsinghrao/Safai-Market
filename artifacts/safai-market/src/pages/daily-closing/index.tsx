import { useState } from "react";
import { useLocation } from "wouter";
import {
  useGetTodayClosing,
  useCreateDailyClosing,
  useListDailyClosings,
  getGetTodayClosingQueryKey,
  getListDailyClosingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settings";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  QrCode,
  Receipt,
  TrendingUp,
  Banknote,
  Smartphone,
  Share,
  Lock,
  CheckCircle2,
  Copy,
  MessageCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DailyClosing() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading } = useGetTodayClosing();
  const { data: history } = useListDailyClosings();
  const createClosing = useCreateDailyClosing();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { settings } = useSettingsStore();

  const [actualCash, setActualCash] = useState("");
  const [notes, setNotes] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const isClosedToday = history?.some((h) => h.date.startsWith(now.toISOString().split("T")[0]));
  const todayClosing = history?.find((h) => h.date.startsWith(now.toISOString().split("T")[0]));

  const totalSales = Number(summary?.totalSales ?? 0);
  const totalExpenses = Number(summary?.totalExpenses ?? 0);
  const netRevenue = totalSales - totalExpenses;
  const cashSales = Number(summary?.cashSales ?? 0);
  const upiSales = Number(summary?.upiSales ?? 0);
  const billCount = Number(summary?.billCount ?? 0);
  const estimatedProfit = Number(summary?.estimatedProfit ?? 0);
  const udhaarSales = Number(summary?.udhaarSales ?? 0);

  const generateReportText = () => {
    const storeName = settings.storeName || "My Shop";
    return [
      `📊 *${storeName} — Daily Report*`,
      `📅 ${dateStr}`,
      ``,
      `💰 Net Revenue: ₹${netRevenue.toFixed(0)}`,
      `  Gross Sales: ₹${totalSales.toFixed(0)}`,
      `  Expenses: ₹${totalExpenses.toFixed(0)}`,
      ``,
      `📋 Bills: ${billCount}`,
      `📈 Est. Profit: ₹${estimatedProfit.toFixed(0)}`,
      `💵 Cash: ₹${cashSales.toFixed(0)}`,
      `📱 UPI: ₹${upiSales.toFixed(0)}`,
      ``,
      `_Sent from Safai Market_`,
    ].join("\n");
  };

  const handleShare = async () => {
    const msg = generateReportText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Daily Closing Report",
          text: msg
        });
        return;
      } catch (err) {
        console.error("Share failed", err);
      }
    }
    
    // Fallback if navigator.share fails or is undefined
    setIsShareModalOpen(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReportText());
    toast({ title: "Copied!", description: "Report copied to clipboard." });
    setIsShareModalOpen(false);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(generateReportText());
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
    setIsShareModalOpen(false);
  };

  const handleCloseDay = () => {
    if (!actualCash) return;
    const today = now.toISOString().split("T")[0];
    createClosing.mutate(
      {
        data: {
          date: today,
          actualCash: Number(actualCash),
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Day closed successfully!" });
          queryClient.invalidateQueries({ queryKey: getGetTodayClosingQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListDailyClosingsQueryKey() });
        },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/more")} className="text-primary p-1 -ml-1 hover:bg-slate-100 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[19px] text-primary">Daily Closing</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-slate-500">{dateStr}</span>
          </div>
        </div>
      </div>

      <div className="space-y-5 pb-6">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="h-[120px] bg-slate-200 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-[90px] bg-slate-200 rounded-2xl animate-pulse" />)}
            </div>
          </div>
        ) : (
          <>
            {/* Closed Today State */}
            {isClosedToday && todayClosing && (
              <div className="mx-4 mt-4 bg-emerald-50 rounded-2xl border border-emerald-200 p-5 text-center space-y-3 shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
                <p className="text-[18px] font-bold text-primary">Day Already Closed</p>
                <p className="text-[13px] text-emerald-700 font-medium">Closing done for {formatDate(todayClosing.date)}</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
                    <p className="text-[11px] text-slate-500 font-medium">Expected Cash</p>
                    <p className="text-[17px] font-bold text-slate-800">{formatCurrency(todayClosing.expectedCash)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
                    <p className="text-[11px] text-slate-500 font-medium">Actual Cash</p>
                    <p className="text-[17px] font-bold text-slate-800">{formatCurrency(todayClosing.actualCash)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Day summary — read only */}
            <div className="mx-4 mt-4 rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Today's Summary
                </p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-100">
                {[
                  { label: "Total Sales",    value: formatCurrency(totalSales),    color: "text-slate-800" },
                  { label: "Est. Profit",    value: formatCurrency(estimatedProfit), color: "text-emerald-600" },
                  { label: "Cash Sales",     value: formatCurrency(cashSales),     color: "text-slate-800" },
                  { label: "UPI Sales",      value: formatCurrency(upiSales),      color: "text-blue-600"   },
                  { label: "Udhaar Given",   value: formatCurrency(udhaarSales),   color: "text-amber-600"  },
                  { label: "Expenses",       value: formatCurrency(totalExpenses), color: "text-red-500"    },
                ].map((row, idx) => (
                  <div key={idx} className={cn(
                    "p-4 text-center",
                    idx % 2 === 0 && idx > 0 ? "border-t border-slate-100" : "",
                    idx % 2 === 1 && idx > 1 ? "border-t border-slate-100" : ""
                  )}>
                    <p className={cn("text-lg font-bold", row.color)}>{row.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{row.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash register — interactive */}
            {!isClosedToday && (
              <div className="mx-4 mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-4">
                <p className="text-sm font-bold text-slate-800">Cash Register Closing</p>

                {/* Expected */}
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <p className="text-sm text-slate-500 font-medium">Expected Cash</p>
                  <p className="text-base font-bold text-slate-800">{formatCurrency(summary?.expectedCash ?? 0)}</p>
                </div>

                {/* Actual input */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Actual Cash in Drawer
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                    <Input
                      type="number"
                      value={actualCash}
                      onChange={e => setActualCash(e.target.value)}
                      className="h-14 pl-8 text-2xl font-bold rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Live difference */}
                {actualCash && (
                  <div className={cn(
                    "flex justify-between items-center rounded-xl px-4 py-3 border",
                    Number(actualCash) >= (summary?.expectedCash ?? 0)
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  )}>
                    <p className={cn("text-sm font-semibold", Number(actualCash) >= (summary?.expectedCash ?? 0) ? "text-emerald-700" : "text-red-700")}>
                      {Number(actualCash) >= (summary?.expectedCash ?? 0) ? "Surplus" : "Shortage"}
                    </p>
                    <p className={cn("text-base font-bold",
                      Number(actualCash) >= (summary?.expectedCash ?? 0) ? "text-emerald-600" : "text-red-600"
                    )}>
                      {Number(actualCash) >= (summary?.expectedCash ?? 0) ? "+" : ""}
                      {formatCurrency(Number(actualCash) - (summary?.expectedCash ?? 0))}
                    </p>
                  </div>
                )}

                <Input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes (optional)..."
                  className="h-12 rounded-xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button variant="outline" className="h-14 gap-2 rounded-2xl font-bold border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active-elevate transition-transform"
                    onClick={() => handleShare()}>
                    <Share className="w-4 h-4" />
                    Share
                  </Button>
                  <Button className="h-14 gap-2 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white active-elevate transition-transform shadow-sm"
                    onClick={handleCloseDay}
                    disabled={!actualCash || createClosing.isPending}>
                    {createClosing.isPending ? "Saving..." : "Close Day"}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Share only button when closed */}
            {isClosedToday && (
              <div className="mx-4 mt-4">
                <Button className="w-full h-14 gap-2 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white active-elevate transition-transform shadow-sm"
                  onClick={() => handleShare()}>
                  <Share className="w-5 h-5" />
                  Share Daily Report
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="w-[90vw] max-w-sm rounded-2xl p-4">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-left text-lg font-bold">Share Summary</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <button
              onClick={handleWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-xl font-bold text-[15px] flex items-center gap-3 transition-colors active-elevate"
            >
              <div className="bg-white/20 p-2 rounded-full">
                <MessageCircle className="w-5 h-5 text-white fill-white" />
              </div>
              Share via WhatsApp
            </button>
            <button
              onClick={handleCopy}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 p-4 rounded-xl font-bold text-[15px] flex items-center gap-3 transition-colors active-elevate"
            >
              <div className="bg-white p-2 rounded-full shadow-sm">
                <Copy className="w-5 h-5 text-slate-500" />
              </div>
              Copy to Clipboard
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
