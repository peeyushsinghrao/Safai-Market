import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, QrCode, Trash2, Plus, Scale } from "lucide-react";
import { useGetProduct } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ProductVariants() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: product } = useGetProduct(Number(id));

  // Mock variants for the UI as per design
  const [variants, setVariants] = useState([
    { id: 1, name: "1 kg Pack", price: 120.00, stock: 45, isLowStock: false },
    { id: 2, name: "5 kg Bag", price: 550.00, stock: 8, isLowStock: true },
    { id: 3, name: "25 kg Sack", price: 2400.00, stock: 12, isLowStock: false },
  ]);

  const handleDelete = (varId: number) => {
    setVariants(prev => prev.filter(v => v.id !== varId));
  };

  const getProductImage = (name: string = "") => {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800&h=800'; // Rice image as default for mockup
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
            Variants
          </h1>
        </div>
        <button type="button" className="text-[#006b2c]">
          <QrCode className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Top Product Summary Card */}
        <div className="bg-white border border-slate-200 rounded-[16px] p-4 shadow-sm flex gap-4 items-center">
          <div className="w-16 h-16 rounded-[12px] bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
            <img src={getProductImage(product?.name)} alt="Product" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-slate-900">{product?.name || "Premium Basmati Rice"}</h2>
            <p className="text-[14px] text-slate-600">Manage size and weight options</p>
          </div>
        </div>

        {/* Variants List Section */}
        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-[14px] font-bold text-slate-700 tracking-wide uppercase">Active Variants</h3>
            <span className="bg-[#4ade80] text-[#064e3b] text-[12px] font-bold px-2.5 py-1 rounded-full">
              {variants.length} Options
            </span>
          </div>

          <div className="space-y-4">
            {variants.map(variant => (
              <div key={variant.id} className="bg-white border border-slate-200 rounded-[16px] p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[#006b2c]">
                    <Scale className="w-5 h-5" />
                    <span className="text-[17px] font-bold text-slate-900">{variant.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(variant.id)}
                    className="text-slate-500 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f8fafc] rounded-[10px] p-2.5">
                    <p className="text-[13px] text-slate-600 mb-0.5">Price</p>
                    <p className="text-[18px] font-bold text-[#006b2c]">₹{variant.price.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#f8fafc] rounded-[10px] p-2.5 flex flex-col justify-center">
                    <p className="text-[13px] text-slate-600 mb-0.5">Stock</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[18px] font-bold",
                        variant.isLowStock ? "text-red-600" : "text-slate-900"
                      )}>{variant.stock}</span>
                      {variant.isLowStock ? (
                        <span className="bg-red-100 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded-[4px]">Low Stock</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-[4px]">Units</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Variant Button */}
        <button className="w-full h-[56px] border-2 border-dashed border-[#006b2c]/40 hover:border-[#006b2c]/80 hover:bg-[#006b2c]/5 rounded-[16px] flex items-center justify-center gap-2 text-[#006b2c] font-bold text-[15px] transition-all">
          <Plus className="w-5 h-5" />
          Add New Variant
        </button>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#f8fafc] z-40 border-t border-slate-200">
        <div className="flex gap-3">
          <button 
            onClick={() => setLocation(`/products/${id}`)}
            className="w-1/3 h-[52px] bg-white border border-slate-300 text-slate-700 rounded-[12px] font-bold text-[15px] flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            Discard
          </button>
          <button 
            className="flex-1 h-[52px] bg-[#006b2c] hover:bg-[#005a24] text-white rounded-[12px] font-bold text-[15px] flex items-center justify-center gap-2 transition-colors active:scale-[0.99] shadow-sm"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
