# Safai Market — Anupurna Traders
## Profit Margin Intelligence System
### Production-Grade Architecture Document — V1

---

> **Document Classification:** Implementation-Ready Internal PRD — New Module Specification
> **Audience:** Engineering Lead, Frontend Developer, Product Manager, Store Owner Stakeholder
> **Depends On:** PRD V6 — All architectural decisions, principles, and infrastructure inherit from V6
> **Status:** Active — Implementation-Ready
> **Supersedes:** N/A (New Module)

---

## Table of Contents

1. Executive Summary & Strategic Framing
2. Core Design Principles — Profit Intelligence
3. Business Context — Why Profit Visibility Matters for This Store
4. Section 1 — Product Cost & Profit Tracking
5. Section 2 — Product Catalog Profit Visibility
6. Section 3 — Billing Screen Profit Intelligence
7. Section 4 — Profit-Aware Discount Engine
8. Section 5 — Profit Reporting System
9. Section 6 — Store Profit Dashboard
10. Section 7 — Database Design — Complete Schema
11. Section 8 — Google Sheets Architecture
12. Section 9 — Apps Script Changes
13. Section 10 — Offline & Sync Behavior
14. Section 11 — Permissions Architecture
15. Section 12 — Audit Log System
16. Section 13 — Edge Cases — Complete Catalog
17. Section 14 — Future Expansion Roadmap
18. Integration with Existing Modules
19. Implementation Order & Phasing
20. Success Criteria

---

## 1. Executive Summary & Strategic Framing

### 1.1 What This Module Is

The Profit Margin Intelligence System is a new cross-cutting capability layer for Safai Market — Anupurna Traders. It does not replace any existing module. It enhances every existing module — product catalog, billing, reports, dashboard — with profit-awareness.

The goal is simple: the store owner should know, at any moment and in any workflow, whether they are making money and how much.

### 1.2 The Problem Being Solved

| Current State | Problem |
|---|---|
| Owner sets sell prices manually | No systematic awareness of actual margin per product |
| No buy price tracked per product | Cannot compute profit without buy price |
| Discounts applied during billing | No warning if discount wipes out the margin |
| Monthly reports show revenue | No profit line — only gross sales visible |
| Owner cannot distinguish profitable from unprofitable products | Entire product range treated as equivalent |
| Supplier rate changes go untracked for margin impact | A product becomes unprofitable silently after a supplier price increase |

### 1.3 What This Module Delivers

| Capability | Where It Appears |
|---|---|
| Profit per unit, per bill, per day, per month | Dashboard, Billing, Reports |
| Margin % per product with color indicators | Product Catalog, Billing Screen |
| Real-time profit update when discount is applied | Billing Screen |
| Warning when discount causes negative profit | Billing Screen |
| Daily, weekly, monthly profit trends | Reports Module |
| Best and worst profit products and categories | Profit Dashboard |
| Supplier rate change impact on margin | Purchase Module + Alerts |
| Historical margin tracking per product | Product Detail + Reports |

### 1.4 Why This Module Must Not Break Billing Performance

PRD V6 Principle P3 states: **Billing Speed Is Sacred.** A bill must be creatable in under 30 seconds.

The Profit Intelligence system is read-only during billing. It calculates from existing IndexedDB data. It adds zero network calls. It adds zero blocking UI steps. All profit calculations are computed in-memory from locally cached prices. This is a non-negotiable constraint.

If the profit display is toggled ON, it appends a non-intrusive display layer below existing cart items. It does not restructure the billing workflow or add a required step.

### 1.5 What This Module Is NOT

This is not a cost accounting system. It is not an audit-grade financial ledger. It is a practical, real-world profit intelligence tool for an Indian local shop owner who currently has no visibility into margins at all. Even rough profit data — directionally accurate, quickly actionable — is vastly superior to the current situation.

---

## 2. Core Design Principles — Profit Intelligence

These principles govern every design decision in this module. They extend and do not replace V6's core product principles.

### PI-1 — Profit Visibility Is Owner-Only by Default

Profit data is sensitive business intelligence. A helper billing a customer should never see buy prices, margins, or profit per item. The profit layer is invisible by default to all non-owner roles. The owner can optionally grant family-member visibility through settings.

### PI-2 — Calculations Run Locally, Always

All profit calculations — margin %, profit per unit, estimated bill profit, discount impact — are computed in-memory from IndexedDB data. No network call is required. Profit data is available offline, always.

### PI-3 — Estimated Profit Is Labelled as Estimated

The system never shows a profit figure as if it were exact. All runtime profit figures during billing carry the label "Estimated." Historical profit figures from saved bills carry a "Recorded" label. This distinction is critical for trust. Buy prices change over time. A saved bill's estimated profit was calculated using the buy price at time of billing, not retroactively.

### PI-4 — Negative Margin Always Triggers a Warning

If any item in a bill would be sold below buy price — due to discount or price override — the system displays a clear, non-blocking warning. The owner is informed but not prevented from proceeding. An override confirmation is required before saving.

### PI-5 — Margin Badges Are Color-Coded, Not Numerical by Default

For helper-visible product cards, margin data must not be shown. For owner-visible contexts, margin is shown as color-coded badges (green / amber / red) rather than raw numbers, to make scanning fast and reduce cognitive load.

### PI-6 — Historical Accuracy Over Live Accuracy

When a bill is saved, the buy price, sell price, and calculated profit at that moment are snapshotted into the bill record. The profit figure for a bill never changes retroactively, even if the product's buy price changes tomorrow. This preserves the integrity of historical profit reports.

### PI-7 — Buy Price Is the Most Sensitive Field in the System

The buy price is not shown to helpers. It is not shown to family members unless the owner explicitly enables this in settings. It is the field from which all profit data flows. Its visibility must be tightly controlled.

### PI-8 — Profit Data Must Never Slow Down Product Lookup

Product search during billing must remain under 200ms. Profit calculation is a post-selection enrichment step. It does not execute during search — only after a product is added to the cart.

---

## 3. Business Context — Why Profit Visibility Matters for This Store

### 3.1 The Real Problem With No Margin Awareness

The owner of Anupurna Traders has been selling products for years based on rough mental estimates of margin. The actual reality:

- Some products appear profitable because they sell frequently, but their margin per unit is very thin (e.g., washing powder sachets)
- Some products appear unprofitable because they sell rarely, but their margin per unit is very high (e.g., steel vessels, quality brooms)
- A supplier silently increases the purchase rate. The sell price is never updated. The product becomes unprofitable within days. The owner does not know for weeks.
- Frequent customers negotiate small discounts on every bill. Each discount seems trivial (₹5 here, ₹10 there). Over a month, the aggregate discount may exceed ₹2,000 of pure profit erosion.
- At month end, the owner knows they did ₹80,000 in sales. But they don't know if the actual cash profit was ₹8,000 or ₹18,000. They cannot make informed decisions about reordering, supplier negotiation, or pricing.

### 3.2 How This Module Changes the Owner's Day

**Morning:** Dashboard shows yesterday's estimated profit alongside yesterday's sales. The owner sees both numbers side by side.

**During billing:** When an item is added and the owner is logged in, a subtle line below the item shows the estimated profit contribution. If they apply a discount, the line updates instantly. If the discount wipes the margin, a warning appears.

**During a supplier purchase:** When the owner records a purchase and enters a new buy price, the system shows how this new rate affects the margin for that product and flags it if the margin has fallen below a defined threshold.

**End of day:** Daily closing shows estimated daily profit alongside daily sales.

**Monthly review:** Monthly report shows product-wise and category-wise profit analysis. The owner can see which categories are earning and which are bleeding.

---

## 4. Section 1 — Product Cost & Profit Tracking

### 4.1 Price Fields Architecture

Every product record must support the following price fields. These replace the existing single-price model where only `sell_price` was tracked.

```
Product Price Schema:

buy_price          ₹  The actual cost paid to the supplier per unit
mrp                ₹  Maximum Retail Price printed on the product (if applicable)
sell_price         ₹  The price charged to retail customers (must be ≤ MRP)
wholesale_price    ₹  The price charged to bulk/wholesale customers (optional)
```

**Field Relationships:**

```
buy_price < sell_price         → Standard profitable product
sell_price ≤ mrp               → Legal compliance (do not sell above MRP)
wholesale_price < sell_price   → Wholesale buyer gets a lower rate
buy_price ≥ sell_price         → WARNING: Negative or zero margin product
```

**Computed Fields (never stored; always derived at runtime):**

```
profit_per_unit          = sell_price − buy_price
margin_pct               = (profit_per_unit ÷ sell_price) × 100
wholesale_profit_per_unit = wholesale_price − buy_price
wholesale_margin_pct     = (wholesale_profit_per_unit ÷ wholesale_price) × 100
```

### 4.2 Margin Tier Classification

These tiers are used for color-coded badges, filtering, and alerts.

| Tier | Margin % Range | Badge Color | Label |
|---|---|---|---|
| `HIGH_MARGIN` | ≥ 25% | Green | High Margin |
| `GOOD_MARGIN` | 15% – 24.9% | Blue | Good |
| `LOW_MARGIN` | 5% – 14.9% | Amber | Low Margin |
| `THIN_MARGIN` | 1% – 4.9% | Orange | Thin |
| `BREAK_EVEN` | 0% | Yellow | Break Even |
| `NEGATIVE_MARGIN` | < 0% | Red | Loss Product |
| `UNTRACKED` | buy_price = null | Grey | No Cost Data |

The tier thresholds are configurable by the owner in Settings → Profit Intelligence → Margin Thresholds.

**Default thresholds are pre-set** at the above values and tuned for a cleaning products retail shop with typical 10–30% margins.

### 4.3 Buy Price Entry UX

The buy price field is added to the product creation and product editing screens.

**Product Creation (Owner Role):**
```
Product Name:        [____________]
Category:            [Dropdown    ]
Unit:                [Piece / Box ]

Pricing
─────────────────────────────────
Buy Price (Cost):    ₹ [_______]    ← NEW FIELD
MRP:                 ₹ [_______]    ← Existing field
Sell Price:          ₹ [_______]    ← Existing field
Wholesale Price:     ₹ [_______]    ← NEW FIELD (optional)

Estimated Margin:    __ %           ← Computed live as user types
                     [Green Badge]
```

**Live Margin Preview:** As the owner types the buy price and sell price, the margin percentage and margin tier badge update in real-time below the pricing fields. This gives instant feedback during product creation so the owner can adjust pricing before saving.

**Margin Preview Formula (live, client-side):**
```javascript
const computeMargin = (buyPrice, sellPrice) => {
  if (!buyPrice || !sellPrice || sellPrice === 0) return null;
  const profit = sellPrice - buyPrice;
  const marginPct = (profit / sellPrice) * 100;
  return { profit, marginPct, tier: classifyMarginTier(marginPct) };
};
```

### 4.4 Buy Price Update Logic

Buy price changes must be handled carefully because they affect the accuracy of historical profit calculations.

**Rule 1 — Buy Price Change is a Ledger Event**

When the owner changes a product's buy price, the old buy price is preserved in `PRICE_HISTORY`. The new buy price takes effect for all future bills. Bills already saved retain their original snapshotted buy price.

**Rule 2 — Supplier Purchase Auto-Updates Buy Price**

