import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { useGetSalesReport } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Period = "daily" | "weekly" | "monthly";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const PAYMENT_COLORS = ["#006b2c", "#1e40af", "#f59e0b", "#dc2626"];

export default function SalesReport() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<Period>("daily");
  
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading, isError, refetch } = useGetSalesReport({
    period,
    month,
    year,
  });

  const monthYearLabel = `${MONTHS[month - 1]} ${year}`;

  const last12Months = useMemo(() => {
    const opts = [];
    const d = new Date();
    d.setDate(1); // avoid end of month shifting issues
    for (let i = 0; i < 12; i++) {
      opts.push({
        m: d.getMonth() + 1,
        y: d.getFullYear(),
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      });
      d.setMonth(d.getMonth() - 1);
    }
    return opts;
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/more")} className="text-primary p-1 -ml-1 hover:bg-slate-100 rounded-full active:scale-95 transition-transform">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-[19px] text-primary">Sales Report</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="appearance-none border border-slate-300 rounded-full px-3 py-1.5 text-[13px] font-medium text-slate-700 bg-white pr-8 relative focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={`${month}-${year}`}
              onChange={(e) => {
                const [m, y] = e.target.value.split("-");
                setMonth(Number(m));
                setYear(Number(y));
              }}
            >
              {last12Months.map((opt) => (
                <option key={`${opt.m}-${opt.y}`} value={`${opt.m}-${opt.y}`}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="px-4 pt-4 pb-3">
        <div className="bg-slate-200 rounded-full p-1 flex">
          {(["daily", "weekly", "monthly"] as Period[]).map((mode) => (
            <button
              key={mode}
              className={cn(
                "flex-1 py-2.5 rounded-full text-sm font-bold transition-colors capitalize",
                period === mode ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
              onClick={() => setPeriod(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <span className="text-red-500 text-xl">⚠️</span>
          </div>
          <h3 className="text-slate-900 font-bold mb-1">Failed to load sales</h3>
          <p className="text-slate-500 text-sm mb-4">Could not fetch the report data.</p>
          <button onClick={() => refetch()} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm active-elevate transition-transform shadow-sm">
            Try Again
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-5">
          {/* Hero Card */}
          <div className="bg-primary rounded-2xl p-5 text-white shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-white/20 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
              {data && data.momChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isLoading ? "--" : `${Math.abs(data?.momChange || 0).toFixed(1)}% MoM`}
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Total Sales</p>
            {isLoading ? (
              <div className="h-10 w-40 bg-white/20 rounded-lg animate-pulse mb-4" />
            ) : (
              <p className="text-4xl font-bold leading-none tracking-tight mb-4">
                {formatCurrency(data?.totalSales ?? 0)}
              </p>
            )}
            <div className="flex gap-6">
              <div>
                <p className="text-white/70 text-xs mb-0.5 font-medium">Bills</p>
                <p className="text-xl font-bold">{isLoading ? "--" : data?.billCount}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs mb-0.5 font-medium">Avg Bill Value</p>
                <p className="text-xl font-bold">{isLoading ? "--" : formatCurrency(data?.avgBillValue ?? 0)}</p>
              </div>
            </div>
          </div>

          {/* Sales Trend Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[15px] font-bold text-slate-900 mb-4 capitalize">
              {period} Sales Trend
            </p>
            {isLoading ? (
              <div className="h-[200px] bg-slate-100 rounded-xl animate-pulse" />
            ) : !data?.chartData?.length ? (
              <p className="text-center text-slate-500 py-8 text-sm">No data in this period</p>
            ) : (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#006b2c" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#006b2c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(val) => `₹${val}`}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#006b2c', fontWeight: 'bold' }}
                      formatter={(val: number) => [formatCurrency(val), 'Sales']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#006b2c" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Payment Breakdown Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
            <p className="text-[15px] font-bold text-slate-900 mb-4">Payment Methods</p>
            {isLoading ? (
              <div className="h-[200px] bg-slate-100 rounded-xl animate-pulse" />
            ) : !data?.paymentBreakdown?.length || data.totalSales === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">No payment data</p>
            ) : (
              <div className="h-[200px] w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.paymentBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="method"
                    >
                      {data.paymentBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => formatCurrency(val)}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          
          {/* MoM Comparison Info Card */}
          {data && (
            <div className={cn(
              "rounded-2xl p-4 flex items-center justify-between border shadow-sm",
              data.momChange >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
            )}>
              <div>
                <p className={cn("text-sm font-bold", data.momChange >= 0 ? "text-emerald-700" : "text-red-700")}>
                  {data.momChange >= 0 ? "Growing Sales! 🚀" : "Needs Attention 📉"}
                </p>
                <p className={cn("text-xs mt-0.5 font-medium", data.momChange >= 0 ? "text-emerald-600" : "text-red-600")}>
                  Sales are {data.momChange >= 0 ? 'up' : 'down'} {Math.abs(data.momChange).toFixed(1)}% compared to last month.
                </p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
