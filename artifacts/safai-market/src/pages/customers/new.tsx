import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateCustomer } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, QrCode, UserRound, Phone, MapPin, UserPlus, X, ShieldCheck } from "lucide-react";

export default function CustomerNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createCustomer = useCreateCustomer();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    openingBalance: "0",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Name required", description: "Please enter the customer's name.", variant: "destructive" });
      return;
    }

    createCustomer.mutate(
      {
        data: {
          name: formData.name.trim(),
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          openingBalance: Number(formData.openingBalance) || 0,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Customer added!", description: `${formData.name} has been saved.` });
          setLocation("/customers");
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/customers")}
              className="text-primary p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[19px] text-primary">Add Customer</h1>
          </div>
          <button className="text-primary p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95">
            <QrCode className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative mx-4 mt-4 rounded-2xl overflow-hidden h-[140px] bg-gradient-to-r from-primary to-green-600">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <p className="absolute bottom-4 left-4 text-white text-[15px] font-medium leading-snug max-w-[260px]">
          Register a new customer to track credit and sales history.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-5 pb-[100px]">
        {/* Customer Full Name */}
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">
            Customer Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              required
              autoFocus
              className="w-full pl-12 pr-4 h-14 rounded-2xl border bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <span className="absolute left-12 top-1/2 -translate-y-1/2 text-[15px] text-slate-700 font-medium">+91</span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="98765 43210"
              className="w-full pl-[80px] pr-4 h-14 rounded-2xl border bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Shop/Home Address */}
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Shop/Home Address</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street name, landmark, city..."
              className="w-full pl-12 pr-4 py-4 min-h-[100px] rounded-2xl border bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 resize-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Udhaar Limit + KYC */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border shadow-sm p-4">
            <p className="text-xs font-bold text-slate-700 mb-1">Udhaar Limit</p>
            <p className="text-2xl font-bold text-primary leading-none mb-1">₹5,000</p>
            <p className="text-[11px] text-slate-500">Standard base limit</p>
          </div>
          <div className="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold text-slate-700">KYC Ready</p>
            </div>
            <p className="text-base font-bold text-slate-900 mb-1">Pending</p>
            <button type="button" className="text-primary text-[11px] font-bold tracking-wider uppercase active:scale-95 transition-transform">
              UPLOAD DOCS
            </button>
          </div>
        </div>
      </form>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-50 border-t border-slate-200 p-4 z-50">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setLocation("/customers")}
            className="flex-1 h-14 border rounded-2xl font-bold text-[15px] text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-100 active-elevate"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit as any}
            className="flex-[1.5] h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 active-elevate disabled:opacity-50"
            disabled={createCustomer.isPending}
          >
            <UserPlus className="w-5 h-5" />
            {createCustomer.isPending ? "Saving..." : "Save Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
