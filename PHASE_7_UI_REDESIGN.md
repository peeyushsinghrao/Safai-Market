# Safai Market — UI Polish & Screen Redesign
## Master Implementation Plan · Phase 7

> **For AI Agent / Developer**
> Read this document fully before writing a single line of code.
> This covers 7 screens needing redesign + 1 new checkout flow.
> All changes are additive — existing logic stays untouched.

---

## Ground Rules

| Rule | Detail |
|---|---|
| **Do not touch** | Billing logic, cart store, API routes, Zustand stores |
| **Only change** | JSX layout, className, visual structure |
| **Design feel** | WhatsApp · PhonePe · Blinkit — clean, fast, Indian |
| **Component library** | Existing shadcn/ui + Tailwind only |
| **Animations** | Use existing `lib/animations.ts` presets — nothing new |
| **Colors** | Use existing CSS variables — `primary`, `muted`, `destructive` etc. |

---

## Screens Overview

| # | Screen | File | Impact | Priority |
|---|---|---|---|---|
| 1 | Home Dashboard | `pages/home.tsx` | 🔴 Highest — opened every day | P1 |
| 2 | Customer Profile | `pages/customers/detail.tsx` | 🔴 High — udhaar collection | P1 |
| 3 | Bill Detail | `pages/bills/detail.tsx` | 🟠 High — post-billing actions | P2 |
| 4 | More Menu | `pages/more/index.tsx` | 🟠 High — navigation hub | P2 |
| 5 | Daily Closing | `pages/daily-closing/index.tsx` | 🟠 High — end-of-day ritual | P2 |
| 6 | Profit Report | `pages/profit/index.tsx` | 🟡 Medium — owner insights | P3 |
| 7 | Bills History | `pages/bills/index.tsx` | 🟡 Medium — bill lookup | P3 |
| 8 | Checkout (New) | `pages/billing/checkout/` | 🔴 Highest — daily core flow | P1 |

---

---

# Screen 1 — Home Dashboard

**File:** `artifacts/safai-market/src/pages/home.tsx`

---

## What's Wrong Now

- Sales card has numbers but no context — no comparison to yesterday
- Quick action buttons are small (14×14 icons) — hard to tap fast
- Low stock section is a plain list hidden below the fold
- Recent activity is a wall of text with no visual hierarchy
- No greeting — feels like a dashboard, not a personal tool
- No "Today's Profit" visible above the fold

---

## New Layout Structure

```
┌─────────────────────────────────────┐
│  Good morning, Sharma Ji 👋          │  ← Greeting + date
│  Annapurna Traders                  │
├─────────────────────────────────────┤
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║  Today's Sales                ║  │  ← Hero card (primary color)
│  ║  ₹4,250          ↑ 12%       ║  │    Shows vs yesterday
│  ║                               ║  │
│  ║  Cash ₹2,100  UPI ₹1,850    ║  │
│  ║  Udhaar ₹300  Bills: 14     ║  │
│  ║  ─────────────────────────  ║  │
│  ║  Est. Profit  ₹680  (16%)   ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  ⚡ Quick Actions                    │  ← 2×2 grid, large tap targets
│  ┌──────────┐  ┌──────────┐        │
│  │  🧾      │  │  📦      │        │
│  │ New Bill │  │ Receive  │        │
│  │          │  │  Stock   │        │
│  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐        │
│  │  👤      │  │  🔍      │        │
│  │ Customer │  │ Products │        │
│  │ Payment  │  │          │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  🚨 Low Stock (3 items)             │  ← Alert strip — red border
│  ┌─────────────────────────────┐   │
│  │ Harpic 500ml    2 left  →  │   │
│  │ Surf Excel 1kg  0 left  →  │   │
│  │ Dettol Soap     1 left  →  │   │
│  └─────────────────────────────┘   │
│                                     │
│  📋 Recent Activity                 │  ← Timeline style
│  • Bill ₹450 — Ramesh Kumar  2m    │
│  • Bill ₹120 — Walk-in       8m    │
│  • Stock In: Harpic ×24      1h    │
└─────────────────────────────────────┘
```

---

## Implementation

### 1. Greeting Header

Replace the current plain header with:

```tsx
// At the very top of the return, before the sales card
const hour = new Date().getHours();
const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
const dayName = new Date().toLocaleDateString("en-IN", { weekday: "long" });
const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" });

<div className="px-4 pt-4 pb-2 flex items-start justify-between">
  <div>
    <p className="text-sm text-muted-foreground font-medium">
      {greeting} 👋
    </p>
    <h1 className="text-2xl font-bold text-foreground leading-tight">
      {settings.storeName}
    </h1>
    <p className="text-xs text-muted-foreground mt-0.5">
      {dayName}, {dateStr}
    </p>
  </div>
  <Link href="/settings/store">
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
      <Store className="w-5 h-5 text-primary" />
    </div>
  </Link>
</div>
```