When the owner records a new supplier purchase for a product, the system detects if the per-unit purchase rate differs from the current buy price on file.

```
Flow:
1. Owner records purchase: 24 units of Harpic 500ml at ₹58/unit
2. System checks current buy_price for Harpic 500ml: ₹55
3. System detects rate change: +₹3 per unit
4. System prompts: "New purchase rate ₹58 is higher than current buy price ₹55.
   Update buy price for Harpic 500ml to ₹58?"
   [Update] [Keep Old] [Update & Review Sell Price]
5. If owner selects "Update & Review Sell Price":
   → System shows current sell price (₹95), new margin at ₹58 buy (₹37 → 38.9%)
   → If margin drops below threshold: shows warning badge
   → Owner can adjust sell price in the same flow
```

**Rule 3 — Bulk Purchase Rate Change Flow**

When a supplier increases rates across multiple products in a delivery, the system must allow batch review rather than product-by-product confirmation.

```
After recording a purchase with multiple rate changes:
"3 products have new purchase rates compared to current buy prices.
 Review margin impact?"

Product             Old Buy  New Buy  Sell   New Margin
─────────────────────────────────────────────────────────
Harpic 500ml        ₹55     ₹58     ₹95    38.9% ↓ (was 42.1%)
Vim Bar 200g        ₹18     ₹20     ₹32    37.5% ↓ (was 43.8%)
Lizol 500ml         ₹72     ₹72     ₹115   37.4% (no change)

[Update All Buy Prices] [Review Each] [Skip For Now]
```

### 4.5 Historical Buy Price Tracking

The `PRICE_HISTORY` tab in Google Sheets (already defined in V6) is extended to track buy price changes alongside sell price changes.

```
PRICE_HISTORY extended columns:
change_type        | Enum: SELL_PRICE | BUY_PRICE | WHOLESALE_PRICE | MRP
old_value          | Number
new_value          | Number
triggered_by       | Enum: MANUAL_EDIT | PURCHASE_ENTRY | BULK_UPDATE | SYNC_CORRECTION
purchase_id        | UUID (if triggered by a purchase; otherwise null)
margin_before      | Number (margin % before change)
margin_after       | Number (margin % after change)
```

### 4.6 Validation Rules for Pricing

These rules are enforced both client-side (immediate feedback) and server-side (Apps Script validation).

| Rule | Severity | Behavior |
|---|---|---|
| buy_price > sell_price | WARNING | Shows negative margin badge; owner must confirm before saving |
| sell_price > mrp | BLOCKING | Cannot save; sell price must be ≤ MRP if MRP is set |
| buy_price < 0 | BLOCKING | Negative buy price is invalid |
| sell_price < 0 | BLOCKING | Negative sell price is invalid |
| wholesale_price > sell_price | WARNING | Wholesale higher than retail is unusual; requires confirmation |
| wholesale_price < buy_price | WARNING | Selling wholesale below cost; shows loss badge |
| buy_price = 0 but sell_price > 0 | INFO | "Buy price appears to be free/gifted. Margin will show 100%." |

---

## 5. Section 2 — Product Catalog Profit Visibility

### 5.1 Product Card Design — Owner View

In the Products module, when the logged-in user is **Owner**, each product card shows the profit intelligence layer.

**Product Card Layout — Owner Role:**
```
┌─────────────────────────────────────────────┐
│  [Category Icon]  Harpic Toilet Cleaner 500ml│
│                   SKU: HC-500                │
│                                              │
│  Stock: 12 units   [LOW STOCK badge]         │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Cost: ₹55    Sell: ₹95             │   │
│  │  Profit: ₹40/unit   [38.9%] ●GREEN  │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [Edit]  [Stock]  [History]                  │
└─────────────────────────────────────────────┘
```

**Product Card Layout — Family Member Role (profit hidden by default):**
```
┌─────────────────────────────────────────────┐
│  [Category Icon]  Harpic Toilet Cleaner 500ml│
│                   SKU: HC-500                │
│  Stock: 12 units   [LOW STOCK badge]         │
│  Sell Price: ₹95                             │
│  [Edit]  [Stock]  [History]                  │
└─────────────────────────────────────────────┘
```

If the owner enables "Show profit to family members" in Settings, the family view gains the profit intelligence block.

**Product Card Layout — Helper Role:**
```
┌─────────────────────────────────────────────┐
│  [Category Icon]  Harpic Toilet Cleaner 500ml│
│  Stock: 12 units                             │
│  Price: ₹95                                  │
└─────────────────────────────────────────────┘
```

No buy price. No margin. No profit. Helper sees only what they need to bill.

### 5.2 Margin Badge System

Margin badges appear in product cards, product search results (owner view), and product detail screens.

```
Badge Component:

HIGH_MARGIN  → ● Green  background-green-100  text-green-800   "38.9%"
GOOD_MARGIN  → ● Blue   background-blue-100   text-blue-800    "22.5%"
LOW_MARGIN   → ● Amber  background-amber-100  text-amber-800   "11.2%"
THIN_MARGIN  → ● Orange background-orange-100 text-orange-800  " 3.1%"
BREAK_EVEN   → ● Yellow background-yellow-100 text-yellow-800  " 0.0%"
NEGATIVE     → ● Red    background-red-100    text-red-800     "−5.2%"
UNTRACKED    → ○ Grey   background-gray-100   text-gray-500    "  —  "
```

Badge behavior:
- **Tap the badge** → Opens a small tooltip: "Cost: ₹55 | Sell: ₹95 | Profit: ₹40/unit"
- **Long-press the badge** (owner) → Opens quick price edit bottom sheet
- Badge value shows margin % for current sell price; does not show buy price in the badge itself

### 5.3 High Margin Indicators

Products with `HIGH_MARGIN` tier get a visual star indicator next to their name in the product list. This draws the owner's attention to products worth promoting or prioritizing in placement.

```
★ Harpic 500ml    [38.9%] ●
★ Vim Bar 200g    [37.5%] ●
  Floor Cleaner   [12.0%] ●
```

The star indicator can be toggled off in Settings → Profit Intelligence → Hide Margin Stars.

### 5.4 Low Margin Warnings

Products with `THIN_MARGIN` or `NEGATIVE_MARGIN` tiers display a warning flag in the product list.

```
⚠ Washing Powder Sachet  [3.1%]  ●ORANGE
✕ Liquid Soap 50ml       [−2.0%] ●RED
```

Tapping the warning icon on a `NEGATIVE_MARGIN` product opens an alert:

```
⚠ Selling Below Cost

Liquid Soap 50ml
Buy Price: ₹22.00
Sell Price: ₹21.50
Loss Per Sale: ₹0.50

What would you like to do?
[Update Sell Price]  [Review Buy Price]  [Dismiss]
```

### 5.5 Product Catalog Filtering by Profitability

A new filter group is added to the Products module filter sheet.

```
FILTER SHEET — Profitability Filters (Owner Only)

Margin Tier:
  ☐ High Margin (≥ 25%)
  ☐ Good Margin (15–24%)
  ☐ Low Margin (5–14%)
  ☐ Thin Margin (1–4%)
  ☐ Break Even
  ☐ Loss Products
  ☐ No Buy Price Set

Special Filters:
  ☐ Margin dropped since last purchase
  ☐ Products needing price review
  ☐ Highest absolute profit per unit
```

These filters are additive. Selecting "Loss Products + No Buy Price Set" shows all products with either condition.

**"Needs Price Review" filter logic:**
A product is flagged for price review if:
1. Its buy price was updated in the last 30 days AND its sell price was not updated, AND
2. The margin has dropped below the `LOW_MARGIN` threshold as a result.

### 5.6 Product Catalog Sorting by Profitability

Sort options (Owner-only) added to the Products sort drawer:

```
Sort By:
  ○ Name (A–Z) [default]
  ○ Stock (Low to High)
  ● Margin % (High to Low)       ← NEW
  ○ Margin % (Low to High)       ← NEW
  ○ Profit/Unit (High to Low)    ← NEW
  ○ Last Updated
```

### 5.7 Product Detail Screen — Profit History Section

On the product detail screen, a new collapsible "Profit History" section is added at the bottom (owner-only).

```
PROFIT HISTORY — Harpic 500ml
─────────────────────────────────────────────
Date          Buy     Sell    Margin   Change
─────────────────────────────────────────────
Today         ₹58     ₹95     38.9%   ↓ −3.2%
3 weeks ago   ₹55     ₹95     42.1%   —
6 months ago  ₹50     ₹90     44.4%   —
─────────────────────────────────────────────
Trend: Margin declining. Consider reviewing sell price.
```

The data is drawn from `PRICE_HISTORY` ledger, filtered for this product, sorted by date descending.

---

## 6. Section 3 — Billing Screen Profit Intelligence

### 6.1 The Billing Profit Display Setting

A new toggle is added under Settings → Billing → Profit Visibility:

```
SHOW PROFIT DURING BILLING

When enabled, estimated profit is shown per item
and for the full bill while you create bills.
Visible to Owner only.

[  ON  / OFF  ]

Show to Family Members?  [OFF]
```

This setting is device-level and role-gated. It defaults to OFF. The owner must explicitly enable it. When enabled, profit data appears in the billing screen only when the logged-in user is Owner (or Family Member if the sub-setting is enabled).

This setting must never affect billing performance, workflow steps, or helper behavior.

### 6.2 Billing Cart Item — Profit Display

When the profit display setting is ON, each cart item gains a profit line beneath its price line.

**Cart Item Layout — Profit Display OFF (standard):**
```
┌─────────────────────────────────────────────────┐
│ Harpic 500ml                                    │
│ ₹95 × 2                              ₹190.00   │
│ [−] [2] [+]                                     │
└─────────────────────────────────────────────────┘
```

**Cart Item Layout — Profit Display ON (owner billing):**
```
┌─────────────────────────────────────────────────┐
│ Harpic 500ml                                    │
│ ₹95 × 2                              ₹190.00   │
│ [−] [2] [+]                                     │
│ ─────────────────────────────────────────────  │
│ Cost ₹58 × 2 = ₹116  Est. Profit: +₹74  [39%] │
└─────────────────────────────────────────────────┘
```

The profit line is visually subdued (smaller font, lighter color — `text-gray-400` or similar) so it does not draw attention away from the primary billing action. The margin badge still uses the color-tier system.

### 6.3 Cart Footer — Estimated Bill Profit

**Cart Footer Layout — Profit Display ON:**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Subtotal:                          ₹385.00      │
│  Discount:                          −₹20.00      │
│  ─────────────────────────────────────────────  │
│  Total:                             ₹365.00      │
│                                                  │
│  Est. Bill Profit:                  ₹118.00      │
│  Est. Margin:                       32.3%         │
│                                                  │
│         [ CHECKOUT → ]                           │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Estimated Bill Profit Formula:**

```
For each cart item:
  item_profit = (sell_price − discount_per_unit − buy_price) × quantity

Est. Bill Profit = Σ item_profit for all cart items
Est. Margin %    = (Est. Bill Profit ÷ bill_total_after_discount) × 100
```

The footer profit block uses a compact 2-line layout and is visually separated from the total block with a thin divider. It never obscures or competes with the Checkout button.

### 6.4 Products Without Buy Price in Billing

If a product in the cart has `buy_price = null` (untracked cost), its profit contribution is shown as unknown.

