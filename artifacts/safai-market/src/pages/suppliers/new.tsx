import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSupplier } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";
import { Building2, User, Phone } from "lucide-react";

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
    if (!formData.name.trim()) {
      toast({ title: "Name required", description: "Enter the supplier or company name.", variant: "destructive" });
      return;
    }

    createSupplier.mutate({
      data: {
        name: formData.name.trim(),
        contactName: formData.contactName || undefined,
        phone: formData.phone || undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Supplier added!", description: `${formData.name} has been saved.` });
        setLocation("/suppliers");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Add Supplier" subtitle="New vendor account" backTo="/suppliers" />

      <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4 pb-24">
        <FormCard title="Supplier Details">
          <FormField label="Company / Supplier Name" required>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Reckitt Benckiser Dist."
                required
                autoFocus
                className="h-12 pl-10 rounded-xl text-base border-muted focus:border-primary"
              />
            </div>
          </FormField>

          <FormField label="Contact Person" hint="Optional">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="e.g. Amit Singh"
                className="h-12 pl-10 rounded-xl text-base border-muted focus:border-primary"
              />
            </div>
          </FormField>

          <FormField label="Phone Number" hint="Optional">
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
        </FormCard>

        <Button
          type="submit"
          className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 active-elevate mt-2"
          disabled={createSupplier.isPending}
        >
          {createSupplier.isPending ? "Saving..." : "Save Supplier"}
        </Button>
      </form>
    </div>
  );
}
