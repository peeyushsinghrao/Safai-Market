import { useState } from "react";
import { Store, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth";
export default function Onboarding() {
  const { toast } = useToast();
  const { getToken, setShop } = useAuthStore();
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast({ title: "Shop name is required", variant: "destructive" });
      return;
    }
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
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const shop = await res.json();
      setShop(shop);
      toast({ title: "Shop created!", description: `Welcome to ${shop.name}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-green-50 flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up Your Shop</h1>
          <p className="text-muted-foreground mt-1 text-sm">You're almost ready to start selling!</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Shop Name *</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  placeholder="e.g. Sharma General Store"
                  required
                  autoFocus
                  className="h-12 pl-10 rounded-xl text-base"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Phone <span className="font-normal normal-case">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="h-12 pl-10 rounded-xl text-base"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Address <span className="font-normal normal-case">(optional)</span></label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Shop No. 5, Main Bazaar, Delhi"
                  className="min-h-[72px] pl-10 rounded-xl resize-none text-base"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 mt-2"
              disabled={loading}
            >
              {loading ? "Creating..." : "Start Selling →"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
