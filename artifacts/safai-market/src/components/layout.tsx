import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Package, Receipt, Users, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings";
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

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { settings } = useSettingsStore();

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground h-14 flex items-center px-4 shadow-sm">
        <div className="flex flex-col">
          <h1 className="font-bold text-base leading-tight tracking-tight">{settings.storeName}</h1>
          <p className="text-[10px] text-primary-foreground/60 leading-tight">Safai Market</p>
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
          >
            {children}
          </motion.div>
        ) : (
          children
        )}
      </main>

      <nav className="fixed bottom-0 w-full border-t bg-card text-card-foreground flex justify-between items-center h-16 pb-safe z-50">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className="flex-1 h-full">
              <div
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-1 active-elevate",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive && "fill-primary/10")} />
                <span className="text-[10px]">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
