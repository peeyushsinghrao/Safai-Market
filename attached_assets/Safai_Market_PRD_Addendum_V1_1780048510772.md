# Safai Market — Anupurna Traders
## PRD Addendum — Feature Groups 1–10
### Production-Grade Architecture Document — Addendum V1

---

> **Document Classification:** Implementation-Ready PRD Addendum — Merge Into Master PRD V6
> **Audience:** Engineering Lead, Frontend Developer, Product Manager, Store Owner Stakeholder
> **Depends On:** PRD V6 (all principles, architecture, database design, sync engine, and UX system)
> **Also References:** Thermal Printer Integration V1, Profit Margin Intelligence V1
> **Status:** Active — Implementation-Ready
> **Merge Instruction:** Each section below maps to a specific PRD V6 section. Insert, extend, or replace as indicated in the merge notes at the top of each section.

---

## Table of Contents

**Feature Group 1 — Advanced Billing System**
- Section A1: Redesigned Billing Module — Complete Architecture
- Section A2: Multi-Product Cart System
- Section A3: Product List Inside Billing Screen
- Section A4: Billing UX — One-Hand, Fast Checkout Design

**Feature Group 2 — Bill Success Experience**
- Section B1: Bill Success Screen
- Section B2: Bill Download System (PDF)
- Section B3: Bill Sharing System
- Section B4: Bill History Actions
- Section B5: Duplicate Bill Workflow

**Feature Group 3 — Barcode System**
- Section C1: Barcode Architecture — Optional Design
- Section C2: Barcode in Product Creation
- Section C3: Barcode Billing Workflow
- Section C4: Product Not Found — Create Flow
- Section C5: Mobile Camera Scanner
- Section C6: External Scanner Support

**Feature Group 4 — Profit Margin Intelligence**
- Section D1: Integration Reference (see standalone V1 doc)

**Feature Group 5 — Quick Add Product**
- Section E1: Quick Add Product Mode

**Feature Group 6 — Frequently Sold Together**
- Section F1: Frequently Sold Together System

**Feature Group 7 — Low Stock Home Widget**
- Section G1: Low Stock Home Widget

**Feature Group 8 — Product Bundle System**
- Section H1: Product Bundle Architecture

**Feature Group 9 — Voice Billing (Future)**
- Section I1: Voice Billing — Future Architecture

**Feature Group 10 — Printer & Receipt Improvements**
- Section J1: Billing → Print Integration Enforcement

---

---

# FEATURE GROUP 1 — ADVANCED BILLING SYSTEM

> **Merge Note:** This group replaces and significantly expands PRD V6 Section 20 (Billing / POS Module). All existing sub-sections of Section 20 are preserved; new sub-sections are inserted and marked as NEW. The billing screen layout in Section 20.2 is replaced by the layout defined below.

---

## Section A1: Redesigned Billing Module — Complete Architecture

### A1.1 Business Purpose

The existing billing system described in V6 is architecturally sound but optimized primarily for search-first workflows. Real Indian shopkeepers, especially when the helper is billing, often don't type product names — they recognize products visually or browse by category. The redesigned billing module supports both workflows simultaneously: fast typers search, visual browsers scroll.

### A1.2 User Problem Solved

| Old Problem | Solution |
|---|---|
| Helper must know exact product name to bill | Products visible in browse grid; tap to add |
| No way to bill without typing | Category-browsed product grid |
| Cart interaction requires precise tap targets | Large stepper buttons; swipe to remove |
| One-handed billing is awkward | All primary actions in thumb zone |
| Favorites hard to manage | Persistent favorites row with long-press management |
| Can't see what's been added at a glance | Sticky floating cart summary always visible |

### A1.3 Billing Screen — Redesigned Layout

The billing screen is divided into two logical zones:

**Zone 1 — Product Discovery (upper ~60% of screen)**
**Zone 2 — Cart Summary Overlay (sticky bottom)**

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR                                                │
│  [≡ Hold Bills (2)]          [Cart Badge: 3]  [● Sync] │
├─────────────────────────────────────────────────────────┤
│  SEARCH BAR                                             │
│  [🔍 Search product name or scan barcode...      ] [📷]│
├─────────────────────────────────────────────────────────┤
│  CATEGORY FILTER ROW (Horizontal Scroll)                │
│  [All] [Cleaning] [Detergents] [Tools] [Plastic] [Steel]│
├─────────────────────────────────────────────────────────┤
│  FAVORITES ROW (Horizontal Scroll)                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Harpic│ │Vim   │ │Lizol │ │Bucket│ │+More │         │
│  │ ₹95  │ │ ₹32  │ │₹115  │ │ ₹150 │ │      │         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
├─────────────────────────────────────────────────────────┤
│  PRODUCT GRID (Scrollable)                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ [img]      │  │ [img]      │  │ [img]      │        │
│  │ Harpic     │  │ Vim Bar    │  │ Lizol      │        │
│  │ 500ml      │  │ 200g       │  │ 500ml      │        │
│  │ ₹95        │  │ ₹32        │  │ ₹115       │        │
│  │ Stock: 12  │  │ Stock: 28  │  │ Stock: 6   │        │
│  │  [ Add + ] │  │ [−][2][+]  │  │  [ Add + ] │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                         │
│  ... more products scroll down ...                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  STICKY CART FOOTER                                     │
│  3 items  •  ₹335.00           [ CHECKOUT → ]          │
└─────────────────────────────────────────────────────────┘
```

### A1.4 Layout Behavior Rules

**Search Bar Behavior:**
- Tapping the search bar does NOT navigate away from the product grid
- Search results replace the product grid inline (same screen)
- Results appear within 200ms (local IndexedDB search)
- Clearing search restores the last active category/grid view
- The barcode scan icon (📷) to the right of the search bar opens the camera scanner (Feature Group 3)

**Category Filter Row:**
- Always visible below the search bar
- Horizontal scroll; no wrap
- "All" is always first and selected by default
- Tapping a category filters the product grid to that category instantly
- Active category chip: filled green background; others: outlined
- Category chips are sourced from the CATEGORIES table in IndexedDB

**Favorites Row:**
- Shown when search is empty and "All" or a specific category is selected
- Products are shown as compact horizontal chips (name + price only)
- Tapping a favorite chip: if not in cart → adds 1 unit; if in cart → increments quantity
- Long-press a chip → "Remove from Favorites" option
- "+More" chip opens a full favorites management bottom sheet
- Favorites are stored in `local_favorites` IndexedDB table (device-specific, not synced)
- Maximum 12 favorites shown in the row; remaining in the management sheet

**Product Grid:**
- 2-column grid by default on standard phones
- 3-column grid on large phones (> 420px width)
- Each product card: image (or placeholder icon), name, price, stock level, Add/Stepper control
- Grid scrolls independently; cart footer stays fixed
- Category filter change: grid smoothly re-renders (no loading spinner needed; data is local)

**Sticky Cart Footer:**
- Always visible at the bottom (above system navigation)
- Shows: item count, cart total, Checkout button
- Tapping anywhere on the footer (except Checkout) slides up the Cart Drawer
- Checkout button is always fully visible and tappable — never obscured
- Footer is hidden when cart is empty (replaced by a subtle "Add products to start billing" hint)

---

## Section A2: Multi-Product Cart System

### A2.1 Business Purpose

The cart is the core data structure of billing. It must support an unlimited number of products, fast mutations (add, remove, quantity change), and accurate running totals at all times. Critically, adding a second product must never replace the first — each product occupies its own cart line.

### A2.2 Functional Requirements

```
CART CAPABILITIES
─────────────────────────────────────
✓ Unlimited products per bill
✓ Each product on its own line item
✓ Quantity: increment, decrement, direct edit
✓ Per-item discount (owner/family only)
✓ Per-item price override (owner only, with PIN)
✓ Remove item (swipe left or tap × button)
✓ Line total = effective_price × quantity (live)
✓ Subtotal = sum of all line totals (live)
✓ Bill discount (flat ₹ or %)
✓ Grand total = subtotal − bill_discount (live)
✓ Item count badge (updates instantly)
```

### A2.3 Cart Drawer UX

The Cart Drawer slides up as a bottom sheet when the sticky footer is tapped.

```
┌────────────────────────────────────────────────┐
│  ──── (drag handle)                            │
│  YOUR CART                      [3 items]      │
│  ──────────────────────────────────────────    │
│                                                │
│  Harpic Toilet Cleaner 500ml                   │
│  ₹95.00                                        │
│  [−] [  2  ] [+]           Line Total: ₹190   │
│  [Item Discount: ₹0 ▾]                         │
│                                                │
│  Vim Bar 200g                                  │
│  ₹32.00                                        │
│  [−] [  3  ] [+]           Line Total: ₹96    │
│  [Item Discount: ₹0 ▾]                         │
│                                                │
│  Lizol Floor Cleaner 500ml                     │
│  ₹115.00                                       │
│  [−] [  1  ] [+]           Line Total: ₹115   │
│  [Item Discount: ₹0 ▾]                         │
│                                                │
│  ──────────────────────────────────────────    │
│  Subtotal:                        ₹401.00      │
│  Bill Discount:             [₹0     ▾]         │
│  ──────────────────────────────────────────    │
│  TOTAL:                           ₹401.00      │
│                                                │
│         [ ← Add More ]   [ CHECKOUT → ]        │
└────────────────────────────────────────────────┘
```

**Cart Item Interactions:**
- **Quantity stepper [−]/[+]:** Touch targets are minimum 48×48px. The [−] button is disabled (greyed) when quantity is 1 — it does not go to 0; use the × to remove instead.
- **Direct quantity edit:** Tapping the quantity number opens a numeric keypad bottom sheet. User enters desired quantity and confirms. Maximum enforced: `min(999, current_stock)`.
- **Swipe left to remove:** Swipe the entire cart item card left reveals a red "Remove" button. Full swipe removes the item instantly with a 3-second undo toast.
- **Item discount field:** Collapsed by default. Tap "Item Discount: ₹0 ▾" to expand inline. Shows a numeric field for flat discount or toggle to %. Only visible to Owner and Family Member roles. Line total updates instantly.
- **Price override:** Long-pressing the price (₹95.00) for 1 second opens a "Override Price" bottom sheet. Requires Owner PIN. Override price must be ≥ ₹0. If override causes negative profit: Profit-Aware Discount Engine warning shown (see Profit Intelligence V1). Price override is stored in the bill item as `price_override: true, overridden_price: X`.
- **Product name tap:** Navigates to the product detail page. A "Back to Cart" button is shown on the product detail page to return without losing cart state.

### A2.4 Cart State Management (Zustand)

```javascript
// cartStore.js
const useCartStore = create((set, get) => ({
  items: [],       // Array of CartItem
  billDiscount: 0,
  billDiscountType: 'flat', // 'flat' | 'pct'
  customerSelected: null,
  holdBills: [],

  addItem: (product, quantity = 1) => {
    const { items } = get();
    const existing = items.find(i => i.product_id === product.product_id);
    if (existing) {
      // Increment quantity; never create a duplicate line
      set({ items: items.map(i =>
        i.product_id === product.product_id
          ? { ...i, quantity: i.quantity + quantity }
          : i
      )});
    } else {
      // New line item
      const newItem = {
        cart_item_id:        generateUUID(),
        product_id:          product.product_id,
        product_name:        product.name,
        sku_code:            product.sku_code,
        sell_price:          product.sell_price,
        buy_price:           product.buy_price,   // for profit display
        item_discount:       0,
        item_discount_type:  'flat',
        price_override:      false,
        overridden_price:    null,
        quantity:            quantity,
        unit:                product.unit,
        available_stock:     product.current_stock,
        added_at:            new Date().toISOString(),
      };
      set({ items: [...items, newItem] });
    }
  },

  removeItem: (cart_item_id) => {
    set({ items: get().items.filter(i => i.cart_item_id !== cart_item_id) });
  },

  updateQuantity: (cart_item_id, quantity) => {
    if (quantity <= 0) return;
    set({ items: get().items.map(i =>
      i.cart_item_id === cart_item_id ? { ...i, quantity } : i
    )});
  },

  setItemDiscount: (cart_item_id, discount, type) => {
    set({ items: get().items.map(i =>
      i.cart_item_id === cart_item_id
        ? { ...i, item_discount: discount, item_discount_type: type }
        : i
    )});
  },

  // Computed selectors
  getSubtotal:   () => get().items.reduce((s, i) => s + getLineTotal(i), 0),
  getGrandTotal: () => {
    const sub = get().getSubtotal();
    const d = get().billDiscount;
    const t = get().billDiscountType;
    return t === 'pct' ? sub * (1 - d / 100) : sub - d;
  },
  getItemCount:  () => get().items.reduce((s, i) => s + i.quantity, 0),

  clearCart: () => set({ items: [], billDiscount: 0, customerSelected: null }),
}));

