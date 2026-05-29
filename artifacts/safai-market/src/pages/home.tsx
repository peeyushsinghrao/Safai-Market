import React from "react";
import { Link } from "wouter";
import { 
  useGetDashboardSummary, 
  useGetLowStockProducts, 
  useGetRecentActivity 
} from "@workspace/api-client-react";
import { 
  PlusCircle, 
  Receipt, 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  IndianRupee,
  Package,
  Users,
  BarChart2,
} from "lucide-react";
import { formatCurrency, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Home() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: lowStock, isLoading: isLoadingLowStock } = useGetLowStockProducts();
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity();

  const marginPct =
    summary?.todayTotalSales && summary.todayTotalSales > 0 && summary.todayEstimatedProfit != null
      ? (summary.todayEstimatedProfit / summary.todayTotalSales) * 100
      : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Today's Sales Card */}
      <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp className="w-24 h-24" />
        </div>
        <CardHeader className="pb-2 relative">
          <CardTitle className="text-primary-foreground/80 text-sm font-medium">Today's Sales</CardTitle>
          {isLoadingSummary ? (
            <Skeleton className="h-10 w-32 bg-primary-foreground/20" />
          ) : (
            <div className="text-4xl font-bold tracking-tight">
              {formatCurrency(summary?.todayTotalSales)}
            </div>
          )}
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mt-2">
            <div className="flex flex-col">
              <span className="text-primary-foreground/60 text-xs">Cash</span>
              <span className="font-semibold">{formatCurrency(summary?.todayCashReceived)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-primary-foreground/60 text-xs">UPI</span>
              <span className="font-semibold">{formatCurrency(summary?.todayUpiReceived)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-primary-foreground/60 text-xs">Udhaar Given</span>
              <span className="font-semibold">{formatCurrency(summary?.todayUdhaarGiven)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-primary-foreground/60 text-xs">Bills Made</span>
              <span className="font-semibold">{summary?.todayBillCount || 0}</span>
            </div>
          </div>

          {/* Profit Strip */}
          {!isLoadingSummary && (summary?.todayEstimatedProfit != null) && (
            <div className="mt-3 pt-3 border-t border-primary-foreground/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-primary-foreground/70" />
                <span className="text-primary-foreground/70 text-xs font-medium">Est. Profit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">
                  {formatCurrency(summary.todayEstimatedProfit)}
                </span>
                {marginPct != null && (
                  <span className="text-[10px] font-semibold bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">
                    {marginPct.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          )}
          {!isLoadingSummary && summary?.todayEstimatedProfit == null && (
            <div className="mt-3 pt-3 border-t border-primary-foreground/20 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-primary-foreground/40" />
              <span className="text-primary-foreground/40 text-xs">Add buy prices to track profit</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        <Link href="/billing" className="flex flex-col gap-1 items-center">
          <div className="bg-primary/10 text-primary w-14 h-14 rounded-2xl flex items-center justify-center active-elevate shadow-sm">
            <Receipt className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-center">New Bill</span>
        </Link>
        <Link href="/products" className="flex flex-col gap-1 items-center">
          <div className="bg-secondary text-secondary-foreground w-14 h-14 rounded-2xl flex items-center justify-center active-elevate shadow-sm">
            <Search className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-center">Search Item</span>
        </Link>
        <Link href="/customers" className="flex flex-col gap-1 items-center">
          <div className="bg-blue-100 text-blue-700 w-14 h-14 rounded-2xl flex items-center justify-center active-elevate shadow-sm">
            <IndianRupee className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-center">Get Payment</span>
        </Link>
        <Link href="/expenses/new" className="flex flex-col gap-1 items-center">
          <div className="bg-destructive/10 text-destructive w-14 h-14 rounded-2xl flex items-center justify-center active-elevate shadow-sm">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-center">Add Expense</span>
        </Link>
      </div>

      {/* Udhaar, Supplier, Profit Row */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <Card className="bg-card shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Market Udhaar</span>
            </div>
            {isLoadingSummary ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(summary?.totalOutstandingUdhaar)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs font-medium">Supplier Pending</span>
            </div>
            {isLoadingSummary ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-lg font-bold text-amber-600">
                {formatCurrency(summary?.totalSupplierPending)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profit Report CTA */}
      <Link href="/profit">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow active-elevate">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-700 w-10 h-10 rounded-xl flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-green-800 text-sm">Profit Report</p>
                <p className="text-xs text-green-600">View margins by product & category</p>
              </div>
            </div>
            <span className="text-green-600 text-lg font-bold">→</span>
          </CardContent>
        </Card>
      </Link>

      {/* Low Stock Preview */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Finishing Stock
          </CardTitle>
          <Link href="/low-stock" className="text-xs text-primary font-semibold p-1">View All</Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingLowStock ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : lowStock?.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              All stock levels look good.
            </div>
          ) : (
            <div className="divide-y">
              {lowStock?.slice(0, 3).map((item) => (
                <div key={item.id} className="p-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={item.currentStock === 0 ? "destructive" : "secondary"} className="font-mono">
                      {item.currentStock} {item.unit}
                    </Badge>
                    <Link href={`/products/${item.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                        <PlusCircle className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-sm mb-4">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingActivity ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : activity?.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No recent activity today.
            </div>
          ) : (
            <div className="divide-y">
              {activity?.slice(0, 5).map((event) => (
                <div key={event.id} className="p-3 px-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium line-clamp-1">{event.description}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(event.createdAt)}</span>
                  </div>
                  {event.amount && (
                    <span className={cn(
                      "text-sm font-semibold whitespace-nowrap",
                      event.eventType.includes('expense') || event.eventType.includes('purchase') 
                        ? "text-destructive" 
                        : "text-primary"
                    )}>
                      {event.eventType.includes('expense') || event.eventType.includes('purchase') ? "-" : "+"}
                      {formatCurrency(event.amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="p-2 border-t">
            <Button variant="ghost" className="w-full text-xs text-muted-foreground">
              Show more activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
