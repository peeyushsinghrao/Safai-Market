import { useState } from "react";
import { useLocation } from "wouter";
import { useListExpenses, useCreateExpense, useDeleteExpense, getListExpensesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Plus, Trash2, Calendar, Search, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

export default function ExpensesList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: expenses, isLoading } = useListExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [payMode, setPayMode] = useState<"cash"|"upi">("cash");

  const handleAdd = () => {
    if (!desc || !amount) return;
    createExpense.mutate({
      data: {
        description: desc,
        amount: Number(amount),
        category,
        paymentMode: payMode
      }
    }, {
      onSuccess: () => {
        toast({ title: "Expense added" });
        setIsOpen(false);
        setDesc(""); setAmount(""); setCategory("Other");
        queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      }
    });
  };

  const handleDelete = (expenseId: number) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      const id = expenseId;
      deleteExpense.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Expense deleted" });
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        }
      });
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/more")} className="text-primary p-1 -ml-1 hover:bg-slate-100 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[19px] text-primary">Expenses</h1>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              className="pl-10 h-12 bg-white border-slate-300 shadow-sm text-[15px] rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Search expenses..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            All Expenses
          </h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm active-elevate transition-transform"><Plus className="w-4 h-4 mr-1"/> Add</Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-md rounded-3xl p-6">
              <DialogHeader><DialogTitle className="text-xl">Add Expense</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Description (e.g. Tea/Snacks)" value={desc} onChange={e=>setDesc(e.target.value)} className="h-14 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
                <Input type="number" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} className="h-14 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-14 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["Rent", "Electricity", "Transport", "Salary", "Repairs", "Tea/Snacks", "Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={payMode} onValueChange={(v:any)=>setPayMode(v)}>
                  <SelectTrigger className="h-14 rounded-2xl text-[15px] border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"><SelectValue placeholder="Payment Mode" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full h-14 text-[16px] font-bold rounded-2xl shadow-sm bg-primary hover:bg-primary/90 text-white active-elevate transition-transform" onClick={handleAdd} disabled={createExpense.isPending || !desc || !amount}>Save Expense</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : expenses?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500 font-semibold text-[15px]">No expenses found.</div>
        ) : (
          <div className="space-y-3">
            {expenses?.map(exp => (
              <div key={exp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <div className="font-bold text-[15px] text-slate-800">{exp.description}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-2 py-0.5 rounded-full border border-slate-200 text-[11px] font-bold text-slate-600 bg-slate-50 uppercase tracking-wider">{exp.category}</span>
                    <span className="text-[12px] font-medium text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {formatDate(exp.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <div className="font-bold text-[16px] text-red-600">-{formatCurrency(exp.amount)}</div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{exp.paymentMode}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDelete(exp.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