// Pure helper — no state dependency
const getLineTotal = (item) => {
  const base = item.price_override ? item.overridden_price : item.sell_price;
  const d = item.item_discount_type === 'pct'
    ? base * (item.item_discount / 100)
    : item.item_discount;
  return (base - d) * item.quantity;
};
```

### A2.5 Stock Validation in Cart

When a product is added to the cart, the system checks `available_stock` from the in-memory product cache:

```
Rule 1 — Add to cart:
  If quantity_in_cart + 1 <= available_stock → add normally
  If quantity_in_cart + 1 > available_stock AND allow_negative_stock = false:
    Show inline warning on product card: "Only X left in stock"
    Plus button disabled at available_stock; minus still works

Rule 2 — Direct quantity edit:
  If entered quantity > available_stock:
    Show warning toast: "Only X units available. Added X."
    Quantity capped at available_stock
    Owner can tap "Override" to exceed stock (requires owner PIN confirmation)

Rule 3 — At checkout:
  Server re-validates stock for all items. If any item has insufficient stock at
  server time (may have been sold on another device): Show conflict resolution:
  "Harpic 500ml: only 2 left (you have 3 in cart). Remove 1 to proceed."
```

### A2.6 Cart Persistence

The active cart (not held) is persisted to IndexedDB as a `draft_bill` entry. This means:
- If the app is backgrounded and killed, the cart survives app restart
- On app open: If a non-empty draft_bill exists, the cart is restored with a banner: "You have an unsaved cart. Resume?"
- The draft_bill is cleared when the bill is confirmed, cancelled, or held

### A2.7 Cart Impact on Database

No database writes happen for cart mutations. Cart state lives entirely in Zustand (in-memory) and IndexedDB draft_bill (for persistence). The database is only written at the moment of bill confirmation (same atomic flow as V6 Section 7.6).

### A2.8 Cart Impact on Reports

The cart itself has no report impact. Only saved bills affect reports. However, the cart's estimated profit (from Profit Intelligence V1) is shown in real-time and does not create any records until the bill is saved.

### A2.9 Cart Offline Behavior

Cart operations are 100% local. No network dependency for any cart mutation. Stock validation offline uses the last-synced stock from IndexedDB, with a staleness warning if the last sync was > 1 hour ago. The confirmed bill is queued to the offline_queue for sync.

---

## Section A3: Product List Inside Billing Screen

### A3.1 Business Purpose

The billing screen must not force the helper to know the exact product name. A visual product grid — browseable by category — reduces billing errors caused by wrong product selection, speeds up billing for common items, and enables helpers with minimal training to bill confidently.

### A3.2 Product Card Design — Billing Screen

Each card in the billing grid is a compact, touch-optimized card:

```
┌─────────────────────────┐
│  [Product Image / Icon] │
│  Harpic Toilet          │
│  Cleaner 500ml          │
│  ₹95                    │
│  Stock: 12              │
│  ┌─────────────────────┐│
│  │      + Add          ││
│  └─────────────────────┘│
└─────────────────────────┘
```

**After tapping "Add":**
```
┌─────────────────────────┐
│  [Product Image / Icon] │
│  Harpic Toilet          │
│  Cleaner 500ml          │
│  ₹95   •   Line: ₹190   │
│  Stock: 12              │
│  ┌───┐ ┌───┐ ┌───┐     │
│  │ − │ │ 2 │ │ + │     │
│  └───┘ └───┘ └───┘     │
└─────────────────────────┘
```

**State transitions for the Add/Stepper control:**
- `quantity_in_cart === 0` → Shows full-width green "Add" button
- `quantity_in_cart > 0` → Transitions (animated, 150ms) to [−][qty][+] stepper
- `quantity_in_cart === available_stock` → [+] button is orange, shows tooltip "Max stock reached"
- `available_stock === 0` → "Add" button is greyed, shows "Out of Stock"

**Product card touch target:** Minimum 44px height for all interactive elements. The stepper buttons are 44×44px. The card itself is approximately 160px tall.

### A3.3 Product Card — Information Hierarchy

| Element | Always Visible | Owner Only | Helper |
|---|---|---|---|
| Product image / icon | ✓ | ✓ | ✓ |
| Product name | ✓ | ✓ | ✓ |
| Sell price | ✓ | ✓ | ✓ |
| Stock quantity | ✓ | ✓ | ✓ |
| Add/Stepper | ✓ | ✓ | ✓ |
| Margin badge | — | ✓ | — |
| Buy price | — | ✓ | — |

### A3.4 Product Image in Billing Cards

Product images are optional (V6 already plans for image uploads compressed to 50KB). In the billing grid:
- If image exists: shown as a 48×48px square thumbnail in the card top section
- If no image: a category-specific colored icon is shown (mop icon for Tools, bottle icon for Cleaning Liquids, etc.) with the category's color from the store's color taxonomy
- No broken image states are visible; fallback icon is always shown if image fails to load

### A3.5 Sorting and Display Order of Products in Billing Grid

Default sort order in billing grid (can be changed in Settings → Billing → Product Display Order):
1. **Favorites** (always shown first in the grid if the "All" category is selected)
2. **Recently billed** (last 7 days; descending by last billed date)
3. **Alphabetical by category**, then alphabetical by name within category

Owner can change sort order to:
- Best sellers (most units billed in last 30 days)
- Alphabetical A–Z
- Most recently added to catalog

### A3.6 Search Results in the Grid

When the search bar has a query:
- The category filter row is hidden (search overrides category)
- The favorites row is hidden
- Product grid shows search results sorted by relevance (exact match first, partial match second, fuzzy match third — per V6 Section 18.2)
- Results use the same card design as the grid
- "No results found" state shows: product name as typed + "Create this product?" link → opens Quick Add Product (Feature Group 5)

### A3.7 "Recent Products" Section

When search is empty and "All" category is selected:
- First row of the grid shows a "Recently Billed" horizontal scroll section
- Shows last 8 products billed (most recent first), distinct products only
- Tapping adds 1 unit to cart (same behavior as favorites)
- Recent products are sourced from `BILL_ITEMS` in IndexedDB, grouped by `product_id`, ordered by most recent `bill_created_at`
- "Recent" section is device-specific (not synced) and resets on cache clear

### A3.8 Performance Requirements

The product grid must render without perceptible lag on a 2GB RAM Android device.

- Full catalog (500 products) loaded into memory on app start
- Category filter: instant (in-memory filter on pre-loaded array)
- Search: in-memory fuzzy search, debounced at 150ms
- Grid virtualization: react-window or similar; only render visible cards + 2 rows above/below viewport
- Image lazy loading: only load images for visible cards

---

## Section A4: Billing UX — One-Hand, Fast Checkout Design

### A4.1 One-Hand Usage Principles

The billing screen is designed for right-thumb operation on a 6-inch phone. Specifically for a shop owner or helper standing at the counter, potentially with one hand occupied.

**Thumb Zone Mapping (6-inch phone):**
```
┌──────────────────┐
│  ╔══════════════╗│  ← Hard to reach (top of screen)
│  ║ Top Bar      ║│    Only passive info here (sync status, holds count)
│  ╠══════════════╣│
│  ║ Search Bar   ║│  ← Stretchy reach; acceptable for search initiation
│  ║ Category Row ║│
│  ╠══════════════╣│
│  ║              ║│
│  ║ Product Grid ║│  ← Natural thumb zone; primary interaction area
│  ║              ║│    Cards, Add buttons, steppers all here
│  ╠══════════════╣│
│  ║ Cart Footer  ║│  ← Easiest reach (thumb resting zone)
│  ╚══════════════╝│    Checkout button always here
└──────────────────┘
```

**Key design decisions from one-hand constraint:**
- Checkout button: always at the bottom-right (natural thumb resting zone)
- Cart item removal: swipe left (natural thumb gesture)
- Category filter: horizontal scroll with large chips (48px height)
- Product cards: large enough to tap confidently but small enough to see 4–6 per screen
- Quantity stepper: [−] on left, [+] on right, number in center — matches natural finger spread

### A4.2 Fast Checkout Design

The fastest path from "customer tells you items" to "bill saved" must be under 30 seconds for a typical 3–5 item bill.

**Fastest path (returning helper billing known products):**
```
1. Billing screen opens → keyboard auto-focused on search
   (Total: ~0 seconds)

2. Type "ha" → Harpic appears → tap → added to cart
   (Total: ~5 seconds)

3. Tap [+] twice → quantity becomes 3
   (Total: ~7 seconds)

4. Type "vim" → tap Vim → added
   (Total: ~10 seconds)

5. Tap Cart Footer → Checkout button visible
   (Total: ~11 seconds)

6. Checkout opens → Payment: Cash → Enter ₹400 → Confirm
   (Total: ~20 seconds)

7. Bill Saved. Success screen.
   (Total: ~22 seconds)
```

**Timing constraints per interaction:**
- Search result appearance: ≤ 150ms
- Add to cart animation: ≤ 100ms
- Cart total update: ≤ 50ms (synchronous arithmetic)
- Cart drawer open: ≤ 200ms (CSS animation)
- Checkout screen transition: ≤ 200ms

### A4.3 Floating Cart Summary

The sticky cart footer described in A1.3 serves as the floating cart summary. Its behavior:

- Present on every billing screen state (search, browse, category filtered)
- Disappears with slide-down animation only when cart is truly empty
- Height: 60px; does not obscure more than 60px of the product grid
- When cart has ≥ 1 item: shows count badge, total, Checkout button
- Badge on cart count is a green circle with white number — immediately visible

### A4.4 Bill Discount UX in Cart

Accessible from the Cart Drawer. The bill discount field:
```
Bill Discount:
  ₹ [ 0.00      ]  ←→  [ % ]
  (Tap ₹ or % to toggle between flat and percentage mode)
