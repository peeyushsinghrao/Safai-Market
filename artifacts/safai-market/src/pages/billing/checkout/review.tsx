import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, User, Pencil, ArrowRight, ShieldCheck } from "lucide-react";
import { useListCustomers } from "@workspace/api-client-react";
import { useCartStore } from "@/stores/cart";
import { useSettingsStore } from "@/stores/settings";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function CheckoutReview() {
  const [, navigate] = useLocation();
  const cart = useCartStore();
  const { settings } = useSettingsStore();
  const { data: customers } = useListCustomers();

  const items = cart.items;
  const subtotal = cart.getSubtotal();
  const discountAmt = cart.getDiscountAmount();
  const total = cart.getTotal();
  const gst = cart.getGstBreakdown();

  // Redirect to billing if cart is empty
  if (items.length === 0) {
    navigate("/billing");
    return null;
  }

  const selectedCustomer = customers?.find(
    (c) => String(c.id) === cart.customerId
  );

  const getProductImage = (name: string) => {
    return 'https://images.unsplash.com/photo-1585565804112-f201f68c48b4?auto=format&fit=crop&q=80&w=400&h=400';
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-[100px]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-muted/50 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/billing")}
              className="text-muted-foreground p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors active-elevate"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[19px] text-foreground">Review Order</h1>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[13px] font-bold tracking-wide">
            Step 1 of 3
          </div>
        </div>
        
        {/* Stepper */}
        <div className="flex items-center justify-between px-6 pb-4 pt-2">
          <div className="flex flex-col items-center gap-1">
            <div className="w-[32px] h-[32px] rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[14px] shadow-sm border-2 border-primary ring-2 ring-primary/20">
              1
            </div>
            <span className="text-[12px] font-bold text-primary">Review</span>
          </div>
          <div className="flex-1 h-[2px] bg-muted -mt-5 mx-2" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-[32px] h-[32px] rounded-full bg-white text-muted-foreground flex items-center justify-center font-bold text-[14px] border-2 border-muted">
              2
            </div>
            <span className="text-[12px] font-medium text-muted-foreground">Payment</span>
          </div>
          <div className="flex-1 h-[2px] bg-muted -mt-5 mx-2" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-[32px] h-[32px] rounded-full bg-white text-muted-foreground flex items-center justify-center font-bold text-[14px] border-2 border-muted">
              3
            </div>
            <span className="text-[12px] font-medium text-muted-foreground">Success</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Customer Card */}
        <div className="bg-white rounded-2xl border border-muted/50 shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase mb-0.5">Customer</p>
            <p className="text-lg font-bold text-foreground truncate">
              {selectedCustomer?.name || "Walk-in"}
            </p>
          </div>
          <button className="flex items-center gap-1.5 text-primary font-bold text-sm active-elevate" onClick={() => navigate("/customers")}>
            Change
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        {/* Order Items */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-bold text-foreground">
              Order Items ({items.length})
            </h2>
            <button onClick={() => navigate("/billing")} className="text-primary font-bold text-sm active-elevate">
              + Add Items
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item) => {
              const lineTotal = (item.unitPrice - item.itemDiscount) * item.quantity;
              return (
                <div key={item.productId} className="bg-white rounded-2xl border border-muted/50 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted shrink-0 overflow-hidden border border-muted/50">
                     <img src={getProductImage(item.productName)} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-foreground leading-tight mb-1 truncate">{item.productName}</p>
                    <p className="text-[13px] text-muted-foreground font-semibold">
                      {formatCurrency(item.unitPrice)} / {item.unit || 'unit'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-foreground">{formatCurrency(lineTotal)}</p>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Notes */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-2 px-1">Order Notes (Optional)</h2>
          <textarea
            className="w-full h-[100px] rounded-2xl border border-muted/50 bg-white p-4 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none shadow-sm"
            placeholder="Add special instructions or delivery notes..."
            value={cart.notes}
            onChange={(e) => cart.setNotes(e.target.value)}
          />
        </div>

        {/* Bill Details */}
        <div className="bg-primary/5 rounded-[20px] p-5 shadow-sm border border-primary/10">
          <h3 className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-4">Bill Details</h3>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center text-[15px] font-semibold">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between items-center text-[15px] font-semibold">
                <span className="text-red-600">Discount {cart.billDiscountType === 'pct' ? `(${cart.billDiscount}%)` : ''}</span>
                <span className="text-red-600">-{formatCurrency(discountAmt)}</span>
              </div>
            )}
            {gst.totalGst > 0 && (
              <>
                <div className="h-[1px] bg-muted my-1" />
                {gst.isInterState ? (
                  <div className="flex justify-between items-center text-[13px] text-muted-foreground font-semibold">
                    <span>IGST</span>
                    <span>{formatCurrency(gst.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-[13px] text-muted-foreground font-semibold">
                      <span>CGST (2.5%)</span>
                      <span>{formatCurrency(gst.cgst)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px] text-muted-foreground font-semibold">
                      <span>SGST (2.5%)</span>
                      <span>{formatCurrency(gst.sgst)}</span>
                    </div>
                  </>
                )}
                <div className="h-[1px] bg-muted my-1" />
              </>
            )}
          </div>

          <div className="flex justify-between items-end pt-2">
            <div>
              <p className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Total Payable</p>
              <p className="text-[34px] font-bold text-primary leading-none tracking-tight">{formatCurrency(total)}</p>
            </div>
            <div className="bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Incl. Taxes
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-muted/50 p-4 z-50">
        <button
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-base flex items-center justify-center gap-2 active-elevate shadow-sm"
          onClick={() => navigate("/billing/checkout/payment")}
          id="btn-continue-payment"
        >
          Continue to Payment
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
