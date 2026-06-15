import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Package, Receipt, Users, Menu, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings";
import { WifiOff } from "lucide-react";
import { pageVariants } from "@/lib/animations";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Products", icon: Package },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/more", label: "More", icon: Menu },
];

/**
 * Determines which nav tab should be active for a given path.
 * Routes not matching Home/Products/Billing/Customers fall through to "More".
 */
function getActiveTab(path: string): string {
  if (path === "/") return "/";
  if (path.startsWith("/products")) return "/products";
  if (path.startsWith("/billing")) return "/billing";
  if (path.startsWith("/customers")) return "/customers";
  // Everything else → More tab
  // Covers: /more, /suppliers, /purchases, /expenses, /bundles, /reports/*,
  // /settings/*, /stock/*, /daily-closing, /bills, /profit, /low-stock, /barcode, etc.
  return "/more";
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { settings } = useSettingsStore();
  const activeTab = getActiveTab(location);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#f8fafc] font-sans">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-500 text-white overflow-hidden z-50 flex items-center justify-center gap-2 px-4 py-2"
          >
            <WifiOff className="w-4 h-4" />
            <span className="text-[13px] font-bold">You are offline. Some features may be limited.</span>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="sticky top-0 z-40 w-full bg-[#f8fafc] border-b border-slate-200 h-14 flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {location !== "/" && (
            <button onClick={() => window.history.back()} className="text-[#006b2c] p-1 -ml-1 hover:bg-slate-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          {location === "/" && (
            <button className="text-[#006b2c] p-1 -ml-1 hover:bg-slate-100 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <h1 className="font-bold text-lg text-[#006b2c]">Safai Market</h1>
        </div>
        
        <div className="flex items-center gap-3 text-[#006b2c]">
          <button className="p-1 hover:bg-slate-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
          </button>
          <Link href="/settings/store">
            <div className="w-8 h-8 rounded-full bg-slate-300 overflow-hidden border border-slate-200 cursor-pointer hover:ring-2 hover:ring-[#006b2c]/30 transition-all">
               <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 pb-16 overflow-y-auto">
        {settings.animationsEnabled ? (
          <motion.div
            key={location}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-full"
          >
            {children}
          </motion.div>
        ) : (
          children
        )}
      </main>

      <nav className="fixed bottom-0 w-full border-t border-slate-200 bg-[#f4f7fb] flex justify-between items-center h-[68px] px-2 pb-safe z-50">
        {navItems.map((item) => {
          const isActive = activeTab === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1 h-full">
              <div
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-1 transition-all",
                  isActive ? "text-[#006b2c]" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-14 h-8 rounded-full transition-colors",
                  isActive ? "bg-[#006b2c] text-white" : "bg-transparent"
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className={cn("text-[11px] font-medium", isActive ? "text-[#006b2c]" : "text-slate-600")}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