```

- Flat mode: Enter ₹ amount; grand total updates instantly
- Percentage mode: Enter %; equivalent ₹ amount shown below; grand total updates
- Both modes: If discount exceeds total profit (Profit Intelligence V1): warning shown
- Minimum discount: ₹0. Maximum discount: bill total (cannot create negative bills)

### A4.5 Bill Notes

An optional Bill Notes field is accessible from the Cart Drawer (collapse by default, expandable):
```
Bill Notes (optional):
[ _________________________________ ]
e.g. "Regular customer, gave ₹10 off"
```
Saved in `bills.notes` field. Visible in bill detail view but not printed on receipt unless the owner enables it in Settings → Billing → Print Notes on Receipt.

---

---

# FEATURE GROUP 2 — BILL SUCCESS EXPERIENCE

> **Merge Note:** This group extends PRD V6 Section 20.3 (Checkout Flow, Step 5) and adds entirely new sections 20.10–20.15.

---

## Section B1: Bill Success Screen

### B1.1 Business Purpose

The moment after a bill is saved is the most emotionally significant moment in the billing flow. The success screen should communicate trust (your data is safe), speed (you can move on immediately), and options (share, print, next bill). It should never feel like a dead end.

### B1.2 Bill Success Screen Layout

```
┌──────────────────────────────────────────────┐
│                                              │
│              ✓ BILL SAVED                    │
│         (Large green checkmark, animated)    │
│                                              │
│   Anupurna Traders                          │
│   Bill #SMAT-2026-0023                      │
│   15 January 2026, 3:45 PM                  │
│                                              │
│   Sharma ji  •  Cash  •  ₹335.00            │
│                                              │
│   ── Quick Actions ─────────────────────    │
│   ┌──────────────┐    ┌──────────────┐      │
│   │  📄 View     │    │  ⬇ Download  │      │
│   │    Bill      │    │    PDF       │      │
│   └──────────────┘    └──────────────┘      │
│   ┌──────────────┐    ┌──────────────┐      │
│   │  📤 Share    │    │  🖨 Print    │      │
│   │    Bill      │    │    Bill      │      │
│   └──────────────┘    └──────────────┘      │
│   ┌──────────────────────────────────┐      │
│   │  🖨 Reprint Bill                 │      │
│   └──────────────────────────────────┘      │
│                                              │
│   ──────────────────────────────────────    │
│                                              │
│   [ ← CREATE NEW BILL ]                     │
│                                              │
└──────────────────────────────────────────────┘
```

### B1.3 Success Screen States

**State 1 — Saved Online (synced immediately):**
```
✓ BILL SAVED
Synced to cloud
```
Green checkmark. Solid green badge "Synced ✓" near bill number.

**State 2 — Saved Offline:**
```
✓ BILL SAVED
Will sync when internet returns
```
Green checkmark (same visual confidence). Amber badge "Saved Offline ●" near bill number. The owner knows the bill is safe locally and will sync.

**State 3 — Saving... (rare slow network):**
```
○ SAVING...
```
Animated spinner. "Create New Bill" button is disabled until save completes. This state should last < 2 seconds under normal conditions (local save is instant; this state only appears if local IndexedDB write is unusually slow).

### B1.4 Quick Action Buttons — Behavior

| Button | Behavior | Availability |
|---|---|---|
| View Bill | Opens the formatted bill detail screen | Always |
| Download PDF | Generates PDF and triggers device download | Always |
| Share Bill | Opens the share bottom sheet (Section B3) | Always |
| Print Bill | Triggers the print flow (per Printer Integration V1) | When printer configured |
| Reprint Bill | Same as Print Bill; explicitly labelled for reprinting | When printer configured |
| Create New Bill | Clears cart, returns to billing screen | Always |

**Auto-Print Behavior:**
If the setting "Auto-print after bill save" is ON (Settings → Billing → Auto Print), the print job is queued immediately after the bill save confirmation — without requiring the user to tap "Print." The Print button on the success screen in this case is relabelled "Reprint."

### B1.5 Success Screen Back Navigation

The back button on the success screen navigates to the billing screen (new empty cart), NOT to the checkout flow. The completed bill cannot be re-submitted by navigating back.

### B1.6 Audit Log

On bill success screen display:
```
AUDIT_LOG entry: BILL_SUCCESS_SCREEN_SHOWN
Fields: bill_id, device_id, timestamp, auto_print_triggered, share_method (null at this point)
```
This is the baseline event from which we can track share/print conversion rates in future analytics.

---

## Section B2: Bill Download System (PDF)

### B2.1 Business Purpose

A PDF bill is the professional receipt format that customers expect when they ask "can you give me a bill?" It also serves as the owner's permanent record for each transaction.

### B2.2 PDF Filename Convention

```
Bill-SMAT-{YEAR}-{SEQUENCE}.pdf

Examples:
  Bill-SMAT-2026-0001.pdf
  Bill-SMAT-2026-0023.pdf
  Bill-SMAT-2026-1204.pdf
```

**Filename Components:**
- `SMAT` — Fixed prefix (Safai Market Anupurna Traders); configurable in Settings → Store → Bill Prefix
- `{YEAR}` — 4-digit year of bill creation
- `{SEQUENCE}` — 4-digit zero-padded bill sequence number for the year (not the daily sequence)

A separate `annual_bill_sequence` counter is maintained in IndexedDB (and mirrored in Google Sheets CONFIG tab). It increments for every saved bill and resets to 0001 on January 1st.

### B2.3 PDF Generation Workflow

PDF generation happens entirely client-side using the browser's print-to-PDF capability.

```
User taps "Download PDF"
↓
System checks if PDF was already generated for this bill_id
  → If cached: serve from IndexedDB cache
  → If not cached: generate now
↓
Generate print HTML (same template as browser print; see Printer Integration V1)
↓
Open print preview window
↓
Browser "Save as PDF" dialog opens
  (On Chrome Android: share sheet includes "Save as PDF" option)
↓
PDF saved to device Downloads folder
↓
Toast: "PDF saved: Bill-SMAT-2026-0023.pdf"
```

**Caching strategy:** The first PDF generation for a bill_id creates the HTML payload and caches it in IndexedDB as `pdf_cache:bill_id`. Subsequent download requests serve from cache. Cache is cleared when IndexedDB is cleared (rare; only on full data reset).

### B2.4 PDF Layout

The PDF uses the same receipt HTML template as the browser print (see Printer Integration V1, Section 8 — Receipt Layout Design). The layout is A5 paper size when saved as PDF (not the 58mm thermal receipt size), allowing for a more readable customer-facing document.

A setting in Settings → Billing → PDF Format allows switching between:
- **Compact (58mm receipt style):** Same as thermal receipt; small file, minimal whitespace
- **Standard (A5 document):** Wider layout with store logo header, more readable fonts

Default: Standard (A5 document).

### B2.5 PDF Offline Behavior

PDF generation is fully offline. All bill data is in IndexedDB. The HTML generation and browser print API work without internet. The customer can receive their PDF receipt even when the store is offline.

### B2.6 PDF Storage Strategy

PDFs are not stored permanently by the app. The bill data is stored permanently in IndexedDB and Google Sheets. The PDF is regenerated on-demand from the stored bill data.

This keeps app storage lean. PDFs are generated when needed (download, share) and not accumulated on the device.

### B2.7 Reports Impact

Every PDF download is logged:
```
PDF_DOWNLOAD_LOG (IndexedDB only; not synced to Sheets)
Fields: bill_id, downloaded_at, device_id
```
This is for local debugging only. No Sheets impact.

---

## Section B3: Bill Sharing System

### B3.1 Business Purpose

Sharing a bill is how the owner provides a digital receipt to the customer. WhatsApp is the dominant channel in India. The system must make sharing as fast as possible.

### B3.2 Share Bottom Sheet Layout

```
┌────────────────────────────────────────────┐
│  ──── (drag handle)                        │
│  SHARE BILL #SMAT-2026-0023                │
│                                            │
│  Share to:                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   💬     │ │   ✈️     │ │   📧     │   │
│  │ WhatsApp │ │ Telegram │ │  Email   │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐                │
│  │   📡     │ │   ⋯ More │                │
│  │  Nearby  │ │(Android) │                │
│  └──────────┘ └──────────┘                │
│                                            │
│  Share as:   [● Text]  [○ PDF]            │
│                                            │
│  Customer phone: +91 98765XXXXX  [Edit]   │
│  ────────────────────────────────────     │
│  [ Share ]                                 │
└────────────────────────────────────────────┘
```

### B3.3 Share Channels — Implementation Details

**WhatsApp (Primary Channel):**
```javascript
const shareViaWhatsApp = (billData, format = 'text') => {
  const phone = billData.customer?.phone?.replace(/\D/g, ''); // digits only
  const message = format === 'text'
    ? generateWhatsAppBillMessage(billData)  // existing V6 format
    : null; // PDF share uses file share flow, not URL deep link

  if (format === 'text') {
    const encodedMsg = encodeURIComponent(message);
    const url = phone
      ? `whatsapp://send?phone=91${phone}&text=${encodedMsg}`
      : `whatsapp://send?text=${encodedMsg}`;
    window.open(url, '_blank');
  } else {
    // PDF: generate PDF first, then use Web Share API
    generateAndSharePDF(billData, 'whatsapp');
  }
};
```

**Telegram:**
```javascript
const shareViaTelegram = (billData) => {
  const message = generateWhatsAppBillMessage(billData); // same format as WhatsApp
  const encodedMsg = encodeURIComponent(message);
  window.open(`https://t.me/share/url?url=&text=${encodedMsg}`, '_blank');
};
```

**Email:**
```javascript
const shareViaEmail = (billData) => {
  const subject = encodeURIComponent(`Bill from Anupurna Traders — #${billData.bill_number}`);
  const body = encodeURIComponent(generateEmailBillBody(billData));
  const to = billData.customer?.email ? encodeURIComponent(billData.customer.email) : '';
  window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank');
};
```

**Nearby Share / Android Share Sheet:**
Uses the Web Share API with PDF file for maximum compatibility:
```javascript
const shareViaAndroid = async (billData) => {
  const pdfBlob = await generatePDFBlob(billData);
  const pdfFile = new File(
    [pdfBlob],
    `Bill-SMAT-${billData.year}-${billData.sequence}.pdf`,
    { type: 'application/pdf' }
  );
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    await navigator.share({ files: [pdfFile], title: `Bill #${billData.bill_number}` });
  } else {
    // Fallback: download the PDF
    downloadPDF(pdfBlob, billData);
  }
};
```

### B3.4 Share Format — Text vs PDF

- **Text (default):** Uses the existing WhatsApp bill message format (V6 Section 33.2). Fast — no PDF generation. Works on all channels.
- **PDF:** Generates the PDF first (Section B2), then shares the file. Takes 1–2 seconds longer but provides a professional document.

The default is Text. Owner can change default in Settings → Billing → Default Share Format.

### B3.5 Customer Phone Pre-Population

If the bill has a customer with a phone number, the share sheet pre-populates the WhatsApp deep link with that number. The user can edit it before sharing.

If no customer phone: Share opens without a pre-selected contact.

### B3.6 Audit Log for Shares

```
AUDIT_LOG entry type: BILL_SHARED
Fields: bill_id, channel (whatsapp | telegram | email | android_share | nearby),
        format (text | pdf), customer_id, shared_at, device_id
```

---

## Section B4: Bill History Actions

### B4.1 Business Purpose

Every saved bill must be fully actionable from the Bills History screen. The owner should never feel stuck because a bill was printed once and now they can't access it again.

### B4.2 Bill History List Item

In the Bills module → All Bills list, each bill entry shows:

```
┌─────────────────────────────────────────────────┐
│  #SMAT-2026-0023          15 Jan 2026, 3:45 PM  │
│  Sharma ji                             ₹335.00  │
│  Cash • 4 items                    [●Synced ✓]  │
│  ─────────────────────────────────────────────  │
│  [View] [Share ↗] [PDF ⬇] [Print 🖨] [⋯ More]  │
└─────────────────────────────────────────────────┘
```

**Action Buttons (inline on list item):**
- **View:** Opens full bill detail screen
- **Share:** Opens share bottom sheet (B3)
- **PDF:** Downloads PDF directly
- **Print:** Queues a print job
- **⋯ More:** Opens overflow menu with: Reprint, Duplicate Bill, Cancel Bill (owner PIN)

### B4.3 Bill Detail Screen

The bill detail screen shows the complete, formatted bill:

```
BILL DETAIL
────────────────────────────────────────────────
Anupurna Traders
Shop Address • Phone: XXXXXXXXXX

