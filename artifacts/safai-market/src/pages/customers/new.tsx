import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useCreateCustomer } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

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
    if (!formData.name) {
      toast({ title: "Validation Error", description: "Name is required", variant: "destructive" });
      return;
    }

    createCustomer.mutate({
      data: {
        name: formData.name,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        openingBalance: Number(formData.openingBalance) || 0
      }
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Customer created successfully" });
        setLocation("/customers");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pb-20">
      <div className="sticky top-14 z-30 bg-primary text-primary-foreground border-b p-4 flex items-center shadow-sm">
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 mr-2" onClick={() => setLocation("/customers")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg">Add New Customer</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Customer Name *</label>
          <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Rahul Sharma" required className="h-12" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
          <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g. 9876543210" className="h-12" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Address</label>
          <Textarea name="address" value={formData.address} onChange={handleChange} placeholder="e.g. Shop No. 12, Main Market" className="min-h-24" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Opening Balance (Udhaar) ₹</label>
          <Input type="number" name="openingBalance" value={formData.openingBalance} onChange={handleChange} className="h-12" />
        </div>

        <Button type="submit" className="w-full h-12 text-lg mt-4 active-elevate" disabled={createCustomer.isPending}>
          {createCustomer.isPending ? "Saving..." : "Save Customer"}
        </Button>
      </form>
    </div>
  );
}
