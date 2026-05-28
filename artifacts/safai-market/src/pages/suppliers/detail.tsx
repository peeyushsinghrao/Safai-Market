import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, IndianRupee, Phone, Calendar, ArrowDownRight, ArrowUpRight, User } from "lucide-react";
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
    <div className="flex flex-col h-full bg-gray-50/50 pb-20">
      <div className="sticky top-14 z-30 bg-primary text-primary-foreground border-b p-4 flex items-center shadow-sm">
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 mr-2" onClick={() => setLocation("/suppliers")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg truncate pr-4">{supplier.name}</h1>
      </div>

      <div className="p-4 space-y-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{supplier.name}</h2>
                {supplier.contactName && (
                  <div className="flex items-center text-sm text-muted-foreground mt-2 gap-1.5">
                    <User className="w-4 h-4" /> {supplier.contactName}
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center text-sm text-muted-foreground mt-1 gap-1.5">
                    <Phone className="w-4 h-4" /> {supplier.phone}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-amber-800 mb-1">Pending to Pay</span>
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
                  <Button className="w-full active-elevate h-12 text-lg bg-amber-600 hover:bg-amber-700 text-white shadow-md">
                    <IndianRupee className="w-5 h-5 mr-2" /> Make Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[90vw] max-w-md rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Make Payment to {supplier.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount (₹)</label>
                      <Input type="number" min="1" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="h-12 text-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Mode</label>
                      <Select value={payMode} onValueChange={(v: any) => setPayMode(v)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
                      <Input value={payNotes} onChange={e => setPayNotes(e.target.value)} className="h-12" />
                    </div>
                    <Button 
                      className="w-full h-12 text-lg active-elevate bg-amber-600 hover:bg-amber-700 text-white" 
                      onClick={handlePayment}
                      disabled={makePayment.isPending || !payAmount || Number(payAmount) <= 0}
                    >
                      {makePayment.isPending ? "Processing..." : "Confirm Payment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Ledger History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 text-center text-sm text-muted-foreground">
              Payment history will appear here.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
