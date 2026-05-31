import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, Wifi, WifiOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { FormCard } from "@/components/form-card";
import { cn } from "@/lib/utils";

export default function SyncCenter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(() => {
    const stored = localStorage.getItem("safai-last-sync");
    return stored ? new Date(stored) : null;
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      toast({ title: "No internet connection", description: "Please connect to internet and try again.", variant: "destructive" });
      return;
    }
    setSyncing(true);
    try {
      await queryClient.invalidateQueries();
      await queryClient.refetchQueries({ type: "active" });
      const now = new Date();
      setLastSync(now);
      localStorage.setItem("safai-last-sync", now.toISOString());
      toast({ title: "Sync complete!", description: "All data is up to date." });
    } catch {
      toast({ title: "Sync failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const syncItems = [
    { label: "Products & Categories", icon: "📦" },
    { label: "Bills & Payments",       icon: "🧾" },
    { label: "Customers & Udhaar",     icon: "👤" },
    { label: "Suppliers & Purchases",  icon: "🏭" },
    { label: "Expenses",               icon: "💸" },
    { label: "Stock Movements",        icon: "📊" },
  ];

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Sync Center" subtitle="Data sync status" backTo="/more" />

      <div className="p-4 space-y-4 pb-24">

        <div className={cn(
          "rounded-xl border p-4 flex items-center gap-3",
          isOnline ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        )}>
          {isOnline
            ? <Wifi className="w-5 h-5 text-green-600 shrink-0" />
            : <WifiOff className="w-5 h-5 text-red-500 shrink-0" />
          }
          <div>
            <p className={cn("text-sm font-semibold", isOnline ? "text-green-700" : "text-red-600")}>
              {isOnline ? "Connected to internet" : "No internet connection"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isOnline ? "All features are available" : "Some features may be limited"}
            </p>
          </div>
        </div>

        <FormCard title="Sync Status">
          <div className="flex items-center gap-3 bg-background rounded-xl border border-muted/50 px-4 py-3 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Last Sync</p>
              <p className="text-xs text-muted-foreground">
                {lastSync
                  ? lastSync.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                  : "Never synced manually"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {syncItems.map(item => (
              <div key={item.label} className="flex items-center gap-3 px-2">
                <span className="text-base">{item.icon}</span>
                <p className="text-sm flex-1">{item.label}</p>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </div>
        </FormCard>

        <Button
          onClick={handleSync}
          disabled={syncing || !isOnline}
          className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 gap-2"
        >
          <RefreshCw className={cn("w-5 h-5", syncing && "animate-spin")} />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>

        <FormCard title="About Offline Mode">
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>⚡ <strong>Online mode:</strong> All data is saved directly to the cloud server in real-time.</p>
            <p>📱 <strong>Current state:</strong> This app requires internet for billing and product management.</p>
            <p>🔄 <strong>Sync Now:</strong> Use this if you notice stale data or after switching devices.</p>
            <p>🚧 <strong>Offline billing</strong> (coming soon): Will allow creating bills without internet, syncing when reconnected.</p>
          </div>
        </FormCard>

      </div>
    </div>
  );
}