### 2. Hero Sales Card

Replace the existing `<Card>` sales card with:

```tsx
{/* Hero Card */}
<div className="mx-4 rounded-3xl bg-primary text-primary-foreground p-5 shadow-xl shadow-primary/25 relative overflow-hidden">
  {/* Background decoration */}
  <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full" />
  <div className="absolute -right-2 top-8 w-20 h-20 bg-white/5 rounded-full" />

  {/* Label + change */}
  <div className="flex items-center justify-between mb-1">
    <p className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider">
      Today's Sales
    </p>
    {/* vs yesterday — show if data available */}
    {summary?.yesterdayTotalSales > 0 && (
      <div className={cn(
        "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
        summary.todayTotalSales >= summary.yesterdayTotalSales
          ? "bg-white/20 text-white"
          : "bg-black/20 text-white/80"
      )}>
        {summary.todayTotalSales >= summary.yesterdayTotalSales
          ? <TrendingUp className="w-3 h-3" />
          : <TrendingDown className="w-3 h-3" />
        }
        {Math.abs(((summary.todayTotalSales - summary.yesterdayTotalSales)
          / summary.yesterdayTotalSales) * 100).toFixed(0)}% vs yesterday
      </div>
    )}
  </div>

  {/* Big number */}
  {isLoadingSummary ? (
    <div className="h-12 w-40 bg-white/20 rounded-xl animate-pulse mb-3" />
  ) : (
    <p className="text-5xl font-bold tracking-tight mb-3">
      {formatCurrency(summary?.todayTotalSales ?? 0)}
    </p>
  )}

  {/* Payment breakdown row */}
  <div className="grid grid-cols-4 gap-2">
    {[
      { label: "Cash",   value: summary?.todayCashReceived },
      { label: "UPI",    value: summary?.todayUpiReceived  },
      { label: "Udhaar", value: summary?.todayUdhaarGiven  },
      { label: "Bills",  value: summary?.todayBillCount, isCnt: true },
    ].map(item => (
      <div key={item.label}>
        <p className="text-[10px] text-primary-foreground/60 font-medium">{item.label}</p>
        <p className="text-sm font-bold">
          {item.isCnt ? (item.value ?? 0) : formatCurrency(item.value ?? 0)}
        </p>
      </div>
    ))}
  </div>

  {/* Profit strip */}
  {summary?.todayEstimatedProfit != null && (
    <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <BarChart2 className="w-3.5 h-3.5 text-primary-foreground/60" />
        <span className="text-primary-foreground/60 text-xs">Est. Profit</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg">
          {formatCurrency(summary.todayEstimatedProfit)}
        </span>
        {marginPct != null && (
          <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">
            {marginPct.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )}
</div>
```

### 3. Quick Actions — 2×2 Grid

Replace the current 4-column icon grid with large tap targets:

```tsx
<div className="px-4">
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
    Quick Actions
  </p>
  <div className="grid grid-cols-2 gap-3">
    {[
      { href: "/billing",       icon: Receipt,        label: "New Bill",       sub: "Start billing",       color: "bg-primary text-white shadow-lg shadow-primary/30" },
      { href: "/stock/receive", icon: ArrowDownToLine, label: "Receive Stock",  sub: "Add inventory",       color: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" },
      { href: "/customers",     icon: IndianRupee,     label: "Get Payment",   sub: "Collect udhaar",      color: "bg-blue-500 text-white shadow-lg shadow-blue-500/25" },
      { href: "/products/new",  icon: Plus,            label: "Add Product",   sub: "New item",            color: "bg-violet-500 text-white shadow-lg shadow-violet-500/25" },
    ].map(action => {
      const Icon = action.icon;
      return (
        <Link key={action.href} href={action.href}>
          <div className={cn(
            "rounded-2xl p-4 flex items-center gap-3 active-elevate",
            action.color
          )}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">{action.label}</p>
              <p className="text-[11px] opacity-75 mt-0.5">{action.sub}</p>
            </div>
          </div>
        </Link>
      );
    })}
  </div>
</div>
```

### 4. Low Stock Alert Strip

Replace existing low stock section with a compact urgent strip:

```tsx
{lowStock && lowStock.length > 0 && (
  <div className="mx-4">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
          Low Stock — {lowStock.length} items
        </p>
      </div>
      <Link href="/low-stock">
        <span className="text-xs text-primary font-semibold">See all →</span>
      </Link>
    </div>
    <div className="space-y-1.5">
      {lowStock.slice(0, 3).map(p => (
        <Link key={p.id} href={`/products/${p.id}`}>
          <div className={cn(
            "flex items-center justify-between rounded-xl border px-3 py-2.5 bg-white",
            Number(p.currentStock) <= 0
              ? "border-red-200 bg-red-50"
              : "border-amber-200 bg-amber-50"
          )}>
            <p className="text-sm font-semibold">{p.name}</p>
            <div className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              Number(p.currentStock) <= 0
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
            )}>
              {Number(p.currentStock) <= 0 ? "Out of Stock" : `${p.currentStock} left`}
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
)}
```

