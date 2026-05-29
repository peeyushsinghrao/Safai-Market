import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useGetCustomer, useUpdateCustomer, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";
import { UserPlus, Phone, MapPin } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function CustomerEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: customer, isLoading } = useGetCustomer(Number(id), {
    query: { enabled: !!id, queryKey: getGetCustomerQueryKey(Number(id)) }
  });
  const updateCustomer = useUpdateCustomer();

  const [form, setForm] = useState({ name: "", phone: "", address: "" });
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
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    updateCustomer.mutate({
      id: Number(id),
      data: {
        name: form.name.trim(),
        phone: form.phone || undefined,
        address: form.address || undefined,
      } as any
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(Number(id)) });
        toast({ title: "Customer updated!" });
        setLocation(`/customers/${id}`);
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!customer) {
    return <div className="p-4 text-center text-muted-foreground">Customer not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Edit Customer" subtitle={customer.name} backTo={`/customers/${id}`} />

      <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4 pb-24">
        <FormCard title="Customer Details">
          <FormField label="Full Name" required>
            <div className="relative">
              <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                required
                autoFocus
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
                value={form.phone}
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
                value={form.address}
                onChange={handleChange}
                placeholder="e.g. Shop No. 12, Main Market"
                className="min-h-[80px] pl-10 rounded-xl border-muted focus:border-primary text-base resize-none"
              />
            </div>
          </FormField>
        </FormCard>

        <Button
          type="submit"
          className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 active-elevate mt-2"
          disabled={updateCustomer.isPending}
        >
          {updateCustomer.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
