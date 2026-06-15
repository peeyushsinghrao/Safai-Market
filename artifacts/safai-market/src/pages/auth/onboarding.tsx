import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Store, Phone, MapPin, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const { toast } = useToast();
  const { getToken, setShop } = useAuthStore();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [shopName, setShopName] = useState("");
  const [shopType, setShopType] = useState("Kirana / General Store");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleNextStep = () => {
    if (step === 1) {
      if (!shopName.trim()) {
        toast({ title: "Shop name is required", variant: "destructive" });
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/shops`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: shopName.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          // shopType is frontend only for now to match UI, could be added to backend later
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const shop = await res.json();
      setShop({
        id: shop.id,
        name: shop.name,
        ownerId: shop.ownerId,
        phone: shop.phone,
        address: shop.address,
        gstNumber: shop.gstNumber,
      });
      toast({ title: "Shop created!", description: `Welcome to ${shop.name} 🎉` });
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const SHOP_TYPES = [
    "Kirana / General Store",
    "Grocery Supermarket",
    "Other Retail"
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 bg-white border-b border-slate-200">
        <button 
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else setLocation("/auth/register");
          }} 
          className="p-2 -ml-2 text-[#006b2c] hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-[#006b2c]">Safai Market</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 pt-6 pb-8">
        
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-800">Step {step} of 2</span>
            <span className="text-sm font-bold text-[#006b2c]">Progress</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-[#006b2c] transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-full bg-slate-200 rounded-2xl overflow-hidden aspect-[16/9] mb-6">
              <img src="/shop-setup-hero.png" alt="Shop setup" className="w-full h-full object-cover" />
            </div>

            <div className="mb-6">
              <h2 className="text-[28px] font-bold text-slate-900 leading-tight">Basic Details</h2>
              <p className="text-slate-700 mt-1 text-[15px]">Let's start with the basics of your retail business.</p>
            </div>

            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">Shop Name</label>
                <Input
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  placeholder="e.g. Agarwal Kirana Store"
                  required
                  autoFocus
                  className="h-[52px] rounded-2xl px-4 text-base border-slate-300 focus:border-[#006b2c] bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">Shop Type</label>
                <div className="space-y-3">
                  {SHOP_TYPES.map((type) => (
                    <div 
                      key={type}
                      onClick={() => setShopType(type)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-colors cursor-pointer",
                        shopType === type 
                          ? "border-[#006b2c] bg-[#006b2c]/5" 
                          : "border-slate-300 bg-white hover:border-[#006b2c]/50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        shopType === type ? "border-[#006b2c]" : "border-slate-300"
                      )}>
                        {shopType === type && <div className="w-2.5 h-2.5 bg-[#006b2c] rounded-full" />}
                      </div>
                      <span className="text-base text-slate-800 font-medium">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleNextStep}
              className="w-full h-[52px] text-lg font-bold rounded-2xl mt-8 bg-[#006b2c] hover:bg-[#005a24] text-white flex items-center justify-center gap-2 shadow-md"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <h2 className="text-[28px] font-bold text-slate-900 leading-tight">Contact Info</h2>
              <p className="text-slate-700 mt-1 text-[15px]">How can suppliers and customers reach you?</p>
            </div>

            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">Phone Number (Optional)</label>
                <div className="flex gap-3">
                  <div className="h-[52px] w-[72px] shrink-0 rounded-2xl border border-slate-300 bg-slate-50 flex items-center justify-center font-medium text-slate-700">
                    +91
                  </div>
                  <Input 
                    type="tel" 
                    placeholder="10-digit mobile number" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    className="h-[52px] flex-1 rounded-2xl px-4 text-base border-slate-300 focus:border-[#006b2c] bg-white" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">Address (Optional)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                  <Textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Shop No. 5, Main Bazaar, Delhi"
                    className="min-h-[120px] pl-12 pt-4 rounded-2xl resize-none text-base border-slate-300 focus:border-[#006b2c] bg-white"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-[52px] text-lg font-bold rounded-2xl mt-8 bg-[#006b2c] hover:bg-[#005a24] text-white flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? "Finishing..." : "Complete Setup"}
              {!loading && <Check className="w-5 h-5" />}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