### 5. Recent Activity — Timeline Style

Replace the flat activity list with a timeline:

```tsx
<div className="px-4 pb-24">
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
    Recent Activity
  </p>
  <div className="relative">
    {/* Vertical timeline line */}
    <div className="absolute left-[18px] top-2 bottom-2 w-px bg-muted" />

    <div className="space-y-3">
      {isLoadingActivity
        ? Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3 items-start pl-1">
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-1 pt-1">
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))
        : activity?.slice(0, 6).map((item, idx) => {
            const isBill = item.eventType === "bill_created";
            const isStock = item.eventType?.includes("stock");
            const dotColor = isBill ? "bg-primary" : isStock ? "bg-emerald-500" : "bg-muted-foreground";
            return (
              <div key={idx} className="flex gap-3 items-start pl-1">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm",
                  dotColor
                )}>
                  {isBill ? <Receipt className="w-4 h-4" />
                   : isStock ? <Package className="w-4 h-4" />
                   : <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1 bg-white rounded-xl border border-muted/50 px-3 py-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{item.description}</p>
                    {item.amount && (
                      <span className="text-sm font-bold text-primary shrink-0">
                        {formatCurrency(Number(item.amount))}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatTime(item.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
      }
    </div>
  </div>
</div>
```

---

---

# Screen 2 — Customer Profile

**File:** `artifacts/safai-market/src/pages/customers/detail.tsx`

---

## What's Wrong Now

- Udhaar balance is a small blue box — not the most important thing on the screen
- "Receive Payment" button is too plain for the most critical action
- Bills history is buried below the fold
- No visual differentiation between customers with/without udhaar
- WhatsApp reminder button exists but is not prominent enough

---

## New Layout Structure

```
┌─────────────────────────────────────┐
│ ←  Ramesh Kumar             ✏️       │  ← Header
├─────────────────────────────────────┤
│                                     │
│  ╔═══════════════════════════════╗  │  ← Udhaar Hero (RED if >0)
│  ║  Outstanding Udhaar           ║  │
│  ║  ₹1,250                      ║  │
│  ║                               ║  │
│  ║  [💬 Send Reminder] [💰 Pay]  ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  📞 9876543210    📍 Main Bazaar    │  ← Contact info (compact)
│                                     │
│  📊 Stats                          │
│  ┌──────────┐ ┌──────────┐        │
│  │ 42 Bills │ │ ₹38,400  │        │
│  │ Total    │ │ Lifetime │        │
│  └──────────┘ └──────────┘        │
│                                     │
│  🧾 Recent Bills                   │
│  ┌────────────────────────────┐    │
│  │ #BL-260601 · ₹450 · Cash  │    │
│  │ Today 2:30 PM              │    │
│  ├────────────────────────────┤    │
│  │ #BL-260531 · ₹820 · UPI   │    │
│  │ Yesterday 4:15 PM          │    │
│  └────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## Implementation

### 1. Udhaar Hero Card

This must be the FIRST thing visible on the screen:

```tsx
{/* Udhaar Hero — only shown when balance > 0 */}
{Number(customer.udhaarBalance) > 0 && (
  <div className="mx-4 mt-4 rounded-3xl bg-red-500 text-white p-5 shadow-xl shadow-red-500/30 relative overflow-hidden">
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
    <p className="text-red-100 text-xs font-semibold uppercase tracking-wider mb-1">
      Outstanding Udhaar
    </p>
    <p className="text-4xl font-bold mb-4">
      {formatCurrency(Number(customer.udhaarBalance))}
    </p>
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={handleUdhaarReminder}
        className="flex items-center justify-center gap-2 h-11 rounded-xl bg-white/20 text-white text-sm font-semibold active-elevate"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967..." />
        </svg>
        Send Reminder
      </button>
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center justify-center gap-2 h-11 rounded-xl bg-white text-red-600 text-sm font-bold active-elevate shadow-md">
            <IndianRupee className="w-4 h-4" />
            Collect Payment
          </button>
        </DialogTrigger>
        {/* existing payment dialog */}
      </Dialog>
    </div>
  </div>
)}