```
┌─────────────────────────────────────────────────┐
│ Plastic Mug 1L                                  │
│ ₹45 × 3                               ₹135.00  │
│ [−] [3] [+]                                     │
│ ─────────────────────────────────────────────  │
│ Cost: Not Set   Profit: Unknown   [—]           │
└─────────────────────────────────────────────────┘
```

Cart footer behavior when some items have unknown cost:
```
Est. Bill Profit:    ₹118.00 (partial — 1 item has no cost data)
Est. Margin:         —
[Set missing buy prices →]
```

The link "Set missing buy prices" opens the product editor for each untracked product in a sequence, allowing the owner to fill in buy prices without leaving the billing context completely. After filling, they return to the bill.

### 6.5 Profit Display During Checkout

**Checkout Confirmation Screen — Profit Display ON:**

The checkout confirmation step (Step 4 in V6's billing flow) shows the final profit summary.

```
CONFIRM BILL
────────────────────────────────────────────────
Customer:     Sharma ji
Payment:      Cash — ₹365
Items:        4

ITEMS SUMMARY
────────────────────────────────────────────────
Harpic 500ml × 2         ₹190.00  [Profit ₹74]
Vim Bar × 3              ₹120.00  [Profit ₹36]
Lizol 500ml × 1          ₹115.00  [Profit ₹43]
Plastic Mug × 3          ₹135.00  [Profit  — ]

Discount Applied:        −₹20.00
────────────────────────────────────────────────
Total:                   ₹540.00
Est. Profit:             ₹153.00  (28.3%)
────────────────────────────────────────────────
         [← Back]    [CONFIRM BILL ✓]
```

### 6.6 Performance Guarantee for Billing Profit Calculations

All profit calculations execute synchronously from in-memory data. No async operations. No IndexedDB reads during billing (product data is already loaded into React state when the billing screen opens). No network calls.

**Performance budget for profit enrichment:**
- Per-item profit line render: < 1ms (pure arithmetic)
- Cart footer profit total render: < 1ms (sum of already-computed values)
- Buy price lookup: O(1) — product data is a pre-loaded object keyed by `product_id`

The buy prices are loaded into the billing screen's product cache alongside sell prices during the initial product sync. There is no separate buy-price fetch.

---

## 7. Section 4 — Profit-Aware Discount Engine

### 7.1 Discount System Overview

The existing billing system already supports:
- Per-item discount (flat ₹ amount off item price)
- Bill-level discount (flat ₹ or % off total bill)

The Profit-Aware Discount Engine extends this system to show real-time profit impact as discounts are applied, and to alert the owner when a discount crosses into loss territory.

### 7.2 Item-Level Discount — Profit Impact Display

**Without discount (owner billing, profit display ON):**
```
Harpic 500ml × 2
₹95 × 2 = ₹190.00
Cost ₹58 × 2 = ₹116   Est. Profit: +₹74   [38.9%]
```

**After applying ₹10 discount per unit:**
```
Harpic 500ml × 2
₹95 − ₹10 = ₹85 × 2 = ₹170.00   [Discount: −₹20]
Cost ₹58 × 2 = ₹116   Est. Profit: +₹54   [31.8%]
                                   ↓ Was ₹74
```

The profit line updates instantly as the discount field value changes (debounced at 150ms for keystroke performance).

**Item Discount Calculation:**
```
effective_sell_price   = sell_price − item_discount_per_unit
item_line_total        = effective_sell_price × quantity
item_profit            = (effective_sell_price − buy_price) × quantity
item_margin_pct        = ((effective_sell_price − buy_price) ÷ effective_sell_price) × 100
```

### 7.3 Negative Profit Warning — Item Level

When a discount causes `effective_sell_price < buy_price` for an item:

```
┌─────────────────────────────────────────────────┐
│ Harpic 500ml × 2                                │
│ ₹95 − ₹40 = ₹55 × 2 = ₹110.00  [Discount −₹80]│
│ [−] [2] [+]      [Item Discount: ₹40 ▼]        │
│ ─────────────────────────────────────────────  │
│ ⚠ Selling Below Cost                           │
│ Cost ₹58 > Sell ₹55  Loss: −₹3/unit            │
└─────────────────────────────────────────────────┘
```

The warning is:
- Displayed inline, below the item
- Uses `bg-red-50 border-l-4 border-red-500 text-red-700` styling
- Non-blocking (does not prevent adding to cart)
- The margin badge shows the red `NEGATIVE_MARGIN` indicator

### 7.4 Bill-Level Discount — Profit Impact Display

When the owner applies a bill-level discount during checkout:

**Before bill discount:**
```
Subtotal:                  ₹560.00
Est. Profit (subtotal):    +₹182.00  (32.5%)
```

**After applying ₹50 bill discount:**
```
Subtotal:                  ₹560.00
Bill Discount:             −₹50.00
Total:                     ₹510.00
Est. Profit:               +₹132.00  (25.9%)
Discount Cost:             −₹50.00 came from profit
```

**Bill Discount Profit Formula:**

The bill-level discount is distributed proportionally across all items for accurate per-item impact tracking in reports.

```
For each item:
  item_discount_share = (item_line_total ÷ subtotal) × bill_discount_amount
  item_effective_sell = item_line_total − item_discount_share
  item_adjusted_profit = item_effective_sell − (buy_price × quantity)

Total bill profit = Σ item_adjusted_profit
```

This proportional distribution is used only for reporting purposes. It does not change the displayed per-item prices.

### 7.5 Negative Profit Warning — Bill Level

When the bill-level discount causes the total estimated profit to go negative:

```
┌──────────────────────────────────────────────┐
│  ⚠ SELLING BELOW COST                        │
│                                              │
│  Bill Discount: ₹200                         │
│  This discount exceeds the estimated profit  │
│  of ₹182 for this bill.                      │
│                                              │
│  Estimated Loss: ₹18.00                      │
│                                              │
│  [Reduce Discount]  [Confirm Anyway]         │
└──────────────────────────────────────────────┘
```

If the owner selects "Confirm Anyway," an `owner_override_confirmed: true` flag is stored in the bill record. This allows the report to identify owner-approved loss bills separately from pricing errors.

### 7.6 Discount Threshold Alert — Configurable

The owner can set a minimum acceptable margin for the entire bill in Settings → Profit Intelligence → Discount Alerts:

```
MINIMUM ACCEPTABLE BILL MARGIN

Alert me when a bill discount brings the
estimated margin below:

[ 15 ] %

[Save]
```

When any bill discount causes the margin to fall below this threshold, a soft amber warning appears (not as severe as the negative-profit red warning):

```
⚠ Margin Alert: Bill margin is 12.3%, below your 15% minimum.
  [See Details]  [Dismiss for this bill]
```

### 7.7 Discount Impact Tracking for Reports

Each bill that includes a discount saves the following discount impact data for reporting:

```
Bill Record — Discount Impact Fields:
item_discounts_total     | Sum of all per-item discounts
bill_discount_amount     | Bill-level discount amount
discount_profit_impact   | Estimated profit reduction due to discounts
pre_discount_profit      | Estimated profit if no discount had been applied
post_discount_profit     | Actual estimated profit after all discounts
discount_pct_of_profit   | (discount_profit_impact ÷ pre_discount_profit) × 100
```

---

## 8. Section 5 — Profit Reporting System

### 8.1 Reporting Architecture — Profit Layer

All profit reports are powered by the same underlying data source: the `BILL_ITEMS` ledger in Google Sheets, enriched with `buy_price_snapshot` and `sell_price_snapshot` fields that are captured at bill-save time.

Because buy prices are snapshotted at billing time, every historical profit report is accurate to the price conditions that existed when the bill was created — even if prices have changed since.

**Report Data Flow:**
```
BILL_ITEMS ledger
  ├── sell_price_snapshot    (price actually charged)
  ├── buy_price_snapshot     (cost at time of billing)
  ├── quantity
  ├── item_discount
  └── bill_discount_share    (proportional bill discount allocated to this item)

Apps Script aggregates these fields to generate:
  ├── Daily Profit Summary   → DAILY_SUMMARY tab
  ├── Product Profit Report  → On-demand aggregation
  ├── Category Profit Report → On-demand aggregation
  └── Margin Trend Report    → On-demand aggregation
```

### 8.2 Daily Profit Report

**Location in App:** Reports → Daily → Profit Tab

**Data shown:**

```
DAILY PROFIT REPORT — 15 January 2024
────────────────────────────────────────────────
Total Sales:              ₹4,850
Total Cost (Est.):        ₹3,210
─────────────────
Estimated Profit:         ₹1,640    (33.8%)

Bills with Discount:      5 bills   −₹240 total discount
Estimated Profit w/o Discount: ₹1,880

Products with Unknown Cost:  3 items (₹360 revenue — profit not calculated)
────────────────────────────────────────────────

TOP 5 PROFIT CONTRIBUTORS TODAY
Rank  Product              Revenue   Profit   Margin
  1   Vim Bar 200g         ₹640      ₹220     34.4%
  2   Harpic 500ml         ₹570      ₹200     35.1%
  3   Lizol Floor Cleaner  ₹460      ₹168     36.5%
  4   Steel Bucket 10L     ₹380      ₹140     36.8%
  5   Detergent 1kg        ₹520      ₹125     24.0%
────────────────────────────────────────────────
```

The report also includes a timeline chart showing hourly revenue vs. hourly profit contribution for the day, rendered using a lightweight chart component.

### 8.3 Weekly Profit Report

**Location:** Reports → Weekly → Profit Tab

**Data shown:**
- Day-by-day bar chart: Revenue vs. Estimated Profit for each day of the week
- Weekly total: Sales, Cost, Profit, Average Margin %
- Week-over-week comparison: This week vs. last week (profit %, not absolute numbers to avoid confusion)
- Top 3 products by profit contribution for the week
- Discount impact summary for the week

**Chart Design:**
```
WEEKLY PROFIT CHART — Week of Jan 13–19
₹
2000 │                    ███
1500 │     ███      ███   ███   ███
1000 │     ███ ███  ███   ███   ███   ███
 500 │     ███ ███  ███   ███   ███   ███   ███
   0 └────────────────────────────────────────
       Mon  Tue  Wed  Thu  Fri  Sat  Sun

     ■ Revenue   ■ Est. Profit
```

### 8.4 Monthly Profit Report

**Location:** Reports → Monthly → Profit Tab

**Data shown:**

```
MONTHLY PROFIT REPORT — January 2024
────────────────────────────────────────────────
Total Sales:             ₹1,24,500
Total Cost (Est.):       ₹83,780
─────────────────────────
Estimated Profit:        ₹40,720     (32.7%)

Compared to December:   +₹4,200 (+11.5%)
Average Daily Profit:   ₹1,314

Discounts Given:         ₹3,840 (3.1% of sales)
Profit Lost to Discounts: ₹3,840 (9.4% of potential profit)

Working Days:            26
────────────────────────────────────────────────
```

**Category Breakdown:**
```
Category            Revenue    Est. Profit  Margin
──────────────────────────────────────────────────
Cleaning Liquids    ₹38,200    ₹13,870     36.3%
Detergents          ₹24,800    ₹6,940      28.0%
Cleaning Tools      ₹18,500    ₹6,660      36.0%
Plastic Products    ₹15,200    ₹5,320      35.0%
Steel/Utensils      ₹12,800    ₹5,120      40.0%
Miscellaneous       ₹15,000    ₹2,810      18.7%
──────────────────────────────────────────────────
TOTAL               ₹1,24,500  ₹40,720     32.7%
```

**Export Support:**
Monthly Profit Report can be exported via:
- WhatsApp share (formatted summary text)
- Google Sheets export (raw numbers for CA/accountant)
- PDF generation (Phase 2)

### 8.5 Product Profit Report

**Location:** Reports → Products → Profit Analysis (Owner Only)

This report shows profit metrics for every product over a selected time period.

```
PRODUCT PROFIT ANALYSIS — Last 30 Days
Sort by: Profit (High to Low) ▼

Product                   Units  Revenue   Profit   Margin  Trend
─────────────────────────────────────────────────────────────────
★ Vim Bar 200g             284    ₹9,088   ₹3,408   37.5%  ↑
★ Harpic 500ml             212    ₹20,140  ₹7,232   35.9%  →
★ Lizol Floor 500ml        165    ₹18,975  ₹6,930   36.5%  ↑
  Detergent 1kg            310    ₹24,800  ₹6,200   25.0%  ↓
  Steel Bucket 10L          48    ₹7,200   ₹2,640   36.7%  →
  Washing Powder Sachet    890    ₹8,010   ₹890     11.1%  ↓ ⚠
⚠ Liquid Soap 50ml         142    ₹3,053   −₹142   −4.7%  ✕ LOSS
  Candles (no cost set)    220    ₹3,960   —        —     [Set Cost]
─────────────────────────────────────────────────────────────────
```

**Trend indicators:**
- `↑` Margin improved vs. previous 30 days
- `→` Margin stable (within ±2%)
- `↓` Margin declined vs. previous 30 days
- `✕ LOSS` Product currently selling at a loss

### 8.6 Category Profit Report

**Location:** Reports → Categories → Profit Analysis (Owner Only)

Shows profit breakdown by category, with drill-down support.

Category summary cards:
```
┌──────────────────────┐   ┌──────────────────────┐
│ Cleaning Liquids     │   │ Detergents           │
│ Revenue: ₹38,200     │   │ Revenue: ₹24,800     │
│ Profit:  ₹13,870     │   │ Profit:  ₹6,940      │
│ Margin:  36.3% ●     │   │ Margin:  28.0% ●     │
│ 12 products          │   │ 8 products           │
└──────────────────────┘   └──────────────────────┘
```

Tapping a category card opens the product list filtered to that category, sorted by profit margin.

### 8.7 Margin Trend Report

**Location:** Reports → Trends → Margin Trend (Owner Only)

Shows how the store's overall average margin has moved over time.

```
MARGIN TREND — Last 6 Months

%
40 │                              ●
35 │         ●        ●   ●───●
30 │   ●───●
25 │
20 └──────────────────────────────
   Aug  Sep  Oct  Nov  Dec  Jan

Average Margin %  ──

Notes:
• Oct: Harpic supplier rate increased — margin dipped
• Dec: Seasonal high-margin product sales (steel items)
• Jan: Margin recovering after Harpic sell price adjustment
```

The "Notes" are auto-generated by comparing supplier purchase rate changes and sell price changes with margin movements. They provide the owner context for why margin moved.

### 8.8 Discount Impact Report

**Location:** Reports → Discounts → Impact Analysis (Owner Only)

```
DISCOUNT IMPACT REPORT — January 2024

Total Discounts Given:          ₹3,840
% of Total Revenue:             3.1%
Est. Profit Reduction:          ₹3,840
As % of Potential Profit:       9.4%

Bills With Discount:            87 bills (of 412 total — 21.1%)
Average Discount Per Bill:      ₹44.14

DISCOUNT BY TYPE
─────────────────────────────────────────────
Bill Discounts:    ₹2,400  (62.5%)
Item Discounts:    ₹1,440  (37.5%)

TOP 5 MOST DISCOUNTED PRODUCTS
Product                Total Discount   Bills
────────────────────────────────────────────
Detergent 1kg          ₹480            22
Harpic 500ml           ₹320            18
Vim Bar 200g           ₹200            14
Lizol Floor 500ml      ₹180            12
Steel Bucket 10L       ₹160             8
────────────────────────────────────────────

OWNER OVERRIDE BILLS (sold below cost after confirmation)
Date        Bill      Product           Loss
Jan 08      B-042     Liquid Soap 50ml  ₹12.50
Jan 14      B-108     Damaged Harpic    ₹28.00
Total Loss (Owner-confirmed):  ₹40.50
```

---

## 9. Section 6 — Store Profit Dashboard

### 9.1 Profit Dashboard Location

The Profit Dashboard is a new tab in the existing Reports module, accessible from the bottom navigation Reports section. It surfaces a curated set of profit KPIs without requiring the owner to navigate into detailed reports.

**Navigation path:** Bottom Nav → Reports → Profit Dashboard

**Permission:** Owner only. If Family Member accesses Reports, the Profit Dashboard tab is hidden unless the owner has enabled family profit visibility.

### 9.2 Profit Dashboard Layout

The dashboard uses a card-based layout. All cards are compact summary cards optimized for a 5.5–6.5 inch screen. Cards stack vertically with clear section dividers.

```
┌───────────────────────────────────────────────┐
│  STORE PROFIT DASHBOARD                       │
│  Last updated: Today 2:34 PM                  │
├───────────────────────────────────────────────┤
│                                               │
│  TODAY                                        │
│  ┌─────────────────┐  ┌────────────────────┐  │
│  │ Sales Today     │  │ Profit Today       │  │
│  │ ₹4,850          │  │ ₹1,640             │  │
│  │ 32 bills        │  │ 33.8% margin       │  │
│  └─────────────────┘  └────────────────────┘  │
│                                               │
│  THIS MONTH                                   │
│  ┌─────────────────┐  ┌────────────────────┐  │
│  │ Monthly Sales   │  │ Monthly Profit     │  │
│  │ ₹1,24,500       │  │ ₹40,720            │  │
│  │ Jan 2024        │  │ 32.7% margin       │  │
│  └─────────────────┘  └────────────────────┘  │
│                                               │
│  PRODUCT PERFORMANCE                          │
│  ┌─────────────────────────────────────────┐  │
│  │ ★ Highest Profit Product (Month)        │  │
│  │ Harpic 500ml — ₹7,232 profit           │  │
│  │ 35.9% margin | 212 units sold          │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │ ⚠ Lowest Profit Product (Month)         │  │
│  │ Washing Powder Sachet — ₹890 profit    │  │
│  │ 11.1% margin | 890 units sold          │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │ ✕ Loss Product Alert                    │  │
│  │ Liquid Soap 50ml — ₹142 LOSS           │  │
│  │ Selling below cost! [Review Pricing]   │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  CATEGORY PERFORMANCE                         │
│  ┌─────────────────┐  ┌────────────────────┐  │
│  │ Best Category   │  │ Worst Category     │  │
│  │ Steel/Utensils  │  │ Miscellaneous      │  │
│  │ 40.0% margin    │  │ 18.7% margin       │  │
│  └─────────────────┘  └────────────────────┘  │
│                                               │
│  MARGIN HEALTH                                │
│  ┌─────────────────────────────────────────┐  │
│  │ Overall Average Margin   32.7%    ●     │  │
│  │ vs Last Month: ↑ +2.1%                  │  │
│  │ Products with no cost data: 12           │  │
│  │ [Fill Missing Costs →]                  │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

### 9.3 Dashboard Card Specifications

| Card | Calculation Source | Refresh Frequency |
|---|---|---|
| Sales Today | DAILY_SUMMARY (Fast Layer) | On each sync |
| Profit Today | DAILY_PROFIT_SUMMARY (new Fast Layer) | On each sync |
| Monthly Sales | DAILY_SUMMARY aggregate | Daily |
| Monthly Profit | DAILY_PROFIT_SUMMARY aggregate | Daily |
| Highest Profit Product | PRODUCT_PROFIT_SNAPSHOT (new) | Daily |
| Lowest Profit Product | PRODUCT_PROFIT_SNAPSHOT (new) | Daily |
| Loss Product Alert | PRODUCT_PROFIT_SNAPSHOT | On each sync |
| Best Category | CATEGORY_PROFIT_SNAPSHOT (new) | Daily |
| Worst Category | CATEGORY_PROFIT_SNAPSHOT (new) | Daily |
| Margin Health | Computed from PRODUCT_PROFIT_SNAPSHOT | Daily |

### 9.4 "Fill Missing Costs" Workflow

From the dashboard, the owner can tap "Fill Missing Costs" to enter the missing buy prices in a streamlined flow.

```
FILL MISSING BUY PRICES
12 products have no buy price set.
Setting buy prices enables full profit tracking.

  1 / 12

Product:    Candles (Pack of 10)
Sell Price: ₹18

Buy Price:  ₹ [________]

[Skip This]  [Next →]
[Finish Later]
```

This is a wizard-style multi-step flow. Progress is auto-saved. The owner can exit and return at any time. Each completed product is removed from the "no cost data" count on the dashboard.

### 9.5 Profit Dashboard — Offline Behavior

The dashboard reads from IndexedDB-cached data. Since `DAILY_PROFIT_SUMMARY` and `PRODUCT_PROFIT_SNAPSHOT` are Fast Layer tables synced periodically, they may be up to the last sync point when offline.

When offline, the dashboard shows:
- A subtle sync status indicator: "Data as of 2:34 PM — offline"
- Today's figures are calculated locally from IndexedDB bills (fully accurate)
- Monthly figures are from the last sync (may not include the most recent day's bills)

---

## 10. Section 7 — Database Design — Complete Schema

### 10.1 IndexedDB Schema Changes

All new fields are added to existing Dexie.js table schemas. No existing fields are removed or renamed.

#### PRODUCTS Table — New Fields

```javascript
// Dexie.js products table schema extension
db.version(X).stores({
  products: '++id, product_id, name, category_id, ...,
              buy_price,           // Number | null
              mrp,                 // Number | null (already existed as field)
              wholesale_price,     // Number | null
              margin_tier,         // String (computed on sync, cached)
              last_buy_price_updated_at,  // DateTime | null
              buy_price_source,    // Enum: MANUAL | PURCHASE_ENTRY | BULK_UPDATE
              needs_price_review   // Boolean
             '
});
```

#### BILLS Table — New Fields

```javascript
db.version(X).stores({
  bills: '++id, bill_id, bill_number, ...,
           estimated_profit,          // Number | null
           estimated_margin_pct,      // Number | null
           pre_discount_profit,       // Number | null
           discount_profit_impact,    // Number | null
           has_unknown_cost_items,    // Boolean
           unknown_cost_revenue,      // Number (revenue from items with no buy price)
           owner_override_confirmed   // Boolean (true if owner confirmed loss sale)
          '
});
```

#### BILL_ITEMS Table — New Fields

```javascript
db.version(X).stores({
  bill_items: '++id, bill_item_id, bill_id, product_id, ...,
                buy_price_snapshot,       // Number | null (buy price at time of billing)
                sell_price_snapshot,      // Number (sell price at time of billing)
                item_profit,              // Number | null (null if buy_price unknown)
                item_margin_pct,          // Number | null
                item_discount,            // Number (already exists; confirm)
                effective_sell_price,     // Number (sell_price minus item_discount)
                bill_discount_share,      // Number (proportional bill discount for this item)
                adjusted_profit,          // Number | null (profit after bill discount share)
               '
});
```

#### New Table: PRODUCT_PROFIT_SNAPSHOTS

This table stores pre-computed periodic profit snapshots per product, used to power the Product Profit Report and trend analysis without recomputing from raw BILL_ITEMS every time.

```javascript
db.version(X).stores({
  product_profit_snapshots: '++id, snapshot_id, product_id,
                              period_type,        // Enum: DAY | WEEK | MONTH
                              period_start,       // Date
                              period_end,         // Date
                              units_sold,         // Number
                              total_revenue,      // Number
                              total_cost,         // Number
                              estimated_profit,   // Number
                              avg_margin_pct,     // Number
                              total_discount,     // Number
                              bills_count,        // Number
                              created_at,         // DateTime
                              synced_at           // DateTime | null
                             '
});
```

#### New Table: DAILY_PROFIT_SUMMARY

Extends the existing DAILY_SUMMARY concept with profit-specific fields.

```javascript
db.version(X).stores({
  daily_profit_summary: '++id, summary_id, date,
                          total_sales,             // Number
                          total_cost_est,          // Number
                          estimated_profit,        // Number
                          avg_margin_pct,          // Number
                          total_discounts,         // Number
                          discount_profit_impact,  // Number
                          bills_with_discount,     // Number
                          total_bills,             // Number
                          items_with_unknown_cost, // Number
                          unknown_cost_revenue,    // Number
                          loss_bills_count,        // Number
                          synced_at                // DateTime | null
                         '
});
```

### 10.2 Google Sheets Schema Changes

#### PRODUCTS Tab — New Columns

| Column | Type | Description |
|---|---|---|
| `buy_price` | Number | Current buy price per unit |
| `wholesale_price` | Number (optional) | Wholesale price per unit |
| `margin_tier` | String | Current margin tier classification |
| `margin_pct` | Number (formula) | `=IF(D2>0,(D2-E2)/D2*100,"")` where D=sell, E=buy |
| `profit_per_unit` | Number (formula) | `=IF(E2>0, D2-E2, "")` |
| `last_buy_price_updated_at` | DateTime | Timestamp of last buy price change |
| `buy_price_source` | String | How buy price was last set |
| `needs_price_review` | Boolean | System flag for price review |

#### BILL_ITEMS Tab — New Columns

| Column | Type | Description |
|---|---|---|
| `buy_price_snapshot` | Number | Buy price at time of billing |
| `sell_price_snapshot` | Number | Sell price at time of billing (already existed; confirm presence) |
| `item_profit` | Number | `=IF(buy_price_snapshot>0, (effective_sell_price - buy_price_snapshot) * quantity, "")` |
| `item_margin_pct` | Number | `=IF(effective_sell_price>0, item_profit/(effective_sell_price*quantity)*100, "")` |
| `effective_sell_price` | Number | Sell price minus item discount |
| `bill_discount_share` | Number | Proportional allocation of bill discount |
| `adjusted_profit` | Number | Profit after bill discount share |

#### BILLS Tab — New Columns

| Column | Type | Description |
|---|---|---|
| `estimated_profit` | Number | Total estimated profit for this bill |
| `estimated_margin_pct` | Number | Overall bill margin % |
| `pre_discount_profit` | Number | Profit before any discounts |
| `discount_profit_impact` | Number | Profit reduction due to discounts |
| `has_unknown_cost_items` | Boolean | Whether any items lacked buy price |
| `owner_override_confirmed` | Boolean | Owner confirmed sale below cost |

#### New Tab: DAILY_PROFIT_SUMMARY

| Column | Type | Description |
|---|---|---|
| `summary_id` | UUID | Unique identifier |
| `date` | Date | Summary date |
| `total_sales` | Number | Total bill revenue |
| `total_cost_est` | Number | Estimated total cost |
| `estimated_profit` | Number | Sales minus cost |
| `avg_margin_pct` | Number | Weighted average margin |
| `total_discounts` | Number | Sum of all discounts |
| `discount_profit_impact` | Number | Profit lost to discounts |
| `bills_with_discount` | Number | Count of discounted bills |
| `total_bills` | Number | Total bill count |
| `items_with_unknown_cost` | Number | Items missing buy price |
| `loss_bills_count` | Number | Bills sold below total cost |

#### New Tab: PRODUCT_PROFIT_SNAPSHOT

Stores monthly profit summary per product.

| Column | Type | Description |
|---|---|---|
| `snapshot_id` | UUID | Unique identifier |
| `product_id` | UUID | Product reference |
| `product_name` | String | Name snapshot |
| `period_year` | Number | Year (e.g., 2024) |
| `period_month` | Number | Month (1–12) |
| `units_sold` | Number | Units sold in period |
| `total_revenue` | Number | Revenue in period |
| `total_cost_est` | Number | Estimated cost |
| `estimated_profit` | Number | Estimated profit |
| `avg_margin_pct` | Number | Average margin |
| `total_discount` | Number | Discounts given |
| `generated_at` | DateTime | When snapshot was computed |

---

## 11. Section 8 — Google Sheets Architecture

### 11.1 Updated Sheet Architecture

The existing V6 sheet architecture (three-layer: Config / Ledger / Fast Layer) is preserved exactly. The Profit Intelligence system adds new columns to existing ledger tabs and adds two new Fast Layer tabs.

**Updated Architecture Map:**

```
APPEND-ONLY LEDGER TABS           FAST LAYER TABS (Recomputed)
─────────────────────────         ──────────────────────────────
BILLS (+ profit cols)     ──→     PRODUCTS (+ buy_price, margin cols)
BILL_ITEMS (+ profit cols)──→     CUSTOMERS (unchanged)
STOCK_MOVEMENTS           ──→     DAILY_SUMMARY (unchanged)
UDHAAR_LEDGER             ──→     STOCK_SNAPSHOT (unchanged)
SUPPLIER_LEDGER           ──→     DAILY_PROFIT_SUMMARY (NEW)  ←
PURCHASES                 ──→     PRODUCT_PROFIT_SNAPSHOT (NEW) ←
PURCHASE_ITEMS            ──→
PRICE_HISTORY (+ buy cols)──→     CONFIG TABS
...                               ──────────────────────────────
                                  CONFIG (+ profit thresholds)
                                  USERS
                                  CATEGORIES
                                  SUPPLIERS
                                  PROCESSED_ACTIONS
```

### 11.2 Apps Script Formulas and Calculations

Apps Script handles all server-side profit aggregation. Client-side profit calculation (during billing) uses in-memory React state. The two must produce identical results — Apps Script is the authority for historical records.

**Core Profit Formulas (Apps Script):**

```javascript
// Calculate profit for a single bill item
function calculateItemProfit(item) {
  if (!item.buy_price_snapshot || item.buy_price_snapshot === null) {
    return { profit: null, margin_pct: null, has_cost: false };
  }
  const effective_sell = item.effective_sell_price;  // sell_price - item_discount
  const bill_discount_share = item.bill_discount_share || 0;
  const adjusted_sell = effective_sell - (bill_discount_share / item.quantity);
  const item_profit = (adjusted_sell - item.buy_price_snapshot) * item.quantity;
  const margin_pct = adjusted_sell > 0
    ? (item_profit / (adjusted_sell * item.quantity)) * 100
    : 0;
  return { profit: item_profit, margin_pct, has_cost: true };
}

// Aggregate profit for a bill
function calculateBillProfit(bill_items, bill_discount) {
  const subtotal = bill_items.reduce((s, i) => s + i.line_total, 0);
  let total_profit = 0;
  let total_cost = 0;
  let unknown_cost_revenue = 0;
  let has_unknown = false;
  
  bill_items.forEach(item => {
    const share = subtotal > 0
      ? (item.line_total / subtotal) * bill_discount
      : 0;
    item.bill_discount_share = share;
    const result = calculateItemProfit(item);
    if (result.has_cost) {
      total_profit += result.profit;
      total_cost += item.buy_price_snapshot * item.quantity;
    } else {
      unknown_cost_revenue += item.effective_sell_price * item.quantity;
      has_unknown = true;
    }
  });
  
  const final_total = subtotal - bill_discount;
  const margin_pct = (final_total - unknown_cost_revenue) > 0
    ? (total_profit / (final_total - unknown_cost_revenue)) * 100
    : 0;
  
  return {
    estimated_profit: total_profit,
    estimated_margin_pct: margin_pct,
    total_cost_est: total_cost,
    has_unknown_cost_items: has_unknown,
    unknown_cost_revenue
  };
}
```

### 11.3 Daily Profit Summary — Computation Strategy

The `DAILY_PROFIT_SUMMARY` tab is updated by Apps Script after every bill save (inside the existing atomic bill-save flow, extending step 13 from V6).

```javascript
function updateDailyProfitSummary(date, billProfitData) {
  const existing = findDailyProfitRow(date);
  if (existing) {
    // Increment existing row
    existing.total_sales += billProfitData.bill_total;
    existing.total_cost_est += billProfitData.total_cost_est;
    existing.estimated_profit += billProfitData.estimated_profit;
    existing.total_discounts += billProfitData.total_discount;
    existing.total_bills += 1;
    if (billProfitData.has_unknown_cost_items) {
      existing.items_with_unknown_cost += billProfitData.unknown_item_count;
    }
    existing.avg_margin_pct = existing.total_sales > 0
      ? (existing.estimated_profit / existing.total_sales) * 100
      : 0;
    writeBackDailySummaryRow(existing);
  } else {
    // Create new row for this date
    appendDailyProfitSummaryRow(date, billProfitData);
  }
}
```

### 11.4 Product Profit Snapshot — Computation Strategy

The `PRODUCT_PROFIT_SNAPSHOT` tab is regenerated monthly by a scheduled Apps Script trigger (runs on the 1st of each month for the previous month). It can also be triggered manually from the sync center.

This avoids the performance cost of aggregating all `BILL_ITEMS` rows on every report load. Instead, reports read from the pre-computed snapshot.

**Monthly Snapshot Generation:**
```javascript
function generateMonthlyProductProfitSnapshot(year, month) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const billItems = getAllBillItemsForMonth(year, month);
    const productGroups = groupBy(billItems, 'product_id');
    
    const snapshots = Object.entries(productGroups).map(([product_id, items]) => {
      const revenue = sumField(items, 'effective_sell_price_times_qty');
      const cost = sumField(items, 'buy_cost_times_qty'); // null items excluded
      const profit = revenue - cost; // only items with known cost
      const units = sumField(items, 'quantity');
      const discount = sumField(items, 'item_discount_total') +
                       sumField(items, 'bill_discount_share_total');
      return {
        product_id, year, month, units, revenue, cost,
        profit, avg_margin_pct: revenue > 0 ? (profit / revenue) * 100 : 0,
        discount, generated_at: new Date()
      };
    });
    
    deleteProductSnapshotsForMonth(year, month);
    appendProductSnapshots(snapshots);
    return { success: true, count: snapshots.length };
  } finally {
    lock.releaseLock();
  }
}
```

### 11.5 Performance Strategy for Google Sheets

**Problem:** BILL_ITEMS can grow to 100,000+ rows over a year. Aggregating for reports from raw rows on every request would be too slow.

**Strategy:**

1. **Fast Layer (DAILY_PROFIT_SUMMARY):** Updated incrementally on every bill save. Never aggregated from scratch during normal operation.
2. **Product Profit Snapshots:** Pre-computed monthly. Report reads from snapshot, not raw rows.
3. **On-demand aggregation limit:** Direct BILL_ITEMS queries are only run for the last 7 days (daily/weekly report). Anything older uses snapshots.
4. **Archiving alignment:** Profit snapshot data is included in the annual archive strategy from V6 (Section 7.8).

---

## 12. Section 9 — Apps Script Changes

### 12.1 New Action Endpoints

The following new actions are added to the Apps Script routing table.

| Action | Purpose | Auth Required |
|---|---|---|
| `get_profit_dashboard` | Returns dashboard KPI data for today, month | Owner/Family |
| `get_daily_profit_report` | Returns full daily profit report for a date | Owner |
| `get_monthly_profit_report` | Returns monthly profit report | Owner |
| `get_product_profit_report` | Returns product-wise profit for a period | Owner |
| `get_category_profit_report` | Returns category-wise profit | Owner |
| `get_margin_trend` | Returns month-by-month margin trend | Owner |
| `get_discount_impact_report` | Returns discount impact analysis | Owner |
| `update_buy_price` | Updates buy price for a product | Owner |
| `bulk_update_buy_prices` | Updates buy prices for multiple products | Owner |
| `generate_product_profit_snapshot` | Triggers monthly snapshot generation | Owner |
| `rebuild_profit_fast_layer` | Rebuilds DAILY_PROFIT_SUMMARY from BILL_ITEMS | Owner |

### 12.2 Changes to Existing Endpoints

**`create_bill`:** Extended to compute and store profit data inside the existing atomic transaction.

```javascript
// Inside handleBillCreate, after existing steps:
// Step N: Compute and record profit data
const profitData = calculateBillProfit(payload.items, payload.bill_discount);
appendBillProfitColumns(billId, profitData);
appendBillItemProfitColumns(billId, payload.items, profitData.itemProfits);
updateDailyProfitSummary(billDate, profitData);
// End of atomic section
```

**`create_purchase`:** Extended to detect buy price changes and prompt for confirmation.

```javascript
function handlePurchaseCreate(payload) {
  // Existing logic...
  const rateChanges = detectBuyPriceChanges(payload.items);
  if (rateChanges.length > 0) {
    // Include rate change info in response for client to display
    response.buy_price_change_suggestions = rateChanges;
  }
}
```

**`update_product`:** Extended to track buy price change in PRICE_HISTORY.

```javascript
// When buy_price changes:
appendPriceHistoryRow({
  product_id: payload.product_id,
  change_type: 'BUY_PRICE',
  old_value: currentProduct.buy_price,
  new_value: payload.buy_price,
  triggered_by: 'MANUAL_EDIT',
  margin_before: computeMargin(currentProduct.buy_price, currentProduct.sell_price),
  margin_after: computeMargin(payload.buy_price, currentProduct.sell_price)
});
```

### 12.3 Validation in Apps Script

All profit calculations submitted by the client are re-validated server-side. The client's calculation is used for display only. The server-side recalculation is what goes into the ledger.

```javascript
function validateBillProfitData(clientProfitData, serverComputedProfitData) {
  const tolerance = 0.01; // 1 paisa tolerance for floating point
  const profit_diff = Math.abs(
    clientProfitData.estimated_profit - serverComputedProfitData.estimated_profit
  );
  if (profit_diff > tolerance) {
    // Log discrepancy but use server value
    appendAuditLog({
      type: 'PROFIT_CALCULATION_MISMATCH',
      client_value: clientProfitData.estimated_profit,
      server_value: serverComputedProfitData.estimated_profit,
      diff: profit_diff,
      bill_id: payload.bill_id
    });
  }
  return serverComputedProfitData; // Always use server value
}
```

### 12.4 Scheduled Triggers

Two new Apps Script time-based triggers are added:

| Trigger | Schedule | Function |
|---|---|---|
| Monthly Snapshot | 1st of each month, 2:00 AM | `generateMonthlyProductProfitSnapshot` for previous month |
| Margin Alert Digest | Daily, 8:00 AM | `generateMarginAlertDigest` — identifies products with margin drops |

### 12.5 Profit Data in Pull Changes Response

When a device calls `pull_changes_since`, the response now includes profit-related fast layer updates:

```javascript
response.profit_data = {
  daily_profit_summary: getRecentDailyProfitSummaries(since_timestamp, limit=30),
  product_profit_snapshots: getProductProfitSnapshots(current_month, current_month_minus_1),
  loss_product_alerts: getActiveLossProducts()
};
```

---

## 13. Section 10 — Offline & Sync Behavior

### 13.1 Offline Billing Profit Calculation

When a bill is created offline, profit calculations run entirely on client-side data.

**Buy price availability offline:**
Buy prices are part of the products table, which is fully synced to IndexedDB during the initial sync and delta-synced on subsequent syncs. When the app is offline, buy prices are available for all products that were synced before the internet dropped.

**No-cost-data behavior offline:**
If a product has no buy price set (or the buy price is null in IndexedDB), the system shows "Cost: Not Set" for that item. The bill saves normally. The `has_unknown_cost_items: true` flag is stored in the local bill record. When the bill syncs to Apps Script, Apps Script checks if a buy price now exists in Google Sheets for that product and back-fills the profit calculation if possible.

### 13.2 Offline Discount Calculation

Discount impact calculations (item profit adjustment, negative margin warning) all run synchronously from in-memory React state. Zero network dependency. No change from online behavior.

### 13.3 Sync Recovery for Profit Data

**Scenario 1:** Bill saved offline → profit calculated locally → synced to Apps Script → server recalculates profit using server-side buy price → server-side profit is stored.

If there is a discrepancy between client-calculated profit and server-calculated profit:
- The server value is canonical
- The discrepancy is logged to AUDIT_LOG
- The IndexedDB bill record is updated with the server-calculated profit on next `pull_changes_since`

**Scenario 2:** Buy price changes on one device while another device is offline.

Device A (owner's phone): Updates buy price for Harpic from ₹55 to ₹58.  
Device B (billing phone): Offline for 3 hours. Creates a bill for Harpic.

When Device B syncs:
- The bill's `buy_price_snapshot` was captured as ₹55 (the value at billing time on Device B)
- The server receives the bill with `buy_price_snapshot: 55`
- The server does NOT override the snapshot — the snapshot is intentionally the price at time of billing
- The bill profit is calculated using ₹55 buy price, as recorded
- The AUDIT_LOG records the snapshot divergence (buy_price at billing: 55, current buy_price: 58)

This is by design. The bill profit reflects what was true on the billing device at billing time.

**Scenario 3:** `DAILY_PROFIT_SUMMARY` stale when offline.

On the dashboard, when offline, today's profit figure is calculated directly from all IndexedDB bills for today. This is real-time accurate. Historical figures (monthly, last month) are from the last synced DAILY_PROFIT_SUMMARY — labelled with "as of [sync time]."

### 13.4 Stale Data Handling

Dashboard and reports show a sync timestamp indicator:

```
Monthly Profit: ₹40,720
As of: Jan 15, 3:22 PM  [Sync Now]
```

If last sync was more than 24 hours ago:
```
Monthly Profit: ₹40,720
⚠ Last synced 26 hours ago — may not reflect latest data
[Sync Now]
```

This ensures the owner never mistakes stale cached data for live data.

---

## 14. Section 11 — Permissions Architecture

### 14.1 Permission Matrix — Profit Intelligence Features

| Feature | Owner | Family Member | Helper |
|---|---|---|---|
| See buy price on product card | ✓ | ✗ (configurable) | ✗ |
| See margin badge on product card | ✓ | ✗ (configurable) | ✗ |
| See profit per item in billing | ✓ | ✗ (configurable) | ✗ |
| See estimated bill profit | ✓ | ✗ (configurable) | ✗ |
| Negative margin warning in billing | ✓ | ✓ (see-only) | ✗ |
| Override confirmed loss sale | ✓ | ✗ | ✗ |
| Edit buy price on product | ✓ | ✗ | ✗ |
| Edit sell price on product | ✓ | ✗ | ✗ |
| View Profit Dashboard | ✓ | ✗ (configurable) | ✗ |
| View Daily Profit Report | ✓ | ✗ (configurable) | ✗ |
| View Monthly Profit Report | ✓ | ✗ (configurable) | ✗ |
| View Product Profit Report | ✓ | ✗ | ✗ |
| View Category Profit Report | ✓ | ✗ | ✗ |
| Export profit reports | ✓ | ✗ | ✗ |
| Configure margin thresholds | ✓ | ✗ | ✗ |
| Bulk update buy prices | ✓ | ✗ | ✗ |
| View audit log for price changes | ✓ | ✗ | ✗ |

### 14.2 Configurable Family Member Profit Access

The owner can selectively enable profit visibility for family members. This is configured in Settings → User Roles → Family Member Access.

```
FAMILY MEMBER PROFIT ACCESS

