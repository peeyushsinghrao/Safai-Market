import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Settings, Printer, Minus, Plus, Tag, Check, CalendarDays, ReceiptText, FileText } from "lucide-react";
import { useGetProduct } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function BarcodeLabelPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: product } = useGetProduct(Number(id));

  const [quantity, setQuantity] = useState(1);
  const [paperSize, setPaperSize] = useState<"thermal" | "a4">("thermal");
  const [printPrice, setPrintPrice] = useState(true);

  const barcodeStr = product?.barcode || "8 901234 567890";
  const productName = product?.name || "Amul Taaza Milk (1L)";
  const productPrice = product?.sellPrice || 72.00;

  const handlePrint = () => {
    // Simulate print action
    window.print();
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f8fafc] font-sans pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#f8fafc] px-4 py-4 flex items-center justify-between shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setLocation(`/products/${id}`)} className="text-[#006b2c] p-1 -ml-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[19px] font-bold text-[#006b2c]">
            Print Label
          </h1>
        </div>
        <button type="button" className="text-[#006b2c]">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Preview Card */}
        <div className="bg-white border border-slate-200 rounded-[16px] p-6 shadow-sm flex flex-col items-center">
          {/* Simulated Barcode */}
          <div className="flex flex-col items-center mb-4">
            <div className="h-[80px] w-[120px] bg-[repeating-linear-gradient(90deg,#000_0px,#000_2px,transparent_2px,transparent_5px,#000_5px,#000_6px,transparent_6px,transparent_9px)] rounded-[2px]" />
            <p className="text-[13px] text-slate-600 mt-2 tracking-[0.2em] font-mono">{barcodeStr}</p>
          </div>

          <h2 className="text-[18px] font-bold text-slate-900 mb-1">{productName}</h2>
          {printPrice && <p className="text-[32px] font-bold text-[#006b2c] leading-tight mb-4">{formatCurrency(productPrice)}</p>}

          <div className="w-full border-t border-dashed border-slate-300 my-4"></div>

          <div className="bg-slate-50 text-slate-600 text-[13px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" />
            Exp: 12 Oct 2024
          </div>
        </div>

        <p className="text-[13px] text-slate-600 text-center -mt-3">
          Preview only. Final print may vary based on paper size.
        </p>

        {/* Paper Size */}
        <div>
          <h3 className="text-[15px] font-bold text-slate-800 mb-3 px-1">Paper Size</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setPaperSize("thermal")}
              className={cn(
                "h-[80px] rounded-[16px] flex flex-col items-center justify-center gap-2 border-2 transition-colors",
                paperSize === "thermal" 
                  ? "bg-[#006b2c] border-[#006b2c] text-white" 
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
              )}
            >
              <ReceiptText className="w-6 h-6" />
              <span className="text-[14px] font-bold">58mm (Thermal)</span>
            </button>
            <button 
              onClick={() => setPaperSize("a4")}
              className={cn(
                "h-[80px] rounded-[16px] flex flex-col items-center justify-center gap-2 border-2 transition-colors",
                paperSize === "a4" 
                  ? "bg-white border-[#006b2c] text-slate-900" 
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
              )}
            >
              <FileText className="w-6 h-6" />
              <span className="text-[14px] font-bold">A4 (Laser)</span>
            </button>
          </div>
        </div>

        {/* Quantity to Print */}
        <div>
          <h3 className="text-[15px] font-bold text-slate-800 mb-3 px-1">Quantity to Print</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-[52px] bg-[#eef2ff] text-[#4f46e5] rounded-[12px] flex items-center justify-center active:bg-indigo-100 transition-colors shrink-0"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <Input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="h-[52px] rounded-[12px] text-center text-[18px] font-bold border-slate-300 focus:border-[#006b2c] focus:ring-1 focus:ring-[#006b2c]"
              />
            </div>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-[52px] bg-[#eef2ff] text-[#4f46e5] rounded-[12px] flex items-center justify-center active:bg-indigo-100 transition-colors shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print MRP Toggle */}
        <button 
          onClick={() => setPrintPrice(!printPrice)}
          className="w-full bg-[#f8fafc] border border-slate-200 rounded-[16px] p-4 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3 text-slate-800">
            <Tag className="w-5 h-5 text-[#006b2c]" />
            <span className="text-[15px] font-bold">Print MRP/Selling Price</span>
          </div>
          <div className={cn(
            "w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors",
            printPrice ? "bg-[#006b2c] border-[#006b2c]" : "border-2 border-slate-300"
          )}>
            {printPrice && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
          </div>
        </button>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#f8fafc] z-40 border-t border-slate-200">
        <button 
          onClick={handlePrint}
          className="w-full h-[56px] bg-[#006b2c] hover:bg-[#005a24] text-white rounded-[16px] font-bold text-[16px] flex items-center justify-center gap-2 transition-colors active:scale-[0.99] shadow-sm"
        >
          <Printer className="w-5 h-5" />
          Print Label
        </button>
      </div>
    </div>
  );
}
