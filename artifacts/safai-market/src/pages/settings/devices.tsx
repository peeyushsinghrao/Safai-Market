import { useState } from "react";
import { Bluetooth, Usb, Printer, ScanLine, Wifi, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/page-header";
import { FormCard } from "@/components/form-card";
import { useSettingsStore } from "@/stores/settings";
import { printReceipt } from "@/lib/receipt";

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
  const { settings } = useSettingsStore();
  const [devices] = useState<DeviceConfig[]>(DEFAULT_DEVICES);
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

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

  const handleTestPrint = () => {
    printReceipt({
      storeName: settings.storeName || "TEST STORE",
      storeAddress: settings.address,
      storePhone: settings.phone,
      storeGstNumber: settings.gstNumber,
      footerMessage: settings.footerMessage || "THIS IS A TEST PRINT",
      billNumber: "BL-TEST-000",
      date: new Date().toLocaleDateString("en-IN"),
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      items: [
        { productName: "Test Product 1", quantity: 1, unitPrice: 100, totalPrice: 100 },
        { productName: "Test Product 2", quantity: 2, unitPrice: 50, totalPrice: 100 },
      ],
      subtotal: 200,
      totalAmount: 200,
      cashAmount: 200,
      upiAmount: 0,
      udhaarAmount: 0,
      customerName: "Test Customer",
      notes: "*** TEST PRINT ***",
      paperSize: settings.paperSize,
      showGst: settings.showGst,
      logoUrl: settings.logoUrl,
    });
  };

  const printers = devices.filter(d => d.type === "printer");
  const scanners = devices.filter(d => d.type === "scanner");

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans">
      <PageHeader title="Device Center" subtitle="Scanners & printers" backTo="/more" />

      <div className="p-4 space-y-4 pb-24">

        <FormCard title="Quick Test">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleTestScan}
              disabled={testingId === "scan-test"}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active-elevate",
                testingId === "scan-test"
                  ? "border-blue-400 bg-blue-50"
                  : "border-dashed border-slate-300 bg-white hover:border-primary/40 shadow-sm"
              )}
            >
              <ScanLine className={cn("w-7 h-7", testingId === "scan-test" ? "text-blue-600 animate-pulse" : "text-slate-400")} />
              <span className="text-[13px] font-bold text-center text-slate-600">
                {testingId === "scan-test" ? "Waiting for scan..." : "Test Scanner"}
              </span>
            </button>

            <button
              onClick={handleTestPrint}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-primary/40 shadow-sm active-elevate transition-all"
            >
              <Printer className="w-7 h-7 text-slate-400" />
              <span className="text-[13px] font-bold text-center text-slate-600">Test Print</span>
            </button>
          </div>
          <p className="text-[12px] font-medium text-slate-500 text-center mt-3">
            Use these to verify your devices are working correctly.
          </p>
        </FormCard>

        <FormCard title="Barcode Scanners">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm mb-3">
            <div>
              <p className="text-[14px] font-bold text-slate-800">Keyboard Wedge Mode</p>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                Enables USB & Bluetooth scanners on billing screen
              </p>
            </div>
            <Switch checked={scannerEnabled} onCheckedChange={setScannerEnabled} />
          </div>

          {scanners.length > 0 && (
            <div className="space-y-2">
              {scanners.map(device => {
                const Icon = CONNECTION_ICON[device.connection];
                const statusCfg = STATUS_CONFIG[device.status];
                return (
                  <div key={device.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-slate-800 leading-tight">{device.name}</p>
                      <p className="text-[12px] font-medium text-slate-500 mt-1 leading-tight">{device.description}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider shrink-0", statusCfg.color)}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-2">
            <p className="text-[13px] text-blue-800 font-bold mb-1.5">How to connect Bluetooth scanner:</p>
            <ol className="text-[12px] font-medium text-blue-700 space-y-1 pl-4 list-decimal">
              <li>Pair the scanner in your phone's Bluetooth settings</li>
              <li>Open the billing screen</li>
              <li>Scan any barcode — it will auto-add to cart</li>
            </ol>
          </div>
        </FormCard>

        <FormCard title="Printers">
          <div className="space-y-2">
            {printers.map(device => {
              const Icon = CONNECTION_ICON[device.connection];
              const statusCfg = STATUS_CONFIG[device.status];
              return (
                <div key={device.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-slate-800 leading-tight">{device.name}</p>
                    <p className="text-[12px] font-medium text-slate-500 mt-1 leading-tight">{device.description}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider", statusCfg.color)}>
                    {statusCfg.label}
                  </Badge>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-2">
            <p className="text-[13px] text-amber-800 font-bold mb-1.5">Thermal printer setup:</p>
            <ol className="text-[12px] font-medium text-amber-700 space-y-1 pl-4 list-decimal">
              <li>Connect printer to same WiFi as your phone</li>
              <li>Use "Print" on any bill — select the thermal printer</li>
              <li>Set paper size to 58mm in Bill Settings</li>
            </ol>
          </div>
        </FormCard>

        <FormCard title="Camera Barcode Scanner">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-800">Built-in Camera Scanner</p>
              <p className="text-[12px] font-medium text-slate-500 mt-1">
                Available directly on the billing screen. Tap the camera icon next to the search bar to scan a barcode with your phone camera.
              </p>
            </div>
          </div>
        </FormCard>

      </div>
    </div>
  );
}