Control what profit information family members can see.
Changes take effect on their next app sync.

Allow family members to see:

  [✓] Show Profit During Billing
  [✗] Show Buy Price on Products
  [✗] Show Margin % on Products
  [✓] See Daily Sales & Profit Summary
  [✗] See Monthly Profit Report
  [✗] See Product Profit Breakdown
```

These settings are stored in the `CONFIG` tab in Google Sheets and synced to all devices. They are enforced client-side on role-check.

### 14.3 Role Enforcement for Profit Data

**Client-Side Enforcement:**

```javascript
// React context for role-gated profit visibility
const ProfitVisibilityContext = {
  showBuyPrice: (role, settings) => {
    if (role === 'OWNER') return true;
    if (role === 'FAMILY') return settings.family_show_buy_price;
    return false;
  },
  showMarginBadge: (role, settings) => {
    if (role === 'OWNER') return true;
    if (role === 'FAMILY') return settings.family_show_margin;
    return false;
  },
  showBillingProfit: (role, settings) => {
    if (role === 'OWNER') return settings.billing_profit_display_on;
    if (role === 'FAMILY') return settings.billing_profit_display_on
                                 && settings.family_show_billing_profit;
    return false; // Helper: always false
  }
};
```

**Server-Side Enforcement:**

Apps Script profit report endpoints validate the requesting device's role from the `USERS` tab before returning data. A device registered as "Helper" role receives a `PERMISSION_DENIED` response for any profit report endpoint.

### 14.4 Profit Data in WhatsApp Shares

WhatsApp bill shares (to customer) never include profit data. The bill share template only contains items, quantities, prices, discount, and total — no buy price, no margin, no profit estimate.

Internal WhatsApp shares (owner sending themselves a report) include profit data.

---

## 15. Section 12 — Audit Log System

### 15.1 New Audit Log Event Types

The existing `AUDIT_LOG` tab in Google Sheets is extended with new event types for profit-related changes.

| Event Type | Trigger | Data Captured |
|---|---|---|
| `BUY_PRICE_CHANGED` | Owner manually edits buy price | product_id, old_price, new_price, margin_before, margin_after |
| `SELL_PRICE_CHANGED` | Owner manually edits sell price | product_id, old_price, new_price, margin_before, margin_after |
| `BUY_PRICE_UPDATED_FROM_PURCHASE` | Purchase entry triggers buy price update | product_id, purchase_id, old_price, new_price |
| `LOSS_SALE_OVERRIDE` | Owner confirms sale below cost | bill_id, product_id, sell_price, buy_price, loss_amount |
| `DISCOUNT_APPLIED_BELOW_THRESHOLD` | Bill margin drops below configured threshold | bill_id, threshold_pct, actual_margin_pct |
| `NEGATIVE_PROFIT_BILL_SAVED` | Bill saved with overall estimated loss | bill_id, estimated_loss |
| `PROFIT_CALCULATION_MISMATCH` | Client vs. server profit divergence | bill_id, client_value, server_value, diff |
| `BUY_PRICE_BULK_UPDATE` | Batch buy price update | count, source (MANUAL / PURCHASE) |
| `PROFIT_FAST_LAYER_REBUILD` | Admin rebuilds profit fast layer | triggered_by, duration_ms |
| `MARGIN_THRESHOLD_CHANGED` | Owner changes margin threshold in settings | old_value, new_value |
| `PRODUCT_FLAGGED_NEEDS_REVIEW` | System auto-flags product for price review | product_id, reason, margin_pct |

### 15.2 Audit Log Schema Extension

New fields added to every audit log entry for profit events:

```
AUDIT_LOG new columns:
profit_context_type  | String  — "PRODUCT_PRICE" | "BILLING" | "DISCOUNT" | "REPORT" | "CONFIG"
product_id           | UUID (when event is product-specific)
bill_id              | UUID (when event is bill-specific)
old_numeric_value    | Number (for price change events)
new_numeric_value    | Number (for price change events)
margin_before        | Number
margin_after         | Number
```

### 15.3 Price Change History — Owner View

On the product detail screen, under the Profit History section, a separate "Price Change Log" tab shows all buy and sell price changes for that product.

```
PRICE CHANGE LOG — Harpic 500ml

