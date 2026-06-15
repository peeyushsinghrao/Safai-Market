import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { IndianRupee, Phone, Calendar, ArrowDownRight, ArrowUpRight, User, Clock, FileText } from "lucide-react";
import PageHeader from "@/components/page-header";
import { 
  useGetSupplier, 
  useMakeSupplierPayment,
  getGetSupplierQueryKey,
  getListSuppliersQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function SupplierDetail() {
  const [, params] = useRoute('/suppliers/:id');
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: supplier, isLoading } = useGetSupplier(id, {
    query: { enabled: !!id, queryKey: getGetSupplierQueryKey(id) }
  });

  const makePayment = useMakeSupplierPayment();

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<"cash" | "upi">("upi");
  const [payNotes, setPayNotes] = useState("");

  const handlePayment = () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;

    makePayment.mutate({
      id,
      data: {
        amount,
        paymentMode: payMode,
        notes: payNotes || undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Payment recorded successfully" });
        setIsPaymentOpen(false);
        setPayAmount("");
        setPayNotes("");
        queryClient.invalidateQueries({ queryKey: getGetSupplierQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-60 w-full" />
    </div>;
  }

  if (!supplier) {
    return <div className="p-4 text-center">Supplier not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-20">
      <PageHeader title={supplier.name} backTo="/suppliers" />

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-[20px] font-bold text-slate-900">{supplier.name}</h2>
              {supplier.contactName && (
                <div className="flex items-center text-[14px] text-slate-500 mt-2 gap-1.5 font-medium">
                  <User className="w-4 h-4" /> {supplier.contactName}
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center text-[14px] text-slate-500 mt-1 gap-1.5 font-medium">
                  <Phone className="w-4 h-4" /> {supplier.phone}
                </div>
              )}
              {supplier.gstNumber && (
                <div className="flex items-center text-[14px] text-slate-500 mt-1 gap-1.5 uppercase font-medium">
                  <FileText className="w-4 h-4" /> GST: {supplier.gstNumber}
                </div>
              )}
              {(supplier.leadTime != null || supplier.creditLimit != null) && (
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                  {supplier.leadTime != null && (
                    <div className="flex items-center text-[13px] text-slate-700 gap-1.5 font-medium">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="font-bold">{supplier.leadTime} Days</span> lead
                    </div>
                  )}
                  {supplier.creditLimit != null && (
                    <div className="flex items-center text-[13px] text-slate-700 gap-1.5 font-medium">
                      <IndianRupee className="w-4 h-4 text-slate-400" />
                      <span className="font-bold">{formatCurrency(supplier.creditLimit)}</span> limit
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[13px] font-bold text-amber-800 mb-1">Pending to Pay</span>
            <div className={cn(
              "text-4xl font-bold tracking-tight",
              Number(supplier.pendingAmount) > 0 ? "text-amber-600" : "text-primary"
            )}>
              {formatCurrency(supplier.pendingAmount)}
            </div>
          </div>

          <div className="mt-4">
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
              <DialogTrigger asChild>
                <Button className="w-full active-elevate h-14 text-[16px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-2xl shadow-sm transition-transform">
                  <IndianRupee className="w-5 h-5 mr-2" /> Make Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-w-md rounded-3xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl">Make Payment to {supplier.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div>
                    <label className="text-[13px] font-bold text-slate-500 mb-1.5 block">Amount (₹)</label>
                    <Input type="number" min="1" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="h-14 text-xl font-bold rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-slate-500 mb-1.5 block">Payment Mode</label>
                    <Select value={payMode} onValueChange={(v: any) => setPayMode(v)}>
                      <SelectTrigger className="h-14 rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-slate-500 mb-1.5 block">Notes (optional)</label>
                    <Input value={payNotes} onChange={e => setPayNotes(e.target.value)} className="h-14 rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base" />
                  </div>
                  <Button 
                    className="w-full h-14 text-[17px] font-bold active-elevate bg-amber-600 hover:bg-amber-700 text-white rounded-2xl transition-transform mt-2" 
                    onClick={handlePayment}
                    disabled={makePayment.isPending || !payAmount || Number(payAmount) <= 0}
                  >
                    {makePayment.isPending ? "Processing..." : "Confirm Payment"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              Ledger History
            </h3>
          </div>
          <div className="p-8 text-center text-[14px] font-medium text-slate-500">
            Payment history will appear here.
          </div>
        </div>
      </div>
    </div>
  );
}
