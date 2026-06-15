import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSupplier } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { Building2, User, Phone, ScanBarcode, FileText, Clock, IndianRupee } from "lucide-react";
import BarcodeScannerModal from "@/components/barcode-scanner-modal";

export default function SupplierNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createSupplier = useCreateSupplier();

  const [formData, setFormData] = useState({
    name: "", contactName: "", phone: "", gstNumber: "", leadTime: "", creditLimit: ""
  });
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
        phone: formData.phone || undefined,
        gstNumber: formData.gstNumber || undefined,
        leadTime: formData.leadTime ? parseInt(formData.leadTime) : undefined,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined
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

  const handleScan = (text: string) => {
    // Attempt to parse GST from standard QR (often just a string containing GSTIN, or a URL with GSTIN)
    // Basic fallback: just put the text in the field
    const gstMatch = text.match(/\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/);
    if (gstMatch) {
      setFormData(prev => ({ ...prev, gstNumber: gstMatch[0] }));
      toast({ title: "GST Number Found", description: `Found: ${gstMatch[0]}` });
    } else {
      setFormData(prev => ({ ...prev, gstNumber: text }));
      toast({ title: "Scan Successful", description: "Pasted raw text into GST field." });
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans">
      <PageHeader 
        title="Add Supplier" 
        subtitle="New vendor account" 
        backTo="/suppliers" 
        right={
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsScannerOpen(true)}>
            <ScanBarcode className="w-5 h-5" />
          </Button>
        }
      />

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
                className="h-14 pl-10 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                className="h-14 pl-10 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                className="h-14 pl-10 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </FormField>

          <FormField label="GST Number" hint="Optional">
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="e.g. 27ABCDE1234F1Z5"
                className="h-14 pl-10 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase"
              />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Lead Time (Days)" hint="Optional">
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  name="leadTime"
                  value={formData.leadTime}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                  className="h-14 pl-10 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </FormField>

            <FormField label="Credit Limit" hint="Optional">
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  name="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  placeholder="e.g. 50000"
                  className="h-14 pl-10 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </FormField>
          </div>
        </FormCard>

        <Button
          type="submit"
          className="w-full h-14 text-[16px] font-bold rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-white active-elevate mt-2 transition-transform"
          disabled={createSupplier.isPending}
        >
          {createSupplier.isPending ? "Saving..." : "Save Supplier"}
        </Button>
      </form>

      <BarcodeScannerModal
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleScan}
      />
    </div>
  );
}