Date         Changed By  Type       Old      New      Margin Impact
────────────────────────────────────────────────────────────────────
Jan 15, 2024  Owner       Buy Price  ₹55.00  ₹58.00   42.1% → 38.9% ↓
Oct 3, 2023   Owner       Sell Price ₹90.00  ₹95.00   44.4% → 42.1% ↑
Jun 1, 2023   Owner       Buy Price  ₹50.00  ₹55.00   44.4% → 38.9% ↓
```

### 15.4 Rollback Support for Price Changes

If the owner needs to revert a buy price change:

```
Owner taps a price change entry in the Price Change Log.

→ Options appear:
  "Revert to ₹55.00"  (the previous value)
  "Edit Buy Price"
  "Cancel"
```

Selecting "Revert" creates a new PRICE_HISTORY entry with the reverted value (it does not delete the prior change). The AUDIT_LOG records a `BUY_PRICE_REVERTED` event with reference to the original change.

Historical bills are never affected by a price revert. Their snapshotted values remain unchanged.

---

## 16. Section 13 — Edge Cases — Complete Catalog

### 16.1 Price Changes After a Bill Is Created

**Scenario:** Harpic's buy price changes from ₹55 to ₹65 after 20 bills were created at ₹55.

**Behavior:**
- The 20 existing bills retain `buy_price_snapshot: 55`. Their profit calculations remain ₹40/unit.
- New bills use buy_price ₹65 → profit becomes ₹30/unit.
- The product profit report correctly shows two different profit rates for the same product in the same month, averaged across the month.
- No retroactive recalculation is ever performed.

**This is correct behavior.** Historical accuracy requires snapshotting.

### 16.2 Supplier Cost Changes Between Purchase Entry

**Scenario:** Supplier delivers goods. Invoice shows same rate as last time. Owner records purchase. Two weeks later, supplier clarifies their rate increased and sends a revised invoice.

**Handling:**
1. Owner records a corrective purchase entry (negative quantity adjustment or a rate correction).
2. System prompts: "Update buy price for affected products?"
3. Owner reviews and approves.
4. Previous bills between the original and corrected purchase retain their original snapshots.
5. The purchase correction is recorded in the PURCHASES ledger with a `correction_of: original_purchase_id` field.
6. AUDIT_LOG records `BUY_PRICE_UPDATED_FROM_PURCHASE_CORRECTION`.

### 16.3 Negative Profit Products

**Scenario:** A product is consistently sold below cost (e.g., owner uses it as a loss leader or made a pricing error).

**Detection:** When `profit_per_unit < 0` for a product based on current buy and sell prices.

**System Response:**
- Product gets `NEGATIVE_MARGIN` tier badge (red).
- Product appears in "Loss Products" filter in the catalog.
- Product appears in the Loss Product Alert card on the dashboard.
- Each bill containing this product triggers a `LOSS_SALE_OVERRIDE` audit event if the override is confirmed.
- Monthly Profit Report flags total accumulated loss from this product.

**Owner Action Paths:**
- Increase sell price
- Update buy price if it was entered incorrectly
- Archive the product if it should no longer be sold

### 16.4 Free Items from Supplier

**Scenario:** Supplier delivers 12 units + 1 free (12+1 scheme). Owner records the purchase.

**Handling:**
- Owner records 12 units at the standard rate and 1 unit at ₹0 (free), using the `purchase_free` movement type (already exists in V6).
- For margin calculation on the free unit: `buy_price_snapshot: 0` is stored.
- When that free unit is sold, it appears as 100% margin.
- The product's effective average buy price can optionally be computed as: `(total paid ÷ total units received)` = `(12 × rate) ÷ 13`.
- A setting in product configuration: "Use average cost accounting for free supplier items?" [ON/OFF] — defaults to OFF (simpler; most owners prefer to track at face value).

### 16.5 Bundle Offers

**Scenario:** Owner bundles Vim Bar + Harpic + Lizol for ₹250 as a set, when individual prices total ₹310.

**Handling:**
- Bundle is created as a separate product in the catalog with its own `sell_price: 250`.
- The `buy_price` for the bundle is entered as the sum of component buy prices (Owner calculates manually for now).
- Phase 2: Bundle Product type with component linking for automatic cost aggregation.
- For billing, the bundle behaves as a single product. Margin is computed on the bundle sell price vs. bundle buy price.

### 16.6 Damaged Goods

**Scenario:** 3 units of a product are damaged and removed from stock via the Damage Register.

**Handling:**
- A damage record is created with `quantity: 3` and movement type `damage` (OUT).
- The `cost_impact` field on the STOCK_MOVEMENTS entry is populated: `buy_price × quantity`.
- This cost impact is reflected in the Expense module and counted in the monthly cost of goods reconciliation.
- Profit report includes a "Damage Cost" line: damaged inventory reduces effective profit for the month.

```
Monthly Profit Summary — Damage Impact
─────────────────────────────────────────
Estimated Bill Profit:        ₹40,720
Damage Cost Write-Down:       − ₹1,840
─────────────────────────────────────────
Adjusted Est. Profit:         ₹38,880
```

### 16.7 Returned Products

**Scenario:** Customer returns a product. A return bill is created.

**Handling (Customer Return — Good Condition):**
- Stock is restocked (movement type `customer_return_good`).
- The return is linked to the original bill via `source_bill_id`.
- The profit on the original bill is not modified retroactively.
- A `return_profit_reversal` entry is created in `DAILY_PROFIT_SUMMARY`: the profit that was counted from the original bill is partially reversed for the returned item.

**Return Profit Reversal Formula:**
```
return_profit_reversal = item_profit_from_original_bill × return_fraction
where return_fraction = return_quantity ÷ original_quantity_for_this_product
```

### 16.8 Cancelled Bills

**Scenario:** A bill is cancelled after saving.

**Handling:**
- The original bill's `status` is set to `CANCELLED`.
- Stock is restored via `bill_cancelled` stock movement.
- The daily profit summary is updated to reverse the cancelled bill's profit contribution.
- DAILY_PROFIT_SUMMARY: `estimated_profit -= cancelled_bill_profit`.
- The AUDIT_LOG records `BILL_CANCELLED` with profit impact noted.

### 16.9 Partial Returns

**Scenario:** Customer returns 2 out of 5 units of an item.

**Handling:**
- Same as full return but `return_fraction = 2/5`.
- Profit reversal: `(2/5) × item_profit_at_billing_time`.
- Remaining 3 units stay in the original bill.
- Reports show the partial return correctly.

### 16.10 Wholesale Pricing

**Scenario:** A regular wholesale customer gets the wholesale price (₹85 instead of ₹95 for Harpic).

**Handling:**
- During billing, if `wholesale_price` is set and the customer is tagged as a wholesale customer, the sell price in the cart defaults to `wholesale_price`.
- Profit calculations use `wholesale_price` as the effective sell price:
  `wholesale_profit = wholesale_price − buy_price`
- The margin badge shows the wholesale margin (lower than retail margin).
- Reports track wholesale vs. retail sales separately if the customer has a `customer_type: WHOLESALE` tag.

### 16.11 Products With Identical Buy and Sell Price (Break-Even Products)

**Handling:**
- `profit_per_unit: 0`, `margin_pct: 0%`.
- `BREAK_EVEN` tier badge (yellow).
- No blocking warning; an informational tooltip: "This product has zero margin."
- Appears in the "Break Even" filter in the product catalog.

### 16.12 Buy Price Entered as Zero (Intentional)

**Scenario:** Owner has received goods at no cost (donation, opening stock write-off, promotional goods).

**Handling:**
- `buy_price: 0` is a valid value. It is distinct from `buy_price: null` (unset).
- `profit_per_unit = sell_price − 0 = sell_price`.
- Margin shows as 100%.
- No warning triggered.

### 16.13 MRP Compliance Check

**Scenario:** Supplier changes MRP on packaging. Owner forgets to update MRP in the system. Sell price ends up higher than MRP.

**Detection:**
- On bill save, client checks: `effective_sell_price > mrp` for all items.
- If true: Warning toast: "Harpic 500ml is priced above MRP (₹105 > ₹100 MRP). Selling above MRP is not permitted."
- This is a soft warning, not a block (the system cannot enforce legal compliance; it can only inform).
- Flagged in AUDIT_LOG as `SELL_ABOVE_MRP_WARNING`.

### 16.14 Sync Conflict — Simultaneous Buy Price Update from Two Devices

**Scenario:** Owner on Phone A sets Harpic buy_price to ₹58 while offline. Owner on Phone B (also offline) sets it to ₹60. Both sync at the same time.

**Resolution:**
- Apps Script uses `LockService` for serialized writes.
- Both updates arrive. The second update overwrites the first (last-write-wins for buy price, consistent with V6 sync strategy for product fields).
- Both changes are recorded in PRICE_HISTORY with their respective device IDs and timestamps.
- The owner sees both entries in the Price Change Log and can review.
- AUDIT_LOG flags a `CONCURRENT_PRICE_UPDATE_DETECTED` event.

---

## 17. Section 14 — Future Expansion Roadmap

### 17.1 Phase 2 — Enhanced Intelligence (3–6 months after launch)

**AI Profit Insights — Margin Anomaly Detection**

Integrate with Gemini API (or run locally) to detect unusual margin patterns:

```
Smart Insight: "Your Vim Bar margin has dropped 12% over 3 months
while sales are up 34%. This suggests a supplier rate increase is
absorbing your growth. Consider a ₹3 sell price increase to restore
your historical margin."
```

**Smart Pricing Suggestions**

When a product's buy price is updated, the system suggests a new sell price to maintain the owner's historical target margin.

```
Buy Price Updated: Harpic 500ml ₹55 → ₹58

