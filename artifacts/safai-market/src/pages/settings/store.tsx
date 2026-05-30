import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Store, Phone, MapPin, FileText, Receipt, AlignLeft, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settings";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";

export default function StoreSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { settings, updateSettings } = useSettingsStore();

  const [form, setForm] = useState({
    storeName: settings.storeName,
    storeTagline: settings.storeTagline,
    address: settings.address,
    phone: settings.phone,
    gstNumber: settings.gstNumber,
    footerMessage: settings.footerMessage,
    paperSize: settings.paperSize,
    showDiscount: settings.showDiscount,
    showGst: settings.showGst,
  });

  useEffect(() => {
    setForm({
      storeName: settings.storeName,
      storeTagline: settings.storeTagline,
      address: settings.address,
      phone: settings.phone,
      gstNumber: settings.gstNumber,
      footerMessage: settings.footerMessage,
      paperSize: settings.paperSize,
      showDiscount: settings.showDiscount,
      showGst: settings.showGst,
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.storeName.trim()) {
      toast({ title: "Store name is required", variant: "destructive" });
      return;
    }
    updateSettings({
      storeName: form.storeName.trim(),
      storeTagline: form.storeTagline.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      gstNumber: form.gstNumber.trim(),
      footerMessage: form.footerMessage.trim(),
      paperSize: form.paperSize as "58mm" | "A4" | "A5",
      showDiscount: form.showDiscount,
      showGst: form.showGst,
    });
    // FIX BUG-013: Persist to server so settings survive device switch
    await useSettingsStore.getState().persistToServer();
    toast({ title: "Settings saved!", description: "Your store settings have been updated." });
    setLocation("/more");
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Store Settings" subtitle="Manage your shop info" backTo="/more" />

      <form onSubmit={handleSave} className="flex-1 p-4 space-y-4 pb-24">
        <FormCard title="Store Identity">
          <FormField label="Store Name" required>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="storeName"
                value={form.storeName}
                onChange={handleChange}
                placeholder="e.g. Sharma General Store"
                required
                autoFocus
                className="h-12 pl-10 rounded-xl text-base border-muted focus:border-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">This appears in the app header and on receipts.</p>
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
                placeholder="e.g. Shop No. 5, Main Bazaar, Delhi"
                className="min-h-[72px] pl-10 rounded-xl border-muted focus:border-primary text-base resize-none"
              />
            </div>
          </FormField>

          <FormField label="GST Number" hint="Optional">
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="gstNumber"
                value={form.gstNumber}
                onChange={handleChange}
                placeholder="e.g. 07AAAAA0000A1Z5"
                className="h-12 pl-10 rounded-xl text-base border-muted focus:border-primary font-mono tracking-wider"
              />
            </div>
          </FormField>
        </FormCard>

        <FormCard title="Receipt Settings">
          <FormField label="Paper Size">
            <Select value={form.paperSize} onValueChange={(v) => setForm(p => ({ ...p, paperSize: v as any }))}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58mm">58mm Thermal Roll (default)</SelectItem>
                <SelectItem value="A5">A5 Paper</SelectItem>
                <SelectItem value="A4">A4 Paper</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Footer Message">
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea
                name="footerMessage"
                value={form.footerMessage}
                onChange={handleChange}
                placeholder="e.g. Thank you for shopping!"
                className="min-h-[72px] pl-10 rounded-xl border-muted focus:border-primary text-base resize-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">Printed at the bottom of every receipt.</p>
          </FormField>

          <div className="flex items-center justify-between rounded-xl border border-muted/50 bg-background px-4 py-3">
            <div>
              <p className="text-sm font-medium">Show Discount on Receipt</p>
              <p className="text-xs text-muted-foreground">Display discount amount when applicable</p>
            </div>
            <Switch
              checked={form.showDiscount}
              onCheckedChange={(v) => setForm(p => ({ ...p, showDiscount: v }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-muted/50 bg-background px-4 py-3">
            <div>
              <p className="text-sm font-medium">Show GST on Receipt</p>
              <p className="text-xs text-muted-foreground">Print GST number if available</p>
            </div>
            <Switch
              checked={form.showGst}
              onCheckedChange={(v) => setForm(p => ({ ...p, showGst: v }))}
            />
          </div>
        </FormCard>

        <Button
          type="submit"
          className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 active-elevate mt-2"
        >
          Save Settings
        </Button>
      </form>
    </div>
  );
}
