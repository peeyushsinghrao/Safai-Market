import React from "react";
import { cn } from "@/lib/utils";

interface FormCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function FormCard({ children, title, className }: FormCardProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <p className="text-[14px] font-semibold text-slate-800 px-1">{title}</p>
      )}
      <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-4 space-y-4">
        {children}
      </div>
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
      <div className="flex items-baseline justify-between">
        <label className="text-[13px] font-semibold text-slate-800 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 text-[12px]">*</span>}
        </label>
        {hint && <span className="text-[12px] text-slate-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