{/* No Udhaar — show a green "all clear" card */}
{Number(customer.udhaarBalance) <= 0 && (
  <div className="mx-4 mt-4 rounded-3xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
      <CheckCircle2 className="w-5 h-5 text-green-600" />
    </div>
    <div>
      <p className="text-sm font-bold text-green-700">No Outstanding Udhaar</p>
      <p className="text-xs text-green-600">All payments are cleared</p>
    </div>
  </div>
)}
```

### 2. Contact + Stats Row

```tsx
<div className="mx-4 mt-4 bg-white rounded-2xl border border-muted/50 divide-y divide-muted/30">
  {/* Contact info */}
  <div className="p-4 flex items-center gap-4">
    {customer.phone && (
      <a href={`tel:${customer.phone}`}
        className="flex items-center gap-2 text-sm font-medium text-foreground">
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
          <Phone className="w-4 h-4 text-blue-600" />
        </div>
        {customer.phone}
      </a>
    )}
    {customer.address && (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <MapPin className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="truncate">{customer.address}</span>
      </div>
    )}
  </div>

  {/* Stats row */}
  <div className="grid grid-cols-2 divide-x divide-muted/30">
    <div className="p-4 text-center">
      <p className="text-2xl font-bold">{customerBills?.length ?? 0}</p>
      <p className="text-xs text-muted-foreground mt-0.5">Total Bills</p>
    </div>
    <div className="p-4 text-center">
      <p className="text-2xl font-bold">
        {formatCurrency(customerBills?.reduce((s, b) => s + Number(b.totalAmount), 0) ?? 0)}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">Lifetime Value</p>
    </div>
  </div>
</div>
```

### 3. Bills Timeline

```tsx
<div className="mx-4 mt-4">
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
    Recent Bills
  </p>
  <div className="space-y-2">
    {customerBills?.slice(0, 5).map(bill => (
      <Link key={bill.id} href={`/bills/${bill.id}`}>
        <div className="bg-white rounded-xl border border-muted/50 px-4 py-3 flex items-center justify-between active-elevate">
          <div>
            <p className="text-sm font-semibold font-mono">{bill.billNumber}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(bill.createdAt)} · {bill.itemCount ?? "?"} items
            </p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold">{formatCurrency(Number(bill.totalAmount))}</p>
            <div className={cn(
              "text-[10px] font-semibold mt-0.5",
              Number(bill.udhaarAmount) > 0 ? "text-amber-600" : "text-green-600"
            )}>
              {Number(bill.cashAmount) > 0 && "Cash "}
              {Number(bill.upiAmount) > 0 && "UPI "}
              {Number(bill.udhaarAmount) > 0 && "Udhaar"}
            </div>
          </div>
        </div>
      </Link>
    ))}
  </div>
</div>
```

---

---

# Screen 3 — Bill Detail

**File:** `artifacts/safai-market/src/pages/bills/detail.tsx`

---

## What's Wrong Now

- Looks like a data table, not a receipt
- Action buttons (Print, Share, Download) are scattered
- Status badge is small and easy to miss
- No visual separation between items and totals
- Customer section and bill metadata are crammed together

---

## New Layout Structure

```
┌─────────────────────────────────────┐
│ ←  Bill Detail                      │
├─────────────────────────────────────┤
│                                     │
│        Annapurna Traders            │  ← Store name (centered)
│        #BL-260601-A3F2              │  ← Bill number (monospace)
│        Today · 2:30 PM             │
│        👤 Ramesh Kumar             │
│                                     │
├── ── ── ── ── ── ── ── ── ── ── ──┤  ← Dashed divider (receipt style)
│                                     │
│  Harpic 500ml           ×2         │
│  ₹85 each                   ₹170   │
│                                     │
│  Surf Excel 1kg              ×1    │
│  ₹120 each                  ₹120   │
│                                     │
├── ── ── ── ── ── ── ── ── ── ── ──┤
│                                     │
│  Subtotal                    ₹290  │
│  Discount                    -₹10  │
│  ─────────────────────────────     │
│  Total                       ₹280  │
│                                     │
│  💵 Cash          ₹200             │
│  📱 UPI           ₹80              │
│                                     │
├─────────────────────────────────────┤
│  [💬 Share] [🖨️ Print] [⬇️ Save]  │  ← 3-button action bar
└─────────────────────────────────────┘
```

---

## Implementation

### 1. Receipt-Style Header

```tsx
{/* Receipt header — centered, like a real receipt */}
<div className="px-6 py-5 text-center border-b border-dashed border-muted">
  {settings.storeName && (
    <p className="text-lg font-bold tracking-wide">{settings.storeName}</p>
  )}
  {settings.address && (
    <p className="text-xs text-muted-foreground mt-0.5">{settings.address}</p>
  )}
  {settings.phone && (
    <p className="text-xs text-muted-foreground">{settings.phone}</p>
  )}
  {settings.gstNumber && (
    <p className="text-xs text-muted-foreground font-mono">GSTIN: {settings.gstNumber}</p>
  )}

  <div className="mt-4 mb-1">
    <Badge variant={bill.status === "cancelled" ? "destructive" : "default"}
      className="text-xs px-3 py-1">
      {bill.status === "cancelled" ? "CANCELLED" : "PAID"}
    </Badge>
  </div>

  <p className="text-xl font-bold font-mono tracking-wider mt-2">
    {bill.billNumber}
  </p>
  <p className="text-xs text-muted-foreground mt-1">
    {formatDate(bill.createdAt)} · {formatTime(bill.createdAt)}
  </p>
  {bill.customerName && (
    <div className="flex items-center justify-center gap-1.5 mt-1.5">
      <User className="w-3.5 h-3.5 text-muted-foreground" />
      <p className="text-sm font-medium">{bill.customerName}</p>
    </div>
  )}
