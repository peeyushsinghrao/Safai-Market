import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Store, Phone, MapPin, FileText, Receipt, AlignLeft, Settings2, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settings";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";

import imageCompression from "browser-image-compression";
import { getSupabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export default function StoreSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { settings, updateSettings } = useSettingsStore();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

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
    logoUrl: settings.logoUrl || "",
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
      logoUrl: settings.logoUrl || "",
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
    setIsUploading(true);
    let logoUrl = form.logoUrl;

    if (form.logoUrl && form.logoUrl.startsWith("data:image")) {
      try {
        const res = await fetch(form.logoUrl);
        const blob = await res.blob();
        
        // compress image
        const compressedFile = await imageCompression(new File([blob], "logo.png", { type: blob.type }), {
          maxSizeMB: 1,
          maxWidthOrHeight: 512,
          useWebWorker: true,
        });

        const supabase = getSupabase();
        const fileName = `logo_${Date.now()}.png`;
        const { data, error } = await supabase.storage
          .from("shop-logos")
          .upload(fileName, compressedFile, { upsert: true });
        
        if (error) throw error;
        
        const { data: publicData } = supabase.storage
          .from("shop-logos")
          .getPublicUrl(fileName);
          
        logoUrl = publicData.publicUrl;
      } catch (err: any) {
        setIsUploading(false);
        toast({ title: "Logo Upload Failed", description: err.message || "Ensure shop-logos bucket exists.", variant: "destructive" });
        return;
      }
    }

    try {
      // Save to local settings
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
        logoUrl: logoUrl || undefined,
      });
      await useSettingsStore.getState().persistToServer();
      setIsUploading(false);
      toast({ title: "Settings saved!", description: "Your store settings have been updated." });
      setLocation("/more");
    } catch (err: any) {
      setIsUploading(false);
      toast({ title: "Failed to save settings", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans">
      <PageHeader title="Store Settings" subtitle="Manage your shop info" backTo="/more" />

      <form onSubmit={handleSave} className="flex-1 p-4 space-y-4 pb-24">
        <FormCard title="Store Logo">
          <FormField label="Upload Logo" hint="Shown at the top of printed receipts">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setForm(prev => ({ ...prev, logoUrl: event.target?.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="h-14 pl-10 rounded-2xl text-[15px] border-slate-300 file:bg-transparent file:border-0 file:text-[15px] file:font-bold pt-3.5 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              {form.logoUrl && (
                <div className="w-12 h-12 rounded-lg border border-muted/50 overflow-hidden flex-shrink-0 bg-white flex items-center justify-center p-1">
                  <img src={form.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Max size: 2MB. Use square image for best results.</p>
          </FormField>
        </FormCard>

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
                className="h-14 pl-10 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                className="h-14 pl-10 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                className="min-h-[72px] pl-10 pt-3 rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent text-[15px] resize-none transition-all"
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
                className="h-14 pl-10 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent font-mono tracking-wider transition-all"
              />
            </div>
          </FormField>
        </FormCard>

        <FormCard title="Receipt Settings">
          <FormField label="Paper Size">
            <Select value={form.paperSize} onValueChange={(v) => setForm(p => ({ ...p, paperSize: v as any }))}>
              <SelectTrigger className="h-14 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
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
                className="min-h-[72px] pl-10 pt-3 rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent text-[15px] resize-none transition-all"
              />
            </div>
            <p className="text-xs text-muted-foreground">Printed at the bottom of every receipt.</p>
          </FormField>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-[14px] font-bold text-slate-800">Show Discount on Receipt</p>
              <p className="text-xs text-muted-foreground">Display discount amount when applicable</p>
            </div>
            <Switch
              checked={form.showDiscount}
              onCheckedChange={(v) => setForm(p => ({ ...p, showDiscount: v }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-[14px] font-bold text-slate-800">Show GST on Receipt</p>
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
          disabled={isUploading}
          className="w-full h-14 text-[16px] font-bold rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-white active-elevate mt-2 transition-transform"
        >
          {isUploading ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
