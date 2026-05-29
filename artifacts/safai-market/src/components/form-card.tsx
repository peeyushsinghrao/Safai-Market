import React from "react";
import { cn } from "@/lib/utils";

interface FormCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function FormCard({ children, title, className }: FormCardProps) {
  return (
    <div className={cn("bg-card rounded-2xl border border-muted/60 shadow-sm p-5 space-y-4", className)}>
      {title && (
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">{title}</p>
      )}
      {children}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1">
        <label className="text-sm font-semibold text-foreground/80">{label}</label>
        {required && <span className="text-destructive text-xs font-bold">*</span>}
        {hint && <span className="text-xs text-muted-foreground ml-auto">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
