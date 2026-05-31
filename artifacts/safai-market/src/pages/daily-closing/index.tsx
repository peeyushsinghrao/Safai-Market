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
import { CheckCircle2, AlertCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings";

export default function DailyClosing() {
  const { data: summary, isLoading } = useGetTodayClosing();
  const { data: history } = useListDailyClosings();
  const createClosing = useCreateDailyClosing();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { settings } = useSettingsStore();

  const [actualCash, setActualCash] = useState("");
  const [notes, setNotes] = useState("");

  const handleShareWhatsApp = (closing?: typeof todayClosing, summaryData?: typeof summary) => {
    const storeName = settings.storeName || "My Shop";
    const date = new Date().toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const lines = [
      `📊 *${storeName} — Daily Report*`,
      `📅 ${date}`,
      ``,
      `💰 *Sales Summary*`,
      `  Total Sales: ₹${Number(summaryData?.totalSales ?? 0).toFixed(0)}`,
      `  Cash Sales: ₹${Number(summaryData?.cashSales ?? 0).toFixed(0)}`,
      `  UPI Sales: ₹${Number(summaryData?.upiSales ?? 0).toFixed(0)}`,
      `  Udhaar Given: ₹${Number(summaryData?.udhaarSales ?? 0).toFixed(0)}`,
      `  Bills Count: ${summaryData?.billCount ?? 0}`,
      ``,
      `💸 *Expenses*`,
      `  Total Expenses: ₹${Number(summaryData?.totalExpenses ?? 0).toFixed(0)}`,
      ``,
      `🏧 *Cash Register*`,
      `  Expected Cash: ₹${Number(summaryData?.expectedCash ?? 0).toFixed(0)}`,
    ];
    if (closing) {
      lines.push(`  Actual Cash: ₹${Number(closing.actualCash ?? 0).toFixed(0)}`);
      const diff = Number(closing.actualCash ?? 0) - Number(closing.expectedCash ?? 0);
      lines.push(`  Difference: ${diff >= 0 ? "+" : ""}₹${diff.toFixed(0)}`);
      if (closing.notes) lines.push(`  Note: ${closing.notes}`);
    }
    lines.push(``, `_Sent from Safai Market_`);
    const msg = lines.join("\n");
    const encoded = encodeURIComponent(msg);
    if (navigator.share) {
      navigator.share({ title: `${storeName} Daily Report`, text: msg }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    }
  };

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
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Button
                  variant="outline"
                  className="h-12 gap-2 rounded-xl font-semibold border-green-200 text-green-700 hover:bg-green-50"
                  onClick={() => handleShareWhatsApp(todayClosing, summary)}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="h-12 gap-2 rounded-xl font-semibold"
                  onClick={() => handleShareWhatsApp(todayClosing, summary)}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
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
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 gap-2 rounded-xl font-semibold border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => handleShareWhatsApp(undefined, summary)}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 gap-2 rounded-xl font-semibold"
                    onClick={() => handleShareWhatsApp(undefined, summary)}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
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
