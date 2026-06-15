import { useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, QrCode, Phone, MapPin, Bell, Banknote, ArrowDownRight, ArrowUpRight, Receipt, Calendar, IndianRupee, CheckCircle2 } from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import {
  useGetCustomer,
  useReceiveCustomerPayment,
  getGetCustomerQueryKey,
  getListCustomersQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings } = useSettingsStore();

  const { data: customer, isLoading } = useGetCustomer(id, {
    query: { enabled: !!id, queryKey: getGetCustomerQueryKey(id) },
  });

  const receivePayment = useReceiveCustomerPayment();

  const handleUdhaarReminder = () => {
    if (!customer) return;
    const storeName = settings.storeName || "Our Shop";
    const balance = Number(customer.udhaarBalance ?? 0);
    if (balance <= 0) {
      toast({ title: "No outstanding balance", description: "This customer has no pending udhaar." });
      return;
    }
    const name = customer.name;
    const phone = customer.phone?.replace(/\D/g, "");
    const msg = [
      `Namaskar ${name} ji 🙏`,
      ``,
      `*${storeName}* se aapka udhaar reminder:`,
      ``,
      `💸 Outstanding Balance: *₹${balance.toFixed(0)}*`,
      ``,
      `Jab bhi suvidha ho, payment kar dijiye.`,
      `UPI / Cash dono accepted hain.`,
      ``,
      `Dhanyawad! 🙏`,
    ].join("\n");
    const encoded = encodeURIComponent(msg);
    if (phone) {
      window.open(`https://wa.me/91${phone}?text=${encoded}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    }
  };

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<"cash" | "upi">("cash");
  const [payNotes, setPayNotes] = useState("");

  const handlePayment = () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;

    receivePayment.mutate(
      {
        id,
        data: {
          amount,
          paymentMode: payMode,
          notes: payNotes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Payment received successfully" });
          setIsPaymentOpen(false);
          setPayAmount("");
          setPayNotes("");
          queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 bg-[#f8fafc] min-h-full">
        <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-40 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-60 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!customer) {
    return <div className="p-4 text-center text-slate-500">Customer not found.</div>;
  }

  const udhaar = Number(customer.udhaarBalance ?? 0);
  const hasUdhaar = udhaar > 0;
  
  // Extract all bills from ledger
  const customerBills = (customer.ledger as any[])?.filter(e => e.entryType === "debit") || [];
  
  // Lifetime value
  const lifetimeValue = customerBills.reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-muted/50 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/customers")}
              className="text-muted-foreground p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[19px] text-foreground">{customer.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocation(`/customers/${id}/edit`)}
              className="text-muted-foreground p-2 hover:bg-slate-100 hover:text-primary rounded-full transition-colors active:scale-95"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="pb-6">
        {/* Udhaar Hero — only shown when balance > 0 */}
        {hasUdhaar && (
          <div className="mx-4 mt-4 rounded-3xl bg-red-500 text-white p-5 shadow-xl shadow-red-500/30 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
            <p className="text-red-100 text-xs font-semibold uppercase tracking-wider mb-1">
              Outstanding Udhaar
            </p>
            <p className="text-4xl font-bold mb-4 relative z-10">
              {formatCurrency(udhaar)}
            </p>
            <div className="grid grid-cols-2 gap-2 relative z-10">
              <button
                onClick={handleUdhaarReminder}
                className="flex items-center justify-center gap-2 h-11 rounded-xl bg-white/20 text-white text-sm font-semibold active-elevate hover:bg-white/30 transition-colors"
              >
                <Bell className="w-4 h-4" />
                Send Reminder
              </button>
              <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center justify-center gap-2 h-11 rounded-xl bg-white text-red-600 text-sm font-bold active-elevate shadow-md">
                    <IndianRupee className="w-4 h-4" />
                    Collect Payment
                  </button>
                </DialogTrigger>
                <DialogContent className="w-[90vw] max-w-md rounded-[16px]">
                  <DialogHeader>
                    <DialogTitle>Receive Payment from {customer.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Amount (₹)</label>
                      <Input type="number" min="1" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="h-12 text-lg rounded-[12px]" />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(() => {
                          const chips = udhaar < 500 ? [100, 500] : [500, 1000, 5000];
                          return chips.filter(amt => amt <= udhaar || amt === 500).map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium transition-colors"
                              onClick={() => setPayAmount(String(amt))}
                            >
                              ₹{amt}
                            </button>
                          ));
                        })()}
                        {udhaar > 0 && (
                          <button
                            type="button"
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium transition-colors text-primary"
                            onClick={() => setPayAmount(String(Math.ceil(udhaar)))}
                          >
                            Full
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Payment Mode</label>
                      <Select value={payMode} onValueChange={(v: any) => setPayMode(v)}>
                        <SelectTrigger className="h-12 rounded-[12px]">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Notes (optional)</label>
                      <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} className="h-12 rounded-[12px]" />
                    </div>
                    <button
                      className="w-full h-[52px] bg-primary hover:bg-primary/90 text-primary-foreground rounded-[12px] font-bold text-[16px] disabled:opacity-50 active-elevate"
                      onClick={handlePayment}
                      disabled={receivePayment.isPending || !payAmount || Number(payAmount) <= 0}
                    >
                      {receivePayment.isPending ? "Processing..." : "Confirm Payment"}
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* No Udhaar — show a green "all clear" card */}
        {!hasUdhaar && (
          <div className="mx-4 mt-4 rounded-3xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-700">No Outstanding Udhaar</p>
              <p className="text-xs text-green-600">All payments are cleared</p>
            </div>
          </div>
        )}

        {/* Top Stat Cards */}
        <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Bills</p>
            </div>
            <p className="text-2xl font-bold">{customerBills.length}</p>
          </div>
          <div className="bg-white rounded-2xl border p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Sales</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(lifetimeValue)}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mx-4 mt-3 bg-white rounded-2xl border shadow-sm">
          <div className="p-4 flex flex-col gap-3">
            {customer.phone && (
              <a href={`tel:+91${customer.phone.replace(/\D/g, "")}`}
                className="flex items-center gap-3 text-sm font-medium text-foreground hover:text-primary transition-colors active-elevate">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Phone className="w-4.5 h-4.5 text-blue-600" />
                </div>
                {customer.phone}
              </a>
            )}
            {customer.address && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4.5 h-4.5 text-slate-500" />
                </div>
                <span className="truncate">{customer.address}</span>
              </div>
            )}
            {!customer.phone && !customer.address && (
              <div className="text-sm text-muted-foreground italic flex justify-center py-2">No contact information saved</div>
            )}
          </div>
        </div>

        {/* Ledger/Bills Timeline */}
        <div className="mx-4 mt-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Activity
          </p>
          <div className="space-y-3 relative">
            {/* Timeline line */}
            {(customer.ledger as any[])?.length > 0 && (
              <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-slate-200" />
            )}
            
            {(customer.ledger as any[])?.length === 0 ? (
              <div className="py-8 text-center bg-white rounded-2xl border border-dashed text-[14px] text-muted-foreground">
                No history found.
              </div>
            ) : (
              (customer.ledger as any[])?.slice().reverse().map((entry: any) => {
                const isCredit = entry.entryType === "credit";
                const isBill = entry.description.toLowerCase().includes("bill");
                
                return (
                  <div key={entry.id} className="relative z-10 flex gap-3 items-start group">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center shadow-sm shrink-0 mt-0.5 text-white ring-4 ring-gray-50/50",
                      isCredit ? "bg-emerald-500" : (isBill ? "bg-primary" : "bg-red-500")
                    )}>
                      {isCredit ? <ArrowDownRight className="w-4 h-4" /> : (isBill ? <Receipt className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />)}
                    </div>
                    {isBill ? (
                      <Link href={`/bills/${entry.billId || entry.description.split("#")[1]}`} className="flex-1 block active-elevate">
                        <div className="bg-white rounded-2xl border px-4 py-3 shadow-sm hover:border-primary/30 transition-colors">
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="font-semibold text-slate-800 text-[15px] truncate pr-2">{entry.description}</span>
                            <span className="font-bold text-slate-900 shrink-0">{formatCurrency(entry.amount)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(entry.createdAt)}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                              UDHAAR
                            </span>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex-1 bg-white rounded-2xl border px-4 py-3 shadow-sm">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-semibold text-slate-800 text-[15px] truncate pr-2">{entry.description}</span>
                          <span className={cn("font-bold shrink-0", isCredit ? "text-emerald-600" : "text-red-600")}>
                            {formatCurrency(entry.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(entry.createdAt)}
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                            isCredit ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                          )}>
                            {isCredit ? "PAID" : "UDHAAR"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
