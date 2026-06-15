import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, Wifi, WifiOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
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
      const res = await fetch("/api/healthz");
      if (!res.ok) {
        throw new Error("Cannot connect to server");
      }

      await queryClient.invalidateQueries();
      await queryClient.refetchQueries({ type: "active" });
      
      // Artificial delay to make the sync visually satisfying
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const now = new Date();
      setLastSync(now);
      localStorage.setItem("safai-last-sync", now.toISOString());
      toast({ title: "Sync complete!", description: "All data is up to date." });
    } catch (error) {
      toast({ title: "Sync failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
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
    <div className="flex flex-col min-h-full bg-slate-50 font-sans">
      <PageHeader title="Sync Center" subtitle="Data sync status" backTo="/more" />

      <div className="p-4 space-y-4 pb-24">

        <div className={cn(
          "rounded-2xl border p-4 flex items-center gap-3 shadow-sm",
          isOnline ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
        )}>
          {isOnline
            ? <Wifi className="w-5 h-5 text-emerald-600 shrink-0" />
            : <WifiOff className="w-5 h-5 text-red-500 shrink-0" />
          }
          <div>
            <p className={cn("text-[14px] font-bold", isOnline ? "text-emerald-700" : "text-red-700")}>
              {isOnline ? "Connected to internet" : "No internet connection"}
            </p>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">
              {isOnline ? "All features are available" : "Some features may be limited"}
            </p>
          </div>
        </div>

        <FormCard title="Sync Status">
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 mb-3">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[14px] font-bold text-slate-800">Last Sync</p>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                {lastSync
                  ? lastSync.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                  : "Never synced manually"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {syncItems.map(item => (
              <div key={item.label} className="flex items-center gap-3 px-2 py-1">
                <span className="text-base">{item.icon}</span>
                <p className="text-[14px] font-bold text-slate-700 flex-1">{item.label}</p>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            ))}
          </div>
        </FormCard>

        <Button
          onClick={handleSync}
          disabled={syncing || !isOnline}
          className="w-full h-14 text-[16px] font-bold rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-white active-elevate transition-transform gap-2"
        >
          <RefreshCw className={cn("w-5 h-5", syncing && "animate-spin")} />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>

        <FormCard title="About Offline Mode">
          <div className="space-y-3 text-[13px] font-medium text-slate-500 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="flex gap-2"><span className="text-xl">⚡</span> <span><strong className="text-slate-700 font-bold">Online mode:</strong> All data is saved directly to the cloud server in real-time.</span></p>
            <p className="flex gap-2"><span className="text-xl">📱</span> <span><strong className="text-slate-700 font-bold">Current state:</strong> This app requires internet for billing and product management.</span></p>
            <p className="flex gap-2"><span className="text-xl">🔄</span> <span><strong className="text-slate-700 font-bold">Sync Now:</strong> Use this if you notice stale data or after switching devices.</span></p>
            <p className="flex gap-2"><span className="text-xl">🚧</span> <span><strong className="text-slate-700 font-bold">Offline billing</strong> (coming soon): Will allow creating bills without internet, syncing when reconnected.</span></p>
          </div>
        </FormCard>

        <FormCard title="Team Access">
          <div className="flex flex-col gap-3">
            <p className="text-[12px] font-medium text-slate-500">Manage shop members and their access to sync functions.</p>
            <Link href="/settings/members">
              <Button variant="outline" className="w-full h-12 rounded-xl text-[14px] font-bold border-slate-300 hover:bg-slate-50 text-slate-700 active-elevate transition-transform">
                Manage Shop Members
              </Button>
            </Link>
          </div>
        </FormCard>

      </div>
    </div>
  );
}