</div>
```

### 2. Items List — Receipt Style

```tsx
<div className="px-4 py-4 space-y-3">
  {bill.items?.map((item, idx) => (
    <div key={idx} className="flex justify-between items-start gap-3">
      <div className="flex-1">
        <p className="text-sm font-semibold leading-tight">{item.productName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatCurrency(Number(item.unitPrice))} × {Number(item.quantity)}
          {Number(item.discountAmount) > 0 && (
            <span className="text-red-500 ml-1.5">
              (-{formatCurrency(Number(item.discountAmount))})
            </span>
          )}
        </p>
      </div>
      <p className="text-sm font-bold shrink-0">
        {formatCurrency(Number(item.totalPrice))}
      </p>
    </div>
  ))}
</div>
```

### 3. Totals Section

```tsx
<div className="mx-4 bg-muted/40 rounded-2xl px-4 py-3 space-y-1.5">
  {Number(bill.discountAmount) > 0 && (
    <>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatCurrency(Number(bill.totalAmount) + Number(bill.discountAmount))}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Discount</span>
        <span className="text-red-500">-{formatCurrency(Number(bill.discountAmount))}</span>
      </div>
      <div className="h-px bg-muted my-1" />
    </>
  )}
  <div className="flex justify-between text-base font-bold">
    <span>Total</span>
    <span>{formatCurrency(Number(bill.totalAmount))}</span>
  </div>

  {/* Payment breakdown */}
  <div className="h-px bg-muted my-1" />
  {Number(bill.cashAmount) > 0 && (
    <div className="flex justify-between text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Banknote className="w-3.5 h-3.5" /> Cash
      </span>
      <span>{formatCurrency(Number(bill.cashAmount))}</span>
    </div>
  )}
  {Number(bill.upiAmount) > 0 && (
    <div className="flex justify-between text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Smartphone className="w-3.5 h-3.5" /> UPI
      </span>
      <span>{formatCurrency(Number(bill.upiAmount))}</span>
    </div>
  )}
  {Number(bill.udhaarAmount) > 0 && (
    <div className="flex justify-between text-sm">
      <span className="flex items-center gap-1.5 text-amber-600">
        <BookOpen className="w-3.5 h-3.5" /> Udhaar
      </span>
      <span className="text-amber-600 font-semibold">
        {formatCurrency(Number(bill.udhaarAmount))}
      </span>
    </div>
  )}
</div>
```

### 4. Sticky Action Bar

```tsx
{/* Sticky bottom action bar */}
<div className="sticky bottom-0 bg-white border-t px-4 py-3"
  style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
  <div className="grid grid-cols-3 gap-2">
    <Button variant="outline" className="h-12 gap-1.5 rounded-xl text-sm font-semibold"
      onClick={() => setShareOpen(true)}>
      <Share2 className="w-4 h-4" /> Share
    </Button>
    <Button variant="outline" className="h-12 gap-1.5 rounded-xl text-sm font-semibold"
      onClick={handlePrint}>
      <Printer className="w-4 h-4" /> Print
    </Button>
    <Button className="h-12 gap-1.5 rounded-xl text-sm font-semibold"
      onClick={handleDownload}>
      <Download className="w-4 h-4" /> Save
    </Button>
  </div>
</div>
```

---

---

# Screen 4 — More Menu

**File:** `artifacts/safai-market/src/pages/more/index.tsx`

---

## What's Wrong Now

- Plain list with small icons — no personality
- Store name just a subtitle in the header — not prominent
- All sections look the same — no visual priority
- No today's summary at a glance

---

## New Layout Structure

```
┌─────────────────────────────────────┐
│  ╔═══════════════════════════════╗  │  ← Shop card (primary gradient)
│  ║  🏪 Annapurna Traders         ║  │
│  ║  Today: ₹4,250 · 14 bills    ║  │  ← Live today summary
│  ║  ─────────────────────────   ║  │
│  ║  [⚙️ Settings]               ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  📊 Reports & Insights              │  ← Section with colored icons
│  ● Profit Report                    │
│  ● Bills History                    │
│  ● Daily Closing                    │
│                                     │
│  📦 Inventory                       │
│  ● Receive Stock                    │
│  ● Stock Movements                  │
│  ● Low Stock Alert                  │
│                                     │
│  🏭 Operations                      │
│  ● Suppliers                        │
│  ● Purchase Entry                   │
│  ● Expenses                         │
│                                     │
│  ⚙️ Settings & Tools               │
│  ● Store Settings                   │
│  ● Bill Settings                    │
│  ● Device Center                    │
│  ● Backup & Export                  │
│  ● Sync Center                      │
│                                     │
│  [Sign Out]                         │
└─────────────────────────────────────┘
```

---

## Implementation

### 1. Shop Hero Card

```tsx
{/* Shop hero card */}
<div className="mx-0 rounded-none bg-primary px-5 pt-12 pb-5 relative overflow-hidden">
  <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full" />

  <div className="flex items-start justify-between">
    <div>
      <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider">
        Your Shop
      </p>
      <h1 className="text-2xl font-bold text-white mt-0.5">
        {settings.storeName}
      </h1>
      {summary && (
        <p className="text-primary-foreground/80 text-sm mt-1.5">
          Today: {formatCurrency(summary.todayTotalSales)} · {summary.todayBillCount} bills
        </p>
      )}
    </div>
    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
      <Store className="w-6 h-6 text-white" />
    </div>
  </div>

  <Link href="/settings/store">
    <button className="mt-4 flex items-center gap-2 bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl active-elevate">
      <Settings className="w-4 h-4" />
      Edit Store Settings
    </button>
  </Link>
