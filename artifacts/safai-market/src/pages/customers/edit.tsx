import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useGetCustomer, useUpdateCustomer, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, QrCode, UserRound, Phone, MapPin, Pencil, CreditCard, CheckCircle, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function CustomerEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: customer, isLoading } = useGetCustomer(Number(id), {
    query: { enabled: !!id, queryKey: getGetCustomerQueryKey(Number(id)) },
  });
  const updateCustomer = useUpdateCustomer();

  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [creditEnabled, setCreditEnabled] = useState(true);
  const [creditLimit, setCreditLimit] = useState("50000");
  const [activeGroup, setActiveGroup] = useState("Wholesale");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (customer && !initialized) {
      setForm({
        name: customer.name ?? "",
        phone: (customer as any).phone ?? "",
        address: (customer as any).address ?? "",
      });
      setInitialized(true);
    }
  }, [customer, initialized]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    updateCustomer.mutate(
      {
        id: Number(id),
        data: {
          name: form.name.trim(),
          phone: form.phone || undefined,
          address: form.address || undefined,
        } as any,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(Number(id)) });
          toast({ title: "Customer updated!" });
          setLocation(`/customers/${id}`);
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 bg-slate-50 min-h-full">
        <div className="h-14 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-40 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!customer) {
    return <div className="p-4 text-center text-slate-500">Customer not found.</div>;
  }

  const groups = ["Wholesale", "Retail", "VIP"];

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation(`/customers/${id}`)}
              className="text-primary p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[19px] text-primary">Edit Customer</h1>
          </div>
          <button className="text-primary p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95">
            <QrCode className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center py-6">
        <div className="relative mb-2">
          <div className="w-[80px] h-[80px] rounded-full bg-slate-200 border-[3px] border-blue-100 flex items-center justify-center overflow-hidden shadow-sm">
            <UserRound className="w-10 h-10 text-slate-400" />
          </div>
          <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white active:scale-95 transition-transform">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-sm text-slate-500 font-medium">ID: SME-{id?.padStart(4, "0")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 space-y-5 pb-[120px]">
        {/* Full Name */}
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Full Name</label>
          <div className="relative">
            <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Rajesh Kumar"
              required
              className="w-full pl-12 pr-4 h-14 rounded-2xl border bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <span className="absolute left-12 top-1/2 -translate-y-1/2 text-[15px] text-slate-700 font-medium">+91</span>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="9876543210"
              className="w-full pl-[80px] pr-4 h-14 rounded-2xl border bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Shop Address */}
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Shop Address</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Shop No. 14, Main Market, Sector 5..."
              className="w-full pl-12 pr-4 py-4 min-h-[100px] rounded-2xl border bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 resize-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Enable Credit Limit */}
        <div className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="text-[15px] font-bold text-slate-900">Enable Credit Limit</span>
            </div>
            <button
              type="button"
              onClick={() => setCreditEnabled(!creditEnabled)}
              className={cn(
                "w-12 h-7 rounded-full relative transition-colors",
                creditEnabled ? "bg-primary" : "bg-slate-300"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                  creditEnabled ? "right-1" : "left-1"
                )}
              />
            </button>
          </div>
          {creditEnabled && (
            <>
              <div className="relative mt-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 font-medium">₹</span>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full pl-8 pr-4 h-12 rounded-xl border bg-slate-50 text-lg font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Customer currently has an outstanding balance of {formatCurrency(customer.udhaarBalance)}
              </p>
            </>
          )}
        </div>

        {/* Customer Group */}
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Customer Group</label>
          <div className="flex gap-2 flex-wrap">
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setActiveGroup(g)}
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm font-medium transition-colors border active:scale-95",
                  activeGroup === g
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                {g}
              </button>
            ))}
            <button
              type="button"
              className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        {/* Divider + Archive */}
        <div className="border-t border-slate-200 pt-4">
          <button type="button" className="w-full text-center text-red-600 font-bold text-[15px] flex items-center justify-center gap-2 py-3 hover:bg-red-50 rounded-xl transition-colors active-elevate">
            <Trash2 className="w-4 h-4" />
            Archive Customer Profile
          </button>
        </div>
      </form>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-50 border-t border-slate-200 p-4 z-50">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setLocation(`/customers/${id}`)}
            className="flex-1 h-14 border rounded-2xl font-bold text-[15px] text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors active-elevate"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit as any}
            className="flex-[1.5] h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-transform active-elevate disabled:opacity-50 shadow-sm"
            disabled={updateCustomer.isPending}
          >
            <CheckCircle className="w-5 h-5" />
            {updateCustomer.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
