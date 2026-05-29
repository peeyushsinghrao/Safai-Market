import { useState } from "react";
import { useListExpenses, useCreateExpense, useDeleteExpense, getListExpensesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Plus, Trash2, Calendar, Search } from "lucide-react";
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
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            className="pl-10 h-12 bg-background border-muted shadow-sm text-base rounded-xl"
            placeholder="Search expenses..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 p-4 pb-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Expenses
          </h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8"><Plus className="w-4 h-4 mr-1"/> Add</Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-md rounded-xl">
              <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Description (e.g. Tea/Snacks)" value={desc} onChange={e=>setDesc(e.target.value)} className="h-12" />
                <Input type="number" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} className="h-12" />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {["Rent", "Electricity", "Transport", "Salary", "Repairs", "Tea/Snacks", "Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={payMode} onValueChange={(v:any)=>setPayMode(v)}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Payment Mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full h-12" onClick={handleAdd} disabled={createExpense.isPending || !desc || !amount}>Save Expense</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : expenses?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No expenses found.</div>
        ) : (
          <div className="space-y-3">
            {expenses?.map(exp => (
              <Card key={exp.id} className="shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <div className="font-semibold text-sm">{exp.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] py-0">{exp.category}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3"/> {formatDate(exp.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="font-bold text-destructive">{formatCurrency(exp.amount)}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{exp.paymentMode}</div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(exp.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
