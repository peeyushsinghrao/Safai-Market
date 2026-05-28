import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useCreateSupplier } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function SupplierNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createSupplier = useCreateSupplier();

  const [formData, setFormData] = useState({
    name: "", contactName: "", phone: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: "Validation Error", description: "Supplier Name is required", variant: "destructive" });
      return;
    }

    createSupplier.mutate({
      data: {
        name: formData.name,
        contactName: formData.contactName || undefined,
        phone: formData.phone || undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Supplier created successfully" });
        setLocation("/suppliers");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pb-20">
      <div className="sticky top-14 z-30 bg-primary text-primary-foreground border-b p-4 flex items-center shadow-sm">
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 mr-2" onClick={() => setLocation("/suppliers")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg">Add New Supplier</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Supplier/Company Name *</label>
          <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Reckitt Benckiser Dist." required className="h-12" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
          <Input name="contactName" value={formData.contactName} onChange={handleChange} placeholder="e.g. Amit Singh" className="h-12" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
          <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g. 9876543210" className="h-12" />
        </div>

        <Button type="submit" className="w-full h-12 text-lg mt-4 active-elevate" disabled={createSupplier.isPending}>
          {createSupplier.isPending ? "Saving..." : "Save Supplier"}
        </Button>
      </form>
    </div>
  );
}
