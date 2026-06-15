import { useRoute } from "wouter";
import { useGetPurchase } from "@workspace/api-client-react";
import PageHeader from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { FileText, Calendar, Box, Package } from "lucide-react";

export default function PurchaseDetail() {
  const [, params] = useRoute("/purchases/:id");
  const purchaseId = Number(params?.id);

  const { data: purchase, isLoading } = useGetPurchase(purchaseId, {
    query: { enabled: !!purchaseId }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full bg-slate-50 font-sans">
        <PageHeader title="Purchase Details" backTo="/purchases" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="flex flex-col min-h-full bg-slate-50 font-sans">
        <PageHeader title="Purchase Not Found" backTo="/purchases" />
        <div className="p-4 text-center mt-10">
          <p className="text-slate-500 font-semibold text-[15px]">The requested purchase could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans">
      <PageHeader title={purchase.purchaseNumber} backTo="/purchases" />
      
      <div className="p-4 space-y-4 pb-24">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-bold text-[18px] text-slate-800">{purchase.supplierName}</h2>
              <div className="text-[13px] text-slate-500 mt-1 flex items-center gap-2 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                {formatDate(purchase.createdAt)}
              </div>
            </div>
            <span className={cn(
              "px-3 py-1 rounded-xl text-[12px] font-bold uppercase border",
              purchase.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
              purchase.paymentStatus === 'partial' ? "bg-blue-50 text-blue-600 border-blue-200" : 
              "bg-red-50 text-red-600 border-red-200"
            )}>
              {purchase.paymentStatus}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Invoice Ref
              </p>
              <p className="font-bold text-[15px] text-slate-800">{purchase.invoiceRef || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                <Box className="w-3.5 h-3.5" />
                Total Amount
              </p>
              <p className="font-bold text-[17px] text-primary">{formatCurrency(purchase.totalAmount)}</p>
            </div>
          </div>

          {purchase.notes && (
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-2xl text-[14px] border border-blue-100 font-medium">
              <span className="font-bold block mb-1">Notes:</span>
              {purchase.notes}
            </div>
          )}
        </div>

        <h3 className="font-bold text-slate-800 mt-6 mb-2 px-1 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Received Items ({purchase.items?.length || 0})
        </h3>
        
        <div className="space-y-3">
          {purchase.items?.map((item: any) => (
            <div key={item.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex justify-between items-center">
              <div>
                <div className="font-bold text-[15px] text-slate-800">{item.productName}</div>
                <div className="text-[13px] text-slate-500 mt-1 font-medium">
                  {item.quantity} × {formatCurrency(item.unitCost)}
                  {Number(item.freeQuantity) > 0 && (
                    <span className="text-emerald-600 font-bold ml-2 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">+{item.freeQuantity} free</span>
                  )}
                </div>
              </div>
              <div className="font-bold text-[16px] text-primary">
                {formatCurrency(item.totalCost)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
