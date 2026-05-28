import { useState } from "react";
import { 
  useGetTodayClosing, 
  useCreateDailyClosing, 
  useListDailyClosings,
  getGetTodayClosingQueryKey,
  getListDailyClosingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DailyClosing() {
  const { data: summary, isLoading } = useGetTodayClosing();
  const { data: history } = useListDailyClosings();
  const createClosing = useCreateDailyClosing();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [actualCash, setActualCash] = useState("");
  const [notes, setNotes] = useState("");

  const handleCloseDay = () => {
    if (!actualCash) return;
    const today = new Date().toISOString().split('T')[0];
    createClosing.mutate({
      data: {
        date: today,
        actualCash: Number(actualCash),
        notes: notes || undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Day closed successfully!" });
        queryClient.invalidateQueries({ queryKey: getGetTodayClosingQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListDailyClosingsQueryKey() });
      },
      onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  const isClosedToday = history?.some(h => h.date.startsWith(new Date().toISOString().split('T')[0]));
  const todayClosing = history?.find(h => h.date.startsWith(new Date().toISOString().split('T')[0]));

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pb-20">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Daily Closing</h1>

        {isLoading ? (
          <div className="space-y-4"><Skeleton className="h-64 w-full" /></div>
        ) : isClosedToday && todayClosing ? (
          <Card className="border-primary/20 shadow-md bg-primary/5">
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
              <h2 className="text-xl font-bold text-primary">Day Already Closed</h2>
              <div className="text-sm text-muted-foreground">
                Closing done for {formatDate(todayClosing.date)}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-left">
                <div className="bg-background p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Expected Cash</div>
                  <div className="font-bold">{formatCurrency(todayClosing.expectedCash)}</div>
                </div>
                <div className="bg-background p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground">Actual Cash</div>
                  <div className="font-bold">{formatCurrency(todayClosing.actualCash)}</div>
                </div>
              </div>
              <div className="bg-background p-3 rounded-lg border text-left">
                <div className="text-xs text-muted-foreground">Difference</div>
                <div className={cn("font-bold", todayClosing.difference < 0 ? "text-destructive" : "text-primary")}>
                  {formatCurrency(todayClosing.difference)}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="p-4 pb-2 border-b">
                <CardTitle className="text-sm font-bold">Today's Summary ({formatDate(new Date().toISOString())})</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Sales</p>
                    <p className="font-semibold">{formatCurrency(summary?.totalSales)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cash Sales</p>
                    <p className="font-semibold text-primary">{formatCurrency(summary?.cashSales)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">UPI Sales</p>
                    <p className="font-semibold">{formatCurrency(summary?.upiSales)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Udhaar Given</p>
                    <p className="font-semibold text-amber-600">{formatCurrency(summary?.udhaarSales)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bills Made</p>
                    <p className="font-semibold text-primary">{summary?.billCount ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Expenses</p>
                    <p className="font-semibold text-destructive">{formatCurrency(summary?.totalExpenses)}</p>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex justify-between items-center mt-4">
                  <div className="font-medium text-primary">Expected Cash in Drawer</div>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(summary?.expectedCash)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-primary/20">
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Actual Cash in Drawer *</label>
                  <Input type="number" className="h-14 text-2xl font-bold" value={actualCash} onChange={e => setActualCash(e.target.value)} placeholder="0" />
                </div>
                
                {actualCash && (
                  <div className={cn(
                    "p-3 rounded-lg text-sm font-medium flex items-center justify-between",
                    Number(actualCash) - (summary?.expectedCash || 0) < 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  )}>
                    <span>Difference</span>
                    <span>{formatCurrency(Number(actualCash) - (summary?.expectedCash || 0))}</span>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">Notes</label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any discrepancy reason?" />
                </div>

                <Button className="w-full h-12 text-lg active-elevate" disabled={!actualCash || createClosing.isPending} onClick={handleCloseDay}>
                  {createClosing.isPending ? "Processing..." : "Close Register"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Recent Closings</h2>
          <div className="space-y-3">
            {history?.slice(0, 5).map(h => (
              <Card key={h.id}>
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{formatDate(h.date)}</div>
                    <div className="text-xs text-muted-foreground">Expected: {formatCurrency(h.expectedCash)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(h.actualCash)}</div>
                    <div className={cn("text-[10px]", h.difference < 0 ? "text-destructive" : "text-primary")}>
                      Diff: {formatCurrency(h.difference)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
