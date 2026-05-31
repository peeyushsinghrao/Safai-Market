import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { IndianRupee, Phone, Calendar, ArrowDownRight, ArrowUpRight, Edit } from "lucide-react";
import { useSettingsStore } from "@/stores/settings";
import PageHeader from "@/components/page-header";
import { 
  useGetCustomer, 
  useReceiveCustomerPayment,
  getGetCustomerQueryKey,
  getListCustomersQueryKey,
  getGetDashboardSummaryQueryKey
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

export default function CustomerDetail() {
  const [, params] = useRoute('/customers/:id');
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings } = useSettingsStore();

  const { data: customer, isLoading } = useGetCustomer(id, {
    query: { enabled: !!id, queryKey: getGetCustomerQueryKey(id) }
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

    receivePayment.mutate({
      id,
      data: {
        amount,
        paymentMode: payMode,
        notes: payNotes || undefined
      }
    }, {
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

  if (!customer) {
    return <div className="p-4 text-center">Customer not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50/50 pb-20">
      <PageHeader
        title={customer.name}
        backTo="/customers"
        right={
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9 rounded-xl" onClick={() => setLocation(`/customers/${id}/edit`)}>
            <Edit className="w-4 h-4" />
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
                {customer.phone && (
                  <div className="flex items-center text-sm text-muted-foreground mt-1 gap-1">
                    <Phone className="w-4 h-4" /> {customer.phone}
                  </div>
                )}
                {customer.address && (
                  <p className="text-xs text-muted-foreground mt-1">{customer.address}</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-blue-800 mb-1">Udhaar Balance</span>
              <div className={cn(
                "text-4xl font-bold tracking-tight",
                Number(customer.udhaarBalance) > 0 ? "text-destructive" : "text-primary"
              )}>
                {formatCurrency(customer.udhaarBalance)}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {Number(customer.udhaarBalance) > 0 && (
                <Button
                  variant="outline"
                  onClick={handleUdhaarReminder}
                  className="w-full gap-2 border-green-200 text-green-700 hover:bg-green-50 rounded-xl h-10"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Send WhatsApp Reminder
                </Button>
              )}
              <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full active-elevate h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                    <IndianRupee className="w-5 h-5 mr-2" /> Receive Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[90vw] max-w-md rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Receive Payment from {customer.name}</DialogTitle>
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
                      className="w-full h-12 text-lg active-elevate bg-blue-600 hover:bg-blue-700 text-white" 
                      onClick={handlePayment}
                      disabled={receivePayment.isPending || !payAmount || Number(payAmount) <= 0}
                    >
                      {receivePayment.isPending ? "Processing..." : "Confirm Payment"}
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
            {(customer.ledger as any[])?.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No ledger history found.</div>
            ) : (
              <div className="divide-y">
                {(customer.ledger as any[])?.map((entry: any) => (
                  <div key={entry.id} className="p-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        entry.entryType === 'credit' ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                      )}>
                        {entry.entryType === 'credit' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium line-clamp-1">{entry.description}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right pl-2 shrink-0">
                      <div className={cn(
                        "text-sm font-bold",
                        entry.entryType === 'credit' ? "text-primary" : "text-destructive"
                      )}>
                        {entry.entryType === 'credit' ? "-" : "+"}{formatCurrency(entry.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
