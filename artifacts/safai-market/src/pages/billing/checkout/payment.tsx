import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  QrCode,
  Banknote,
  Smartphone,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ShoppingBasket
} from "lucide-react";
import {
  useCreateBill,
  useListCustomers,
  getListBillsQueryKey,
  getGetDashboardSummaryQueryKey,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useCartStore } from "@/stores/cart";
import { useSettingsStore } from "@/stores/settings";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export default function CheckoutPayment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createBill = useCreateBill();
  const cart = useCartStore();
  const { settings } = useSettingsStore();
  const { data: customers } = useListCustomers();

  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const items = cart.items;
  const total = cart.getTotal();
  const discountAmt = cart.getDiscountAmount();
  const gstBreakdown = cart.getGstBreakdown();
  const cashNum = Number(cashAmount) || 0;
  const upiNum = Number(upiAmount) || 0;
  const udhaarAmount = Math.max(0, total - cashNum - upiNum);
  const remaining = total - cashNum - upiNum;
  const overpaid = remaining < 0;
  const fullyPaid = remaining <= 0;
  const hasRealCustomer = Boolean(
    cart.customerId && cart.customerId !== "walkin"
  );

  const selectedCustomer = customers?.find(
    (c) => String(c.id) === cart.customerId
  );

  // Redirect if cart is empty
  if (items.length === 0) {
    navigate("/billing");
    return null;
  }

  // Auto-fill cash when total changes
  useEffect(() => {
    if (!cashAmount && !upiAmount) {
      setCashAmount(String(Math.round(total)));
    }
  }, []);

  const handleCreateBill = () => {
    if (submitted || createBill.isPending) return;
    if (items.length === 0) return;

    // Udhaar requires a real customer
    if (udhaarAmount > 0 && !hasRealCustomer) {
      toast({
        title: "Customer required",
        description: "Select a customer to record udhaar. Go back to Review.",
        variant: "destructive",
      });
      return;
    }

    setSubmitted(true);

    createBill.mutate(
      {
        data: {
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountAmount: i.itemDiscount * i.quantity,
          })),
          customerId: hasRealCustomer ? Number(cart.customerId) : undefined,
          totalAmount: total,
          cashAmount: cashNum,
          upiAmount: upiNum,
          udhaarAmount,
          discountAmount: discountAmt,
          notes: cart.notes || undefined,
        },
      },
      {
        onSuccess: (bill) => {
          setSubmitted(false);
          const b = bill as any;

          // Invalidate relevant queries
          queryClient.invalidateQueries({
            queryKey: getListBillsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetDashboardSummaryQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getListProductsQueryKey(),
          });

          // Store bill result for success page
          const billResult = {
            billNumber: b.billNumber,
            profit:
              b.estimatedProfit != null ? Number(b.estimatedProfit) : null,
            subtotal: cart.getSubtotal(),
            discountAmount: discountAmt,
            totalAmount: total,
            cashAmount: cashNum,
            upiAmount: upiNum,
            udhaarAmount,
            customerName: selectedCustomer?.name,
            notes: cart.notes || undefined,
            items: items.map((i) => ({
              productName: i.productName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: (i.unitPrice - i.itemDiscount) * i.quantity,
            })),
            gstBreakdown:
              gstBreakdown.totalGst > 0 ? gstBreakdown : undefined,
            storeGstNumber: settings.gstNumber,
            showGst: settings.showGst,
          };

          // Save to sessionStorage so success page can read it
          try {
            sessionStorage.setItem(
              "safai-last-bill",
              JSON.stringify(billResult)
            );
          } catch {}

          cart.clearCart();
          navigate("/billing/checkout/success");
        },
        onError: (err) => {
          setSubmitted(false);
          playSound("error");
          toast({
            title: "Error creating bill",
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-[100px]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-muted/50 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/billing/checkout/review")}
              className="text-muted-foreground p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors active-elevate"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h1 className="font-bold text-[19px] text-foreground leading-tight">Payment</h1>
              <span className="text-[12px] text-muted-foreground font-medium leading-none mt-0.5">Step 2 of 3</span>
            </div>
          </div>
          <button className="text-primary p-1 hover:bg-slate-100 rounded-full active-elevate">
            <QrCode className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Total Payable Hero */}
        <div className="bg-primary rounded-2xl p-5 text-primary-foreground shadow-md">
          <p className="text-primary-foreground/90 text-sm font-medium mb-1 uppercase tracking-wider">
            Total Payable Amount
          </p>
          <div className="flex items-baseline gap-1.5 mb-4">
            <span className="text-[28px] font-bold">₹</span>
            <span className="text-[40px] font-bold tracking-tight leading-none">
              {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full border border-white/30 text-xs font-semibold backdrop-blur-sm">
            <ShoppingBasket className="w-3.5 h-3.5" />
            {cart.getItemCount()} Items in cart
          </div>
        </div>

        {/* Payment Breakdown */}
        <div>
          <h2 className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-3 px-1">Payment Breakdown</h2>
          <div className="space-y-3">
            {/* Cash */}
            <div className="bg-white rounded-2xl border border-muted/50 shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-base font-bold text-foreground">Cash Payment</span>
                </div>
                <div className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs font-bold">F1</div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-medium">₹</span>
                <input
                  type="number"
                  min="0"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full pl-8 pr-4 h-14 rounded-2xl border border-muted/50 bg-slate-50 text-base font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
                />
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                {[100, 500, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="px-3 py-1.5 bg-muted hover:bg-muted-foreground/10 text-foreground text-sm font-bold rounded-full transition-colors whitespace-nowrap active-elevate"
                    onClick={() => setCashAmount(String(Number(cashAmount || 0) + amt))}
                  >
                    +₹{amt}
                  </button>
                ))}
                <button
                  type="button"
                  className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-bold rounded-full transition-colors whitespace-nowrap active-elevate"
                  onClick={() => setCashAmount(String(Math.ceil(total)))}
                >
                  Exact (₹{Math.ceil(total)})
                </button>
              </div>
            </div>

            {/* UPI */}
            <div className="bg-white rounded-2xl border border-muted/50 shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-base font-bold text-foreground">UPI / QR Scan</span>
                </div>
                <div className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs font-bold">F2</div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-medium">₹</span>
                <input
                  type="number"
                  min="0"
                  value={upiAmount}
                  onChange={(e) => setUpiAmount(e.target.value)}
                  className="w-full pl-8 pr-4 h-14 rounded-2xl border border-muted/50 bg-slate-50 text-base font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
                />
              </div>
            </div>

            {/* Udhaar */}
            <div className="bg-white rounded-2xl border border-muted/50 shadow-sm p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 mt-1">
                    <BookOpen className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-foreground">Udhaar (Credit)</span>
                    <span className="text-xs font-semibold text-red-600">Limit: ₹15,000</span>
                  </div>
                </div>
                <div className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs font-bold mt-1">F3</div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-medium">₹</span>
                <input
                  type="number"
                  min="0"
                  value={udhaarAmount > 0 ? udhaarAmount : ""}
                  readOnly
                  className="w-full pl-8 pr-4 h-14 rounded-2xl border border-muted/50 bg-slate-50 font-sans text-base font-semibold focus:outline-none text-muted-foreground cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-muted/50 shadow-sm p-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Balance Remaining:</span>
            <span className={cn("text-xl font-bold", overpaid ? "text-primary" : "text-foreground")}>
              {overpaid ? `Change: ${formatCurrency(Math.abs(remaining))}` : formatCurrency(Math.max(0, remaining))}
            </span>
          </div>

          <div
            className={cn(
              "rounded-2xl p-4 text-center font-bold text-base flex items-center justify-center gap-2",
              fullyPaid
                ? "bg-green-100 border border-green-200 text-green-800"
                : "bg-muted border border-muted/50 text-muted-foreground"
            )}
          >
            {fullyPaid ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Fully paid ✓
              </>
            ) : (
              "Payment pending"
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-muted/50 p-4 z-50">
        <button
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-base flex items-center justify-center gap-2 active-elevate shadow-sm disabled:opacity-50 disabled:active:scale-100"
          onClick={handleCreateBill}
          disabled={createBill.isPending || submitted || items.length === 0}
          id="btn-create-bill"
        >
          {createBill.isPending ? "Creating Bill..." : "Create Bill"}
          {!createBill.isPending && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