To maintain your historical 40% margin:
Suggested Sell Price: ₹96.67 → ₹97

Current Sell Price: ₹95 (new margin: 38.9%)
[Update Sell Price to ₹97]  [Keep ₹95]  [Custom Price]
```

**Competitor Price Tracking Prompt**

A light manual entry system: "Competitor prices" per product. Compare competitor sell price vs. your sell price vs. your buy price. Shows where you can undercut a competitor while maintaining positive margin.

### 17.2 Phase 2 — Margin-Based Reorder Recommendations

Extend the existing "What Is Finishing" (Low Stock Center) module with margin-awareness:

```
REORDER PRIORITY QUEUE

Product                  Stock   Reorder  Priority    Monthly Profit
──────────────────────────────────────────────────────────────────────
Harpic 500ml             2 units  15 units  🔴 URGENT  ₹7,232/month
Vim Bar 200g             3 units  20 units  🔴 URGENT  ₹3,408/month
Washing Powder 1kg       12 units 10 units  🟡 PLAN    ₹890/month
Liquid Soap 50ml         5 units   5 units  ⚪ LOW PRI  −₹142/month ⚠
```

The reorder queue is sorted by: (urgency × monthly_profit) — so high-margin, low-stock products are always prioritized first.

### 17.3 Phase 2 — Dynamic Pricing Recommendations

Based on historical demand and margin data, the system can recommend price adjustments:

```
PRICING OPPORTUNITIES