</div>
```

### 2. Menu Sections — Polished Cards

Replace the flat list items with better-structured cards:

```tsx
{menuSections.map(section => (
  <div key={section.title} className="px-4">
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
      {section.title}
    </p>
    <div className="bg-white rounded-2xl border border-muted/50 overflow-hidden divide-y divide-muted/30">
      {section.items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href}>
            <div className="flex items-center gap-3 px-4 py-3.5 active-elevate">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", item.color)}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </div>
          </Link>
        );
      })}
    </div>
  </div>
))}
```

---

---

# Screen 5 — Daily Closing

**File:** `artifacts/safai-market/src/pages/daily-closing/index.tsx`

---

## What's Wrong Now

- Single long form — overwhelming
- Expected vs actual cash comparison is hard to read
- Share button is small — not prominent for such an important action
- History list is just dates — no quick insight

---

## New Layout

Split into two visual zones:
- Top: Day Summary (read-only, what happened)
- Bottom: Cash Register (enter actual cash, close day)

### 1. Summary Zone

```tsx
{/* Day summary — read only */}
<div className="mx-4 mt-4 rounded-2xl bg-white border border-muted/50 overflow-hidden">
  <div className="bg-muted/40 px-4 py-3 border-b border-muted/50">
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
      Today's Summary
    </p>
  </div>
  <div className="grid grid-cols-2 divide-x divide-muted/30">
    {[
      { label: "Total Sales",    value: formatCurrency(summary?.totalSales ?? 0),    color: "text-foreground" },
      { label: "Est. Profit",    value: formatCurrency(summary?.estimatedProfit ?? 0), color: "text-green-600" },
      { label: "Cash Sales",     value: formatCurrency(summary?.cashSales ?? 0),     color: "text-foreground" },
      { label: "UPI Sales",      value: formatCurrency(summary?.upiSales ?? 0),      color: "text-blue-600"   },
      { label: "Udhaar Given",   value: formatCurrency(summary?.udhaarSales ?? 0),   color: "text-amber-600"  },
      { label: "Expenses",       value: formatCurrency(summary?.totalExpenses ?? 0), color: "text-red-500"    },
    ].map((row, idx) => (
      <div key={idx} className={cn(
        "p-4 text-center",
        idx % 2 === 0 && idx > 0 ? "border-t border-muted/30" : "",
        idx % 2 === 1 && idx > 1 ? "border-t border-muted/30" : ""
      )}>
        <p className={cn("text-lg font-bold", row.color)}>{row.value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{row.label}</p>
      </div>
    ))}
  </div>
</div>
```

### 2. Cash Register Zone

```tsx
{/* Cash register — interactive */}
<div className="mx-4 mt-4 rounded-2xl bg-white border border-muted/50 p-4 space-y-4">
  <p className="text-sm font-bold">Cash Register Closing</p>

  {/* Expected */}
  <div className="flex justify-between items-center py-2 border-b border-muted/30">
    <p className="text-sm text-muted-foreground">Expected Cash</p>
    <p className="text-base font-bold">{formatCurrency(summary?.expectedCash ?? 0)}</p>
  </div>

  {/* Actual input */}
  <div>
    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
      Actual Cash in Drawer
    </label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
      <Input
        type="number"
        value={actualCash}
        onChange={e => setActualCash(e.target.value)}
        className="h-14 pl-8 text-2xl font-bold rounded-xl border-muted"
        placeholder="0"
      />
    </div>
  </div>

  {/* Live difference */}
  {actualCash && (
    <div className={cn(
      "flex justify-between items-center rounded-xl px-4 py-3",
      Number(actualCash) >= (summary?.expectedCash ?? 0)
        ? "bg-green-50 border border-green-200"
        : "bg-red-50 border border-red-200"
    )}>
      <p className="text-sm font-semibold">
        {Number(actualCash) >= (summary?.expectedCash ?? 0) ? "Surplus" : "Shortage"}
      </p>
      <p className={cn("text-base font-bold",
        Number(actualCash) >= (summary?.expectedCash ?? 0) ? "text-green-600" : "text-red-600"
      )}>
        {Number(actualCash) >= (summary?.expectedCash ?? 0) ? "+" : ""}
        {formatCurrency(Number(actualCash) - (summary?.expectedCash ?? 0))}
      </p>
    </div>
  )}

  <Input
    value={notes}
    onChange={e => setNotes(e.target.value)}
    placeholder="Notes (optional)..."
    className="h-11 rounded-xl border-muted"
  />

  {/* Action buttons */}
  <div className="grid grid-cols-2 gap-3">
    <Button variant="outline" className="h-12 gap-2 rounded-xl font-semibold border-green-200 text-green-700"
      onClick={() => handleShareWhatsApp(todayClosing, summary)}>
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382..." /></svg>
      Share
    </Button>
    <Button className="h-12 gap-2 rounded-xl font-bold"
      onClick={handleClose}
      disabled={!actualCash || createClosing.isPending}>
      {createClosing.isPending ? "Saving..." : "Close Day"}
    </Button>
  </div>
</div>
```

---

---

# Screen 6 — Profit Report

**File:** `artifacts/safai-market/src/pages/profit/index.tsx`

---

## What's Wrong Now

- Mini bar charts exist but too small — hard to read on phone
- Period toggle (7d/30d/90d) works but looks bland
- Top products list is very dense
- No "headline insight" — what's the key takeaway?

---

## Key Changes

### 1. Summary Headline Card

Add above the period toggle:

```tsx
<div className="mx-4 mt-4 rounded-2xl bg-primary text-primary-foreground p-4">
  <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider">
    {period}-Day Summary
  </p>
  <p className="text-4xl font-bold mt-1">
    {formatCurrency(summary?.totalProfit ?? 0)}
  </p>
  <div className="flex gap-4 mt-3 text-sm">
    <div>
      <p className="text-primary-foreground/60 text-xs">Revenue</p>
      <p className="font-semibold">{formatCurrency(summary?.totalSales ?? 0)}</p>
    </div>
    <div>
      <p className="text-primary-foreground/60 text-xs">Avg Margin</p>
      <p className="font-semibold">
        {summary?.totalSales > 0
          ? ((summary.totalProfit / summary.totalSales) * 100).toFixed(1) + "%"
          : "—"}
      </p>
    </div>
    <div>
      <p className="text-primary-foreground/60 text-xs">Bills</p>
      <p className="font-semibold">{summary?.billCount ?? 0}</p>
    </div>
  </div>
</div>
```

### 2. Daily Bar Chart — Taller, Readable

Replace the `MiniBar` 4px bars with proper 48px bars:

```tsx
{/* Daily chart */}
{daily && daily.length > 0 && (
  <div className="mx-4 bg-white rounded-2xl border border-muted/50 p-4">
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
      Daily Sales
    </p>
    <div className="flex items-end gap-1 h-16">
      {daily.slice(-14).map((d, idx) => {
        const pct = maxDailySales > 0 ? (d.sales / maxDailySales) * 100 : 0;
        const isToday = idx === daily.slice(-14).length - 1;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-full rounded-t-sm transition-all",
                isToday ? "bg-primary" : "bg-primary/30"
              )}
              style={{ height: `${Math.max(4, pct * 0.64)}px` }}
            />
          </div>
        );
      })}
    </div>
    <div className="flex justify-between mt-1">
      <p className="text-[10px] text-muted-foreground">{daily.slice(-14)[0]?.date?.slice(5)}</p>
      <p className="text-[10px] text-muted-foreground">Today</p>
    </div>
  </div>
)}
```

### 3. Top Products — Cleaner Cards

```tsx
{byProduct?.slice(0, 5).map((p, idx) => (
  <div key={p.productId} className="flex items-center gap-3 bg-white rounded-xl border border-muted/50 px-4 py-3">
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
      idx === 0 ? "bg-yellow-100 text-yellow-700"
      : idx === 1 ? "bg-gray-100 text-gray-600"
      : idx === 2 ? "bg-orange-100 text-orange-600"
      : "bg-muted text-muted-foreground"
    )}>
      #{idx + 1}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold truncate">{p.productName}</p>
      <p className="text-xs text-muted-foreground">{p.quantity} sold</p>
    </div>
    <div className="text-right shrink-0">
      <p className={cn("text-sm font-bold", p.profit >= 0 ? "text-green-600" : "text-red-500")}>
        {formatCurrency(p.profit)}
      </p>
      <p className="text-[10px] text-muted-foreground">profit</p>
    </div>
  </div>
))}
```

---

---

# Screen 7 — Bills History

**File:** `artifacts/safai-market/src/pages/bills/index.tsx`

---

## What's Wrong Now

- Plain list — no visual grouping by date
- Filter (All/Paid/Udhaar/Cancelled) is functional but unstyled
- No summary stats at top

---

## Key Changes

### 1. Summary Bar

Add at the top below the search:

```tsx
{bills && (
  <div className="mx-4 grid grid-cols-3 gap-2">
    {[
      { label: "Total",    value: formatCurrency(bills.reduce((s, b) => s + Number(b.totalAmount), 0)), color: "text-foreground" },
      { label: "Bills",    value: bills.length,                                                          color: "text-primary"    },
      { label: "Udhaar",   value: formatCurrency(bills.reduce((s, b) => s + Number(b.udhaarAmount), 0)), color: "text-amber-600" },
    ].map(stat => (
      <div key={stat.label} className="bg-white rounded-xl border border-muted/50 p-3 text-center">
        <p className={cn("text-base font-bold", stat.color)}>{stat.value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
      </div>
    ))}
  </div>
)}
```

### 2. Bill Cards — Richer

```tsx
{bills?.map(bill => (
  <Link key={bill.id} href={`/bills/${bill.id}`}>
    <div className="mx-4 bg-white rounded-xl border border-muted/50 px-4 py-3 flex items-center justify-between active-elevate">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          bill.status === "cancelled" ? "bg-red-100" : "bg-primary/10"
        )}>
          <Receipt className={cn("w-4 h-4",
            bill.status === "cancelled" ? "text-red-500" : "text-primary"
          )} />
        </div>
        <div>
          <p className="text-sm font-bold font-mono">{bill.billNumber}</p>
          <p className="text-xs text-muted-foreground">
            {bill.customerName ?? "Walk-in"} · {bill.itemCount ?? "?"} items
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {formatDate(bill.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-base font-bold">{formatCurrency(Number(bill.totalAmount))}</p>
        {Number(bill.udhaarAmount) > 0 && (
          <p className="text-xs text-amber-600 font-semibold">
            Udhaar {formatCurrency(Number(bill.udhaarAmount))}
          </p>
        )}
        {bill.status === "cancelled" && (
          <p className="text-xs text-red-500 font-semibold">Cancelled</p>
        )}
      </div>
    </div>
  </Link>
))}
```

---

---

# Summary of All Changes

## Files Modified

| File | Changes |
|---|---|
| `pages/home.tsx` | Greeting header, hero sales card with % change, 2×2 quick actions, low stock strip, timeline activity |
| `pages/customers/detail.tsx` | Red udhaar hero card, prominent collect payment, contact+stats row, bills timeline |
| `pages/bills/detail.tsx` | Receipt-style layout, centered store header, dashed dividers, sticky 3-button action bar |
| `pages/more/index.tsx` | Shop hero card with live today stats, card-style menu sections with chevrons |
| `pages/daily-closing/index.tsx` | 2-zone layout (summary + cash register), live surplus/shortage indicator, prominent share button |
| `pages/profit/index.tsx` | Headline profit card, taller bar chart, ranked product cards with medals |
| `pages/bills/index.tsx` | Summary bar (total/bills/udhaar), richer bill cards with payment type |

## No New Files Required

All changes are layout/styling only within existing files.

## No API Changes Required

All data fetching hooks remain unchanged.

## Shared Patterns Used Everywhere

| Pattern | Usage |
|---|---|
| `active-elevate` | All tappable cards and buttons |
| `rounded-2xl` / `rounded-3xl` | Cards — consistent border radius |
| Hero card pattern | Sales, Udhaar, Profit — same gradient + decoration circles |
| Section label | `text-xs font-bold text-muted-foreground uppercase tracking-wider` |
| Dashed divider | Bill detail receipt-style separator |
| Timeline dots | Activity feed, bills list |

---

## Verification Checklist

- [ ] Home: greeting shows correct time of day
- [ ] Home: sales card shows vs-yesterday % (hidden when no yesterday data)
- [ ] Home: quick action grid is 2×2 with large tap targets
- [ ] Home: low stock strip only shows when items are actually low
- [ ] Home: activity feed shows timeline dots, not plain text
- [ ] Customer: udhaar hero card is red and prominent when balance > 0
- [ ] Customer: green "all clear" card shown when balance is 0
- [ ] Customer: "Collect Payment" is a white button inside the red card
- [ ] Customer: bills timeline shows payment type colour coding
- [ ] Bill Detail: store name centered at top like a real receipt
- [ ] Bill Detail: dashed divider between items and totals
- [ ] Bill Detail: sticky action bar at bottom with Share/Print/Save
- [ ] More: shop hero card shows today's sales live
- [ ] More: menu items are in card groups, not a flat list
- [ ] Daily Closing: surplus/shortage shows in real-time as user types cash
- [ ] Profit: headline card shows total profit + avg margin
- [ ] Bills History: summary bar shows totals above the list
- [ ] All screens: `pnpm build` passes with no TypeScript errors