Bill #SMAT-2026-0023
Date: 15 January 2026, 3:45 PM
Customer: Sharma ji (9876XXXXXX)

ITEMS
────────────────────────────────────────────────
Harpic Toilet Cleaner 500ml
  ₹95 × 2                              ₹190.00

Vim Bar 200g
  ₹32 × 1                               ₹32.00

Lizol Floor Cleaner 500ml
  ₹115 × 1                             ₹115.00
────────────────────────────────────────────────
Subtotal:                              ₹337.00
Discount:                               −₹2.00
TOTAL:                                 ₹335.00

Payment: Cash ₹335.00
Status: PAID ✓
────────────────────────────────────────────────
Billed by: Vikram (Owner)
Device: Owner's Phone
Synced: Yes ✓
────────────────────────────────────────────────
[Share] [Download PDF] [Print] [Reprint] [⋯]
```

Profit section (owner only, if profit display setting is ON):
```
PROFIT SUMMARY (Owner Only)
Est. Profit: ₹118.00  •  35.2% margin
```

### B4.4 Bill Status Tags

| Status | Badge | Color | Description |
|---|---|---|---|
| `PAID` | PAID ✓ | Green | Fully paid bill |
| `UDHAAR` | UDHAAR | Orange | Added to customer credit |
| `PARTIAL` | PARTIAL | Amber | Partially paid + udhaar |
| `CANCELLED` | CANCELLED | Red | Bill cancelled |
| `OFFLINE` | SAVED OFFLINE | Amber | Bill saved locally, not yet synced |
| `SYNC_PENDING` | PENDING SYNC | Yellow | In sync queue |

---

## Section B5: Duplicate Bill Workflow

### B5.1 Business Purpose

Many customers at Anupurna Traders are regulars who buy the same set of products every week. Duplicating a previous bill eliminates the need to search and add each product again. This is one of the most practical time-saving features for a real store.

### B5.2 User Problem Solved

**Scenario:** Ramesh Bhaiya comes every Friday and buys:
- Harpic 500ml × 2
- Vim Bar × 3
- Floor Cleaner × 1
- Naphthalene balls × 1

Instead of adding each item manually every week, the helper can duplicate last week's bill and proceed directly to checkout.

### B5.3 Duplicate Bill Workflow

**Entry Points:**
1. Bill History list → item → ⋯ More → "Duplicate as New Bill"
2. Bill Detail screen → action bar → "Duplicate"
3. Customer Profile → Bills list → "Duplicate"
4. Bill Success screen (immediately after saving) → not shown (no reason to duplicate immediately)

**Duplication Flow:**
```
User taps "Duplicate Bill"
↓
Confirmation: "Create a new bill with the same items as Bill #SMAT-2026-0023?
               Customer: Sharma ji will be pre-selected."
  [Duplicate]   [Cancel]
↓
System creates new cart with items from the original bill:
  - Products: same product_ids
  - Quantities: same as original
  - Prices: CURRENT sell price (not original bill price)
  - Customer: original customer pre-selected (changeable)
  - Discounts: NOT carried over (discounts are per-session decisions)
↓
Billing screen opens with the pre-populated cart
Toast: "Cart loaded from Bill #SMAT-2026-0023. Prices updated to current rates."
↓
User reviews, adjusts quantities if needed, and proceeds to checkout normally
```

### B5.4 Price Handling in Duplication

**Critical rule:** Duplicate bills always use **current prices**, not the prices from the original bill.

Rationale: Prices change over time. Using old prices would create incorrect bills. The system alerts the user if any price has changed:

```
Toast (if any prices differ from original):
"Prices updated: Harpic 500ml was ₹90, now ₹95. Review your cart."
```

### B5.5 Stock Validation on Duplicate

After loading the duplicated cart, stock is re-validated against current stock:
- If a product from the original bill is now out of stock: it is added to the cart with a warning badge: "Out of stock — remove or override"
- If a product from the original bill has been archived: it is skipped and a toast shows: "Lizol 1L was removed (product archived)"
- If quantities exceed current stock: same behavior as A2.5

### B5.6 Edge Cases

| Scenario | Handling |
|---|---|
| Original bill has a cancelled item | Item not included in duplicate |
| Original bill customer no longer exists | Cart loads without customer; user selects new customer |
| Original bill had a price override (manual price) | Override is NOT carried over; current price used |
| Duplicating a cancelled bill | Allowed; loads items as if bill was valid |
| Duplicating a bill with 20+ items | All items loaded; cart handles unlimited items (A2.1) |

### B5.7 Permissions

| Role | Can Duplicate Bill |
|---|---|
| Owner | ✓ Yes |
| Family Member | ✓ Yes |
| Helper | ✓ Yes (for bills they created in the last 24 hours only) |

Helper restriction: Helpers can only duplicate their own recent bills to prevent them from accessing detailed historical bill information of other operators.

### B5.8 Audit Log

```
AUDIT_LOG entry: BILL_DUPLICATED
Fields: new_bill_id (set after confirmation), source_bill_id, duplicated_by,
        price_changes_count, items_skipped_count, device_id, created_at
```

---

---

# FEATURE GROUP 3 — BARCODE SYSTEM

> **Merge Note:** This is an entirely new module. Insert as new Section 20A in PRD V6, between Section 20 (Billing / POS Module) and Section 21 (Customer & Udhaar Module). Also insert into Section 16 (Product Inventory Module) for barcode fields on products.

---

## Section C1: Barcode Architecture — Optional Design

### C1.1 The Golden Rule of Barcodes

**Barcodes are always optional. The system must never require a barcode to function.**

Every barcode workflow has a "Skip / Enter Manually / No barcode" path. A product without a barcode behaves exactly like one with a barcode — it is just searched by name instead of scanned. No feature, report, or workflow is gated behind barcode presence.

### C1.2 Supported Barcode Formats

| Format | Common Use | Support Level |
|---|---|---|
| EAN-13 | Retail products (most packaged goods) | Full |
| EAN-8 | Smaller packaged goods | Full |
| UPC-A | US retail products | Full |
| Code 128 | Variable-length alphanumeric | Full |
| QR Code | Digital barcodes, links | Read-only (future: encode bill link) |
| Code 39 | Industrial use | Full |

### C1.3 Barcode Fields on Product Record

Two new fields added to the PRODUCTS schema:

```
barcode           | String | null    The product's barcode value
barcode_type      | Enum   | null    EAN13 | EAN8 | UPCA | CODE128 | CODE39 | QR
```

**Uniqueness:** The `barcode` field is unique within the store's product catalog. Two products cannot share the same barcode value. If a product has multiple barcodes (e.g., different sizes have different EAN-13 codes), each size is a separate product entry (already the case in V6's variant system).

**IndexedDB index:** `barcode` is indexed in the products Dexie.js table for O(1) lookup during scanning.

### C1.4 Architecture for Camera Scanning

Barcode scanning uses the `ZXing` library (Zebra Crossing) via `@zxing/browser` — a well-maintained open source library with zero external service dependencies.

```javascript
// BarcodeScanner.js
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';

let codeReader = null;

export const startBarcodeScanner = async (videoElementId, onDetected, onError) => {
  codeReader = new BrowserMultiFormatReader();
  const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
  const selectedDeviceId = videoInputDevices[0]?.deviceId; // rear camera preferred

  await codeReader.decodeFromVideoDevice(
    selectedDeviceId,
    videoElementId,
    (result, err) => {
      if (result) {
        onDetected(result.getText(), result.getBarcodeFormat().toString());
      }
      if (err && !(err instanceof NotFoundException)) {
        onError(err);
      }
    }
  );
};

export const stopBarcodeScanner = () => {
  if (codeReader) {
    codeReader.reset();
    codeReader = null;
  }
};
```

**Performance note:** The camera scanner is lazy-loaded (code-split chunk). It is never loaded unless the user taps the scan button, ensuring no impact on billing screen startup time.

---

## Section C2: Barcode in Product Creation

### C2.1 Functional Requirements

```
BARCODE FIELD IN PRODUCT CREATION
─────────────────────────────────────────────
✓ Scan using phone camera (opens scanner overlay)
✓ Enter barcode manually (numeric keyboard)
✓ Skip (leave blank)
✓ Validate uniqueness before save (prevent duplicate barcodes)
✓ Detect barcode type automatically from scan result
✓ Edit barcode after product creation
```

### C2.2 Barcode Entry UX in Product Creation Form

```
BARCODE (Optional)
────────────────────────────────────
[ 8901234567890           ] [Scan 📷]
Detected: EAN-13

Or:  [Enter Manually]  [Skip for now]
```

**Scan flow:**
1. User taps "Scan 📷" button
2. Camera scanner overlay opens (full-screen modal with viewfinder)
3. User points camera at product barcode
4. On detection: vibration feedback + beep + barcode value fills the field
5. Scanner overlay closes automatically
6. Barcode type is shown below the field

**Manual entry:**
- Numeric keypad opens
- User types barcode digits
- Barcode type is auto-detected from length: 8 digits → EAN-8, 12 → UPC-A, 13 → EAN-13

**Uniqueness check:**
On form submit (not on typing), the system checks if this barcode already exists in IndexedDB. If duplicate found:
```
⚠ Barcode already assigned to: Harpic 500ml (500 units)
Is this the same product?  [Yes, use existing]  [No, enter different barcode]
```

### C2.3 Google Sheets Changes for Barcode

New columns in the `PRODUCTS` tab:
- Column: `barcode` (String)
- Column: `barcode_type` (String)

Apps Script `create_product` and `update_product` handlers are extended to accept and save these fields.

### C2.4 Audit Log

```
AUDIT_LOG entry: BARCODE_ASSIGNED
Fields: product_id, barcode_value, barcode_type, assigned_by, method (scan | manual)
```

---

## Section C3: Barcode Billing Workflow

### C3.1 Scan to Bill Flow

```
Billing Screen
↓
User taps [📷] barcode icon next to search bar
↓
Camera scanner overlay opens (full-screen)
↓
User scans product barcode
↓
System looks up barcode in IndexedDB product catalog (O(1) lookup)
  ┌─────────────────────────────────────────┐
  │ Found → Product identified              │
  │   If product has single variant:        │
  │     → Add 1 unit to cart immediately    │
  │     → Haptic feedback                   │
  │     → Brief success toast:              │
  │       "Harpic 500ml added ✓"            │
  │     → Camera stays open for next scan   │
  │                                         │
  │   If product has multiple variants:     │
  │     → Variant selector bottom sheet     │
  │     → After selection: add to cart      │
  │     → Camera stays open for next scan   │
  └─────────────────────────────────────────┘
  ┌─────────────────────────────────────────┐
  │ Not Found → Product not found flow      │
  │   (Section C4)                          │
  └─────────────────────────────────────────┘
