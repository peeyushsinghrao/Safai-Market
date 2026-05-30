import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AlignLeft, Eye, Volume2, VolumeX, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settings";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";
import { printReceipt } from "@/lib/receipt";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sounds";

export default function BillSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { settings, updateSettings } = useSettingsStore();

  const [form, setForm] = useState({
    paperSize: settings.paperSize,
    footerMessage: settings.footerMessage,
    showDiscount: settings.showDiscount,
    showGst: settings.showGst,
    showProfit: settings.showProfit,
  });
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [animationsOn, setAnimationsOn] = useState(settings.animationsEnabled ?? true);

  useEffect(() => {
    setForm({
      paperSize: settings.paperSize,
      footerMessage: settings.footerMessage,
      showDiscount: settings.showDiscount,
      showGst: settings.showGst,
      showProfit: settings.showProfit,
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      paperSize: form.paperSize as "58mm" | "A4" | "A5",
      footerMessage: form.footerMessage.trim(),
      showDiscount: form.showDiscount,
      showGst: form.showGst,
      showProfit: form.showProfit,
      animationsEnabled: animationsOn,
      soundsEnabled: soundOn,
    });
    toast({ title: "Bill settings saved!" });
    setLocation("/more");
  };

  const handlePreview = () => {
    printReceipt({
      storeName: settings.storeName,
      storeAddress: settings.address,
      storePhone: settings.phone,
      storeGstNumber: settings.gstNumber,
      footerMessage: form.footerMessage || "Thank you for shopping!",
      billNumber: "BL-PREVIEW-001",
      date: new Date().toLocaleDateString("en-IN"),
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      items: [
        { productName: "Harpic 500ml", quantity: 2, unitPrice: 85, totalPrice: 170 },
        { productName: "Surf Excel 1kg", quantity: 1, unitPrice: 120, totalPrice: 120 },
      ],
      subtotal: 290,
      discountAmount: form.showDiscount ? 10 : undefined,
      totalAmount: 280,
      cashAmount: 280,
      upiAmount: 0,
      udhaarAmount: 0,
      customerName: "Ramesh Kumar",
      notes: "Sample preview",
      paperSize: form.paperSize as "58mm" | "A4" | "A5",
      showGst: form.showGst,
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Bill Settings" subtitle="Receipt format & display options" backTo="/more" />

      <form onSubmit={handleSave} className="flex-1 p-4 space-y-4 pb-24">

        <FormCard title="Paper & Format">
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
            <p className="text-xs text-muted-foreground">
              58mm is standard for thermal printers. Use A4/A5 for regular printers.
            </p>
          </FormField>

          <FormField label="Footer Message">
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea
                value={form.footerMessage}
                onChange={(e) => setForm(p => ({ ...p, footerMessage: e.target.value }))}
                placeholder="e.g. Thank you for shopping! Come again."
                className="min-h-[72px] pl-10 rounded-xl border-muted focus:border-primary text-base resize-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">Printed at the bottom of every receipt.</p>
          </FormField>
        </FormCard>

        <FormCard title="Show on Receipt">
          {[
            {
              key: "showDiscount" as const,
              label: "Discount Amount",
              sub: "Show discount when applied to a bill",
            },
            {
              key: "showGst" as const,
              label: "GST Breakdown",
              sub: "Show CGST / SGST / IGST (requires GST number in Store Settings)",
            },
            {
              key: "showProfit" as const,
              label: "Estimated Profit",
              sub: "Show profit estimate at bottom of receipt (owner only)",
            },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-muted/50 bg-background px-4 py-3">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
              <Switch
                checked={form[item.key]}
                onCheckedChange={(v) => setForm(p => ({ ...p, [item.key]: v }))}
              />
            </div>
          ))}
        </FormCard>

        <FormCard title="App Experience">
          <div className="flex items-center justify-between rounded-xl border border-muted/50 bg-background px-4 py-3">
            <div className="flex items-center gap-3">
              {soundOn ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">Sound Effects</p>
                <p className="text-xs text-muted-foreground">Beeps on scan, cart add, bill success</p>
              </div>
            </div>
            <Switch
              checked={soundOn}
              onCheckedChange={(v) => {
                setSoundOn(v);
                setSoundEnabled(v);
                updateSettings({ soundsEnabled: v });
              }}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-muted/50 bg-background px-4 py-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Animations</p>
                <p className="text-xs text-muted-foreground">Page transitions and button feedback</p>
              </div>
            </div>
            <Switch
              checked={animationsOn}
              onCheckedChange={(v) => {
                setAnimationsOn(v);
                updateSettings({ animationsEnabled: v });
              }}
            />
          </div>
        </FormCard>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold gap-2"
            onClick={handlePreview}
          >
            <Eye className="w-4 h-4" />
            Preview Receipt
          </Button>
          <Button
            type="submit"
            className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20"
          >
            Save Bill Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
