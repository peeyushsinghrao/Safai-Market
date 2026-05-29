import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateCustomer } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";
import { UserPlus, Phone, MapPin, IndianRupee } from "lucide-react";

export default function CustomerNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createCustomer = useCreateCustomer();

  const [formData, setFormData] = useState({
    name: "", phone: "", address: "", openingBalance: "0"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Name required", description: "Please enter the customer's name.", variant: "destructive" });
      return;
    }

    createCustomer.mutate({
      data: {
        name: formData.name.trim(),
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        openingBalance: Number(formData.openingBalance) || 0
      }
    }, {
      onSuccess: () => {
        toast({ title: "Customer added!", description: `${formData.name} has been saved.` });
        setLocation("/customers");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Add Customer" subtitle="New customer account" backTo="/customers" />

      <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4 pb-24">
        <FormCard title="Customer Details">
          <FormField label="Full Name" required>
            <div className="relative">
              <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                required
                autoFocus
                className="h-12 pl-10 rounded-xl text-base border-muted focus:border-primary"
              />
            </div>
          </FormField>

          <FormField label="Phone Number">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                className="h-12 pl-10 rounded-xl text-base border-muted focus:border-primary"
              />
            </div>
          </FormField>

          <FormField label="Address" hint="Optional">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Shop No. 12, Main Market"
                className="min-h-[80px] pl-10 rounded-xl border-muted focus:border-primary text-base resize-none"
              />
            </div>
          </FormField>
        </FormCard>

        <FormCard title="Opening Balance">
          <FormField label="Starting Udhaar Amount" hint="Leave 0 if none">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">₹</span>
              <Input
                type="number"
                name="openingBalance"
                value={formData.openingBalance}
                onChange={handleChange}
                min="0"
                className="h-12 pl-8 rounded-xl text-base border-muted focus:border-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">If this customer already owes money, enter the amount here.</p>
          </FormField>
        </FormCard>

        <Button
          type="submit"
          className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 active-elevate mt-2"
          disabled={createCustomer.isPending}
        >
          {createCustomer.isPending ? "Saving..." : "Save Customer"}
        </Button>
      </form>
    </div>
  );
}