↓
User scans next product (repeat)
↓
User taps "Done" or Android back → closes scanner
↓
Returns to billing screen with accumulated cart
```

### C3.2 Scanner Overlay UI

```
┌────────────────────────────────────────────────┐
│                                                │
│  [← Close]           SCAN BARCODE              │
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │                                      │     │
│  │         [     |     |     ]          │     │
│  │         Viewfinder frame             │     │
│  │         (animated corner guides)     │     │
│  │                                      │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  Point camera at product barcode               │
│                                                │
│  ─────────────────────────────────────────    │
│  CART:  3 items  •  ₹335.00                   │
│                                                │
│  Recent scans:                                 │
│  ✓ Harpic 500ml  •  Added ×2                  │
│  ✓ Vim Bar 200g  •  Added ×1                  │
│                                                │
│  [ Manual Search ] [ Done — Checkout ]         │
└────────────────────────────────────────────────┘
```

**Key UX decisions in scanner overlay:**
- Cart summary always visible at the bottom of scanner overlay (owner never loses track of cart state)
- Recent scans list shows last 5 scanned products (instant feedback confirmation)
- "Manual Search" falls back to text search without closing scanner state
- "Done — Checkout" jumps directly to checkout from scanner
- Torch (flashlight) button for dim lighting conditions

### C3.3 Rapid Multi-Item Scanning

After a successful scan, the camera immediately resumes scanning. The user can rapidly scan multiple products without any extra taps. Each scan:
1. Identifies product
2. Adds to cart (or increments if already in cart)
3. Shows brief confirmation in "Recent scans" list
4. Resumes scanning (0 additional taps required between items)

For duplicate scans of the same product: each scan adds 1 unit (does not ask for confirmation). The quantity in the cart increments each time. If the resulting quantity would exceed stock: quantity is capped and a warning sounds.

### C3.4 Performance of Barcode Lookup

Barcode lookup during scanning must be < 50ms. The product catalog is pre-loaded in memory (V6 Section 38.3). Barcode lookup is an O(1) dictionary lookup on the `barcode` key.

---

## Section C4: Product Not Found Workflow

### C4.1 Barcode Not in Catalog

When a scanned barcode does not match any product in IndexedDB:

```
┌──────────────────────────────────────────────┐
│  ⚠ PRODUCT NOT FOUND                        │
│                                              │
│  Barcode: 8901234567890 (EAN-13)             │
│                                              │
│  This barcode is not in your catalog.        │
│                                              │
│  [Create New Product]   [Search by Name]    │
│  [Skip This Item]                            │
└──────────────────────────────────────────────┘
```

**Options:**
- **Create New Product:** Opens Quick Add Product (Feature Group 5) with the scanned barcode pre-filled. After product is created, it is added to the cart automatically.
- **Search by Name:** Dismisses the not-found overlay, focuses the search bar with cursor in billing screen.
- **Skip This Item:** Dismisses overlay, resumes scanning.

### C4.2 Quick Create During Scan Session

The Quick Add Product form during a scan session is a minimal bottom sheet (not a full-screen navigation), to keep the billing session context:

```
QUICK ADD PRODUCT
────────────────────────────────────────────
Barcode: 8901234567890 (pre-filled, locked)

Product Name:  [________________________]
Sell Price:    ₹ [_________]
Stock:         [_________]  units
Category:      [Select ▾]

[ Save & Add to Cart ]   [ Cancel ]
```

On save: product is created in IndexedDB, synced to Google Sheets via offline queue, and added to the cart. The camera scanner overlay resumes.

---

## Section C5: Mobile Camera Barcode Scanner

### C5.1 Camera Permissions

Before opening the scanner, the system checks camera permission status:

```javascript
const checkCameraPermission = async () => {
  const result = await navigator.permissions.query({ name: 'camera' });
  if (result.state === 'granted') return 'granted';
  if (result.state === 'prompt') {
    // Request permission — browser will show native permission dialog
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      return 'granted';
    } catch {
      return 'denied';
    }
  }
  return 'denied'; // 'denied'
};
```

**Permission denied handling:**
```
CAMERA ACCESS NEEDED

To scan barcodes, allow camera access.

1. Open your phone Settings
2. Find Chrome (or your browser)
3. Tap Permissions → Camera → Allow

