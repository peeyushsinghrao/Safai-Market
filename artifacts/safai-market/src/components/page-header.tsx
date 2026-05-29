import React from "react";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, backTo, onBack, right, className }: PageHeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    if (backTo) setLocation(backTo);
    else window.history.back();
  };

  return (
    <div className={cn(
      "sticky top-0 z-30 bg-primary text-primary-foreground shadow-md flex items-center gap-3 px-3 py-3 min-h-[56px]",
      className
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9 rounded-xl shrink-0"
        onClick={handleBack}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-base leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-[11px] text-primary-foreground/70 leading-tight mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
