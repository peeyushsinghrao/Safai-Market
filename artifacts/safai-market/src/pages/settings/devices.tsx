import { useState } from "react";
import { Bluetooth, Usb, Printer, ScanLine, Wifi, Zap } from "lucide-react";
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
    const win = window.open("", "_blank", "width=400,height=300");
    if (!win) { toast({ title: "Allow popups to test print", variant: "destructive" }); return; }
    win.document.write(`
      <html><body style="font-family:monospace;text-align:center;padding:20px">
        <h2>PRINT TEST</h2>
        <p>Safai Market</p>
        <p>If you can read this, printer is working!</p>
        <hr/>
        <p>${new Date().toLocaleString("en-IN")}</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const printers = devices.filter(d => d.type === "printer");
  const scanners = devices.filter(d => d.type === "scanner");

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Device Center" subtitle="Scanners & printers" backTo="/more" />

      <div className="p-4 space-y-4 pb-24">

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
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
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

        <FormCard title="Printers">
          <div className="space-y-2">
            {printers.map(device => {
              const Icon = CONNECTION_ICON[device.connection];
              const statusCfg = STATUS_CONFIG[device.status];
              return (
                <div key={device.id} className="bg-white rounded-xl border border-muted/50 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{device.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{device.description}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", statusCfg.color)}>
                    {statusCfg.label}
                  </Badge>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-1">
            <p className="text-xs text-amber-700 font-medium mb-1">Thermal printer setup:</p>
            <ol className="text-xs text-amber-600 space-y-0.5 list-decimal list-inside">
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
              <p className="text-sm font-semibold">Built-in Camera Scanner</p>
              <p className="text-xs text-muted-foreground mt-1">
                Available directly on the billing screen. Tap the camera icon next to the search bar to scan a barcode with your phone camera.
              </p>
            </div>
          </div>
        </FormCard>

      </div>
    </div>
  );
}
