import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateExpense, getListExpensesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { FormCard, FormField } from "@/components/form-card";
import { cn } from "@/lib/utils";
import { Receipt, Tag, FileText } from "lucide-react";

const EXPENSE_CATEGORIES = [
  { value: "Rent", label: "Rent", emoji: "🏪" },
  { value: "Utilities", label: "Utilities", emoji: "⚡" },
  { value: "Salary", label: "Salary / Labour", emoji: "👷" },
  { value: "Transport", label: "Transport", emoji: "🚛" },
  { value: "Supplies", label: "Supplies / Packaging", emoji: "📦" },
  { value: "Repair", label: "Repair / Maintenance", emoji: "🔧" },
  { value: "Misc", label: "Miscellaneous", emoji: "📋" },
];

export default function ExpenseNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createExpense = useCreateExpense();

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      toast({ title: "Description required", variant: "destructive" });
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }

    createExpense.mutate({
      data: {
        description: formData.description.trim(),
        amount: Number(formData.amount),
        category: formData.category || "Misc",
        notes: formData.notes || undefined,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: "Expense recorded!", description: `₹${formData.amount} saved.` });
        setLocation("/expenses");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50/60">
      <PageHeader title="Add Expense" subtitle="Record a business expense" backTo="/expenses" />

      <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4 pb-24">
        <FormCard title="Expense Details">
          <FormField label="Description" required>
            <div className="relative">
              <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Electricity bill payment"
                required
                autoFocus
                className="h-12 pl-10 rounded-xl text-base border-muted focus:border-primary"
              />
            </div>
          </FormField>

          <FormField label="Amount (₹)" required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
              <Input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0"
                min="1"
                required
                className="h-14 pl-8 rounded-xl text-xl font-bold border-muted focus:border-primary"
              />
            </div>
          </FormField>
        </FormCard>

        <FormCard title="Category">
          <div className="grid grid-cols-2 gap-2">
            {EXPENSE_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFormData(p => ({ ...p, category: cat.value }))}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all text-sm font-medium",
                  formData.category === cat.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted bg-background text-muted-foreground hover:border-primary/40"
                )}
              >
                <span className="text-lg">{cat.emoji}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
          {!formData.category && (
            <p className="text-xs text-muted-foreground text-center">Select a category (optional)</p>
          )}
        </FormCard>

        <FormCard title="Notes">
          <FormField label="Additional Notes" hint="Optional">
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g. Paid by cash to landlord"
                className="h-12 pl-10 rounded-xl text-base border-muted focus:border-primary"
              />
            </div>
          </FormField>
        </FormCard>

        <Button
          type="submit"
          className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-destructive/20 bg-destructive hover:bg-destructive/90 active-elevate mt-2"
          disabled={createExpense.isPending}
        >
          {createExpense.isPending ? "Saving..." : `Record Expense${formData.amount ? ` — ₹${formData.amount}` : ""}`}
        </Button>
      </form>
    </div>
  );
}