Product: Steel Bucket 10L
Current Margin: 36.7%  |  Monthly Units Sold: 48
Last Price Increase: 8 months ago

Observation: This product sells consistently at ₹150.
The category average margin is 35%. This product is at 36.7%.
A ₹5 increase to ₹155 would bring monthly profit from
₹2,640 to ₹2,880 (+₹240/month).

[Review & Update Price]  [Dismiss]
```

### 17.4 Phase 3 — Profitability Forecasting

Using 3–6 months of historical bill data and seasonal patterns, the system forecasts:
- Next month's estimated profit range
- Which categories are likely to peak
- Which supplier rate changes to anticipate based on historical patterns

```
PROFIT FORECAST — February 2024

Based on 4 months of historical data:

Projected Sales:           ₹1,15,000 – ₹1,28,000
Projected Profit:          ₹37,500 – ₹42,000
Expected Margin Range:     32.5% – 33.5%

Notes:
• February typically sees 8% lower sales (post-January)
• Cleaning products demand historically stable
• Watch: Harpic buy prices — 3 of 5 years show a March rate increase
```

### 17.5 Phase 3 — Multi-Supplier Price Tracking for Margin Optimization

Track buy price per product per supplier. When reordering, show a comparison:

```
SUPPLIER PRICE COMPARISON — Harpic 500ml

