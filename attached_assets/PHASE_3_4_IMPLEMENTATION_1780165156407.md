# Safai Market — Phase 3 & 4 Implementation Guide
> For AI Agent / Developer use only.
> Read the entire document before writing any code.
> Apply changes exactly as described. Do NOT rewrite unrelated code.

---

## Phase 3 — Device Center + Bill Settings Page + Multi-Unit Variants (UI)
## Phase 4 — Animations, Micro-interactions & Sound Effects

---

## PHASE 3

---

## Step 1 — Device Center Page

### New File: `artifacts/safai-market/src/pages/settings/devices.tsx`

Create this file from scratch:

```tsx
import { useState } from "react";
import { Bluetooth, Usb, Printer, ScanLine, Wifi, CheckCircle2, XCircle, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/page-header";
import { FormCard } from "@/components/form-card";

type DeviceStatus = "connected" | "disconnected" | "testing";

interface DeviceConfig {
  id: string;
  name: string;
  type: "printer" | "scanner";
  connection: "bluetooth" | "usb" | "wifi" | "keyboard";
  status: DeviceStatus;
  description: string;
}

const DEFAULT_DEVICES: DeviceConfig[] = [
  {
    id: "usb-scanner",
    name: "USB Barcode Scanner",
    type: "scanner",
    connection: "usb",
    status: "connected",
    description: "Keyboard wedge mode — works automatically",
  },
  {
    id: "bt-scanner",
    name: "Bluetooth Scanner",
    type: "scanner",
    connection: "bluetooth",
    status: "disconnected",
    description: "Pair via phone Bluetooth settings first",
  },
  {
    id: "thermal-printer",
    name: "Thermal Printer",
    type: "printer",
    connection: "wifi",
    status: "disconnected",
    description: "58mm / 80mm roll — connect via WiFi or USB",
  },
  {
    id: "browser-print",
    name: "Browser Print (PDF)",
    type: "printer",
    connection: "usb",
    status: "connected",
    description: "Always available — prints via browser dialog",
  },
];

const CONNECTION_ICON = {
  bluetooth: Bluetooth,
  usb: Usb,
  wifi: Wifi,
  keyboard: ScanLine,
};

const STATUS_CONFIG = {
  connected: { label: "Connected", color: "bg-green-100 text-green-700 border-green-200" },
  disconnected: { label: "Not Connected", color: "bg-gray-100 text-gray-500 border-gray-200" },
  testing: { label: "Testing...", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function DevicesPage() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<DeviceConfig[]>(DEFAULT_DEVICES);
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Test scan: simulates a barcode read and shows what would happen
  const handleTestScan = () => {
    setTestingId("scan-test");
    toast({ title: "Scanner Test", description: "Type or scan a barcode now. It will be shown here." });
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        document.removeEventListener("keydown", handler);
        setTestingId(null);
      }
    };
    document.addEventListener("keydown", handler);
    setTimeout(() => {
      document.removeEventListener("keydown", handler);
      setTestingId(null);
    }, 10000);
  };

  // Test print: opens the browser print dialog with a test page
  const handleTestPrint = () => {
    const win = window.open("", "_blank", "width=400,height=300");
    if (!win) { toast({ title: "Allow popups to test print", variant: "destructive" }); return; }
    win.document.write(`
      <html><body style="font-family:monospace;text-align:center;padding:20px">
        <h2>🖨️ PRINT TEST</h2>
        <p>Safai Market</p>
        <p>If you can read this, printer is working!</p>
        <hr/>
        <p>${new Date().toLocaleString("en-IN")}</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleToggleDevice = (id: string) => {
    setDevices(prev => prev.map(d =>
      d.id === id
        ? { ...d, status: d.status === "connected" ? "disconnected" : "connected" }
        : d
    ));
  };

  const printers = devices.filter(d => d.type === "printer");
  const scanners = devices.filter(d => d.type === "scanner");

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Device Center" subtitle="Scanners & printers" backTo="/more" />

      <div className="p-4 space-y-4 pb-24">

        {/* Diagnostics */}
        <FormCard title="Quick Test">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleTestScan}
              disabled={testingId === "scan-test"}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all active:scale-95",
                testingId === "scan-test"
                  ? "border-blue-400 bg-blue-50"
                  : "border-dashed border-muted-foreground/30 bg-white hover:border-primary/40"
              )}
            >
              <ScanLine className={cn("w-7 h-7", testingId === "scan-test" ? "text-blue-600 animate-pulse" : "text-muted-foreground")} />
              <span className="text-xs font-semibold text-center">
                {testingId === "scan-test" ? "Waiting for scan..." : "Test Scanner"}
              </span>
            </button>

            <button
              onClick={handleTestPrint}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-white hover:border-primary/40 active:scale-95 transition-all"
            >
              <Printer className="w-7 h-7 text-muted-foreground" />
              <span className="text-xs font-semibold text-center">Test Print</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Use these to verify your devices are working correctly.
          </p>
        </FormCard>

        {/* Scanner Settings */}
        <FormCard title="Barcode Scanners">
          <div className="flex items-center justify-between rounded-xl border border-muted/50 bg-background px-4 py-3 mb-3">
            <div>
              <p className="text-sm font-medium">Keyboard Wedge Mode</p>
              <p className="text-xs text-muted-foreground">
                Enables USB & Bluetooth scanners on billing screen
              </p>
            </div>
            <Switch checked={scannerEnabled} onCheckedChange={setScannerEnabled} />
          </div>

          <div className="space-y-2">
            {scanners.map(device => {
              const Icon = CONNECTION_ICON[device.connection];
              const statusCfg = STATUS_CONFIG[device.status];
              return (
                <div key={device.id} className="bg-white rounded-xl border border-muted/50 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{device.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{device.description}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", statusCfg.color)}>
                    {statusCfg.label}
                  </Badge>
                </div>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-1">
            <p className="text-xs text-blue-700 font-medium mb-1">How to connect Bluetooth scanner:</p>
            <ol className="text-xs text-blue-600 space-y-0.5 list-decimal list-inside">
              <li>Pair the scanner in your phone's Bluetooth settings</li>
              <li>Open the billing screen</li>
              <li>Scan any barcode — it will auto-add to cart</li>
            </ol>
          </div>
        </FormCard>

        {/* Printer Settings */}
        <FormCard title="Printers">
          <div className="space-y-2">
            {printers.map(device => {
              const Icon = CONNECTION_ICON[device.connection];
              const statusCfg = STATUS_CONFIG[device.status];
              return (
                <div key={device.id} className="bg-white rounded-xl border border-muted/50 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{device.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{device.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={cn("text-[10px]", statusCfg.color)}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-1">
            <p className="text-xs text-amber-700 font-medium mb-1">Thermal printer setup:</p>
            <ol className="text-xs text-amber-600 space-y-0.5 list-decimal list-inside">
              <li>Connect printer to same WiFi as your phone</li>
              <li>Use "Print" on any bill — select the thermal printer</li>
              <li>Set paper size to 58mm in Store Settings</li>
            </ol>
          </div>
        </FormCard>

        {/* Camera Scanner Note */}
        <FormCard title="Camera Barcode Scanner">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Built-in Camera Scanner</p>
              <p className="text-xs text-muted-foreground mt-1">
                Available directly on the billing screen. Tap the camera icon (📷) next to the search bar to scan a barcode with your phone camera.
              </p>
            </div>
          </div>
        </FormCard>

      </div>
    </div>
  );
}
```

---

## Step 2 — Bill Settings Page (Dedicated)

The existing `Store Settings` page already covers bill settings but it's buried. Create a focused, dedicated entry in More menu that links directly to Store Settings with the receipt section scrolled into view, OR create a short dedicated page.

### New File: `artifacts/safai-market/src/pages/settings/bill-settings.tsx`

```tsx
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Receipt, AlignLeft, Settings2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settings";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";
import { printReceipt } from "@/lib/receipt";

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

        {/* Preview + Save */}
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
```

---

## Step 3 — Register New Routes

### File: `artifacts/safai-market/src/App.tsx`

**Add imports** at the top with other page imports:
```typescript
import DevicesPage from "./pages/settings/devices";
import BillSettings from "./pages/settings/bill-settings";
```

**Add routes** inside `<Switch>` alongside existing routes:
```tsx
<Route path="/settings/devices" component={() => <Layout><DevicesPage /></Layout>} />
<Route path="/settings/bill-settings" component={() => <Layout><BillSettings /></Layout>} />
```

---

## Step 4 — Update More Menu

### File: `artifacts/safai-market/src/pages/more/index.tsx`

**Add new imports:**
```typescript
import { Smartphone, Receipt } from "lucide-react";
```
(These may already be imported — check first. `Receipt` is already imported. Add `Smartphone`.)

**Add two new items to the `Settings` section** inside `menuSections`:
```typescript
{
  title: "Settings",
  items: [
    { href: "/settings/store", label: "Store Settings", sub: "Name, address, receipt & GST", icon: Store, color: "bg-orange-100 text-orange-700" },
    // ADD THESE TWO:
    { href: "/settings/bill-settings", label: "Bill Settings", sub: "Paper size, footer, GST on receipt", icon: Receipt, color: "bg-rose-100 text-rose-700" },
    { href: "/settings/devices", label: "Device Center", sub: "Scanners, printers & connections", icon: Smartphone, color: "bg-cyan-100 text-cyan-700" },
  ]
},
```

---

## Step 5 — Multi-Unit Variants (UI Layer)

The schema already has `isVariantParent` and `parentProductId` columns. This step adds the UI to create and use variants.

### New File: `artifacts/safai-market/src/pages/products/variants.tsx`

```tsx
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetProduct, useListProducts, useCreateProduct } from "@workspace/api-client-react";
import { Plus, Trash2, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Variant sizes for quick fill
const QUICK_SIZES = ["100g", "250g", "500g", "1kg", "2kg", "5kg", "100ml", "200ml", "500ml", "1L", "2L", "Small", "Medium", "Large"];

interface VariantDraft {
  name: string;
  sellPrice: string;
  buyPrice: string;
  stock: string;
  barcode: string;
}

function emptyVariant(parentName: string, size: string = ""): VariantDraft {
  return { name: size ? `${parentName} ${size}` : "", sellPrice: "", buyPrice: "", stock: "0", barcode: "" };
}

export default function ProductVariants() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: parent, isLoading } = useGetProduct(Number(id));
  const createProduct = useCreateProduct();

  // Load existing variants (products where parentProductId = id)
  const { data: allProducts } = useListProducts({ status: "active" });
  const existingVariants = (allProducts ?? []).filter(
    (p: any) => String(p.parentProductId) === id
  );

  const [drafts, setDrafts] = useState<VariantDraft[]>([
    emptyVariant(parent?.name ?? ""),
  ]);
  const [saving, setSaving] = useState(false);

  const addDraft = () => setDrafts(prev => [...prev, emptyVariant(parent?.name ?? "")]);
  const removeDraft = (idx: number) => setDrafts(prev => prev.filter((_, i) => i !== idx));
  const updateDraft = (idx: number, field: keyof VariantDraft, value: string) => {
    setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const handleQuickSize = (idx: number, size: string) => {
    const base = parent?.name ?? "";
    setDrafts(prev => prev.map((d, i) =>
      i === idx ? { ...d, name: `${base} ${size}` } : d
    ));
  };

  const handleSave = async () => {
    const valid = drafts.filter(d => d.name.trim() && d.sellPrice);
    if (valid.length === 0) {
      toast({ title: "Add at least one variant with name and price", variant: "destructive" });
      return;
    }
    setSaving(true);
    let saved = 0;
    for (const draft of valid) {
      try {
        await createProduct.mutateAsync({
          data: {
            name: draft.name.trim(),
            categoryId: parent?.categoryId ?? 1,
            unit: parent?.unit ?? "piece",
            sellPrice: Number(draft.sellPrice),
            buyPrice: draft.buyPrice ? Number(draft.buyPrice) : 0,
            initialStock: Number(draft.stock) || 0,
            barcode: draft.barcode || undefined,
            parentProductId: Number(id),
            isVariantParent: false,
          } as any,
        });
        saved++;
      } catch (err: any) {
        toast({ title: `Failed to save "${draft.name}"`, description: err.message, variant: "destructive" });
      }
    }
    setSaving(false);
    if (saved > 0) {
      toast({ title: `${saved} variant${saved > 1 ? "s" : ""} created!` });
      setLocation(`/products/${id}`);
    }
  };

  if (isLoading) return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );

  if (!parent) return <div className="p-6 text-center text-muted-foreground">Product not found.</div>;

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Manage Variants" subtitle={parent.name} backTo={`/products/${id}`} />

      <div className="p-4 space-y-4 pb-24">

        {/* Existing Variants */}
        {existingVariants.length > 0 && (
          <FormCard title={`Existing Variants (${existingVariants.length})`}>
            <div className="space-y-2">
              {existingVariants.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between bg-background rounded-xl border border-muted/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{v.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {Number(v.currentStock)} · {formatCurrency(Number(v.sellPrice))}
                    </p>
                  </div>
                  <button onClick={() => setLocation(`/products/${v.id}/edit`)} className="text-primary text-xs font-semibold">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </FormCard>
        )}

        {/* Add new variants */}
        <FormCard title="Add New Variants">
          <p className="text-xs text-muted-foreground -mt-1 mb-2">
            Example: Harpic 500ml, Harpic 1L, Harpic 200ml — each tracked separately.
          </p>

          {drafts.map((draft, idx) => (
            <div key={idx} className="border border-muted/60 rounded-xl p-3 space-y-3 bg-background relative">
              {drafts.length > 1 && (
                <button
                  onClick={() => removeDraft(idx)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Quick size chips */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SIZES.slice(0, 8).map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleQuickSize(idx, size)}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-muted/60 text-muted-foreground border border-muted/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    {size}
                  </button>
                ))}
              </div>

              <FormField label={`Variant ${idx + 1} Name`} required>
                <Input
                  value={draft.name}
                  onChange={e => updateDraft(idx, "name", e.target.value)}
                  placeholder={`e.g. ${parent.name} 500ml`}
                  className="h-11 rounded-xl text-sm border-muted"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Sell Price (₹)" required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={draft.sellPrice}
                      onChange={e => updateDraft(idx, "sellPrice", e.target.value)}
                      placeholder="0"
                      className="h-11 pl-6 rounded-xl text-sm border-muted"
                    />
                  </div>
                </FormField>
                <FormField label="Buy Price (₹)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={draft.buyPrice}
                      onChange={e => updateDraft(idx, "buyPrice", e.target.value)}
                      placeholder="0"
                      className="h-11 pl-6 rounded-xl text-sm border-muted"
                    />
                  </div>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Opening Stock">
                  <Input
                    type="number"
                    value={draft.stock}
                    onChange={e => updateDraft(idx, "stock", e.target.value)}
                    className="h-11 rounded-xl text-sm border-muted"
                  />
                </FormField>
                <FormField label="Barcode" hint="Optional">
                  <Input
                    value={draft.barcode}
                    onChange={e => updateDraft(idx, "barcode", e.target.value)}
                    placeholder="Scan or type"
                    className="h-11 rounded-xl text-sm border-muted font-mono"
                  />
                </FormField>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addDraft}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Another Variant
          </button>
        </FormCard>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20"
        >
          {saving ? "Saving..." : `Save ${drafts.filter(d => d.name && d.sellPrice).length} Variant${drafts.filter(d => d.name && d.sellPrice).length !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}
```

### Register variants route in `App.tsx`

Add import:
```typescript
import ProductVariants from "./pages/products/variants";
```

Add route (after `/products/:id/edit`):
```tsx
<Route path="/products/:id/variants" component={() => <Layout><ProductVariants /></Layout>} />
```

### Update Product Detail page to show Variants button

### File: `artifacts/safai-market/src/pages/products/detail.tsx`

Find the Edit button section (near the `PageHeader`) and add a Variants button:

```tsx
// Find the section with the edit button - add this alongside it:
<Button
  variant="outline"
  size="sm"
  onClick={() => setLocation(`/products/${id}/variants`)}
  className="h-9 gap-1.5 rounded-xl text-xs font-semibold"
>
  <Package className="w-3.5 h-3.5" />
  Variants
</Button>
```

Also add `Package` to the lucide imports in that file if not already present.

### Show variants in billing page product card

When a product has variants (i.e., `allProducts` contains items with `parentProductId === product.id`), show a "variants available" indicator on the product card.

### File: `artifacts/safai-market/src/pages/billing/index.tsx`

In `ProductCard`, add below the product name and price:
```tsx
// Inside ProductCard, after the stock display line
{/* Variants indicator — shown when product has child variants */}
{/* This is purely informational; variants appear as separate products in the grid */}
```

> **Note:** Variants are separate product records with `parentProductId` set. They appear as individual cards in the billing grid. No special billing changes are needed — each variant is already a product.

---

## PHASE 4 — Animations & Sound Effects

---

## Step 6 — Animation Utility

### New File: `artifacts/safai-market/src/lib/animations.ts`

```typescript
// Framer Motion variant presets for consistent animations across the app
// framer-motion is already in package.json

export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
};

export const slideUpVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.15 } },
};

export const scaleInVariants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } },
};

export const cartBadgeVariants = {
  initial: { scale: 0.5, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 20 } },
};

export const successVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1, opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 15, delay: 0.1 }
  },
};

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15 } },
};
```

---

## Step 7 — Sound Effects Utility

### New File: `artifacts/safai-market/src/lib/sounds.ts`

```typescript
// Web Audio API — no external library needed, zero bundle cost
// All sounds are generated programmatically

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available — fail silently
  }
}

export const sounds = {
  // Short click — button press
  click: () => playTone(800, 0.05, "square", 0.15),

  // Double beep — item added to cart
  cartAdd: () => {
    playTone(880, 0.08, "sine", 0.2);
    setTimeout(() => playTone(1100, 0.08, "sine", 0.2), 90);
  },

  // Scanner beep — barcode detected
  scanSuccess: () => {
    playTone(1320, 0.06, "sine", 0.25);
    setTimeout(() => playTone(1760, 0.12, "sine", 0.2), 60);
  },

  // Success chime — bill saved
  billSuccess: () => {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, "sine", 0.2), i * 80);
    });
  },

  // Low buzz — error
  error: () => {
    playTone(200, 0.12, "sawtooth", 0.25);
    setTimeout(() => playTone(150, 0.15, "sawtooth", 0.2), 120);
  },

  // Soft ding — notification
  notification: () => playTone(660, 0.2, "sine", 0.15),
};

// Global sound settings — reads from localStorage
export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem("safai-sounds-enabled") !== "false";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem("safai-sounds-enabled", String(enabled));
  } catch {}
}

// Guarded play — only plays when enabled
export function playSound(name: keyof typeof sounds) {
  if (isSoundEnabled()) sounds[name]();
}
```

---

## Step 8 — Animation Settings in Settings Store

### File: `artifacts/safai-market/src/stores/settings.ts`

Add to `ShopSettings` interface:
```typescript
animationsEnabled: boolean;
soundsEnabled: boolean;
```

Add to `DEFAULT_SETTINGS`:
```typescript
animationsEnabled: true,
soundsEnabled: true,
```

---

## Step 9 — Add Animations & Sounds Toggle to Bill Settings

### File: `artifacts/safai-market/src/pages/settings/bill-settings.tsx`

Add a new `FormCard` for app experience settings after the "Show on Receipt" card:

```tsx
import { isSoundEnabled, setSoundEnabled } from "@/lib/sounds";
import { Volume2, VolumeX, Sparkles } from "lucide-react";

// Inside component, add state:
const [soundOn, setSoundOn] = useState(isSoundEnabled());
const [animationsOn, setAnimationsOn] = useState(settings.animationsEnabled ?? true);

// Add to form JSX:
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
```

---

## Step 10 — Add Sounds to Billing Page

### File: `artifacts/safai-market/src/pages/billing/index.tsx`

**Add import:**
```typescript
import { playSound } from "@/lib/sounds";
```

**In `handleAddProduct`**, after `cartStore.addItem(...)`:
```typescript
playSound("cartAdd");
```

**In the barcode scanner `onDetected` callback**, after `cartStore.addItem(...)`:
```typescript
playSound("scanSuccess");
```

**In keyboard wedge handler**, after `cartStore.addItem(match as any)`:
```typescript
playSound("scanSuccess");
```

**In `CheckoutSheet` `onSuccess` callback**, before `clearCart()`:
```typescript
playSound("billSuccess");
```

**In `CheckoutSheet` `onError` callback**:
```typescript
playSound("error");
```

---

## Step 11 — Add Page Transition Animations

### File: `artifacts/safai-market/src/components/layout.tsx`

**Add import:**
```typescript
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants } from "@/lib/animations";
import { useSettingsStore } from "@/stores/settings";
```

**Wrap `<main>` content:**
```tsx
const { settings } = useSettingsStore();

// Replace:
<main className="flex-1 pb-16 overflow-y-auto">
  {children}
</main>

// With:
<main className="flex-1 pb-16 overflow-y-auto">
  {settings.animationsEnabled ? (
    <motion.div
      key={location}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  ) : (
    children
  )}
</main>
```

---

## Step 12 — Animate Bill Success Screen

### File: `artifacts/safai-market/src/pages/billing/index.tsx`

**Add import:**
```typescript
import { motion } from "framer-motion";
import { successVariants, slideUpVariants, staggerContainer, staggerItem } from "@/lib/animations";
import { playSound } from "@/lib/sounds";
```

**In `BillSuccessScreen`**, wrap the checkmark icon with animation:

```tsx
// Replace the static checkmark div:
<div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
  <CheckCircle2 className="w-12 h-12 text-green-600" />
</div>

// With:
<motion.div
  variants={successVariants}
  initial="initial"
  animate="animate"
  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
>
  <CheckCircle2 className="w-12 h-12 text-green-600" />
</motion.div>
```

**Wrap the content below with stagger animation:**
```tsx
<motion.div
  variants={staggerContainer}
  initial="initial"
  animate="animate"
  className="w-full space-y-2 max-w-sm"
>
  <motion.div variants={staggerItem}>
    <div className="grid grid-cols-2 gap-2">
      {/* Share and Print buttons */}
    </div>
  </motion.div>
  <motion.div variants={staggerItem}>
    {/* New Bill button */}
  </motion.div>
  <motion.div variants={staggerItem}>
    {/* Back to Dashboard button */}
  </motion.div>
</motion.div>
```

---

## Step 13 — Animate Cart Badge

### File: `artifacts/safai-market/src/pages/billing/index.tsx`

The cart item count badge on the FAB should bounce when an item is added.

**Add import:**
```typescript
import { motion, AnimatePresence } from "framer-motion";
```

**Replace the count badge** in the cart FAB:
```tsx
// Replace:
<span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
  {itemCount}
</span>

// With:
<AnimatePresence mode="wait">
  <motion.span
    key={itemCount}
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 500, damping: 20 }}
    className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
  >
    {itemCount}
  </motion.span>
</AnimatePresence>
```

---

## Step 14 — Add CSS Micro-interactions

### File: `artifacts/safai-market/src/index.css`

Add these utility classes at the end of the file (inside `@layer utilities` or just at the bottom):

```css
/* Micro-interaction: button press feedback */
.active-elevate {
  @apply transition-transform duration-100;
}
.active-elevate:active {
  transform: scale(0.97);
}

/* Safe area for bottom nav */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Smooth skeleton pulse */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton-shimmer {
  background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground)/0.1) 50%, hsl(var(--muted)) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Cart add pulse */
@keyframes cart-pulse {
  0% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.4); }
  70% { box-shadow: 0 0 0 8px hsl(var(--primary) / 0); }
  100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0); }
}
.cart-pulse {
  animation: cart-pulse 0.4s ease-out;
}

/* Bounce in */
@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}
.bounce-in {
  animation: bounce-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
```

---

## Summary of Phase 3 & 4 Changes

### New Files Created
| File | Purpose |
|---|---|
| `src/pages/settings/devices.tsx` | Device Center — scanners, printers, test tools |
| `src/pages/settings/bill-settings.tsx` | Dedicated bill/receipt settings with preview |
| `src/pages/products/variants.tsx` | Multi-unit variant creation UI |
| `src/lib/animations.ts` | Framer Motion variant presets |
| `src/lib/sounds.ts` | Web Audio API sound effects (zero deps) |

### Modified Files
| File | Change |
|---|---|
| `src/App.tsx` | Add 3 new routes |
| `src/pages/more/index.tsx` | Add Device Center + Bill Settings menu items |
| `src/pages/products/detail.tsx` | Add Variants button |
| `src/pages/billing/index.tsx` | Add sounds on add/scan/success, animate cart badge, animate success screen |
| `src/components/layout.tsx` | Add page transition animation |
| `src/stores/settings.ts` | Add `animationsEnabled`, `soundsEnabled` fields |
| `src/index.css` | Add micro-interaction CSS utilities |

---

## Verification Checklist

- [ ] `/more` shows "Bill Settings" and "Device Center" menu items
- [ ] `/settings/bill-settings` opens, save works, preview opens print dialog
- [ ] `/settings/devices` shows scanner list and Test Print/Test Scanner buttons
- [ ] Test Print opens a print dialog with test page
- [ ] Test Scanner shows "Waiting for scan..." state when clicked
- [ ] `/products/:id/variants` opens with parent product name pre-filled
- [ ] Quick size chips fill in the variant name correctly
- [ ] Saving variants creates separate product records in DB
- [ ] Variants route added to App.tsx without TS errors
- [ ] Adding product to cart plays a double-beep sound
- [ ] Scanning barcode plays scanner beep sound
- [ ] Confirming a bill plays success chime
- [ ] Bill success screen checkmark animates in with spring effect
- [ ] Cart count badge bounces when item count changes
- [ ] Pages fade in smoothly (page transition animation)
- [ ] Sounds can be toggled OFF in Bill Settings
- [ ] Animations can be toggled OFF in Bill Settings
- [ ] `pnpm build` passes with no TypeScript errors