[ Open Settings ]   [ Enter Code Manually ]
```

### C5.2 Camera Selection

On devices with multiple cameras (most modern phones):
- Default: Rear camera (higher quality, better for barcodes)
- If rear camera unavailable: front camera
- User can toggle camera in scanner overlay (rare need; mostly useful for testing)

### C5.3 Scanning UX — Focus and Targeting

- Viewfinder shows animated corner brackets (like a QR code reader)
- When barcode is detected: brackets flash green and vibration fires
- Scanning works at a range of 5–40cm (standard consumer barcode distance)
- No special positioning required — ZXing handles tilted, slightly blurry barcodes
- Autofocus is continuous; user does not need to tap to focus

### C5.4 Offline Behavior

Camera scanning is fully offline. The camera API is a device API. The barcode lookup is an in-memory lookup. The only network-dependent step is adding a new product (if "Create New Product" is triggered) — which uses the offline queue exactly like all other product creation operations.

---

## Section C6: External Scanner Support

### C6.1 Keyboard Input Mode

Most Bluetooth and USB OTG barcode scanners behave as keyboard input devices — they type the barcode number followed by an Enter key press. The billing screen's search bar captures this naturally.

**Supported external scanner types:**
- Bluetooth HID barcode scanners (e.g., Inateck BCST-60, Tera D5100)
- USB OTG scanners connected to Android via USB adapter
- Any scanner that outputs as keyboard keystrokes

**Implementation:**
```javascript
// In the billing screen component
useEffect(() => {
  let barcodeBuffer = '';
  let bufferTimer = null;

  const handleKeyDown = (e) => {
    // Ignore modifier keys
    if (e.key.length > 1 && e.key !== 'Enter') return;

    if (e.key === 'Enter') {
      if (barcodeBuffer.length >= 4) {
        // Likely a barcode scan (barcode scanners send all digits + Enter very fast)
        handleBarcodeScan(barcodeBuffer);
        barcodeBuffer = '';
        e.preventDefault(); // Don't submit any form
      }
      return;
    }

    barcodeBuffer += e.key;

    // Reset buffer after 100ms of no input
    // (human typing is slower; scanner input comes in < 100ms for all digits)
    clearTimeout(bufferTimer);
    bufferTimer = setTimeout(() => {
      barcodeBuffer = '';
    }, 100);
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

The 100ms timer distinguishes scanner input (all digits arrive within ~50ms) from human typing (typically 200–500ms between keystrokes).

### C6.2 External Scanner Settings

In Settings → Billing → Barcode Scanner:
```
BARCODE INPUT MODE
● Keyboard Input (for external USB/Bluetooth scanners)
○ Camera Only

Scan Sensitivity:
  Input timeout: [ 100 ] ms
  (Reduce if scanner is slow; increase if false positives occur)
```

### C6.3 Future Architecture — Phase 3 APK

When the PWA is converted to an Android APK (V6 Section 44, Phase 3), Capacitor plugins enable:
- `@capacitor-community/barcode-scanner`: Native camera scanner with better performance than ZXing web
- `@capacitor/haptics`: Better vibration feedback on scan
- Full `android.hardware.camera2` API access for faster autofocus

The web-based barcode implementation (Sections C4–C5) is designed to be replaceable with the Capacitor plugin without any business logic changes — the `handleBarcodeScan(barcodeValue)` function is the same in both implementations.

---

---

# FEATURE GROUP 4 — PROFIT MARGIN INTELLIGENCE

> **Merge Note:** Profit Margin Intelligence is fully specified in the companion document `Safai_Market_Profit_Margin_Intelligence_V1.md`. That document is implementation-ready and should be merged alongside this addendum as a peer module. Summary of integration points with this addendum:

- **Billing Screen (Feature Group 1):** Profit per item and estimated bill profit appear in the Cart Drawer (Section A2.3) and the Sticky Cart Footer when profit display setting is ON. See Profit V1 Section 3.
- **Discount System (Feature Group 1, A4.4):** Profit-Aware Discount Engine is triggered when bill or item discount is applied. See Profit V1 Section 4.
- **Bill Success Screen (Feature Group 2, B1):** Profit summary shown in bill detail for Owner role. See Profit V1 Section 3.5.
- **Product Grid in Billing (Feature Group 1, A3.2):** Margin badges shown on product cards for Owner role. See Profit V1 Section 2.
- **Quick Add Product (Feature Group 5):** Includes buy_price and sell_price → margin preview in the quick add form. See Profit V1 Section 1.3.

---

---

# FEATURE GROUP 5 — QUICK ADD PRODUCT

> **Merge Note:** Insert as new Section 16A in PRD V6, between Section 16 (Product Inventory Module) and Section 17 (Product Variant System). Also referenced from Section C4 (barcode not found flow) and Section A3.6 (no search results flow).

---

## Section E1: Quick Add Product Mode

### E1.1 Business Purpose

Full product creation in V6 requires filling in: name, category, brand, unit, MRP, sell price, buy price, low stock limit, variants, aliases, and optionally uploading an image. This is appropriate when the owner is setting up the catalog carefully. But there are two common scenarios where full creation is too slow:

1. **During a billing session:** A product is scanned but not in the catalog. The customer is waiting.
2. **Receiving a new delivery:** Supplier brings 3 new products. Owner wants to get them into stock immediately and fill in details later.

Quick Add Product solves both scenarios with a 4-field form that creates a fully functional product record immediately.

### E1.2 User Problem Solved

| Problem | Solution |
|---|---|
| Full product form takes 3–5 minutes | Quick Add takes < 30 seconds |
| Customer is waiting during billing | Quick Add is a non-disruptive bottom sheet |
| New products can't be sold until fully set up | Quick Add creates a sellable product immediately |
| Owner forgets to finish product setup | Dashboard alert: "X products need completion" |

### E1.3 Quick Add Product Form

**Presentation:** Bottom sheet (not full-screen navigation). This keeps the billing context intact.

```
QUICK ADD PRODUCT
──────────────────────────────────────────────────
Product Name:   [________________________________]
                (required)

Buy Price:      ₹ [____________]   Margin: --
Sell Price:     ₹ [____________]   [37.0% ●]

Opening Stock:  [____________]  units
                (how many units do you have right now?)

Category:       [Select ▾]    (optional; can set later)

Barcode:        [____________]    (pre-filled if from scan)
──────────────────────────────────────────────────
[ Save Product ]      [ Save & Add to Cart ]
[ Cancel ]
```

**Live margin preview:** As the owner types buy price and sell price, the margin % and color tier badge update in real-time (same logic as Profit V1 Section 1.3).

**"Save & Add to Cart":** Only shown when Quick Add is invoked from within a billing session. Saves the product AND adds 1 unit to the current cart.

**"Save Product":** Saves and returns to whatever screen invoked the Quick Add.

### E1.4 Required vs Optional Fields

| Field | Required for Quick Add | Required for Full Product |
|---|---|---|
| Product Name | ✓ Required | ✓ Required |
| Sell Price | ✓ Required | ✓ Required |
| Buy Price | Optional (recommended) | Optional |
| Opening Stock | Optional (default: 0) | Optional |
| Category | Optional | Optional |
| Barcode | Optional | Optional |
| Unit | Defaults to "Piece" | Configurable |
| Low Stock Limit | Defaults to 5 | Configurable |
| Brand | Not in Quick Add | Optional |
| Variants | Not in Quick Add | Optional |
| Image | Not in Quick Add | Optional |
| Aliases | Not in Quick Add | Optional |

### E1.5 Product Created via Quick Add — Completion Tracking

Products created via Quick Add are flagged in the system:
```
PRODUCTS schema: quick_add_pending: Boolean (true if created via Quick Add)
```

**Dashboard alert card (owner view):**
```
📋 PRODUCTS NEED COMPLETION

4 products were added quickly and need more details.
Set categories, images, and other info.

[Complete Now →]
```

**"Complete Now" flow:** Opens a wizard showing each incomplete product one at a time, allowing the owner to fill in the remaining fields in a focused, step-by-step interface.

**Auto-resolution:** When an owner opens a Quick Add product's full edit form and saves it with all required fields filled, `quick_add_pending` is set to `false` and the product is removed from the completion list.

### E1.6 Quick Add Product — Database Impact

Quick Add creates a standard product record in IndexedDB (same schema as V6 Section 16). No schema changes needed beyond the `quick_add_pending` flag and the `buy_price` field from Profit Intelligence V1.

Apps Script `create_product` action handles Quick Add products identically to full products. The `quick_add_pending: true` flag is stored and synced.

### E1.7 Offline Behavior

Quick Add is fully offline. The product is created in IndexedDB immediately. The sync queue receives a `create_product` action. When online, the product syncs to Google Sheets like any other product.

If a product is created offline via Quick Add and added to a bill (also offline), both the product creation and the bill creation are queued. On sync, Apps Script processes `create_product` first (guaranteed by queue ordering), then `create_bill` which references the new product_id.

**Queue ordering guarantee:** The offline queue processes actions in the order they were created (FIFO per session). A product created before a bill in the same session will always sync before the bill.

### E1.8 Permissions

| Role | Can Quick Add |
|---|---|
| Owner | ✓ Yes |
| Family Member | ✓ Yes (creates product; notifies owner) |
| Helper | ✗ No — helpers cannot create products |

If a helper scans an unknown barcode during billing and the "Product Not Found" workflow triggers (Section C4), the "Create New Product" option is not shown to helpers. Instead, they see:
```
PRODUCT NOT FOUND
This barcode is not in your catalog.
Ask the owner to add this product.
[Search by Name]   [Skip]
```

### E1.9 Audit Log

```
AUDIT_LOG entry: PRODUCT_QUICK_ADDED
Fields: product_id, product_name, sell_price, buy_price, opening_stock,
        barcode (if any), created_by, session_context (billing | standalone),
        device_id, created_at
```

---

---

# FEATURE GROUP 6 — FREQUENTLY SOLD TOGETHER

> **Merge Note:** Insert as new Section 20B in PRD V6, after the Barcode System section. Add a new `PRODUCT_ASSOCIATIONS` tab to the Google Sheets architecture summary.

---

## Section F1: Frequently Sold Together System

### F1.1 Business Purpose

Certain products at Anupurna Traders are consistently purchased together. This is not a coincidence — it reflects real customer behavior and genuine product complementarity. Surfacing these associations during billing achieves two goals:
1. Reduces missed add-ons (helper bills only what the customer asked for; the suggestion prompts the helper to ask about the related product)
2. Increases average bill value without requiring the owner to train their staff

### F1.2 User Problem Solved

| Scenario | Without Feature | With Feature |
|---|---|---|
| Customer buys Harpic | Helper bills only Harpic | "Customers also buy: Toilet Brush" appears — helper asks customer |
| Customer buys Phenyl | Floor cleaner → mop suggestion missed | Mop suggestion appears |
| New helper doesn't know product pairings | No suggestions | System shows learned pairings |

### F1.3 Frequently Sold Together — Data Model

#### Product Associations Table (IndexedDB)

```javascript
// IndexedDB table: product_associations
{
  association_id:    UUID,
  product_a_id:      UUID,
  product_b_id:      UUID,
  co_occurrence_count: Number,  // how many bills contain both products
  last_occurred_at:  DateTime,
  strength:          Number,    // computed: co_occurrence_count / total_bills_with_a
  created_at:        DateTime,
  updated_at:        DateTime,
}
```

#### Google Sheets: PRODUCT_ASSOCIATIONS Tab

```
PRODUCT_ASSOCIATIONS tab columns:
association_id        | UUID
product_a_id          | UUID
product_b_id          | UUID
co_occurrence_count   | Number
last_occurred_at      | DateTime
strength              | Number (0–1; recomputed by Apps Script)
```

### F1.4 Association Learning Algorithm

After every bill is saved, Apps Script (and the client) computes pairwise associations for the products in that bill.

```javascript
// Run after bill save — in Apps Script and mirrored client-side
function updateProductAssociations(billItems) {
  const productIds = billItems.map(i => i.product_id);
  
  // For every pair of products in this bill
  for (let i = 0; i < productIds.length; i++) {
    for (let j = i + 1; j < productIds.length; j++) {
      const a = productIds[i];
      const b = productIds[j];
      
      // Increment co-occurrence count for both directions (a→b and b→a)
      upsertAssociation(a, b);
      upsertAssociation(b, a);
    }
  }
  
  // After updating counts, recompute strength for affected products
  // strength(a→b) = co_occurrence(a,b) / total_bills_containing_a
  recomputeStrengths(productIds);
}
```

**Association strength** ranges from 0 to 1. It represents: "When product A is in a bill, how often is product B also in that bill?" A strength of 0.6 means product B appears in 60% of bills that contain product A.

**Minimum threshold for showing a suggestion:** `strength >= 0.15` AND `co_occurrence_count >= 3`.

This prevents associations from appearing based on just 1–2 coincidental co-purchases.

### F1.5 Billing Screen Integration — Suggestions UI

Suggestions appear in the billing screen after a product is added to the cart. They appear as a horizontal suggestion strip between the product grid and the favorites row.

**Trigger:** When the cart has at least 1 item AND at least one suggestion with strength ≥ 0.15 exists for any cart item.

```
FREQUENTLY BOUGHT TOGETHER
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Toilet      │ │  Gloves      │ │  Drain       │
│  Brush       │ │  (Yellow)    │ │  Opener      │
│  ₹45         │ │  ₹28         │ │  ₹65         │
│  [+ Add]     │ │  [+ Add]     │ │  [+ Add]     │
└──────────────┘ └──────────────┘ └──────────────┘
                         Because you added: Harpic
```

**Display rules:**
- Show maximum 3 suggestions
- Sort by strength descending (strongest association first)
- Never suggest a product already in the cart
- Never suggest archived or out-of-stock products
- The "Because you added: [Product]" attribution makes the suggestion feel relevant and trustworthy
- Strip can be dismissed with a swipe or [×] button; dismissed state persists for this billing session only

**Tap "Add":** Adds 1 unit to cart and the card transitions to a stepper (same as product grid, Section A3.2).

### F1.6 Manual Association Management

The owner can manually define or override associations in Settings → Products → Frequently Sold Together:

```
MANAGE ASSOCIATIONS

Auto-learned associations:
───────────────────────────────────────────────────
Harpic 500ml     → Toilet Brush       87% co-purchase
Vim Bar          → Scrubber Pad       74% co-purchase
Phenyl Floor     → Mop (Regular)      68% co-purchase

Add Manual Association:
  Product A: [____________]
  Product B: [____________]
  [Add Pair]

Pinned Associations (always shown regardless of strength):
  Harpic 500ml + Toilet Brush  [Remove pin]
```

**Pinning:** A pinned association always appears in the suggestion strip regardless of co_occurrence_count or strength. This lets the owner promote a pairing they know is good even before the system has learned it.

### F1.7 Reports Impact

A new report is added to the Reports module: **Product Pairing Report** (Owner only).

```
PRODUCT PAIRING REPORT — January 2024

Top Product Pairs by Co-Purchase:
────────────────────────────────────────────────────────
Pair                              Bills   Strength  Rev Impact
Harpic 500ml + Toilet Brush        87     62%       ₹3,915
Vim Bar + Scrubber Pad             74     54%       ₹2,220
Phenyl + Mop                       62     47%       ₹5,580
────────────────────────────────────────────────────────

Suggestion Conversion Rate: 34%
(How often a "Frequently Bought Together" suggestion was added to cart)
```

The conversion rate tracks how often a user taps "Add" on a suggestion, giving the owner a sense of how effective the feature is.

### F1.8 Offline Behavior

Suggestions are computed from IndexedDB data — fully offline. The suggestion strip works without internet. Association updates (after bill save) are also applied to IndexedDB immediately and synced to Google Sheets via the offline queue.

### F1.9 Edge Cases

| Edge Case | Handling |
|---|---|
| Both products in a pair are already in cart | Suggestion not shown |
| Suggested product is out of stock | Show with "Out of Stock" label; still tappable (owner override) |
| Suggested product price has changed | Show current price |
| Cart cleared | Suggestion strip clears |
| Bill with single item | Suggestions shown if associations exist for that single item |

---

---

# FEATURE GROUP 7 — LOW STOCK HOME WIDGET

> **Merge Note:** This extends PRD V6 Section 15 (Home Dashboard) and Section 31 (What Is Finishing). Add the widget as a new dashboard card in the home screen, and add a new "badge" entry point from the home screen to the What Is Finishing module.

---

## Section G1: Low Stock Home Widget

### G1.1 Business Purpose

The owner and family member check the home screen first thing each morning. Low stock and out-of-stock alerts should be immediately visible without navigating to the What Is Finishing module. One tap from the home screen widget should reveal what needs to be ordered today.

### G1.2 Widget Layout

The widget appears as a dedicated card on the home dashboard, positioned after the sales summary card.

```
┌───────────────────────────────────────────────────────┐
│  STOCK ALERTS                              [See All →] │
│                                                       │
│  ┌────────────────────────┐  ┌───────────────────────┐│
│  │  🔴 OUT OF STOCK       │  │  🟡 LOW STOCK         ││
│  │  3 products            │  │  7 products           ││
│  │  Order immediately     │  │  Order soon           ││
│  └────────────────────────┘  └───────────────────────┘│
│                                                       │
│  Critical: Harpic 500ml, Vim Bar, Lizol Floor         │
│  ─────────────────────────────────────────────────    │
│  [📦 Order Now]                                        │
└───────────────────────────────────────────────────────┘
```

**Widget states:**

**All good (no alerts):**
```
┌───────────────────────────────────────────┐
│  STOCK HEALTH                             │
│  ✓ All products well stocked              │
│  Last checked: Just now                   │
└───────────────────────────────────────────┘
```

**Low stock only:**
```
┌───────────────────────────────────────────┐
│  STOCK ALERTS                [See All →] │
│  🟡 7 products running low               │
│  Harpic 1L, Detergent 500g, Mop...       │
│  [View Low Stock]                         │
└───────────────────────────────────────────┘
```

**Out of stock:**
```
┌───────────────────────────────────────────┐
│  ⚠ STOCK ALERTS              [See All →] │
│  🔴 3 OUT OF STOCK                       │
│  Vim Bar 200g, Lizol 500ml, Scrubber      │
│  🟡 7 running low                        │
│  [Order Now]                              │
└───────────────────────────────────────────┘
```

### G1.3 Product Names in Widget

The widget shows up to 3 product names inline (critical/out-of-stock products first). If more than 3 products match, the text reads: "Harpic 500ml, Vim Bar, and 4 more."

The product names are truncated to fit the card width. The full list is visible by tapping "See All →" or "Order Now."

### G1.4 Navigation from Widget

| Tap Target | Navigates To |
|---|---|
| "See All →" | What Is Finishing module (Section 31) |
| "Order Now" | What Is Finishing module → Out of Stock tab |
| "View Low Stock" | What Is Finishing module → Low Stock tab |
| "3 OUT OF STOCK" number | What Is Finishing module → Out of Stock tab |
| "7 running low" number | What Is Finishing module → Low Stock tab |
| Red card (Out of Stock) | What Is Finishing module → Out of Stock tab |
| Yellow card (Low Stock) | What Is Finishing module → Low Stock tab |

### G1.5 Widget Data Source

Data for the widget is computed from the in-memory product catalog (loaded from IndexedDB on app start). No separate network call. No additional data model.

```javascript
const computeStockAlerts = (products) => ({
  outOfStock: products.filter(p => p.current_stock === 0 && p.status === 'active'),
  lowStock:   products.filter(p =>
    p.current_stock > 0 &&
    p.current_stock <= p.low_stock_limit &&
    p.status === 'active'
  )
});
```

This computation runs in < 5ms for 500 products.

### G1.6 Widget Refresh

The widget data refreshes:
- On app open
- After every bill is saved (stock changes)
- After every purchase is recorded (stock changes)
- After every sync completion
- Every 5 minutes while app is active (background refresh)

### G1.7 Permissions

| Role | Sees Widget |
|---|---|
| Owner | ✓ Full widget with product names |
| Family Member | ✓ Full widget with product names |
| Helper | ✓ Widget counts only (no product names exposed) |

Helper version of widget:
```
┌───────────────────────────────────────────┐
│  STOCK STATUS                             │
│  🔴 3 items out of stock                 │
│  🟡 7 items running low                  │
│  Ask the owner to reorder.               │
└───────────────────────────────────────────┘
```

### G1.8 Home Screen Navigation Badge

The "What Is Finishing" module in the bottom navigation (or More menu) shows a badge count when there are out-of-stock products:

```
More  ⑬
```

The badge count shows the total of `outOfStock.length + lowStock.length`. Badge is red if any items are out of stock; amber if only low stock items exist.

---

---

# FEATURE GROUP 8 — PRODUCT BUNDLE SYSTEM

> **Merge Note:** Insert as new Section 17A in PRD V6, after Section 17 (Product Variant System). Add `BUNDLES` and `BUNDLE_ITEMS` tables to the Google Sheets architecture. Add `is_bundle` field to the PRODUCTS schema.

---

## Section H1: Product Bundle Architecture

### H1.1 Business Purpose

Anupurna Traders frequently creates value packs and cleaning kits — especially around festivals and seasonal promotions. A bundle is a named set of products sold together at a single combined price. Examples:

```
Bathroom Cleaning Kit — ₹180
  Harpic 500ml
  Toilet Brush
  Yellow Gloves

Kitchen Cleaning Set — ₹95
  Vim Bar 200g × 2
  Scrubber Pad × 2

Diwali Cleaning Special — ₹450
  Floor Cleaner 1L
  Mop (Regular)
  Broom (Soft)
  Bucket 10L
```

### H1.2 Bundle vs Variant Distinction

| Dimension | Variant | Bundle |
|---|---|---|
| Structure | One product, multiple sizes | Multiple products, sold as one unit |
| Stock | Each variant has its own stock | Bundle stock = min(component stock / component qty) |
| Billing | Select a variant | Select the bundle; components auto-deducted |
| Price | Each variant has own price | Bundle has one combined price (may be discounted vs sum) |
| MRP | Per variant | Bundle MRP = sum of component MRPs or set explicitly |

### H1.3 Bundle Schema

#### PRODUCTS Table Extension

```
is_bundle:            Boolean (true if this product is a bundle)
bundle_sell_price:    Number (the price of the bundle as a whole)
bundle_buy_price:     Number (sum of component buy prices; auto-computed)
```

A bundle is a product record like any other. It appears in search, in the billing grid, in reports. The `is_bundle: true` flag triggers special behavior during billing (deduct component stock instead of a single product stock).

#### New: BUNDLES Table (IndexedDB)

```javascript
{
  bundle_id:        UUID,    // == product_id of the bundle product record
  name:             String,
  description:      String,
  is_active:        Boolean,
  created_at:       DateTime,
  updated_at:       DateTime,
}
```

#### New: BUNDLE_ITEMS Table (IndexedDB)

```javascript
{
  bundle_item_id:   UUID,
  bundle_id:        UUID,    // FK → BUNDLES
  product_id:       UUID,    // FK → PRODUCTS (component)
  quantity:         Number,  // How many units of this component per bundle
  product_name_snapshot: String,
}
```

#### Google Sheets: New Tabs

**BUNDLES tab:**
| Column | Type |
|---|---|
| bundle_id | UUID |
| name | String |
| sell_price | Number |
| buy_price_computed | Number |
| is_active | Boolean |
| description | String |
| created_at | DateTime |

**BUNDLE_ITEMS tab:**
| Column | Type |
|---|---|
| bundle_item_id | UUID |
| bundle_id | UUID |
| product_id | UUID |
| product_name_snapshot | String |
| quantity | Number |

### H1.4 Bundle Stock Calculation

A bundle is sellable only when all components are available in sufficient quantity.

```javascript
const getBundleAvailableStock = (bundle, productCatalog) => {
  const bundleItems = getBundleItems(bundle.bundle_id);
  return Math.floor(
    Math.min(
      ...bundleItems.map(item => {
        const product = productCatalog[item.product_id];
        return product ? product.current_stock / item.quantity : 0;
      })
    )
  );
};
```

**Display in billing grid:**
```
┌──────────────────────────┐
│  [Bundle Icon]           │
│  Bathroom Cleaning Kit   │
│  ₹180                    │
│  Available: 8 kits       │
│  (based on components)   │
│  [ Add + ]               │
└──────────────────────────┘
```

### H1.5 Bundle Billing Workflow

When a bundle is added to the cart:

```
User adds "Bathroom Cleaning Kit" to cart
↓
Cart shows the bundle as a single line item:
  Bathroom Cleaning Kit  × 1  ₹180.00
↓
At bill save (not at add-to-cart):
  System creates stock movements for all components:
    STOCK_MOVEMENT: Harpic 500ml      -1  (type: sale_bundle_component)
    STOCK_MOVEMENT: Toilet Brush      -1  (type: sale_bundle_component)
    STOCK_MOVEMENT: Yellow Gloves     -1  (type: sale_bundle_component)
↓
BILL_ITEMS records the bundle as a single item
  (with a bundle_id reference and component breakdown in bill_item_detail JSON)
```

**Key design decision:** The bill shows the bundle as one line item (customer-facing receipt is clean). The stock system deducts all components. The analytics can drill down into the component breakdown via `bill_item_detail`.

### H1.6 Bundle Profit Calculation

```
bundle_buy_price = Σ (component.buy_price × component.quantity)
bundle_sell_price = set by owner
bundle_profit = bundle_sell_price − bundle_buy_price
bundle_margin_pct = bundle_profit / bundle_sell_price × 100
```

Apps Script auto-computes `bundle_buy_price` whenever any component's buy price changes. The owner sets `bundle_sell_price` independently.

### H1.7 Bundle Creation UX

**Bundle creation is accessed from:** Products → FAB (+) → "Create Bundle"

```
CREATE BUNDLE
──────────────────────────────────────────────────
Bundle Name:    [Bathroom Cleaning Kit          ]
Description:    [Optional description           ]

Components:
──────────────────────────────────────────────────
[+ Add Product]

  Harpic 500ml × 1        Cost: ₹58
  Toilet Brush × 1        Cost: ₹28
  Yellow Gloves × 1       Cost: ₹35
                          ─────────
  Total Component Cost:   ₹121

Sell Price:     ₹ [180]

  Computed Bundle Profit: ₹59  (32.8%) ●GREEN

Available Stock: 12 kits (based on current component stock)
──────────────────────────────────────────────────
[Save Bundle]     [Cancel]
```

**Add Product flow:** Tapping "Add Product" opens the product search. Search results show the product with its buy price (owner view). Selecting a product shows a quantity spinner.

### H1.8 Bundle Updates

When a bundle component is updated (price change, product archived):
- **Component buy price changes:** `bundle_buy_price` is auto-recomputed; owner is notified if bundle margin drops below threshold
- **Component archived:** Bundle is automatically deactivated; owner alerted: "Bathroom Cleaning Kit contains Harpic 500ml which was archived. Bundle deactivated."
- **Component stock goes to 0:** Bundle shows "Out of Stock" in billing grid but is not deactivated (stock may return)

### H1.9 Reports Impact

Bundles appear in reports as follows:
- **Sales Report:** Bundle appears as a single product line with bundle name and sell price
- **Product Sales Report:** Individual components show sales from both direct sales AND bundle sales (stock movements cover both)
- **Bundle-Specific Report (new):** Shows bundle performance: kits sold, revenue, profit, component consumption

```
BUNDLE PERFORMANCE REPORT — January 2024

Bathroom Cleaning Kit    18 kits  ₹3,240  ₹1,062  32.8%
Kitchen Cleaning Set      7 kits   ₹665    ₹168   25.3%
Diwali Cleaning Special   3 kits  ₹1,350  ₹513   38.0%
──────────────────────────────────────────────────
Total Bundle Revenue:    ₹5,255
```

### H1.10 Edge Cases

| Scenario | Handling |
|---|---|
| One component goes negative stock during bundle sale | Apps Script allows if `allow_negative_stock` override; records stock deficit |
| Bundle sold while offline, component stock changes on sync | Sync conflict resolution applies; stock deficit logged if conflict found |
| Bundle with single component | Technically valid; treated as a simple product with a different name |
| Bundle in a bundle | Not supported in V1; Phase 2 |
| Discount on a bundle | Bundle price is the base; item discount and bill discount apply as normal |
| Return of a bundle | Return creates reverse stock movements for all components |
| Duplicate bill with bundle | Bundle item is duplicated; component stock checked at billing time |

### H1.11 Permissions

| Action | Owner | Family | Helper |
|---|---|---|---|
| Create bundle | ✓ | ✗ | ✗ |
| Edit bundle | ✓ | ✗ | ✗ |
| Deactivate bundle | ✓ | ✗ | ✗ |
| Bill a bundle | ✓ | ✓ | ✓ |
| View bundle details | ✓ | ✓ | ✓ (name and price only) |

---

---

# FEATURE GROUP 9 — VOICE BILLING (FUTURE ARCHITECTURE)

> **Merge Note:** Insert as new Section 44A in PRD V6 Future Roadmap, as a Phase 3 capability.

---

## Section I1: Voice Billing — Future Architecture

### I1.1 Business Purpose

Voice billing is the ultimate accessibility feature for a local Indian shop. The owner or family member, hands occupied with handling goods, should be able to dictate a bill: "Add 2 Harpic, 3 Vim, 1 mop" — and the cart fills automatically.

This is a Phase 3 feature. It is specified now to ensure the current architecture does not foreclose the option.

### I1.2 Architecture Design

```
VOICE BILLING ARCHITECTURE

User speaks: "Add 2 Harpic aur 5 Vim"
↓
Web Speech API (or Capacitor plugin in APK) captures audio
↓
Speech-to-text → raw text: "add 2 harpic aur 5 vim"
↓
NLP parsing layer:
  tokens: [add, 2, harpic, aur, 5, vim]
  parsed: [
    { action: "add", quantity: 2, query: "harpic" },
    { action: "add", quantity: 5, query: "vim" }
  ]
↓
Product resolution (same search engine as text search):
  "harpic" → [Harpic 500ml, Harpic 200ml, Harpic 1L]
  → If ambiguous: show disambiguation prompt
  → If single match: resolve directly
  "vim" → [Vim Bar 200g, Vim Liquid 500ml]
  → If ambiguous: disambiguation prompt
↓
Cart mutations (same as manual cart add)
↓
Read-back: Text-to-speech: "Added 2 Harpic 500ml and 5 Vim Bar 200g"
```

### I1.3 Language Support Priority

1. **Hindi + English mixed (Hinglish):** Primary target. "Add 2 Harpic aur ek mop" must work.
2. **Hindi only:** Full Hindi product names and commands.
3. **English only:** Standard English commands.

The product `hinglish_aliases` field (V6 Section 18.3) is the key data structure for voice resolution. Voice search uses the same alias index as text search.

### I1.4 Disambiguation Workflow

When a voice query resolves to multiple products:

```
Voice: "Add 2 Harpic"
System (text-to-speech): "Which Harpic? 500ml, 200ml, or 1 litre?"
User: "500ml"
System: "Added 2 Harpic 500ml"
```

The disambiguation is spoken, not shown on screen (the user may not be looking at the phone).

### I1.5 Offline Considerations

Web Speech API requires internet for cloud-based speech recognition (the standard implementation). For offline voice support, a local on-device model (e.g., Vosk — open source, runs on Android offline, supports Hindi) would be required. This is Phase 3+ scope.

Voice billing offline mode: falls back gracefully to text billing with an informational toast: "Voice billing needs internet. Use text search."

### I1.6 Permissions

Voice billing is available to Owner and Family Member roles only. Helpers do not have voice billing access (prevents misuse and confusion during counter operations).

### I1.7 Current Architecture Impact

No changes required to the current system to support future voice billing. The voice layer is purely a new input method that calls the same `cartStore.addItem()` function that all other input methods use. The current architecture is voice-ready by design.

---

---

# FEATURE GROUP 10 — PRINTER & RECEIPT IMPROVEMENTS

> **Merge Note:** This section reinforces and extends the Printer Integration V1 document. It clarifies the integration between the billing flow (Feature Group 1) and the print system. No new architecture is introduced; this section is an enforcement and integration checklist.

---

## Section J1: Billing → Print Integration Enforcement

### J1.1 The Immutable Print Order

This principle is stated in Printer Integration V1, Section 1.1 and must be enforced at the code level. For absolute clarity, it is restated here in the context of the redesigned billing system:

```
REQUIRED ORDER — NEVER DEVIATE FROM THIS:

1. User confirms bill (taps CONFIRM BILL button)
   ↓
2. Client validates bill (stock, payment totals, customer limits)
   ↓
3. Bill written to IndexedDB atomically
   ↓
4. Stock movements written to IndexedDB
   ↓
5. Udhaar ledger updated (if applicable)
   ↓
6. Bill queued to SYNC_QUEUE (offline queue)
   ↓
7. Success screen shown ← THIS IS THE POINT OF NO RETURN
   ↓
8. Print job queued to PRINT_QUEUE (if auto-print is ON)
   ↓
9. Print executes asynchronously (non-blocking)

FAILURE AT STEP 9 DOES NOT AFFECT STEPS 1–7.
THE BILL IS SAVED. THE OWNER CAN REPRINT FROM HISTORY.
```

### J1.2 Print Triggers from New Features

The following new features in this addendum add print trigger points. All follow the same order above.

**From Bill Success Screen (Section B1):**
- "Print Bill" button → queues a print job for the just-saved bill → triggers print
- "Reprint Bill" button → same flow, flagged as reprint in PRINT_LOGS

**From Bill History (Section B4):**
- "Print" button on bill list item → queues print job for historical bill
- "Reprint" in overflow menu → same; flagged as reprint

**From Duplicate Bill (Section B5):**
- Print trigger is for the NEW bill, not the source bill
- Source bill is not re-printed during duplication

### J1.3 Print Queue Changes for New Bill Fields

The `PRINT_QUEUE` record (defined in Printer Integration V1) must include the new bill fields introduced in this addendum:

```
PRINT_QUEUE additions:
is_bundle_bill:         Boolean (true if bill contains any bundles)
bundle_items_detail:    JSON (component breakdown for bundle items, for receipt)
barcode_on_receipt:     Boolean (setting: print bill barcode/QR on receipt)
duplicate_of_bill_id:   UUID | null (if printed from duplicate flow)
```

**Bundle items on receipt:**

When `is_bundle_bill: true`, the receipt can optionally expand the bundle components:

```
Setting: "Show bundle components on receipt"  [ON/OFF]

Receipt (ON):
  Bathroom Cleaning Kit × 1    ₹180.00
    → Harpic 500ml × 1
    → Toilet Brush × 1
    → Yellow Gloves × 1

Receipt (OFF):
  Bathroom Cleaning Kit × 1    ₹180.00
```

Default: OFF (customer receipt shows bundle as single item; cleaner presentation).

### J1.4 Bill PDF and Print — Shared Template

The PDF download (Section B2) and the print receipt (Printer Integration V1, Section 8) share the same HTML template engine but with different CSS contexts:

| Context | CSS | Page size |
|---|---|---|
| Browser Print / PDF (A5) | Standard fonts, wider layout | A5 |
| Browser Print / PDF (Receipt) | Monospace fonts, 58mm width | 58mm × auto |
| Wi-Fi Thermal Printer | ESC/POS bytes (no CSS) | 58mm or 80mm |
| Bluetooth Thermal Printer | ESC/POS bytes (no CSS) | 58mm or 80mm |

A single `generateReceiptData(bill)` function returns a structured data object. The rendering layer consumes this data and outputs either HTML (for browser print/PDF) or ESC/POS bytes (for thermal printers). Business logic (what data to show) is separate from rendering (how to show it).

### J1.5 Profit Data on Receipt

Per Profit Intelligence V1 Section 11.4 (Permissions), profit data is NEVER printed on customer receipts. The receipt template must never include buy_price, margin_pct, or profit fields.

An owner who wants a profit summary for their own records can view it in the Bill Detail screen (owner-only section) or in the Profit Dashboard. It does not appear on any printed or shared bill.

---

---

# INTEGRATION MAP — CROSS-FEATURE DEPENDENCIES

The table below shows how the features in this addendum interact with each other and with the existing PRD V6 system.

| Feature | Depends On | Used By |
|---|---|---|
| Multi-Product Cart (A2) | V6 Billing, V6 IndexedDB | Bill Success (B1), Barcode Billing (C3), Bundle Billing (H1), Voice Billing (I1) |
| Product Grid in Billing (A3) | V6 Products, V6 Categories | Barcode Not Found (C4), Quick Add (E1), Frequently Sold Together (F1) |
| Bill Success Screen (B1) | V6 Bill Save Flow | PDF Download (B2), Share (B3), Print (J1) |
| PDF Download (B2) | Bill Success (B1), V6 Bill Schema | Share (B3) |
| Share System (B3) | PDF Download (B2), V6 WhatsApp format | Bill History (B4) |
| Duplicate Bill (B5) | V6 Bill Schema, Cart (A2) | — |
| Barcode on Product (C2) | V6 Product Schema | Barcode Billing (C3), Quick Add (E1) |
| Barcode Billing (C3) | Barcode on Product (C2), Cart (A2) | Product Not Found (C4) |
| Quick Add Product (E1) | V6 Product Schema, Profit V1 buy_price | Barcode Not Found (C4), Search No Results (A3.6) |
| Frequently Sold Together (F1) | V6 BILL_ITEMS, Cart (A2), Product Grid (A3) | — |
| Low Stock Widget (G1) | V6 Product Schema, V6 What Is Finishing | — |
| Product Bundle (H1) | V6 Product Schema, V6 Stock Movements, Cart (A2) | Profit V1 (bundle buy price), Print (J1) |
| Voice Billing (I1) | Cart (A2), V6 Product Search | — |
| Print Integration (J1) | Printer V1, Bill Success (B1), Bill History (B4) | — |

---

# IMPLEMENTATION PHASING

## Phase 1 — Core Billing Upgrade (Weeks 1–4)

Priority: These features form the core billing experience and must be delivered together.

| Feature | Section | Why Phase 1 |
|---|---|---|
| Redesigned Billing Screen Layout | A1 | Foundation for all other billing features |
| Multi-Product Cart (Unlimited Items) | A2 | Core billing requirement |
| Product Grid in Billing Screen | A3 | Enables visual billing |
| One-Hand UX / Fast Checkout | A4 | Core UX constraint |
| Bill Success Screen | B1 | Natural billing flow conclusion |
| Bill Download PDF | B2 | Immediate business value |
| Bill Sharing (WhatsApp, Android Share) | B3 | Critical for Indian store context |
| Bill History Actions (View, Share, PDF) | B4 | Completes the bill lifecycle |
| Low Stock Home Widget | G1 | High visibility, low effort, high owner value |

## Phase 2 — Product Intelligence (Weeks 5–8)

| Feature | Section | Why Phase 2 |
|---|---|---|
| Duplicate Bill Workflow | B5 | Requires stable bill history (Phase 1 complete) |
| Quick Add Product | E1 | Requires stable product schema (Phase 1 stable) |
| Profit Margin Intelligence | D1 | Requires buy_price in product schema |
| Frequently Sold Together | F1 | Requires bill history data (2+ weeks of bills) |
| Barcode System — Product Creation | C2 | Foundational for barcode billing |
| Barcode System — Billing Workflow | C3 | Requires C2 complete |
| Barcode System — Mobile Camera Scanner | C5 | Requires C3 complete |

## Phase 3 — Advanced Features (Weeks 9–12)

| Feature | Section | Why Phase 3 |
|---|---|---|
| Product Bundle System | H1 | Complex; requires stable product and billing system |
| External Barcode Scanner Support | C6 | Hardware dependency; lower priority |
| Voice Billing | I1 | Phase 3 by definition; architecture only in this document |

---

# SCHEMA SUMMARY — ALL NEW DATABASE FIELDS

## IndexedDB — New Tables

| Table | Purpose |
|---|---|
| `draft_bill` | Active cart persistence across app restarts |
| `product_associations` | Frequently sold together data |
| `bundles` | Bundle product records |
| `bundle_items` | Bundle component records |
| `pdf_cache` | Cached PDF generation HTML per bill_id |

## IndexedDB — Existing Table Extensions

| Table | New Fields |
|---|---|
| `products` | `barcode`, `barcode_type`, `is_bundle`, `bundle_sell_price`, `bundle_buy_price`, `quick_add_pending` + all Profit V1 fields |
| `bill_items` | `bundle_id` (if item is a bundle), `bill_item_detail` (JSON for bundle components) + all Profit V1 fields |

## Google Sheets — New Tabs

| Tab | Purpose |
|---|---|
| `PRODUCT_ASSOCIATIONS` | Frequently sold together data (synced from IndexedDB) |
| `BUNDLES` | Bundle definitions |
| `BUNDLE_ITEMS` | Bundle component definitions |
| `DAILY_PROFIT_SUMMARY` | From Profit V1 |
| `PRODUCT_PROFIT_SNAPSHOT` | From Profit V1 |

## Apps Script — New Actions

| Action | Feature |
|---|---|
| `create_bundle` | Bundle creation |
| `update_bundle` | Bundle editing |
| `get_bundles` | Sync bundles to client |
| `update_product_associations` | Sync association data |
| `get_product_associations` | Pull associations on sync |
| All Profit V1 actions | From Profit Intelligence V1 |

---

*This document is Addendum V1 to the Safai Market — Anupurna Traders Master PRD V6. It must be read in conjunction with PRD V6 and the Printer Integration V1 document. All V6 principles, architecture decisions, and conventions apply to all features defined herein. No existing V6 functionality is modified or removed by this addendum — only extended.*

*Document produced by: Senior CTO + Product Architecture Review*
*Status: Implementation-Ready — Ready for merge into Master PRD*

---

**End of Addendum V1**