Supplier A (Raju Traders):    ₹58/unit  [Current]
Supplier B (Vinod Wholesale): ₹55/unit  [Save ₹3/unit]
Supplier C (Online):          ₹53/unit  [Save ₹5/unit, min 24 units]

At current monthly volume (212 units):
Switching to Supplier B saves ₹636/month
Switching to Supplier C saves ₹1,060/month (if ordering 24+ units)
```

---

## 18. Integration with Existing Modules

### 18.1 Integration Points Map

| Existing Module | Integration |
|---|---|
| Product Inventory | Buy price field added; margin badge on product cards; profit history section |
| Billing / POS | Profit per item display (toggle); estimated bill profit in footer; negative margin warning; discount impact |
| Purchase Entry | Buy price change detection; margin impact preview; batch rate change review |
| Reports | New Profit tab in Daily/Weekly/Monthly reports; new Product Profit and Category Profit reports |
| Home Dashboard | Profit widget added alongside existing sales widget |
| Daily Closing | Estimated daily profit shown alongside daily sales in closing review |
| Damage Register | Damage cost write-down reflected in monthly profit summary |
| Returns | Return profit reversal applied to daily profit summary |
| Expense Module | No direct integration (expenses tracked separately as operational costs; not mixed with COGS) |
| WhatsApp Integration | Profit data excluded from customer-facing shares; included in owner-to-self report shares |
| Sync Center | DAILY_PROFIT_SUMMARY and PRODUCT_PROFIT_SNAPSHOT added to sync payload |
| Audit Log | All profit-related events added to existing AUDIT_LOG tab |

### 18.2 Home Dashboard Widget

A new profit widget is added to the existing Home Dashboard, positioned directly below (or alongside) the existing "Today's Sales" card.

```
┌──────────────────────┐  ┌──────────────────────┐
│ Today's Sales        │  │ Today's Profit       │
│ ₹4,850               │  │ ₹1,640               │
│ 32 bills             │  │ 33.8% margin         │
└──────────────────────┘  └──────────────────────┘
```

This widget is owner-only. Helpers see only the sales card (or no financial cards at all, depending on settings).

### 18.3 Daily Closing Integration

The Daily Closing screen (Section 28 of V6 PRD) is extended to show profit data alongside the existing sales reconciliation.

```
DAILY CLOSING — 15 January 2024

SALES SUMMARY
Total Sales:         ₹4,850
Cash:                ₹3,200
UPI:                 ₹1,150
Udhaar Added:        ₹500

PROFIT SUMMARY (Estimated)
Estimated Profit:    ₹1,640  (33.8%)
Discount Impact:     −₹120
Items w/o Cost:      3 items (₹360 revenue — excluded)

[CLOSE DAY]
```

---

## 19. Implementation Order & Phasing

### 19.1 Build Order Rationale

The Profit Intelligence System must be built in a sequence that ensures no existing functionality is disrupted. The buy price field is foundational; everything else depends on it being populated.

### 19.2 Phase 1 — Foundation (Week 1–2)

| Task | Dependency | Priority |
|---|---|---|
| Add `buy_price`, `wholesale_price` fields to Product schema (IndexedDB + Google Sheets) | None | P0 |
| Update product creation / editing UX to include buy price | Schema | P0 |
| Add live margin preview to product creation | Buy price field | P1 |
| Add `buy_price_snapshot` and profit fields to BILL_ITEMS schema | Schema | P0 |
| Add profit fields to BILLS schema | Schema | P0 |
| Implement `calculateItemProfit` and `calculateBillProfit` utilities (client-side) | Schema | P0 |
| Update Apps Script `create_bill` to compute and store profit data | Schema + utility | P0 |
| Implement `PRICE_HISTORY` buy price tracking extensions | Schema | P1 |
| Create `DAILY_PROFIT_SUMMARY` tab and Apps Script updater | Bills profit | P1 |

### 19.3 Phase 2 — Visibility Layer (Week 3–4)

| Task | Dependency | Priority |
|---|---|---|
| Add margin badge component | Margin tier logic | P0 |
| Add profit display to product cards (Owner only) | Buy price + badge | P0 |
| Add profit display toggle in Settings | Billing screen | P1 |
| Add profit display to billing cart items | Toggle + billing screen | P1 |
| Add estimated bill profit to cart footer | Cart item profit | P1 |
| Implement negative margin warning in billing | Billing profit | P0 |
| Implement bill discount profit impact display | Discount engine | P1 |
| Add "Fill Missing Costs" wizard | Dashboard | P2 |

### 19.4 Phase 3 — Reporting Layer (Week 5–6)

| Task | Dependency | Priority |
|---|---|---|
| Implement Daily Profit Report | DAILY_PROFIT_SUMMARY | P1 |
| Implement Monthly Profit Report | DAILY_PROFIT_SUMMARY | P1 |
| Implement Product Profit Report | PRODUCT_PROFIT_SNAPSHOT | P1 |
| Implement Category Profit Report | Snapshots | P2 |
| Implement Margin Trend Report | Monthly snapshots | P2 |
| Implement Discount Impact Report | Bill discount fields | P2 |
| Build Profit Dashboard page | All reports | P1 |
| Add Profit widget to Home Dashboard | DAILY_PROFIT_SUMMARY | P1 |
| Monthly snapshot trigger in Apps Script | Snapshot schema | P2 |
| Offline profit data behavior and stale-data indicators | Sync | P2 |

### 19.5 Critical Path Warning

The single most important dependency chain is:

```
Buy price field in Product schema
    → buy_price_snapshot captured at billing time
        → Apps Script profit computation on bill save
            → DAILY_PROFIT_SUMMARY updated
                → Dashboard and Reports powered
```

If the `buy_price_snapshot` capture at billing time is not implemented correctly, all downstream profit data will be inaccurate or missing. This is the most important thing to get right in Phase 1. Test it with:
1. Bill a product with a known buy price
2. Change the buy price
3. Verify the old bill retains the original snapshot
4. Verify the new bill uses the new buy price
5. Verify the Apps Script computed profit matches the client-computed profit

---

## 20. Success Criteria

### 20.1 Technical Success Criteria

| Criterion | Measurement |
|---|---|
| Buy price captured in every bill item | Zero null `buy_price_snapshot` for products with known buy price |
| Profit calculation matches between client and server | `PROFIT_CALCULATION_MISMATCH` audit events < 0.1% of bills |
| No billing performance regression | Bill creation time unchanged (< 30 seconds) |
| Profit data available offline | Dashboard shows today's profit without internet |
| No retroactive profit modification | Historical bill profits unchanged after buy price update |
| Margin badge renders in < 5ms | Browser DevTools profiling |
| Discount impact updates in < 150ms | UI debounce + render time |
| Monthly snapshot completes in < 30 seconds | Apps Script execution log |

### 20.2 Business Success Criteria

**Week 2:**
- Owner has entered buy prices for at least 80% of active products
- Margin badges visible on product cards and recognizable to owner

**Month 1:**
- Owner checks the Profit Dashboard every morning alongside the existing dashboard
- Owner has used the "Fill Missing Costs" flow at least once
- At least one pricing decision has been made based on the profit data (e.g., sell price updated after supplier rate change)

**Month 3:**
- Owner can articulate which category is most profitable without looking it up
- Owner has used the Discount Impact Report to review discounting behavior
- Monthly profit report has been shared with family or CA
- At least one "Loss Product" has been identified and corrected

**Month 6:**
- Owner says: "I know which products I make the most money on"
- Supplier rate negotiations reference the system's margin impact data
- No significant profit calculation errors have been reported

### 20.3 The Definitive Test for This Module

The Profit Margin Intelligence System has succeeded when the owner of Anupurna Traders says:

> "Now I know not just how much I sold, but how much I actually made.
> And when a supplier changes their rate, I know exactly which products
> need a price review before the next bill goes out."

---

*This document is Version 1 of the Safai Market — Anupurna Traders Profit Margin Intelligence System specification. It is a module-level PRD that extends and inherits from the Master PRD V6. All architectural decisions in V6 take precedence where there is any conflict. Implementation must not modify, remove, or degrade any existing V6 functionality.*

*Document produced by: Senior CTO + Product Architecture Review*
*Status: Implementation-Ready*

---

**End of Document**
