# Safai Market — Anupurna Traders
## Master Product Requirements Document (PRD)
### Version V6 — Production-Grade CTO / Product / Architecture / Operations Edition

---

> **Document Classification:** Implementation-Ready Internal PRD  
> **Audience:** Engineering Lead, Frontend Developer, Product Manager, Store Owner Stakeholder  
> **Status:** Active — Supersedes V5  
> **Last Reviewed By:** Senior CTO + Product Architecture Audit  

---

## Table of Contents

1. Executive Summary  
2. Product Vision & Strategic Framing  
3. Core Product Principles  
4. Business Context & Real-World Store Operations  
5. Target Users & Role System  
6. Platform, Technology Stack & Architecture Rationale  
7. Google Sheets Architecture — Deep Design  
8. Offline-First Architecture — Deep Design  
9. Sync Engine & Conflict Resolution System  
10. Data Consistency & Integrity Rules  
11. Audit & Activity Log System  
12. Security Model  
13. Navigation System & Information Architecture  
14. First-Time Setup Workflow  
15. Home Dashboard  
16. Product Inventory Module  
17. Product Variant System  
18. Product Search & Discovery  
19. Stock Movement System  
20. Billing / POS Module  
21. Customer & Udhaar Module  
22. Supplier Management  
23. Purchase Entry & Restock Module  
24. Returns & Exchange System  
25. Damage & Wastage Register  
26. Price History & Bulk Price Update  
27. Expense Module  
28. Daily Closing System  
29. Reports Module  
30. Inventory Count Mode  
31. What Is Finishing (Low Stock Center)  
32. Operational Alerts & Smart Daily Tasks  
33. WhatsApp Integration  
34. Backup & Restore System  
35. Sync Center  
36. Mobile UX System & Design Language  
37. Error Handling & Recovery Patterns  
38. Performance Engineering  
39. Scalability Strategy  
40. Deployment & Infrastructure Plan  
41. Maintenance & Operational Continuity  
42. Testing Strategy  
43. MVP Scope — Hard Boundaries  
44. Future Roadmap  
45. Success Criteria & Definition of Done  
46. Final Architecture Recommendations  

---

## 1. Executive Summary

| Field | Detail |
|---|---|
| **Product Name** | Safai Market — Anupurna Traders |
| **Product Type** | Mobile-First Store Management Progressive Web App (PWA) |
| **Industry** | Cleaning Products, Household Products, Utensils, Daily Consumer Goods |
| **Primary Goal** | Replace manual notebooks, memory-based inventory, and scattered WhatsApp notes with a reliable, fast, and trustworthy mobile store management system |
| **Primary Platform** | Android mobile phones (primary); iOS supported; desktop browser supported but not primary |
| **Backend** | Google Sheets + Google Apps Script (no server infrastructure required) |
| **Version** | V6 — Production Architecture Edition |

### What This Product Replaces

The store currently operates using a combination of:

- Paper notebooks for stock tracking
- Memory-based inventory awareness
- Rough udhaar (credit) tracking in notebooks or WhatsApp
- End-of-day cash counting without structured reconciliation
- Supplier invoices stored loosely or not tracked at all
- WhatsApp messages for reorder reminders
- Mental math for daily sales totals

**This system replaces all of the above** with a structured, mobile-first, reliable, and offline-capable operational system.

### What This Product Is NOT

This is not a corporate ERP. It is not a SaaS product for hundreds of businesses. It is not a complex inventory management system requiring training. It is a **practical operational system built for one real Indian local shop** that sells cleaning supplies, household items, and utensils. Every design decision must be filtered through this lens.

The system must feel as simple and familiar as WhatsApp. If a workflow requires more than four taps to complete, it is too complex.

---

## 2. Product Vision & Strategic Framing

### Vision Statement

Safai Market gives the owner of Anupurna Traders the same operational clarity that an organized corporate retailer has — without any of the corporate complexity. The owner should be able to look at their phone at any moment and know:

- Exactly how much stock they have for every product
- Who owes them money and how much
- How much cash should be in the drawer right now
- Which products are about to run out
- How much they owe each supplier
- What their approximate profit looks like today

This information should be **instantly accessible, completely trustworthy, and available even without internet**.

### Strategic Framing for the Build Team

The single most dangerous failure mode of this product is **data distrust**. If the owner looks at the stock number and thinks "this might be wrong," the entire system fails — even if everything else works. Every engineering decision must prioritize data trust above all other qualities.

The second most dangerous failure mode is **billing disruption**. Billing is the heartbeat of the store. A billing screen that freezes during rush hour, a bill that saves twice, or a bill that fails silently costs the business money and trust. Billing must work reliably under all conditions — offline, slow network, shared device, low-end Android phone.

Everything else — reports, analytics, supplier management — is secondary to trustworthy stock and reliable billing.

---

## 3. Core Product Principles

These principles are non-negotiable. Every feature, every workflow, every screen must be evaluated against them.

### P1 — Mobile First, Always
Every screen is designed for a 5.5–6.5 inch Android screen. Desktop is a bonus. Touch targets are minimum 48×48 points. No hover-only interactions.

### P2 — Simplicity Before Features
A missing feature is better than a confusing feature. When in doubt, leave it out of MVP and schedule it for Phase 2.

### P3 — Billing Speed Is Sacred
A bill must be creatable in under 30 seconds under normal conditions. Any change that increases billing time must be explicitly justified.

### P4 — Every Stock Change Is Logged
There is no direct stock editing. Stock only changes as a result of a logged event: sale, purchase, return, damage, or explicit adjustment with a reason. Stock number integrity depends on this absolutely.

### P5 — Every Money Movement Is Logged
Udhaar, supplier pending, cash received, UPI received — all are ledger-based. Balance is computed from the ledger, not stored as a single overwritable number.

### P6 — Never Hard Delete Business Data
Everything is archived, not deleted. Bills are cancelled, not deleted. Products are archived, not deleted. This enables recovery and audit.

### P7 — Offline Actions Are Safe and Recoverable
The app works without internet. Any action taken offline is queued and synced when connection returns. The user never loses data due to connectivity issues.

### P8 — Human Mistakes Are Reversible
Dangerous actions require confirmation. Mistakes that cannot be undone automatically can be corrected through explicit adjustment workflows. No single tap destroys data.

### P9 — Sync Status Is Always Visible
The user always knows whether their data is synced. Unsynced data is flagged clearly. Sync failures are reported with actionable retry options.

### P10 — Numbers Must Be Trusted
The system must never show a stock number that is wrong, a balance that is incorrect, or a daily total that does not match reality. If the system is uncertain, it says so explicitly rather than showing a wrong number.

### P11 — Concurrency Is Expected and Handled
Two family members or the owner and a helper may be using the app simultaneously on different phones. The system must handle this without data corruption.

### P12 — Low-End Android Performance Is Required
The app must perform acceptably on a 2GB RAM Android device running Chrome. Animations are minimal. Bundles are small. Images are compressed. Loading is progressive.

### P13 — Indian Shop Workflows Are First-Class
Udhaar, wholesale pricing, free items from suppliers, mixed payment (cash + UPI + udhaar), product damage, seasonal demand spikes — these are primary features, not afterthoughts.

### P14 — Recovery Is More Important Than Prevention
Perfect prevention of errors is impossible. Fast, easy recovery from errors is achievable. The system prioritizes clear recovery paths over complex validation that slows down normal workflows.

---

## 4. Business Context & Real-World Store Operations

### Store Product Profile

Anupurna Traders stocks and sells:

**Cleaning Liquids & Chemicals**
Toilet cleaners (Harpic, generic brands), floor cleaners, glass cleaners, drain cleaners, disinfectants, bleach

**Detergents & Washing Products**
Washing powders, liquid detergents, dishwashing bars (Vim), dishwashing liquids, fabric softeners

**Cleaning Tools & Equipment**
Mops, brooms (jhadu), scrubbers, brushes, sponges, dusters, gloves, microfiber cloths

**Buckets, Mugs & Plastic Products**
Buckets, mugs, dustbins, storage containers, plastic trays, water bottles

**Steel & Utensil Products**
Steel vessels, plates, bowls, glasses, spoons, tiffin boxes

**Bathroom & Toilet Products**
Soap dispensers, toilet brushes, bath mugs, drain covers

**Miscellaneous Daily Use**
Agarbatti, candles, naphthalene balls, mousetraps, insect repellents

### Real-World Operational Challenges

The system must handle these realities as first-class scenarios, not edge cases:

**Product Complexity**
- Many similar-looking products in different sizes (Harpic 200ml vs 500ml vs 1L)
- Products from multiple brands doing the same job
- Same product sold in piece, box, or carton depending on the buyer
- Products with no barcode (loose items, local brands)
- Products whose names are commonly known in Hindi/Hinglish ("Vim" vs "dish bar" vs "bartan sabun")

**Pricing Complexity**
- Retail price and wholesale price for the same product
- Prices change frequently due to supplier rate changes
- Seasonal price fluctuations
- Occasional negotiated prices for specific customers
- Damaged or near-expiry products sold at discount

**Stock Complexity**
- High product count (200–500 SKUs)
- Multiple sizes treated as separate products
- Products sometimes confused during purchase entry
- Physical stock sometimes doesn't match system stock (damage, theft, miscounting)
- Free items from suppliers ("12 + 1 free")

**Cash & Payment Complexity**
- Mixed payments in a single bill (part cash, part UPI, part udhaar)
- Customer pays outstanding udhaar partially during a new purchase
- UPI payment reference numbers need to be optionally recorded
- Daily cash drawer doesn't match expected amount (change errors, forgotten expenses)
- Owner takes cash from drawer for personal use (must be trackable as expense)

**Customer & Udhaar Complexity**
- Many long-term customers with running udhaar
- Customer sometimes disputes udhaar amount
- Customer pays partial amounts at irregular intervals
- Some customers are known only by nickname or area ("corner wale bhaiya")
- Customer returns a product after several days without a bill

**Supplier Complexity**
- Same product from multiple suppliers at different rates
- Supplier credit purchases (goods received now, payment later)
- Partial payments to suppliers
- Free items included in supplier deliveries
- Supplier invoice may not match what was physically received
- Some suppliers have no formal invoice (informal local suppliers)

**Operational Complexity**
- Two people billing simultaneously on two phones during rush hour
- Helper creates a bill incorrectly and it needs correction
- Owner is away and family member is running the shop
- Poor or no internet during peak business hours
- Phone battery dies mid-billing
- App is slow because device RAM is full

---

## 5. Target Users & Role System

### 5.1 Role: Owner (Full Access)

**Profile:** The shop owner. Primary decision-maker. May not be technically sophisticated but understands the business deeply.

**Daily Tasks:**
- Review morning dashboard (sales, pending udhaar, low stock)
- Occasional billing when helpers are not present
- Review and approve daily closing
- Handle supplier payments and purchases
- Resolve udhaar disputes
- Review monthly reports

**Critical Needs:**
- Trust the numbers completely
- Easy financial overview
- Low stock visibility
- Supplier pending awareness
- Daily cash reconciliation

**Access Level:** Full. All modules, all settings, all reports, deletion and correction capabilities.

**Pain Points Being Solved:**
- "I don't know how much stock I have of any product"
- "I forget who owes me how much"
- "I can't figure out why cash doesn't match at day end"
- "I don't know which products to reorder"
- "I can't tell if my helper made a billing mistake"

---

### 5.2 Role: Family Member (Trusted Operator)

**Profile:** Spouse, sibling, or adult child who regularly helps run the store. Trusted with daily operations but not strategic settings.

**Daily Tasks:**
- Primary billing operator
- Stock updates after purchases
- Customer payment collection
- Expense recording
- Basic product management

**Access Level:**
- Full billing access
- Full customer access
- Product viewing and stock updates
- Expense entry
- No: settings changes, price structure changes, supplier management, advanced reports, data export

**UX Needs:**
- Large, clear buttons
- Undo support for common mistakes
- Clear confirmation dialogs before irreversible actions
- Simple billing flow without complexity

---

### 5.3 Role: Helper / Staff (Restricted Operator)

**Profile:** Paid assistant working at the counter. Trusted for day-to-day counter operations, not business intelligence.

**Daily Tasks:**
- Create bills
- Search products and confirm availability
- Add basic customer information
- Note customer payments against existing udhaar

**Access Level:**
- Billing only
- Product search (read-only prices)
- Customer search and viewing
- Cannot: view reports, change prices, edit products, view financial summaries, access supplier module, modify settings

**UX Needs:**
- Cannot accidentally access sensitive information
- Cannot make irreversible changes
- Fast product search is the primary need
- No complex workflows

---

### 5.4 Role Enforcement Rules

- Roles are set during device setup and can only be changed by the Owner with PIN confirmation
- Role is stored on device and verified against Google Sheets on sync
- If a device's role is downgraded remotely (e.g., helper's access revoked), it takes effect on next sync
- The Owner role requires PIN to access destructive operations even when already logged in as Owner
- Sensitive operations (cancel bill, large stock correction, price change) always require Owner PIN regardless of device role

---

## 6. Platform, Technology Stack & Architecture Rationale

### 6.1 Frontend

| Technology | Choice | Rationale |
|---|---|---|
| Framework | React 18 + Vite | Fast builds, good ecosystem, familiar to most developers |
| UI Styling | Tailwind CSS | Utility-first, consistent spacing, easy responsive design |
| State Management | Zustand | Lightweight, simple API, works well with async offline patterns |
| Offline Storage | IndexedDB (via Dexie.js) | Reliable local database; handles large queues, product catalog, customer list |
| Settings Storage | localStorage | Simple key-value for app settings, device info, PIN hash |
| Routing | React Router v6 | Standard SPA routing |
| PWA Support | Vite PWA Plugin (workbox) | Service worker generation, caching strategy, install prompt |

### 6.2 Backend

| Technology | Choice | Rationale |
|---|---|---|
| Database | Google Sheets | No server cost, owner can view/audit data directly, familiar to family members |
| API Layer | Google Apps Script (GAS) Web App | Free execution, integrates natively with Sheets, no separate server |
| Auth Token | Shared Secret Header | Simple HMAC token per deployment; no OAuth complexity |

### 6.3 Why Google Sheets (And Its Honest Limitations)

**Why it works:**
- Zero infrastructure cost
- The owner can see all data by opening Google Sheets
- Family members familiar with spreadsheets can audit data
- No database administration required
- Google handles backups and uptime
- Apps Script is free for this usage volume

**Honest limitations the team must design around:**

| Limitation | Design Response |
|---|---|
| Not a transactional database | Implement event ledger architecture; use Apps Script row locking |
| Apps Script execution time limit (6 min) | Keep individual requests small; batch wisely |
| Row limit per sheet (~5 million cells) | Archive sheets annually; keep active data trimmed |
| Concurrent write limit | Queue writes; use LockService in Apps Script |
| Slow on large ranges | Use summarized "Fast Layer" sheets for frequently queried data |
| Formula recalculation lag | Avoid complex formulas in data sheets; compute in Apps Script |
| No native foreign keys | Enforce referential integrity in Apps Script validation layer |

### 6.4 Hosting

| Concern | Solution |
|---|---|
| Frontend Hosting | Netlify (preferred) or Vercel |
| Custom Domain | Optional; not required for MVP |
| HTTPS | Automatic via Netlify/Vercel |
| CDN | Automatic via Netlify/Vercel edge network |
| PWA Cache | Service worker caches app shell; works offline |

### 6.5 Technology Anti-Decisions (What We Deliberately Excluded)

| Excluded Technology | Why |
|---|---|
| Supabase / Firebase | Adds cost, complexity, and dependency; unnecessary for this scale |
| Complex Node.js Backend | No server to maintain, no deployment pipeline needed |
| Complex Authentication Server | Overhead unjustified for a single-shop app |
| React Native / Flutter | PWA is sufficient; avoids App Store complexities |
| SQL Database | No server; Google Sheets serves this use case |
| Barcode Scanner (MVP) | Adds hardware dependency; products often have no barcode; Phase 2 |
| Thermal Printer (MVP) | Hardware dependency; WhatsApp sharing covers receipt needs |

---

## 7. Google Sheets Architecture — Deep Design

### 7.1 Architecture Philosophy

Google Sheets is used as a **hybrid event-sourced database**, not as a traditional row-update database. This distinction is critical and must be understood by every developer on the project.

**Traditional (Wrong) Approach:**
When a product is sold, find the product row and decrement the stock cell.  
*Problem: Race conditions, no history, corruption is invisible.*

**Event Ledger (Correct) Approach:**
When a product is sold, append a new row to the stock movement log. The current stock is computed (or periodically summarized) from all movement log entries.  
*Benefit: No race conditions on appends, complete history, corruption is detectable and recoverable.*

### 7.2 Sheet Architecture — Complete Tab Design

The Google Sheet uses multiple tabs, organized into three layers:

#### Layer 1: Configuration Tabs
These are written once (or rarely) and read frequently.

| Tab Name | Purpose | Write Frequency |
|---|---|---|
| `CONFIG` | App settings, token, store info, version | Rare |
| `USERS` | Device registrations, roles, permissions | Rare |
| `CATEGORIES` | Product category and subcategory master | Occasional |
| `SUPPLIERS` | Supplier master records | Occasional |

#### Layer 2: Event / Ledger Tabs (Append-Only)
These are never edited after writing. Only appended to. This is the source of truth.

| Tab Name | Purpose | Appended When |
|---|---|---|
| `BILLS` | Bill header records | Every bill created |
| `BILL_ITEMS` | Individual line items per bill | Every bill created |
| `STOCK_MOVEMENTS` | All stock changes with full context | Every stock change |
| `UDHAAR_LEDGER` | All customer balance changes | Every udhaar transaction |
| `SUPPLIER_LEDGER` | All supplier balance changes | Every supplier transaction |
| `PURCHASES` | Purchase header records | Every supplier purchase |
| `PURCHASE_ITEMS` | Items in each purchase | Every supplier purchase |
| `RETURNS` | All return records | Every return processed |
| `DAMAGES` | Damage and wastage records | Every damage entry |
| `EXPENSES` | All expense records | Every expense entry |
| `PRICE_HISTORY` | All price change events | Every price update |
| `AUDIT_LOG` | All significant system actions | Many triggers |
| `OFFLINE_QUEUE_LOG` | Sync event log for debugging | Every sync event |

#### Layer 3: Fast Layer / Summary Tabs (Recomputed Periodically)
These tabs hold computed summaries for fast reads. They are regenerated from the event ledger by Apps Script. They should **never be edited directly**.

| Tab Name | Purpose | Recomputed When |
|---|---|---|
| `PRODUCTS` | Product master with current stock | After any stock movement |
| `CUSTOMERS` | Customer master with current balance | After any udhaar event |
| `DAILY_SUMMARY` | Per-day aggregates for reports | After daily closing |
| `STOCK_SNAPSHOT` | Latest stock for every product | After any stock movement |

### 7.3 Apps Script Architecture — Endpoint Design

The Apps Script deployment exposes a single `doPost(e)` endpoint that routes requests internally.

#### Routing Structure
```
POST /exec?token=SECRET_TOKEN
Body: { action: "ACTION_NAME", payload: { ... }, client_action_id: "uuid", device_id: "..." }
```

Every request includes:
- `action`: Identifies which handler to call
- `payload`: Action-specific data
- `client_action_id`: UUID generated by the client; used for idempotency
- `device_id`: Identifies which device is making the request
- `timestamp`: Client timestamp (used for audit, not for trust)

#### Action Categories

| Category | Actions |
|---|---|
| Setup | `setup_store`, `register_device`, `get_config` |
| Products | `create_product`, `update_product`, `archive_product`, `get_products`, `bulk_update_prices` |
| Billing | `create_bill`, `cancel_bill`, `convert_bill_to_udhaar`, `get_bills` |
| Stock | `record_stock_movement`, `get_stock_movements`, `submit_inventory_count` |
| Customers | `create_customer`, `update_customer`, `add_udhaar_payment`, `get_customers` |
| Suppliers | `create_supplier`, `update_supplier`, `get_suppliers` |
| Purchases | `create_purchase`, `get_purchases` |
| Returns | `create_return`, `get_returns` |
| Damages | `create_damage`, `get_damages` |
| Expenses | `create_expense`, `get_expenses` |
| Closing | `submit_daily_closing`, `get_daily_closing`, `reopen_daily_closing` |
| Sync | `pull_changes_since`, `get_sync_status` |
| Backup | `export_full_backup` |

### 7.4 Idempotency System

**Problem:** The app is offline-first. When internet returns, queued actions are sent to Apps Script. If the response is lost (network interruption after the write succeeded), the client will retry. Without idempotency, the same bill could be created twice.

**Solution:** Every action is identified by a `client_action_id` (a UUID v4 generated once on the client at the moment the action is created). Apps Script checks this ID against a processed log before executing.

```
Apps Script flow for every POST request:
1. Extract client_action_id from request
2. Check PROCESSED_ACTIONS tab for this ID
3. If found: Return the cached response (do not re-execute)
4. If not found: Execute the action, then log the ID + response to PROCESSED_ACTIONS
```

The `PROCESSED_ACTIONS` tab is cleaned of entries older than 30 days to prevent unbounded growth.

### 7.5 Concurrency Control with LockService

Google Apps Script provides `LockService` to prevent concurrent execution conflicts.

```javascript
// Pattern used for all write operations in Apps Script
function handleBillCreate(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait up to 10 seconds for lock
    // --- Critical section begins ---
    // 1. Validate payload
    // 2. Check idempotency
    // 3. Read current state (stock, balance)
    // 4. Validate business rules (stock >= quantity, etc.)
    // 5. Append all rows atomically
    // 6. Update Fast Layer summaries
    // 7. Log to AUDIT_LOG
    // --- Critical section ends ---
    return { success: true, data: { bill_id: newBillId } };
  } catch (e) {
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}
```

**Lock timeout behavior:** If a lock cannot be acquired within 10 seconds (another operation is running), the request fails gracefully with a `LOCK_TIMEOUT` error. The client retries the request after 3 seconds. This handles the case where two billing devices submit simultaneously.

### 7.6 Atomic Bill Save — Complete Flow

Bill creation is the most critical atomic operation. The following all happen inside a single lock acquisition, or none of them happen:

```
Apps Script atomic bill creation:
1. Validate token
2. Acquire script lock
3. Check client_action_id for duplicate
4. Validate all products exist and are active
5. Validate stock >= requested quantity for each product
6. Generate bill_id and bill_number
7. Append row to BILLS tab
8. Append rows to BILL_ITEMS tab (one per line item)
9. Append rows to STOCK_MOVEMENTS tab (one per product)
10. If payment includes udhaar: Append row to UDHAAR_LEDGER
11. Update PRODUCTS tab (Fast Layer) — decrement stock for each product
12. Update CUSTOMERS tab (Fast Layer) — if udhaar was added
13. Update DAILY_SUMMARY tab
14. Append row to AUDIT_LOG
15. Record client_action_id to PROCESSED_ACTIONS
16. Release lock
17. Return success response with bill_id and bill_number
```

If **any step 7–15 fails**, the function throws, the lock is released, and no partial data is committed. The client sees a failure response and retries with the same `client_action_id`. On retry, Apps Script finds the original action not in `PROCESSED_ACTIONS` (since step 15 was never reached) and re-attempts the full sequence.

### 7.7 Fast Layer Rebuild Capability

If the Fast Layer (PRODUCTS, CUSTOMERS tabs) ever gets corrupted or out of sync, it can be fully rebuilt from the event ledger tabs. This is the system's data recovery foundation.

A `rebuild_fast_layer` Apps Script function:
1. Reads the entire STOCK_MOVEMENTS ledger
2. Computes current stock for each product
3. Reads the entire UDHAAR_LEDGER
4. Computes current balance for each customer
5. Writes computed values back to PRODUCTS and CUSTOMERS tabs

This operation may be slow for large datasets but is only needed for recovery. It runs under a script lock to prevent concurrent access during rebuild.

### 7.8 Data Archiving Strategy for Google Sheets

Google Sheets begins degrading in performance past approximately 200,000 rows in a single sheet. The archiving strategy prevents this.

**Annual Archive Process (runs at year-end or when any sheet exceeds 150,000 rows):**
1. A new Google Sheet named `Safai Market Archive [YEAR]` is created programmatically
2. All event ledger rows for the completed year are copied to the archive sheet
3. Rows older than 12 months are deleted from the active sheet
4. DAILY_SUMMARY remains in active sheet (it is aggregated and small)
5. The archive sheet URL is saved to CONFIG

**Archive Trigger:**
- Automatic: Apps Script scheduled trigger checks row counts monthly
- Manual: Owner can trigger from Settings > Data Management > Archive Old Data

---

## 8. Offline-First Architecture — Deep Design

### 8.1 Offline Strategy Overview

The app must work completely offline for all core operations. Internet connectivity is treated as a bonus, not a requirement, for day-to-day operation.

**Design principle:** Write locally first, sync to server when available. The local device is the primary operational database. The Google Sheet is the shared truth layer for multi-device sync.

### 8.2 Local Database Structure (IndexedDB via Dexie.js)

The local IndexedDB database mirrors the Google Sheets structure for all operationally relevant data:

```javascript
// Dexie.js schema definition
const db = new Dexie('SafaiMarketDB');
db.version(1).stores({
  products:          '&product_id, sku_code, name, category_id, status',
  customers:         '&customer_id, name, phone, status',
  suppliers:         '&supplier_id, name, status',
  categories:        '&category_id, name',
  bills:             '&bill_id, created_at, customer_id, status',
  bill_items:        '&item_id, bill_id, product_id',
  stock_movements:   '&movement_id, product_id, created_at, movement_type',
  udhaar_ledger:     '&entry_id, customer_id, created_at',
  supplier_ledger:   '&entry_id, supplier_id, created_at',
  purchases:         '&purchase_id, supplier_id, created_at',
  purchase_items:    '&item_id, purchase_id, product_id',
  returns:           '&return_id, created_at',
  damages:           '&damage_id, created_at',
  expenses:          '&expense_id, created_at',
  daily_closings:    '&closing_id, date',
  offline_queue:     '++id, status, created_at, action_type, client_action_id',
  sync_meta:         '&key'
});
```

### 8.3 Offline Queue System — Complete Design

Every action taken offline (or online, for reliability) is first written to the `offline_queue` table before being submitted to Apps Script.

#### Queue Entry Structure

```javascript
{
  id: auto_increment,                   // Local queue ID
  client_action_id: "uuid-v4",         // Idempotency key; stable across retries
  action_type: "CREATE_BILL",          // Identifies handler
  payload: { ... },                    // Complete action data
  status: "PENDING",                   // PENDING | SYNCING | SYNCED | FAILED | CONFLICT
  retry_count: 0,                      // Number of retry attempts
  last_error: null,                    // Error message from last attempt
  device_id: "device-uuid",           // Device that created this action
  user_id: "user-uuid",               // User who performed this action
  created_at: "ISO-8601",             // When the action was queued
  synced_at: null,                    // When successfully synced
  priority: 1,                        // Lower number = higher priority
  depends_on: null                    // client_action_id of prerequisite action
}
```

#### Queue Processing Rules

1. **Processing Order:** Actions are processed in order of `created_at`, with `depends_on` dependencies respected. A BILL_CANCEL action that depends on a CREATE_BILL action will not be sent until the CREATE_BILL is confirmed synced.

2. **Retry Logic:** Failed actions are retried with exponential backoff: 5s, 15s, 45s, 2min, 5min, 15min, 30min. After 7 failures, the action is marked `FAILED` and surfaces in Sync Center for owner review.

3. **Dependency Chains:** Some actions have dependencies. Example: A payment received for a bill requires that bill to exist in the server. The `depends_on` field prevents out-of-order syncing.

4. **Concurrency:** Only one sync operation runs at a time. The sync engine processes the queue sequentially to avoid race conditions.

5. **Network Detection:** The app uses `navigator.onLine` plus a lightweight health-check ping to `/.netlify/functions/ping` to determine connectivity. `navigator.onLine` alone is unreliable (can return true on a captive portal).

#### Offline Queue Status Lifecycle

```
PENDING → SYNCING → SYNCED
                 ↘ FAILED (retryable) → PENDING (on retry)
                 ↘ CONFLICT (requires owner review)
```

### 8.4 Optimistic Updates

When a user creates a bill, adds a product, or records a payment, the UI updates **immediately** from local state. The sync confirmation happens in the background.

**Optimistic update flow for bill creation:**
1. User taps "Save Bill"
2. App validates locally (stock check against local data)
3. App writes bill to local IndexedDB immediately
4. App updates local stock counts immediately
5. App shows success screen immediately
6. App adds action to offline_queue
7. Background sync engine picks up the action and sends to Apps Script
8. On server confirmation: action marked SYNCED, no UI change needed
9. On server failure: action retried; if permanent failure, surfaced in Sync Center

**Conflict risk:** If the local stock shows 5 units available but server stock is 0 (because another device sold the last 5 units while this device was offline), the bill will fail on server-side validation. This is a **stock conflict** and is handled by the conflict resolution system (Section 9).

### 8.5 Data Freshness Strategy

The local database is refreshed from the server using a pull-based sync model:

**On App Open (if online):**
- Pull any changes since `last_sync_timestamp` for all tables
- Apply changes to local IndexedDB
- Update `last_sync_timestamp` in sync_meta

**Continuous Sync (while online):**
- Every 3 minutes: Pull changes for critical tables (products, customers)
- Every 10 minutes: Pull changes for all tables
- Immediately after any successful push: Pull to confirm server state

**Pull Request Structure:**
```javascript
{
  action: "pull_changes_since",
  payload: {
    since_timestamp: "2024-01-15T08:30:00Z",
    tables: ["products", "customers", "bills", "stock_movements", "udhaar_ledger"]
  }
}
```

### 8.6 Offline Indicators

The status of sync is always visible:

- **Green dot + "Synced"**: All actions synced; data is current
- **Yellow dot + "Syncing..."**: Sync in progress
- **Orange dot + "X pending"**: Actions queued, will sync when online
- **Red dot + "Offline"**: No internet detected; actions are being queued locally
- **Red dot + "Sync failed"**: One or more actions failed after max retries; requires attention

The sync status dot appears in the app header on every screen. Tapping it opens the Sync Center.

---

## 9. Sync Engine & Conflict Resolution System

### 9.1 Conflict Categories

Not all conflicts are equal. The system handles four distinct types:

#### Type 1: Harmless Parallel Actions (Auto-Resolved)
Two devices made unrelated changes while offline. Example: Device A added a new customer, Device B added a new expense. These are independent and both are applied without any conflict.

#### Type 2: Non-Destructive Merge Conflicts (Auto-Resolved)
Two devices updated different fields of the same record. Example: Device A changed a product's sell_price, Device B updated the product's low_stock_limit. Both changes are applied by merging field-level diffs. Last-write wins per field, with a full audit record of both changes.

#### Type 3: Stock Conflicts (Semi-Auto with Notification)
An offline sale was created for a product that another device also sold, resulting in negative stock on the server.

**Resolution:**
1. Server validates the late-arriving bill against current stock
2. If stock is insufficient: Bill is flagged as a STOCK_CONFLICT
3. App notifies owner: "Bill #47 could not be confirmed — stock ran out. Please review."
4. Owner options: (a) Approve anyway (allows negative stock, to be corrected on next purchase), (b) Cancel the bill, (c) Adjust the quantity and resubmit

#### Type 4: Duplicate Action Conflicts (Auto-Resolved via Idempotency)
The same action was submitted twice due to network retry. The idempotency system (client_action_id) detects and suppresses the duplicate automatically. No user intervention required.

### 9.2 Conflict Detection — Version Vectors

Each product and customer record carries a `version` integer that increments on every update. When a device pulls data, it records the version of each record it received. When it pushes an update, it includes the version it based the update on.

```javascript
// Update request includes the version the client had
{
  action: "update_product",
  payload: {
    product_id: "prod_001",
    sell_price: 45,
    based_on_version: 12  // Client had version 12 when it made this change
  }
}

// Apps Script checks:
// If current server version == based_on_version: Apply update, increment version
// If current server version > based_on_version: CONFLICT — another device changed it first
```

For MVP, most field-level conflicts are resolved by last-write-wins (the more recent write from any device wins). The version system ensures the conflict is **detected and logged** even when automatically resolved.

### 9.3 Sync Center — Complete UX Design

The Sync Center is accessible from the header sync status indicator and from More > Sync Center.

**Sections:**

**Connection Status Panel**
- Current network status (Online / Offline)
- Current sync status (All synced / X actions pending / Sync error)
- Last successful sync timestamp
- Retry All button (if failures exist)

**Pending Queue Panel**
- List of actions waiting to sync
- Each item shows: action type, timestamp, status
- Owner can view details of any pending action
- Owner can cancel a pending action if it hasn't been sent yet (removes from queue)

**Failed Actions Panel**
- Actions that exceeded max retry attempts
- Each shows: action type, last error message, retry options
- Options per failed action: Retry Now, View Details, Discard (with confirmation)
- Discarding removes from queue but does not undo local changes — owner must manually correct

**Conflict Resolution Panel**
- Stock conflicts, merge conflicts, and other items requiring review
- Each conflict shows: what happened, what the conflict is, suggested resolution
- Owner selects resolution option
- Resolution is logged to AUDIT_LOG with owner decision

**Sync Log (Advanced)**
- Rolling log of last 50 sync events for debugging
- Toggle visible only in developer mode (accessible via Settings > Advanced > Developer Mode)

---

## 10. Data Consistency & Integrity Rules

### 10.1 The Golden Rules

These rules must be enforced at both the application layer (local validation) and the Apps Script layer (server validation). Both layers must be consistent.

**Rule 1 — Unique ID Generation**
Every record is assigned a UUID v4 at the moment of creation on the client. IDs are never reused. Format: `{entity_prefix}_{uuid}` (e.g., `bill_3f4a8b12-...`, `prod_7c2d9e43-...`).

**Rule 2 — Version Tracking**
Every mutable record (product, customer, supplier) carries a `version` integer starting at 1. Every update increments version by 1. The version is included in every update request and checked server-side.

**Rule 3 — Timestamps**
Every record carries `created_at` and `updated_at` in ISO 8601 UTC format. Client timestamps are used for display and auditing. Server-side timestamps (from Apps Script `new Date()`) are the canonical timestamps stored in the sheet.

**Rule 4 — No Hard Deletes**
Deletion is not permitted at the database level. Records have a `status` field:
- `active`: Normal operational state
- `archived`: Soft-deleted; hidden from normal views but retrievable
- `cancelled`: Applied to bills and transactions; preserves the record with cancellation metadata

**Rule 5 — Stock Changes Through Movement Log Only**
The `current_stock` field in the PRODUCTS Fast Layer tab is never directly edited by any action other than the stock ledger computation. All stock changes go through `STOCK_MOVEMENTS` first, then the Fast Layer is updated.

**Rule 6 — Balance Changes Through Ledger Only**
Customer udhaar balance and supplier pending balance are never directly overwritten. Every change appends a ledger entry. The balance in the Fast Layer is computed from the ledger.

**Rule 7 — Bill Snapshots**
Bills store snapshots of product name, price, and customer name at the time of billing. Future product renames or price changes do not retroactively affect historical bills.

**Rule 8 — No Negative Stock Without Explicit Approval**
The system warns when a bill would result in negative stock. It does not silently allow it. The owner must explicitly approve negative stock (enabling the "allow negative stock" override for that specific transaction, which is logged in AUDIT_LOG).

**Rule 9 — Referential Integrity on Writes**
Apps Script validates that referenced IDs exist before writing. A bill referencing a non-existent product_id is rejected. A purchase referencing a non-existent supplier_id is rejected.

**Rule 10 — Idempotency on All Writes**
Every write action carries a client_action_id. Duplicate submissions are detected and suppressed. The canonical response is returned from cache.

### 10.2 Data Validation Layers

**Layer 1: UI Validation (Immediate Feedback)**
- Required fields are checked before form submission
- Quantity fields accept only positive numbers
- Phone numbers validated for 10-digit Indian format
- Amount fields do not accept negative values
- Date fields do not accept future dates for closing and historical entries

**Layer 2: Local Business Logic Validation (Pre-Queue)**
- Stock check against local data before bill creation
- Duplicate customer phone number warning
- Bill total must equal sum of payment modes
- Purchase total must equal sum of item costs

**Layer 3: Server Validation in Apps Script (Pre-Write)**
- Token authentication
- Idempotency check
- Referential integrity (product exists, customer exists)
- Stock availability check (definitive — uses locked server state)
- Business rule validation (negative stock requires flag)
- Payload schema validation

---

## 11. Audit & Activity Log System

### 11.1 Audit Log Purpose

The audit log serves multiple critical purposes:
- **Accountability**: Which user on which device made which change
- **Recovery**: What was the state before a change (old values)
- **Dispute resolution**: Proof of when a bill was created or a payment received
- **Debug**: Trace the sequence of events that led to a data discrepancy

### 11.2 Audit Log Schema

```
AUDIT_LOG tab columns:
log_id          | String UUID
event_type      | String (see event taxonomy below)
module          | String (BILLING | STOCK | CUSTOMER | SUPPLIER | PURCHASE | EXPENSE | CLOSING | SETTINGS | SYNC)
record_id       | String UUID of the affected record
old_value       | JSON string of fields before change (null for creates)
new_value       | JSON string of fields after change (null for deletes/archives)
user_id         | String
user_name       | String (snapshot)
device_id       | String
device_name     | String (snapshot)
client_action_id| String (links to queue action)
server_timestamp| DateTime (authoritative)
client_timestamp| DateTime (for latency analysis)
ip_address      | String (Apps Script captures this for security)
notes           | String (optional human note)
```

### 11.3 Audited Events (Taxonomy)

| Module | Audited Events |
|---|---|
| Billing | bill_created, bill_cancelled, bill_payment_mode_changed, bill_item_edited |
| Stock | stock_movement_recorded, stock_adjustment_approved, negative_stock_approved |
| Customer | customer_created, customer_updated, customer_archived, payment_received, udhaar_adjusted |
| Supplier | supplier_created, supplier_updated, supplier_payment_made |
| Purchase | purchase_created, purchase_edited, purchase_payment_updated |
| Returns | return_created, supplier_return_created |
| Damage | damage_recorded, damage_approved |
| Expense | expense_created, expense_deleted |
| Closing | daily_closing_submitted, daily_closing_reopened |
| Settings | pin_changed, role_changed, device_added, device_removed, price_updated, bulk_price_updated |
| Sync | sync_conflict_resolved, fast_layer_rebuilt, action_discarded |

### 11.4 Audit Log Access

- **Owner**: Can view full audit log from Settings > Audit Log
- **Family Member**: Cannot view audit log
- **Helper**: Cannot view audit log
- Audit log is exportable as CSV from Settings > Audit Log > Export
- Audit log entries are never deleted (they are only archived to archive sheet on annual cleanup)

### 11.5 Activity Feed (Dashboard)

A simplified, human-readable activity feed is shown on the home dashboard. This is derived from the audit log and shows the last 20 significant events in plain language:

```
Today 3:45 PM  Vikram created Bill #203 — ₹450 (Cash)
Today 2:10 PM  Priya received ₹200 payment from Ramesh Bhaiya
Today 11:30 AM Restocked: Harpic 500ml — +24 units (Purchase #PO-44)
Today 9:00 AM  App opened on Device: Priya's Phone
```

---

## 12. Security Model

### 12.1 Threat Model

The security threats relevant to this application are:
1. Helper or unauthorized person accessing sensitive financial data
2. Accidental destructive actions by non-owner users
3. Someone accessing the Apps Script endpoint without proper credentials
4. Data leakage if a helper's phone is lost

The threats that are **not** in scope (and not worth the complexity):
- Sophisticated API attacks (the endpoint obscurity via secret token is sufficient)
- Nation-state attackers
- Cross-site scripting attacks in a PWA context

### 12.2 App PIN System

**PIN Setup:**
- 4-digit PIN set during first-time setup
- PIN is hashed (SHA-256) before storage; plain PIN never stored
- PIN hash stored in localStorage on device and in CONFIG sheet (for cross-device verification)
- PIN can only be changed by entering the current PIN first

**PIN Required For:**
- Opening the app (optional — can be configured as "PIN on start" or "PIN for sensitive actions only")
- Cancelling a bill
- Modifying a closed daily closing
- Changing product prices
- Making large stock adjustments (configurable threshold, default: change > 20 units)
- Changing settings
- Viewing audit log
- Exporting data
- Changing user roles

**PIN Brute Force Protection:**
- After 5 consecutive wrong PINs: 30-minute lockout
- Lockout countdown displayed with remaining time
- Owner can reset lockout by opening the app via a recovery URL with the store's Apps Script token

**PIN Recovery:**
- If PIN is forgotten: Owner opens Google Sheet CONFIG tab, finds the `RESET_TOKEN` value, enters it in the recovery screen, sets a new PIN

### 12.3 API Security

**Authentication:**
- Every Apps Script request carries a secret token in the `Authorization` header
- Token is a 32-character random alphanumeric string set during setup
- Token is stored in CONFIG sheet and in app localStorage
- Apps Script validates token on every request before any processing

**Token Rotation:**
- Owner can rotate the token from Settings > Advanced > Rotate API Token
- After rotation, all devices must re-enter the new token (or re-sync automatically if they have the old token still valid for a 5-minute grace period)

**HTTPS:**
- All traffic to Apps Script is over HTTPS (Google enforces this)
- All traffic to Netlify is over HTTPS

### 12.4 Role-Based Access Control

The role system is enforced at two layers:

**Layer 1: UI Enforcement (Client-Side)**
- Screens and buttons not accessible to the current role are hidden or disabled
- This prevents accidental access but is not a security boundary

**Layer 2: Server Enforcement (Apps Script)**
- Every write request includes `device_id` and `user_role`
- Apps Script validates that the requesting role is permitted to perform the action
- A helper cannot create a purchase, adjust prices, or view reports even if they bypass the UI

### 12.5 Device Management

- Each device is registered with: device_id, device_name, owner_name, role, registered_at
- Device list is visible to Owner from Settings > Devices
- Owner can revoke a device (marks it as inactive in USERS tab)
- Revoked devices are denied on next server contact
- A device that has not synced in 30 days is automatically flagged as stale and alerts the owner

---

## 13. Navigation System & Information Architecture

### 13.1 Bottom Navigation Bar

The bottom nav is persistent across all primary screens. Icons are large (28px), labels are visible below icons, active tab is highlighted with primary green.

| Position | Icon | Label | Accessible To |
|---|---|---|---|
| 1 | Home | Home | All roles |
| 2 | Box | Products | All roles |
| 3 | Receipt | Billing | All roles |
| 4 | Person | Customers | All roles |
| 5 | Menu | More | All roles (filtered by role) |

### 13.2 More Menu (Role-Filtered)

The More menu shows different items based on user role:

| Item | Owner | Family | Helper |
|---|---|---|---|
| What Is Finishing | ✓ | ✓ | ✓ |
| Suppliers | ✓ | ✗ | ✗ |
| Purchase Entry | ✓ | ✓ | ✗ |
| Expenses | ✓ | ✓ | ✗ |
| Reports | ✓ | ✗ | ✗ |
| Daily Closing | ✓ | ✓ | ✗ |
| Sync Center | ✓ | ✓ | ✓ |
| Backup & Restore | ✓ | ✗ | ✗ |
| Settings | ✓ | Limited | ✗ |
| Help | ✓ | ✓ | ✓ |
| Audit Log | ✓ | ✗ | ✗ |

### 13.3 Simple Mode vs Advanced Mode

**Simple Mode** (default):
Shows only the essential daily operations. Designed for routine use during busy hours.
- Bottom Nav: Home, Products, Billing, Customers, More (limited)
- More Menu: What Is Finishing, Daily Closing, Sync Center, Help

**Advanced Mode:**
Unlocked from Settings. Reveals full More menu with all modules.
- Remembers last mode. Auto-reverts to Simple Mode after 24 hours of inactivity (configurable).

**Mode Switch:**
Settings > Display > Mode Toggle

### 13.4 Navigation History & Back Button Behavior

- Android back button behavior is handled gracefully
- Billing screen with an active cart shows a confirmation dialog before navigating away ("Leave billing? Your cart will be saved as a hold.")
- Back from confirmation dialogs returns to the form, not to the previous screen
- Deep links (e.g., opening a specific bill from a WhatsApp notification) work correctly via URL routing

---

## 14. First-Time Setup Workflow

### 14.1 Setup Philosophy

First-time setup should take less than 10 minutes. It is guided, step-by-step, and skippable where possible. The user should be able to start billing within 10 minutes of installing the PWA.

### 14.2 Setup Steps

**Step 1 — Language Selection**
- Options: English, Hinglish (English UI with Hindi labels where appropriate)
- Hindi-only option in Phase 2
- Language choice stored in localStorage; affects all UI labels and messages

**Step 2 — Store Profile**
Required fields:
- Store Name (shown on bills and reports)
- Owner Name
- Owner Phone Number

Optional fields:
- Store Address (shown on bills)
- UPI ID (shown on bills for customer scanning)
- GST Number (if applicable — shown on bills)

**Step 3 — Connect Google Sheet**
- Instructions: "Open Google Drive, copy this spreadsheet template, deploy Apps Script, paste the URL here"
- Step-by-step guide with screenshots (inline in the app)
- URL input field with "Test Connection" button
- Token input field (from the Apps Script deployment)
- Connection test shows: ✓ Connected / ✗ Error with specific error message
- If connection fails: Troubleshooting guide accessible inline

**Step 4 — This Device Setup**
- Device Name (e.g., "Main Counter Phone", "Owner's Phone")
- Your Name (e.g., "Vikram", "Priya")
- Your Role (Owner / Family Member / Helper)
- If Role = Owner: Required. Only one Owner device recommended. Confirm if setting non-owner device.

**Step 5 — PIN Setup**
- Enter 4-digit PIN
- Confirm PIN
- Optional: Enable biometric authentication (fingerprint) where supported
- PIN security notice: "This PIN protects sensitive operations. Do not share it."

**Step 6 — Opening Inventory (Optional)**
Three options:
- "Add Products Now": Opens product creation flow; user can add their top 20 products immediately
- "Import from CSV": Upload a CSV file with product name, buy price, sell price, quantity columns
- "Skip — I'll add products as I go": Recommended for getting started quickly; products can be added at any time

**Step 7 — Opening Balances (Optional)**
- Customer udhaar: "Do you have customers who currently owe you money?" → Add opening balance per customer
- Supplier pending: "Do you owe any supplier money currently?" → Add pending per supplier
- Opening cash: "How much cash is currently in the drawer?" → Enter amount

If skipped: System starts from zero. Owner can add opening balances within 30 days from Settings > Opening Balances.

**Step 8 — Daily Closing Time**
- "What time do you usually close the shop?" → Sets the daily closing reminder time
- Default: 9:00 PM
- Can be changed later in Settings

**Step 9 — Install App**
- "Add this app to your home screen for the best experience"
- Animated guide for Chrome → Share → Add to Home Screen
- Android-specific instructions
- iOS-specific instructions
- "Already installed" button to skip

**Step 10 — Setup Complete**
- Summary of what was set up
- Quick tour offer (optional 60-second tap-through of key screens)
- "Start Using the App" → navigates to Home Dashboard

---

## 15. Home Dashboard

### 15.1 Dashboard Purpose

The home dashboard is a **daily health check** for the store. It should answer the owner's first-morning questions in under 10 seconds without any interaction.

### 15.2 Dashboard Layout (Top to Bottom)

**Header Bar**
- Store name (left)
- Date (center)
- Sync status indicator (right, tappable)
- Notification bell (right, tappable, shows count badge)

**Today's Sales Card**
Prominent card showing:
- Total Sales: ₹X,XXX (large font, primary green)
- Bills Created: N
- Cash Received: ₹X,XXX
- UPI Received: ₹X,XXX
- Udhaar Given Today: ₹X,XXX
- Returns Today: ₹XXX (if any)
- Cancelled Bills: N (if any)
- Tap anywhere on card → Today's Detailed Report

**Quick Actions Row**
Large tappable buttons (full-width row, horizontally scrollable):
- Create Bill (primary, green)
- Add Expense
- Receive Payment (customer udhaar payment)
- Search Product
- Add Customer
- Restock Product (shortcut to purchase entry)

**What Is Finishing — Preview Card**
Compact list showing top 3–5 low-stock products:
- Product name
- Current stock (highlighted red if zero, orange if at low-stock limit)
- "View All (N)" link → What Is Finishing module

**Pending Alerts Card** (shown only if alerts exist)
Orange/red card listing:
- Pending sync actions: "7 actions waiting to sync"
- Sync failures: "2 failed actions need attention → Sync Center"
- Daily closing pending: "Yesterday's closing not done → Close Now"
- Backup overdue: "No backup in 30 days → Backup Now"

**Recent Activity Feed**
Last 10 significant events in chronological order (most recent first):
- Bill created: "Bill #203 — ₹450 — Cash — Vikram"
- Payment received: "₹200 from Ramesh Bhaiya"
- Stock added: "Harpic 500ml +24 units"
- Expense: "Electricity — ₹1,200"
- Each item tappable → opens relevant detail screen

**Udhaar Summary Card**
- Total outstanding udhaar across all customers: ₹X,XXX
- Customers with udhaar > 30 days: N
- Tap → Customer list sorted by outstanding udhaar

**Supplier Pending Card**
- Total pending to suppliers: ₹X,XXX
- Tap → Supplier list sorted by pending amount

**Daily Closing Card** (shown if today's closing not yet done and time > configured closing time)
- Prominent reminder: "Daily closing not done"
- Expected cash based on sales: ₹X,XXX
- "Close Day" button

### 15.3 Dashboard Data Freshness

Dashboard data is served from local IndexedDB immediately on load (zero loading time). A background sync pull happens when the app is opened. If fresher data arrives, the dashboard updates smoothly without disrupting the user.

---

## 16. Product Inventory Module

### 16.1 Product Data Schema

```
PRODUCTS tab — Fast Layer columns:
product_id              | UUID, primary key
sku_code                | String (auto-generated or manual; unique)
barcode                 | String (optional; EAN-13 or custom)
name                    | String (canonical product name)
display_name            | String (short name shown in billing; defaults to name)
hinglish_aliases        | String (comma-separated alternate names; "vim,bartan sabun,dishwash bar")
brand                   | String
category_id             | UUID → CATEGORIES
subcategory             | String
image_url               | String (optional; Google Drive URL or base64 thumbnail)
base_unit               | Enum (piece | litre | ml | kg | gram | packet | dozen | box | carton)
purchase_unit           | Enum (same options)
selling_unit            | Enum (same options)
conversion_rate         | Number (how many base_units in one purchase_unit)
buy_price               | Number (per base_unit)
sell_price              | Number (per base_unit)
wholesale_price         | Number (per base_unit; optional)
mrp                     | Number (maximum retail price; optional)
current_stock           | Number (in base_units; computed from movement ledger)
reserved_stock          | Number (in base_units; held for unconfirmed transactions)
low_stock_limit         | Number (trigger for What Is Finishing alert)
reorder_quantity        | Number (suggested reorder quantity)
primary_supplier_id     | UUID → SUPPLIERS (optional)
secondary_supplier_id   | UUID → SUPPLIERS (optional)
tax_rate                | Number (GST percentage; 0, 5, 12, 18, 28; optional)
is_variant_parent       | Boolean
parent_product_id       | UUID (null if top-level product)
status                  | Enum (active | archived | discontinued)
version                 | Integer (increments on each update)
created_at              | DateTime
updated_at              | DateTime
created_by              | String (user_id)
updated_by              | String (user_id)
notes                   | String (optional internal notes)
```

### 16.2 Category Structure

**Predefined Categories (seeded on first setup):**

| Category | Subcategories |
|---|---|
| Cleaning Liquids | Toilet Cleaners, Floor Cleaners, Glass Cleaners, Disinfectants, Drain Cleaners |
| Detergents | Washing Powder, Liquid Detergent, Dishwash Bars, Dishwash Liquid |
| Tools & Equipment | Mops, Brooms, Brushes, Scrubbers, Gloves, Sponges |
| Plastics | Buckets, Mugs, Dustbins, Containers, Trays |
| Steel & Utensils | Vessels, Plates, Glasses, Tiffin Boxes, Spoons |
| Bathroom | Soap Dispensers, Toilet Brushes, Bath Accessories |
| Household | Agarbatti, Candles, Insect Repellent, Mousetraps |
| Miscellaneous | Uncategorized items |

Custom categories can be added by Owner from Settings > Categories.

### 16.3 Supported Units & Conversions

**Base Units:**
piece, litre, ml, kg, gram, packet, dozen, box, carton

**Conversion Reference Table (seeded, editable):**

| From | To | Rate |
|---|---|---|
| carton | piece | Configurable per product (usually 24) |
| dozen | piece | 12 |
| box | packet | Configurable per product (usually 10) |
| litre | ml | 1000 |
| kg | gram | 1000 |

**Conversion is stored per product**, not globally. A carton of Harpic may be 24 bottles but a carton of Vim bars may be 48. The `conversion_rate` field on the product holds this.

### 16.4 Product List Screen

**Layout:**
- Sticky search bar at top
- Category filter chips below search (horizontal scroll): All, Cleaning Liquids, Detergents, ...
- Product list below: card-based, 1 column on phones, 2 columns on tablets

**Product Card (in list view):**
- Product image (placeholder if none)
- Display name (bold)
- Brand and subcategory (muted text)
- Current stock (color-coded: green = OK, orange = low, red = zero)
- Sell price
- Quick "Add Stock" icon button (opens restock bottom sheet)

**Sort Options:**
- Name (A–Z)
- Stock: Low to High (default)
- Category
- Recently Updated
- Best Selling

**Filter Options:**
- By category
- By status (active only / show archived)
- Low stock only
- Out of stock only

### 16.5 Product Detail Screen

Opening a product shows:

**Header:** Product name, brand, category, image

**Stock Section:**
- Current stock with unit
- Low stock limit
- Reorder quantity
- "Adjust Stock" button (owner only; requires reason + PIN)

**Pricing Section:**
- Buy price
- Sell price
- Wholesale price (if set)
- MRP (if set)
- "Update Price" button (owner only)

**Sales History:**
- Chart: Units sold per day over last 30 days
- Total sold this month
- Total sold all time

**Stock Movement History:**
- List of all movements: date, type, quantity change, reason, user
- Filterable by movement type

**Supplier Information:**
- Primary and secondary supplier names
- Average buy price from each supplier

**Related Variants:**
- If this product has variants: shows sibling variants with their stock levels

**Actions:**
- Edit Product
- Archive Product (owner only, with confirmation)
- View Price History
- Share Product Info (WhatsApp share of product name + price + stock)

---

## 17. Product Variant System

### 17.1 Variant Architecture

Variants represent the same product in different sizes, formulations, or packaging. They share a parent product conceptually but are tracked as independent SKUs with independent stock.

**Structure:**
```
Parent: Harpic (display only, no stock)
  ├── Harpic 200ml (product_id: prod_X, stock: 45, sell_price: 35)
  ├── Harpic 500ml (product_id: prod_Y, stock: 12, sell_price: 75)
  └── Harpic 1L    (product_id: prod_Z, stock: 8,  sell_price: 130)
```

**Variant Fields:**
- `is_variant_parent`: true for the parent record
- `parent_product_id`: set on child variants, null on parent
- Parent has no stock, no price; it's a grouping record only

### 17.2 Variant UX in Billing

When a user searches for "Harpic" in billing:
1. Search results show the parent "Harpic" with a variant indicator
2. Tapping it opens a variant selector bottom sheet
3. Variant sheet shows: size, current stock, sell price for each variant
4. User selects the size they want
5. Selected variant added to cart

This prevents the helper from accidentally billing the wrong size.

### 17.3 Variant Creation

Owner can:
- Create a new product as a standalone product (no variants)
- Create a new product as a variant of an existing parent
- Convert an existing standalone product to a variant (assigns it a parent)
- Create a new parent and attach existing products as variants

---

## 18. Product Search & Discovery

### 18.1 Search Architecture

The product search runs entirely on local IndexedDB data. No network call is needed. This makes search instant even offline.

**Search Index (maintained in Dexie.js):**
- Indexed fields: `name`, `display_name`, `brand`, `sku_code`, `hinglish_aliases`
- Full-text search across all indexed fields
- Fuzzy matching with edit distance tolerance of 1 (handles single typos)

### 18.2 Search Algorithm

```
Search query: "harpic 5"
Steps:
1. Exact match: Find records where any indexed field starts with "harpic 5"
2. Word match: Find records where all words in query appear in any indexed field
3. Alias match: Find records where aliases contain "harpic" or "5"
4. Fuzzy match: If fewer than 3 results found: expand with edit-distance-1 matches
5. Rank results: exact matches first, then partial, then fuzzy
6. Filter: only active products
7. Return top 10 results
```

### 18.3 Hinglish Search Support

The `hinglish_aliases` field is populated during product creation and can include:
- Hindi transliterations: "harpic" → "toilet cleaner, toilet saaf karne wala"
- Common Hinglish names: "vim bar" → "bartan sabun, dishwash"
- Regional names: "jhadu" → "broom, jhadoo"
- Brand nicknames: "surf" → "washing powder, kapda dhone wala"

The setup guide suggests 3–5 aliases for common products. The system does not auto-generate aliases (AI feature for Phase 3).

### 18.4 Search UI

**Billing Screen Search:**
- Sticky search bar always visible at top of billing screen
- Results appear as a drop-down overlay on the cart
- Tapping a result adds to cart (if single variant) or opens variant selector
- Recent products shown below search bar when no query entered
- Favorite products shown as quick-tap chips below search bar

**Products Module Search:**
- Same search bar; results navigate to product detail page
- Category filter chips below search for further narrowing

**Keyboard Behavior:**
- Numeric keypad shown for quantity fields
- QWERTY keyboard shown for search
- Search field focuses automatically when Billing screen opens

---

## 19. Stock Movement System

### 19.1 Stock Movement Philosophy

The stock number is not stored directly. It is computed from the sum of all movement log entries. The Fast Layer caches the current stock for speed, but the STOCK_MOVEMENTS ledger is the truth.

**Why this matters:** If the Fast Layer ever gets corrupted (a concurrent write goes wrong, a manual sheet edit happens), the system can always recompute the correct stock from the movement log. This is the stock trust guarantee.

### 19.2 Stock Movement Schema

```
STOCK_MOVEMENTS tab columns:
movement_id             | UUID
product_id              | UUID → PRODUCTS
product_name_snapshot   | String (name at time of movement)
sku_code_snapshot       | String
movement_type           | Enum (see taxonomy below)
direction               | Enum (IN | OUT | ADJUSTMENT)
old_quantity            | Number (stock before this movement)
change_quantity         | Number (absolute value of change)
new_quantity            | Number (stock after this movement; old ± change)
source_type             | Enum (BILL | PURCHASE | RETURN | DAMAGE | ADJUSTMENT | OPENING | SYNC_CORRECTION)
source_id               | UUID (ID of the source record)
reason                  | String (required for adjustments)
cost_impact             | Number (estimated cost of this movement; for damage tracking)
unit                    | String (unit of measurement at time of movement)
created_by              | String (user_id)
device_id               | String
created_at              | DateTime
server_timestamp        | DateTime
client_action_id        | String
```

### 19.3 Movement Type Taxonomy

| Type | Direction | Triggered By |
|---|---|---|
| `opening_stock` | IN | First-time setup stock entry |
| `purchase` | IN | Supplier purchase entry |
| `purchase_free` | IN | Free items from supplier |
| `sale` | OUT | Bill creation |
| `customer_return_good` | IN | Return of sellable product |
| `customer_return_damaged` | No change | Return of damaged product (goes to damage register) |
| `supplier_return` | OUT | Returning goods to supplier |
| `damage` | OUT | Damaged/leaked/broken/expired |
| `manual_adjustment_in` | IN | Owner correction (with reason) |
| `manual_adjustment_out` | OUT | Owner correction (with reason) |
| `bill_cancelled` | IN | Stock restored when bill cancelled |
| `inventory_count_correction` | ADJUSTMENT | Physical count differs from system |
| `sync_correction` | ADJUSTMENT | System-initiated correction post conflict resolution |
| `restock_from_backroom` | IN | Moving stock from storage to display |

### 19.4 Stock Consistency Validation

On every stock movement, Apps Script runs:

```javascript
function validateStockMovement(product_id, change_quantity, direction) {
  const current_stock = getProductStock(product_id); // from Fast Layer
  const proposed_new = direction === 'OUT' 
    ? current_stock - change_quantity 
    : current_stock + change_quantity;
  
  if (proposed_new < 0 && !payload.allow_negative_stock) {
    return { valid: false, reason: "INSUFFICIENT_STOCK", available: current_stock };
  }
  return { valid: true, new_stock: proposed_new };
}
```

The `allow_negative_stock` flag can only be set if the owner explicitly approved the override in the UI.

---

## 20. Billing / POS Module

### 20.1 Billing Screen Design Philosophy

The billing screen must handle the most stressful moment in the store's day: a queue of customers waiting, a helper who may not know all the product names, a phone that may be slow, and internet that may be intermittent.

Every design decision on this screen is evaluated against: "Does this make billing faster, or does it add friction?"

### 20.2 Billing Screen Layout

**Top Bar:**
- Hold Bills indicator (shows count of holds, tappable)
- Current cart item count badge
- Sync status dot

**Search Bar (Sticky):**
- "Search product..." placeholder
- Always focused on screen open (keyboard ready)
- Voice search icon (Phase 2)

**Favorites Row (Horizontal Scroll):**
- 8–12 most-used products as quick-tap chips
- Each chip shows product name and sell price
- Long-press a chip to remove from favorites
- "Edit Favorites" button at end of row

**Cart Section:**
- List of cart items (product name, quantity, unit price, line total)
- Quantity stepper (−/+) per item
- Swipe left to remove item
- Per-item discount field (optional; collapsed by default)
- Cart is empty state: "No items yet. Search or tap a favorite to start."

**Cart Footer (Sticky):**
- Subtotal
- Total discount (if any)
- **Final Total** (large font, bold)
- "Checkout" button (full width, primary green, large)

### 20.3 Checkout Flow

**Step 1: Review Cart**
- Final cart review
- "Add More Items" button → returns to search
- "Apply Bill Discount" → flat rupee or percentage discount on entire bill
- Bill Notes field (optional; for internal reference)

**Step 2: Customer Selection (Optional)**
- "Walk-in Customer" (default) → no customer tracking
- Search for existing customer by name or phone
- "New Customer" → quick customer creation inline (name + phone)
- If customer has existing udhaar: shows current balance with flag

**Step 3: Payment Mode**
- Four mode buttons: Cash | UPI | Udhaar | Mixed
- **Cash:** Enter amount received (auto-calculates change due)
- **UPI:** Enter amount (optional: UPI reference number field)
- **Udhaar:** Full bill added to customer's udhaar. Customer must be selected.
- **Mixed:** Shows split entry fields for Cash + UPI + Udhaar with running total that must equal bill total

**Step 4: Confirm & Save**
- Final confirmation screen showing: customer name, items, total, payment mode breakdown
- "Confirm Bill" button (primary green)
- Bill save triggers: local IndexedDB write + queue to offline_queue + optimistic UI update

**Step 5: Bill Saved**
- Success screen with bill number
- "Share on WhatsApp" button → opens WhatsApp with bill summary
- "Print / View Bill" → opens formatted bill view
- "New Bill" button → clears cart and returns to billing screen

### 20.4 Bill Numbering System

- Bill numbers are sequential per day: B20240115-001, B20240115-002, etc.
- Format: `B{YYYYMMDD}-{3-digit-sequence}`
- Sequence resets daily
- If two devices create bills simultaneously offline, both use local sequence. Conflicts resolved on sync by renumbering one bill (original numbers preserved in audit log, display number updated).

### 20.5 Mixed Payment UX

The mixed payment screen shows a visual balance:

```
Bill Total:           ₹850.00
───────────────────────
Cash:         ₹ [500]
UPI:          ₹ [200]
Udhaar:       ₹ [150]
───────────────────────
Remaining:    ₹  0.00  ✓
```

The "Confirm Bill" button is disabled until "Remaining" equals zero. This prevents bills where the payment modes don't add up.

### 20.6 Hold Bill Workflow

**Scenario:** Customer says, "Wait, I'll get more items from home."

**Hold Flow:**
1. User taps "Hold Bill" (accessible from cart overflow menu)
2. App prompts for optional label: "Customer Name or Note"
3. Cart is saved locally as a hold with timestamp and label
4. User returns to empty billing screen, ready for next customer

**Restore Hold Flow:**
1. Hold bill indicator in header shows N held bills
2. Tap indicator → shows held bill list: label, items, total, time held
3. Tap any hold → confirms restore: "This will replace current cart"
4. Hold is restored; original cart items and quantities intact

**Auto-Expiry:**
- Holds older than 12 hours are automatically discarded (configurable)
- Owner receives notification: "2 held bills expired. Review if needed."

### 20.7 Failed Bill Recovery

**Problem:** User taps "Confirm Bill." App sends request. Internet drops. App shows error. User taps again.

**Without protection:** Two bills created for the same cart.

**Protection mechanism:**
1. "Confirm Bill" button is disabled immediately upon first tap (shows spinner)
2. A temporary `pending_bill_id` is stored in localStorage
3. If the request fails: Button re-enables after 3 seconds with retry option
4. If the request appears to succeed but confirmation is missing: App checks for existing bill with the same `client_action_id` before creating a new one
5. Server-side: `client_action_id` prevents double-creation even if two requests arrive

### 20.8 Quick Counter Mode

**Scenario:** Rush hour. Long queue. Owner wants fastest possible billing for known regular items.

**Quick Counter Mode features:**
- Full-screen grid of favorite products (6 per row)
- Each product shows: image/icon, name, price
- Tap adds 1 unit to cart; tap again adds another
- Running total visible at bottom right
- Cart sidebar slides in from right when cart is non-empty
- Single tap "Charge ₹XXX (Cash)" button for cash-only fast checkout
- No customer selection required; defaults to walk-in
- Quantity adjustment available in cart sidebar

**Activating Quick Counter Mode:**
- Billing screen → overflow menu → "Quick Counter Mode"
- Or: long press the billing tab

### 20.9 Billing Offline Behavior

When offline:
- All billing features work normally
- Stock is checked against local data
- Bill saved to local IndexedDB immediately
- "Saved Offline" indicator shown on success screen
- Bill queued for sync; syncs automatically when internet returns

**Risk communication:**
- If local stock shows product available but server stock may differ (last sync > 1 hour ago): subtle warning on product card: "Stock based on last sync 2 hours ago"
- User can proceed; server validates on sync

---

## 21. Customer & Udhaar Module

### 21.1 Customer Schema

```
CUSTOMERS tab — Fast Layer columns:
customer_id             | UUID
name                    | String
display_name            | String (nickname; "Corner Wale Ramesh")
phone                   | String (10 digits; optional but strongly recommended)
phone_secondary         | String (optional)
address                 | String (optional)
area                    | String (neighbourhood/area for delivery grouping)
customer_type           | Enum (retail | wholesale | regular)
opening_balance         | Number (udhaar at system start; positive = owes us)
current_udhaar          | Number (computed from ledger; cached in Fast Layer)
credit_limit            | Number (max udhaar allowed; 0 = no limit)
notes                   | String (internal notes)
tags                    | String (comma-separated custom tags)
status                  | Enum (active | archived)
version                 | Integer
created_at              | DateTime
updated_at              | DateTime
created_by              | String
last_transaction_at     | DateTime (for "inactive customer" detection)
```

### 21.2 Udhaar Ledger Schema

```
UDHAAR_LEDGER tab columns:
entry_id                | UUID
customer_id             | UUID
customer_name_snapshot  | String
entry_type              | Enum (see below)
bill_id                 | UUID (if linked to a bill)
amount                  | Number (positive = added to udhaar; negative = reduced)
payment_mode            | Enum (cash | upi | adjustment)
payment_reference       | String (UPI reference number; optional)
balance_after           | Number (customer balance after this entry; running total snapshot)
note                    | String
created_by              | String (user_id)
device_id               | String
created_at              | DateTime
server_timestamp        | DateTime
client_action_id        | String
```

**Entry Types:**

| Type | Description |
|---|---|
| `opening_balance` | Initial balance set during setup |
| `udhaar_added` | New sale on credit |
| `payment_received_cash` | Customer paid in cash |
| `payment_received_upi` | Customer paid via UPI |
| `return_adjustment` | Credit given for returned goods |
| `bill_cancelled_adjustment` | Udhaar reversed when bill cancelled |
| `manual_adjustment` | Owner-initiated correction with reason (requires PIN) |
| `partial_payment_on_new_bill` | Customer paid some old udhaar while buying new items |

### 21.3 Customer Profile Screen

**Customer Header:**
- Name and contact info
- Outstanding udhaar (large, colored: green = zero, orange = 1–limit, red = over limit)
- Last transaction date

**Quick Actions:**
- "Receive Payment" button → payment entry bottom sheet
- "New Bill for Customer" → opens billing with customer pre-selected
- "Share Statement" → WhatsApp share of udhaar history

**Udhaar Statement:**
- Chronological list of all udhaar ledger entries
- Each entry shows: date, type, amount, running balance, user who recorded it
- Filterable by date range
- Monthly summary view option

**Statistics:**
- Total purchased all time
- Total paid all time
- Average order value
- Days since last payment

### 21.4 Receiving Customer Payment

**Payment Entry Flow:**
1. Customer searches or selected from list
2. Current balance shown prominently
3. Payment amount field (defaults to full balance)
4. Payment mode: Cash / UPI
5. UPI reference number field (if UPI selected)
6. Optional note: "Paid for Diwali shopping"
7. Confirm → updates udhaar ledger → updates Fast Layer

**Partial Payment Support:**
Customer owes ₹800. Pays ₹300 today. System records ₹300 payment and leaves ₹500 outstanding.

**Payment During New Bill:**
Scenario: Customer buys ₹200 of goods, owes ₹800 from before, pays ₹500 total.
- Create bill for ₹200 as udhaar (adds to balance, now ₹1000)
- Record ₹500 payment separately (balance becomes ₹500)
- OR: Create bill for ₹200, in payment section: "Cash ₹300 + Udhaar ₹(-300 existing payment)" [Mixed mode that supports previous balance reduction]

The simpler approach (recommended for MVP): Record the payment separately, then create the bill. Linked but independent operations.

### 21.5 Convert Bill to Udhaar

**Scenario:** Bill was created as "Cash ₹500" but customer says, "Kal de dunga."

**Conversion Flow:**
1. Open the bill
2. "Change Payment Mode" button (visible for today's bills only; owner PIN required)
3. Confirmation: "This will convert ₹500 cash to udhaar for [Customer Name]. Are you sure?"
4. System: Reverses the cash payment entry. Creates a new udhaar_added entry. Updates customer balance. Updates AUDIT_LOG with full before/after.
5. Daily totals updated: Cash decreases, Udhaar increases, Total unchanged.

**Restriction:** Can only convert same-day bills. Bills from previous days require a manual adjustment workflow with explicit owner approval.

### 21.6 Customer Deduplication

On customer creation, if a phone number matches an existing customer, the system warns: "A customer with this phone number already exists: [Name]. Is this the same person?" Options: Use existing customer / Create as new (if different person with same number).

### 21.7 Udhaar Credit Limit Enforcement

If a customer has a credit limit set and a new bill would exceed it:
- Warning shown: "This customer's udhaar will be ₹X,XXX after this bill, exceeding their limit of ₹Y,YYY."
- Options: Proceed (requires owner PIN) / Collect partial payment first / Change payment mode

---

## 22. Supplier Management

### 22.1 Supplier Schema

```
SUPPLIERS tab columns:
supplier_id             | UUID
name                    | String
contact_person          | String (optional)
phone                   | String
phone_secondary         | String (optional)
address                 | String
area                    | String
primary_categories      | String (comma-separated categories they supply)
products_supplied       | String (brief description)
payment_terms           | String (e.g., "30 days credit", "cash on delivery")
pending_amount          | Number (computed from ledger; cached)
notes                   | String
status                  | Enum (active | archived)
version                 | Integer
created_at              | DateTime
updated_at              | DateTime
```

### 22.2 Supplier Ledger Schema

```
SUPPLIER_LEDGER tab columns:
entry_id                | UUID
supplier_id             | UUID
supplier_name_snapshot  | String
entry_type              | Enum (see below)
purchase_id             | UUID (if linked to a purchase)
amount                  | Number (positive = we owe more; negative = we paid)
payment_mode            | Enum (cash | upi | cheque | bank_transfer)
payment_reference       | String (cheque number, UPI ref; optional)
balance_after           | Number (running balance snapshot)
note                    | String
created_by              | String
created_at              | DateTime
client_action_id        | String
```

**Entry Types:**

| Type | Description |
|---|---|
| `opening_pending` | Initial balance at system start |
| `purchase_pending` | New purchase on credit |
| `purchase_cash` | Cash purchase (no pending added) |
| `payment_made_cash` | We paid supplier in cash |
| `payment_made_upi` | We paid supplier via UPI |
| `payment_made_cheque` | We paid by cheque |
| `return_adjustment` | Supplier accepted return, reduced our pending |
| `manual_adjustment` | Owner correction with reason |

### 22.3 Supplier Profile Screen

Similar to customer profile with:
- Outstanding pending balance prominently displayed
- "Record Payment" button
- Purchase history list
- Return history list
- "Call Supplier" button (opens phone dialer with supplier's number)

---

## 23. Purchase Entry & Restock Module

### 23.1 Purchase Entry Purpose

Purchase entry records when new stock arrives from a supplier. It:
- Increases product stock via stock movements
- Creates a supplier ledger entry for the amount
- Provides an invoice record for accounting

### 23.2 Purchase Header Schema

```
PURCHASES tab columns:
purchase_id             | UUID
supplier_id             | UUID
supplier_name_snapshot  | String
invoice_number          | String (supplier's invoice number; optional)
invoice_photo_url       | String (Google Drive URL of photo; optional)
purchase_date           | Date
total_amount            | Number (total value of purchase)
paid_amount             | Number (amount paid immediately)
pending_amount          | Number (total_amount - paid_amount)
payment_status          | Enum (paid | partial | pending)
payment_mode            | Enum (cash | upi | cheque | credit)
payment_reference       | String (optional)
notes                   | String
created_by              | String
device_id               | String
created_at              | DateTime
client_action_id        | String
```

### 23.3 Purchase Item Schema

```
PURCHASE_ITEMS tab columns:
item_id                 | UUID
purchase_id             | UUID
product_id              | UUID
product_name_snapshot   | String
quantity                | Number (in purchase_unit)
purchase_unit           | String
conversion_to_base      | Number (computed from product's conversion_rate)
quantity_in_base        | Number (quantity * conversion_to_base)
buy_price               | Number (per purchase_unit; as on this invoice)
total_cost              | Number
free_quantity           | Number (free items from supplier; default 0)
free_quantity_in_base   | Number
is_price_changed        | Boolean (true if different from product's stored buy_price)
```

### 23.4 Purchase Entry Workflow

**Step 1: Select Supplier**
- Search or select from supplier list
- "New Supplier" option to add inline

**Step 2: Purchase Details**
- Invoice number (optional)
- Invoice date (defaults to today)
- Invoice photo (optional; opens camera or file picker)

**Step 3: Add Items**
- Search product
- Enter quantity in purchase unit (e.g., 2 cartons)
- Auto-shows conversion: "2 cartons = 48 pieces"
- Enter buy price per purchase unit
- If buy price differs from stored buy price: Flag shown; option to update product's buy price
- Free quantity field (e.g., "1 free bottle") — optional
- "Add Item" button adds to purchase list
- Repeat for all items

**Step 4: Review**
- List of all purchase items
- Computed total
- Subtotal, any discount from supplier (optional field)

**Step 5: Payment**
- "Paid Now" toggle
- If partially paid: Enter paid amount; pending auto-calculated
- Payment mode: Cash / UPI / Cheque / Credit (full credit)

**Step 6: Confirm**
- All items stocked in (stock_movement created for each item)
- Supplier ledger updated
- Purchase record saved

### 23.5 Free Item Workflow

Supplier provides: "Buy 12 Harpic 500ml, get 1 free"

In purchase entry:
- Item: Harpic 500ml
- Quantity: 12 bottles
- Buy price: ₹65/bottle
- Free quantity: 1 bottle
- Total cost: ₹780 (12 × ₹65; free not counted in cost)

System creates two stock movements:
1. Type `purchase`: +12 units at ₹65 each
2. Type `purchase_free`: +1 unit at ₹0

Profit calculation later correctly excludes free item from cost basis.

### 23.6 Duplicate Invoice Protection

If an invoice number is entered that matches a recent purchase from the same supplier, the system warns: "A purchase with invoice #INV-234 from this supplier was recorded on [date]. Is this a different delivery?" This prevents double-entering the same supplier invoice.

### 23.7 Quick Restock

For fast restocking without a full purchase entry:
- From Products list: Long-press a product → "Quick Restock"
- Enter quantity and buy price
- Select supplier (optional)
- Saves as an informal purchase linked to that supplier

Not recommended as primary workflow; full purchase entry is always preferred. Quick restock should be used only when supplier invoice will be entered later.

---

## 24. Returns & Exchange System

### 24.1 Return Categories

Returns fall into four distinct scenarios, each handled differently:

**Scenario A: Customer Returns Sellable Product**
Product is in perfect condition. Can be put back on shelf.
→ Stock increases by returned quantity
→ Customer gets refund or store credit

**Scenario B: Customer Returns Damaged/Unusable Product**
Product is damaged, leaked, or wrong item entirely.
→ Product goes to Damage Register (not back to stock)
→ Customer gets refund or store credit

**Scenario C: Exchange**
Customer returns one product for a different product.
→ Atomic operation: return old product + new bill for new product
→ Price difference settled in the exchange

**Scenario D: Supplier Return**
We return defective or wrong products to supplier.
→ Stock decreases by returned quantity
→ Supplier pending reduced (or supplier owes us cash)

### 24.2 Return Schema

```
RETURNS tab columns:
return_id               | UUID
return_type             | Enum (customer_sellable | customer_damaged | exchange | supplier)
original_bill_id        | UUID (if linked to a bill; optional for some supplier returns)
original_purchase_id    | UUID (for supplier returns)
customer_id             | UUID (for customer returns)
supplier_id             | UUID (for supplier returns)
return_date             | Date
items                   | JSON array of return items
total_refund_amount     | Number
refund_mode             | Enum (cash | upi | store_credit | udhaar_adjustment)
stock_action            | Enum (return_to_stock | damage_register)
reason                  | String
notes                   | String
created_by              | String
created_at              | DateTime
client_action_id        | String
```

### 24.3 Customer Return Workflow

**Step 1: Initiate Return**
- Customer Returns section in More menu
- Or: Open original bill → "Return Items"

**Step 2: Select Items to Return**
- If linked to bill: shows bill items; check items being returned
- If no bill: manually select product and quantity

**Step 3: Condition Assessment**
- For each returned item: "Good condition (can resell)" or "Damaged/Unusable"
- Good condition items → go back to stock
- Damaged items → go to Damage Register

**Step 4: Refund Method**
- Cash refund
- UPI refund
- Adjust against customer's udhaar (reduce what they owe)
- Store credit (udhaar goes negative; credit for future purchase)

**Step 5: Confirm**
- Stock movements created for returned items
- Udhaar ledger updated (if udhaar adjustment)
- Damage register updated (if damaged items)
- Return record created

### 24.4 Exchange Workflow

**Step 1:** Start return for item A
**Step 2:** System shows return amount for item A
**Step 3:** User selects exchange product B
**Step 4:** If B > A: Customer pays difference (cash/UPI)
**Step 5:** If B < A: Refund given or credited to udhaar
**Step 6:** System creates: Return record + new Bill record as a linked pair
**Step 7:** Net stock change: +item A (if sellable), -item B

---

## 25. Damage & Wastage Register

### 25.1 Purpose

Track every product that cannot be sold: broken, leaked, expired, stolen, or simply lost. This is critical for understanding true profit and for insurance or tax purposes.

### 25.2 Damage Schema

```
DAMAGES tab columns:
damage_id               | UUID
product_id              | UUID
product_name_snapshot   | String
quantity                | Number
unit                    | String
reason                  | Enum (broken | leaked | expired | theft | fire | water | rodent | other)
reason_detail           | String (optional additional description)
estimated_cost          | Number (quantity × buy_price at time of damage)
photo_url               | String (optional Google Drive URL)
reported_by             | String (user_id)
approved_by             | String (owner user_id; required before stock is deducted)
approval_status         | Enum (pending_approval | approved | rejected)
approval_note           | String
created_at              | DateTime
approved_at             | DateTime
```

### 25.3 Damage Workflow

**Reporting Damage (any role):**
1. More > Damage Register > Report Damage
2. Select product
3. Enter quantity and reason
4. Optional: Photo of damaged goods
5. Submit → status: `pending_approval`

**Approving Damage (owner only):**
1. Dashboard alert: "2 damage reports need approval"
2. Owner reviews each report
3. Options: Approve (stock deducted) / Reject (stock not changed; reason logged) / Modify quantity
4. On approval: stock_movement created with type `damage`

**Why approval step:** Prevents helpers from using damage entry to cover billing errors or theft without owner awareness.

---

## 26. Price History & Bulk Price Update

### 26.1 Price History Schema

```
PRICE_HISTORY tab columns:
history_id              | UUID
product_id              | UUID
product_name_snapshot   | String
old_buy_price           | Number
new_buy_price           | Number
old_sell_price          | Number
new_sell_price          | Number
old_wholesale_price     | Number
new_wholesale_price     | Number
change_reason           | Enum (supplier_rate_change | market_adjustment | bulk_update | correction)
change_note             | String
effective_from          | Date
changed_by              | String
changed_at              | DateTime
client_action_id        | String
```

### 26.2 Price Update Workflow

**Single Product Price Update:**
1. Open product detail
2. Tap "Update Price"
3. Shows current prices; edit any field
4. Select reason
5. PIN required (owner only)
6. Confirm → new prices saved, old prices archived in price history

**Important:** Price changes do not retroactively affect past bills. Historical bills show the price at the time of billing (snapshot field).

### 26.3 Bulk Price Update

**Scenario:** Supplier increases prices by 8%. All Harpic products need price updates.

**Bulk Price Update Workflow:**
1. Settings > Bulk Price Update
2. Filter products: by supplier, brand, category, or manual selection
3. Update method selection:
   - Percentage increase: +8% on buy price
   - Percentage increase with margin: +8% on buy price, auto-compute sell price at 20% margin
   - Fixed increase: +₹5 on sell price
   - Set specific price: Useful for a batch of related products
4. Preview shows: Table of old price → new price for each affected product
5. Owner reviews and can deselect any products
6. PIN confirmation
7. Bulk update applied; price history created for each updated product

### 26.4 Margin Helper

When updating prices, a "Margin Helper" panel shows:
```
Buy Price:    ₹65
Sell Price:   ₹85
Margin:       ₹20 (23.5%)
```

This helps the owner set a healthy margin without mental arithmetic.

---

## 27. Expense Module

### 27.1 Expense Schema

```
EXPENSES tab columns:
expense_id              | UUID
category                | Enum (see categories below)
subcategory             | String (optional custom detail)
amount                  | Number
payment_mode            | Enum (cash | upi | cheque | credit)
payment_reference       | String (optional)
expense_date            | Date
description             | String
vendor                  | String (optional)
receipt_photo_url       | String (optional)
created_by              | String
created_at              | DateTime
client_action_id        | String
```

### 27.2 Expense Categories

| Category | Common Uses |
|---|---|
| Rent | Monthly shop rent, godown rent |
| Electricity | Electricity bill, extension cord, fan repair |
| Salary | Helper salary, delivery boy payment |
| Transport | Auto, tempo for goods delivery/pickup |
| Stock Purchase | Informal purchases not linked to a supplier |
| Packaging | Carry bags, boxes, tape, wrapping |
| Repairs & Maintenance | Shelf repair, lock replacement, display unit |
| Fees & Taxes | Municipal tax, shop license, GST filing |
| Personal Withdrawal | Owner takes cash from drawer for personal use |
| Communication | Mobile recharge, internet bill |
| Miscellaneous | Anything else |

### 27.3 Personal Withdrawal

A common Indian shop scenario: the owner takes cash from the drawer for household expenses. This must be tracked as an expense (category: Personal Withdrawal) to prevent daily closing mismatches.

The system should nudge the owner to record personal withdrawals from the dashboard if cash is consistently short at day end.

### 27.4 Expense Entry UX

Optimized for speed:
- Quick entry bottom sheet (accessible from dashboard Quick Actions)
- Category selector (large icon grid)
- Amount field (numeric keypad)
- Date (defaults to today)
- Description (optional, but shown as suggestion based on category)
- Save button → expense recorded immediately

---

## 28. Daily Closing System

### 28.1 Daily Closing Philosophy

The daily closing is the most important operational ritual. It answers: "Did today's business make sense?" It reconciles what the system says should be in the drawer with what is physically there.

### 28.2 Daily Closing Schema

```
DAILY_CLOSINGS tab columns:
closing_id              | UUID
closing_date            | Date (unique per date)
opening_cash            | Number
total_sales             | Number
cash_sales              | Number
upi_sales               | Number
udhaar_sales            | Number
mixed_payment_cash      | Number
mixed_payment_upi       | Number
mixed_payment_udhaar    | Number
cash_payments_received  | Number (udhaar payments collected in cash)
upi_payments_received   | Number (udhaar payments collected via UPI)
returns_cash            | Number (refunds given in cash)
expenses_cash           | Number (cash expenses paid)
expected_cash           | Number (computed; see formula)
actual_cash             | Number (owner counts physically)
cash_difference         | Number (actual - expected)
difference_note         | String (owner's explanation of difference)
total_bills             | Integer
cancelled_bills         | Integer
total_udhaar_outstanding| Number (snapshot of all customer udhaar at closing)
total_supplier_pending  | Number (snapshot)
closed_by               | String
closed_at               | DateTime
reopened_by             | String (if reopened)
reopened_at             | DateTime
reopen_reason           | String
status                  | Enum (open | closed | reopened)
```

### 28.3 Expected Cash Formula (Detailed)

```
Expected Cash in Drawer =
  Opening Cash
  + Cash Sales (from bills where payment_mode includes cash)
  + Cash collected from udhaar payments
  − Cash refunds given on returns
  − Cash expenses paid
  − Personal withdrawals (if recorded separately)

Formula:
expected_cash = opening_cash 
              + cash_sales 
              + mixed_payment_cash 
              + cash_payments_received
              - returns_cash 
              - expenses_cash
```

**Example:**
```
Opening Cash:              ₹  500
+ Cash Sales:              ₹3,200
+ Mixed Bill Cash:         ₹  800
+ Udhaar Cash Received:    ₹  600
- Cash Returns Given:      ₹  (150)
- Cash Expenses:           ₹  (350)
────────────────────────────────
Expected Cash:             ₹4,600
Physical Count:            ₹4,580
Difference:                ₹   (20)   ← Likely change given wrong
```

### 28.4 Daily Closing Workflow

**Step 1: Auto-Summary**
System shows pre-filled summary of the day:
- Total bills: N (with total ₹X)
- Breakdown by payment mode
- Expenses total
- Returns total
- Udhaar collected

**Step 2: Cash Count**
- Owner physically counts cash in drawer
- Enters actual cash amount
- System immediately shows expected vs actual difference
- If difference is within ₹20: "Close enough — accept" option available
- If difference > ₹20: Must enter explanation in "Difference Note" field

**Step 3: Review**
- All bills for the day (expandable list)
- Any cancelled bills highlighted
- Udhaar given today and collected today
- Expenses for the day

**Step 4: Owner Confirmation**
- Owner reviews and taps "Close Day"
- PIN required
- Daily closing submitted

**Step 5: Closing Report**
- Auto-generated daily closing summary
- Available for WhatsApp share or PDF export
- Tomorrow's opening cash = today's actual cash (carried forward)

### 28.5 Reopening a Closed Day

If a mistake is found after closing:
1. More > Daily Closing > Select date > "Reopen"
2. PIN required
3. Reason for reopening must be entered
4. Day reopened; corrections can be made
5. Must be re-closed with PIN
6. Both closings logged in AUDIT_LOG

**Restriction:** Only the current day or previous day can be reopened. Days older than 2 days require a special recovery workflow from Settings.

### 28.6 Day-End Reminders

- Push notification at configured closing time: "Time to close the day. Today's sales: ₹X,XXX"
- Dashboard shows prominent banner if yesterday's closing was not done
- First action on app open shows modal if closing has been pending for > 24 hours

---

## 29. Reports Module

### 29.1 Report Philosophy

Reports must be simple enough for an owner who has never used business software. No pivot tables, no complex filters by default. Present the most important number first; let the owner drill down if needed.

### 29.2 Report Types

**29.2.1 Daily Report**
- Available for any specific date
- Shows: Total sales by mode, top products sold, expenses, udhaar added, udhaar collected, closing difference
- Source: BILLS + EXPENSES + UDHAAR_LEDGER for that date

**29.2.2 Date Range Sales Report**
- Select any date range (up to 90 days)
- Shows: Day-by-day sales bar chart, total summary, average daily sale, best day, worst day
- Drillable: tap any day → that day's detailed report

**29.2.3 Monthly Summary Report**
- Pre-built for each month
- Shows: Total sales, total expenses, estimated gross profit, top 10 products, udhaar summary
- Month-over-month comparison (current vs previous month)

**29.2.4 Product Sales Report**
- All products sorted by revenue (default) or quantity sold
- Filterable by category, date range
- Each product shows: units sold, total revenue, estimated profit, sell-through rate

**29.2.5 Stock Report**
- Current stock of all products
- Color-coded by stock health (healthy / low / zero)
- Purchase history per product
- Last received date per product

**29.2.6 Udhaar Report**
- All customers with outstanding balance
- Sorted by: highest balance, oldest unpaid, most transactions
- Customer-level drill-down with full ledger history

**29.2.7 Supplier Report**
- All suppliers with pending balance
- Purchase history by supplier
- Supplier-level drill-down

**29.2.8 Expense Report**
- Expenses by category for a date range
- Monthly expense trend chart
- Category breakdown pie chart (simple)

**29.2.9 Profit Report (Estimated)**
- Clearly labeled: "Estimated — based on buy price at time of purchase"
- Gross margin per product (sell price - buy price × quantity sold)
- Total estimated gross profit for the period
- Note: Does not account for overhead expenses; owner must subtract manually

**Profit Reporting Disclaimer** (shown on every profit report screen):
> "This is an estimated profit based on the buy prices recorded in this system. It does not include operating expenses (rent, salary, electricity). Actual profit may differ. For tax purposes, consult an accountant."

**29.2.10 Damage/Wastage Report**
- All damage entries for a date range
- Total cost impact of damage
- Reason breakdown (broken vs leaked vs expired)

### 29.3 Report UX

- All reports default to "This Month"
- Date range selector is a standard calendar picker
- Charts use simple bar or line charts (Recharts library)
- "Export as PDF" available for all reports
- "Share on WhatsApp" available for summary reports
- Reports are generated from local IndexedDB data for speed; a "Refresh from Server" option pulls latest data

### 29.4 GST-Related Reporting

If products have tax rates set:
- Bills show GST breakup (before tax + GST amount)
- GST summary available in Monthly Report: "Total GST collected: ₹X,XXX"

This is informational only. The system does not file GST returns. The owner uses this information when working with their CA.

---

## 30. Inventory Count Mode

### 30.1 Purpose

Monthly or quarterly physical stock verification. The system count may drift from physical reality due to: helper billing errors, unrecorded damage, theft, or miscounted restock. Inventory Count Mode lets the owner correct this systematically.

### 30.2 Inventory Count Workflow

**Step 1: Start Count**
- More > Inventory Count > Start New Count
- PIN required
- Select: Full count / Category-specific count
- System enters "Count Mode" — billing continues but stock adjustments are paused pending count completion

**Step 2: Count Products**
- Product list shown with: product name, system stock (hidden by default to avoid anchoring bias)
- Owner counts physical units
- Enters actual count per product
- Option to show system stock: "Reveal System Count" (useful for verification, but biases counting)

**Step 3: Discrepancy Review**
- System compares entered counts to system counts
- Shows products with discrepancies, sorted by magnitude
- For each discrepancy: old count, new count, difference
- Reason field for significant discrepancies (> configured threshold; default 5 units)

**Step 4: Approve Adjustments**
- Owner reviews and approves each adjustment
- Can override individual adjustments with correct quantities
- Bulk "Approve All" option

**Step 5: Apply Count**
- Stock movements created: type `inventory_count_correction`
- Fast Layer updated
- Count record saved with date, who did it, and all adjustments
- AUDIT_LOG records all corrections

### 30.3 Partial Count

For large inventories, the count can be done category by category over several days. Each category count is saved independently. The full count is considered complete when all categories are marked counted.

---

## 31. What Is Finishing (Low Stock Center)

### 31.1 Purpose

This is the reorder management center. "Finishing" is the Indian shopkeeper term for "running out." This module answers: "What do I need to buy soon?"

### 31.2 Data Sources

Products appear in What Is Finishing when:
- `current_stock <= low_stock_limit` (configurable per product)
- `current_stock == 0` (out of stock; shown with red badge)
- The product's sell rate suggests it will run out within 3 days (computed from recent sales velocity)

### 32.3 Screen Layout

**Header:**
- Count of products needing attention
- "Create Purchase Order" button

**Tabs:**
- **Out of Stock** (0 units): red; most urgent
- **Low Stock**: orange; approaching limit
- **Running Fast**: yellow; sell velocity suggests shortage soon

**Per-Product Card:**
- Product name and brand
- Current stock
- Low stock limit
- "Last Reordered" date and quantity
- "Days Until Out" estimate (based on 7-day average sales)
- Primary supplier name
- "Order from [Supplier]" shortcut button
- "Mark as Ordered" — removes from urgent list; shows "Ordered, awaiting delivery" badge

### 31.4 Smart Reorder Suggestion

When "Order from Supplier" is tapped:
- Pre-fills a purchase entry with this product
- Suggested quantity = reorder_quantity set on the product
- Supplier pre-selected as primary supplier

Multiple "Order" taps from different products with the same supplier accumulate into a single draft purchase order.

### 31.5 Low Stock Limit Management

Low stock limits are set per product. The system suggests a sensible default during product creation based on the average daily sales velocity (if sales data exists). Owner can override.

---

## 32. Operational Alerts & Smart Daily Tasks

### 32.1 Alert System Architecture

Alerts are generated locally based on data in IndexedDB. No server request required. Alerts are evaluated:
- On app open
- Every 30 minutes while app is active
- When relevant data changes (after a bill is created, after sync completes)

### 32.2 Alert Types

| Alert | Trigger | Urgency | Action |
|---|---|---|---|
| Low Stock | product.current_stock <= low_stock_limit | Medium | View → What Is Finishing |
| Out of Stock | product.current_stock == 0 | High | View → What Is Finishing |
| Sync Failed | queue item in FAILED status | High | View → Sync Center |
| Sync Pending | queue items > 10 for > 30 min | Medium | Retry → Sync Center |
| Negative Stock Detected | current_stock < 0 | High | Review → Product |
| High Customer Udhaar | customer udhaar > configured limit | Medium | View → Customer |
| Udhaar Overdue | customer udhaar_added_at > 30 days | Medium | View → Customer |
| Daily Closing Pending | no closing for today after configured time | High | Close → Daily Closing |
| Backup Overdue | no export in > 30 days | Low | Backup → Backup Center |
| Damage Pending Approval | damage entries in pending_approval status | Medium | Review → Damage Register |
| Device Not Synced | device last_sync_at > 48 hours | High | Check → Sync Center |
| Stock Count Overdue | no inventory count in > 90 days | Low | Count → Inventory Count |

### 32.3 Smart Daily Tasks Panel

The home dashboard shows a "Things to Do Today" card with 3–5 contextual tasks:

```
Today's Tasks
─────────────────────────────────
⚠️  3 products are out of stock → Order Now
✓  Daily closing done yesterday
📋  Inventory count overdue (last: 45 days ago) → Start Count
💰  Ramesh Bhaiya owes ₹1,200 for 38 days → Send Reminder
🔄  7 actions pending sync → Sync Now
```

Tasks are personalized based on store's actual data. They update throughout the day.

---

## 33. WhatsApp Integration

### 33.1 WhatsApp as the Primary Sharing Layer

WhatsApp is used by essentially all Indian shopkeepers and their customers. The app uses WhatsApp as its primary external communication channel for:
- Sending bills to customers
- Sending udhaar statements to customers
- Sending reorder reminders (to self or to family)
- Sharing daily closing summary
- Sharing monthly reports

### 33.2 WhatsApp Bill Message Format

```
*Anupurna Traders*
📍 [Store Address]

*Bill #B20240115-023*
📅 15 Jan 2024, 3:45 PM

*Items:*
• Harpic 500ml × 2 = ₹150
• Vim Liquid 500ml × 1 = ₹65
• Bucket (Red) × 1 = ₹120

─────────────────
*Total: ₹335*
Paid: Cash ₹335

UPI: 7890XXXXXX@upi
*Thank you! Come again 🙏*
```

The format is pre-built. The "Share on WhatsApp" button opens the WhatsApp share sheet with this message pre-filled. The customer's number is pre-populated if they have a phone on file.

### 33.3 WhatsApp Udhaar Statement Format

```
*Anupurna Traders — Udhaar Account*
Customer: Ramesh Bhaiya
As of: 15 Jan 2024

📊 *Statement:*
10 Jan - Udhaar added: ₹450
12 Jan - Payment received: ₹200
15 Jan - Udhaar added: ₹335

─────────────────
*Outstanding Balance: ₹585*

Please pay at your convenience.
UPI: 7890XXXXXX@upi
```

### 33.4 WhatsApp Daily Closing Summary

Sent to the owner (self or family group):
```
*Anupurna Traders — Day End Summary*
📅 15 January 2024

💰 Total Sales: ₹4,850
  Cash: ₹2,800
  UPI: ₹1,400
  Udhaar: ₹650

🧾 Bills: 34 (3 cancelled)
💸 Expenses: ₹450
📦 Udhaar Collected: ₹600
📊 Closing Difference: -₹20

✅ Day closed by Vikram at 9:15 PM
```

### 33.5 Technical Implementation

WhatsApp sharing uses the `whatsapp://send?text=...` deep link on mobile. This opens WhatsApp with the message pre-filled. No WhatsApp Business API is needed — the system works with a basic WhatsApp account.

URL encoding is applied to the message text before passing it in the URL.

---

## 34. Backup & Restore System

### 34.1 Backup Philosophy

Data in Google Sheets is inherently cloud-backed by Google. However, the store needs its own backup mechanism for two reasons:
1. If the Google Sheet is accidentally deleted or corrupted
2. If the Apps Script deployment changes in a way that corrupts data
3. To have a local copy independent of Google

### 34.2 Backup Types

**Full Backup (JSON):**
A complete export of all data from all Google Sheets tabs in JSON format. Can be used to fully restore the system to a new Google Sheet. Recommended: Monthly.

**Product Catalog (CSV):**
All products with current stock, prices, and settings. Useful for importing into another system or reviewing outside the app. Recommended: Weekly.

**Customer & Udhaar (CSV):**
All customers and their current balance. Useful for dispute resolution.

**Bills Archive (CSV):**
All bills for a date range. Useful for accounting purposes.

**Monthly Report (PDF):**
The monthly financial summary as a printable PDF. Useful for owner records and CA/accountant.

### 34.3 Backup Workflow

**Manual Backup:**
1. More > Backup & Restore > Create Backup
2. Select backup type
3. System fetches data from Google Sheets
4. File downloaded to device storage or shared via WhatsApp/Google Drive

**Scheduled Backup Reminder:**
- If no backup taken in 30 days: Dashboard alert + notification reminder
- Reminder time configurable (default: 1st of each month, 9 AM)

### 34.4 Restore Workflow

**Restore from Full Backup:**
1. More > Backup & Restore > Restore from Backup
2. PIN required
3. Warning: "This will overwrite all current data. This cannot be undone."
4. Upload the JSON backup file
5. System validates the file format and version
6. Restore runs: clears all tabs, imports all data from backup
7. Fast Layer is rebuilt after restore

**Restore is a destructive operation.** It requires double confirmation: once after file selection, once after file validation.

### 34.5 Backup Storage

Backups are stored on the user's device (downloads folder) or shared to Google Drive / WhatsApp. The app does not maintain a cloud backup independently — it relies on the user to store the exported files.

Recommendation (shown during backup): "Store your backup in Google Drive or email it to yourself for safekeeping."

---

## 35. Sync Center

### 35.1 Sync Center Purpose

The Sync Center is the transparency layer of the sync system. It tells the owner exactly what is happening with their data's journey to the cloud.

### 35.2 Sync Center Sections

**Status Header:**
- Large status indicator: Fully Synced / Syncing (with progress) / X Pending / Sync Error
- Last sync timestamp
- Current connectivity indicator

**Pending Actions:**
- Count of actions waiting to sync
- "Sync Now" button (triggers immediate sync attempt)
- List of pending actions (action type, created time)
- Each expandable to see payload summary

**Failed Actions:**
- Actions that exceeded all retries
- Per action: Retry button / View Details / Discard
- Discard removes from queue; owner must verify if action needs manual correction

**Conflict Resolution Queue:**
- Active conflicts requiring owner decision
- Each conflict shown with: what happened, what the conflict is, options
- Conflicts must be resolved before the related data is finalized

**Sync Log (Expandable):**
- Last 50 sync events with timestamps and outcomes
- Useful for debugging unexplained discrepancies

**Multi-Device Sync Status:**
- List of registered devices and their last sync time
- Flag devices not synced in > 24 hours

---

## 36. Mobile UX System & Design Language

### 36.1 Design System Tokens

**Color Palette:**

| Token | Hex | Usage |
|---|---|---|
| Primary Green | #16A34A | Buttons, active states, positive values |
| Deep Green | #166534 | Headers, pressed states |
| Clean Blue | #0EA5E9 | Links, info states, UPI related |
| Background | #F8FAFC | Screen backgrounds |
| Surface | #FFFFFF | Cards, sheets, modals |
| Text Primary | #111827 | Main text |
| Text Secondary | #6B7280 | Labels, muted text |
| Border | #E5E7EB | Card borders, dividers |
| Warning | #F59E0B | Low stock, pending alerts |
| Danger | #DC2626 | Errors, negative values, out of stock |
| Success | #22C55E | Confirmed actions, healthy stock |
| Udhaar Orange | #EA580C | Udhaar-related values |
| Supplier Purple | #7C3AED | Supplier-related values |

**Dark Mode:** Phase 2. Not in MVP.

**Typography Scale:**

| Token | Size | Weight | Usage |
|---|---|---|---|
| Display | 28px | 700 | Total amounts, key numbers |
| Heading 1 | 22px | 700 | Screen titles |
| Heading 2 | 18px | 600 | Section headers |
| Body Large | 16px | 400 | Primary body text |
| Body | 14px | 400 | Secondary text, labels |
| Caption | 12px | 400 | Timestamps, metadata |
| Button | 15px | 600 | Button labels |

**Font:** System font stack (Roboto on Android, San Francisco on iOS). No custom fonts in MVP.

**Spacing Scale:** 4px base unit. Common values: 4, 8, 12, 16, 20, 24, 32, 48px.

**Border Radius:** Cards: 12px. Buttons: 8px. Chips: 20px (fully rounded). Modals: 16px.

### 36.2 Touch Target Standards

- Minimum touch target: 48×48 pixels (Google Material standard)
- Preferred touch target for primary actions: 56×56 pixels or full-width
- Spacing between adjacent touch targets: minimum 8px
- No targets smaller than 44×44 pixels (Apple HIG minimum)

### 36.3 Loading States

Every async operation shows a loading state. No blank screens or frozen UI.

**Skeleton Screens:** Product list, customer list, and reports show skeleton placeholder cards while data loads.

**Inline Spinners:** Button actions (Save, Sync, Confirm) show an inline spinner replacing the label while processing.

**Progress Indicators:** Long operations (backup export, restore, bulk price update) show a progress bar with percentage and estimated time remaining.

### 36.4 Motion & Animation

- Animations are subtle and functional, not decorative
- Screen transitions: slide from right (forward navigation), slide to right (back)
- Bottom sheets: slide up; dismiss by drag down or backdrop tap
- Card tap feedback: brief scale animation (0.97× for 150ms)
- No animations that block interaction or delay feedback
- Animations respect the device's "Reduce Motion" accessibility setting

### 36.5 Key UX Patterns

**Bottom Sheets:** Used for:
- Quick actions (quick restock, quick payment receive)
- Selection dialogs (payment mode, category selection)
- Quantity entry
- Hold bill list

**Floating Action Button (FAB):** On billing screen only. Label: "New Bill" or "Checkout" depending on cart state.

**Swipe Actions:**
- Cart items: swipe left to delete
- Customer list: swipe left for "Receive Payment"
- Product list: swipe left for "Quick Restock"
- Swipe reveals a contextual action button (red for delete, green for positive actions)

**Quantity Stepper:** Minus / Number / Plus. Minus is disabled at 0 (or 1 for billing). Plus is disabled when quantity would exceed stock (with warning variant that allows override).

**Number Keypad:** Custom numeric keypad shown for all amount and quantity fields. Avoids keyboard layout inconsistency across Android versions.

**Confirmation Dialogs:** Required for:
- Cancel a bill
- Archive a product
- Approve negative stock
- Discard changes on a form
- Delete/reject a damage report
- Reopen a closed day

Dialog shows: action title, consequence description, primary action button (danger-colored for destructive), cancel button. PIN field added if action is PIN-protected.

### 36.6 Accessibility

- All interactive elements have ARIA labels
- Contrast ratio meets WCAG AA minimum (4.5:1 for body text)
- Screen reader support for primary flows (billing, customer management)
- Text is resizable up to 200% without breaking layouts
- Error messages are always text, never color-only

### 36.7 Outdoor Readability

Shopkeepers often use phones in bright outdoor or high-ambient-light conditions:
- High contrast for all text and amounts
- Large font sizes for key numbers
- No grey-on-grey text combinations
- Avoid light colors for important information
- Screen brightness CSS hint (`color-scheme: light` to prevent dark mode auto-activation)

### 36.8 One-Hand Usage

The app is designed for right-thumb operation on a 6-inch phone:
- Primary action buttons are at the bottom of the screen
- Navigation is at the bottom
- Search bars accessible from bottom (or central area of screen)
- No critical actions placed at the top of the screen (unreachable with one hand)
- Floating action button is at bottom-right (natural thumb zone)

---

## 37. Error Handling & Recovery Patterns

### 37.1 Error Categories

**Category A: User Errors (Recoverable)**
User entered wrong data. Must be correctable without complex workflows.

Examples:
- Wrong quantity on a bill → Edit bill or cancel and re-create
- Wrong price updated → Price history allows reverting
- Payment recorded for wrong customer → Adjustment entries

**Category B: Network Errors (Auto-Recoverable)**
Action failed due to connectivity. System handles automatically.

Examples:
- Bill save request timed out → Queued for retry
- Sync failed mid-way → Retry from last successful point
- Pull failed → Data stays at last known state; retry scheduled

**Category C: Conflict Errors (Owner Intervention Required)**
Data conflicts that cannot be auto-resolved.

Examples:
- Same product sold beyond stock on two devices
- Same customer balance updated on two devices in conflicting ways

**Category D: System Errors (Require Support)**
Unexpected errors in the application logic or Apps Script.

Examples:
- Apps Script exception during bill save
- Corrupted local IndexedDB data
- Fast Layer rebuild failure

### 37.2 Error Message Standards

Every error message must:
- State what happened in plain language (no technical codes visible to user)
- State what the user should do next
- Provide a direct action button where possible

**Good error messages:**

| Situation | Message | Action |
|---|---|---|
| Offline | "You're offline. Your bill has been saved and will sync automatically when internet returns." | OK |
| Sync failed after retries | "We couldn't sync 3 actions. Tap to review and retry." | → Sync Center |
| Stock insufficient | "Only 4 units of Harpic 500ml available. You added 6." | Change Quantity / Approve Anyway |
| Apps Script error | "Server is busy right now. Your action is saved and will retry automatically." | OK / Retry Now |
| Duplicate bill detected | "A similar bill was already saved. Did you mean to create a new bill?" | View Existing / Create New |
| PIN wrong | "Wrong PIN. 3 attempts remaining before lockout." | Try Again |
| Backup failed | "Backup failed. Check your internet connection and try again." | Retry |

**Never show:**
- Raw error codes
- Stack traces
- Technical field names
- "Something went wrong" without context
- Errors that disappear before the user can read them (minimum 4-second toast duration)

### 37.3 Recovery Workflows

**Recover from Cancelled Wrong Bill:**
1. Find cancelled bill in Bills list (filter: Cancelled)
2. "Duplicate as New Bill" option creates a new bill with the same items pre-loaded
3. Make corrections and save as new bill

**Recover from Wrong Stock Adjustment:**
1. Product > Stock History > find the incorrect movement
2. "Create Correction" option → creates a reverse movement with reason "Correction"

**Recover from Wrong Customer Payment:**
1. Customer > Udhaar Ledger > find incorrect payment
2. "Reverse Entry" creates a correcting entry with audit trail

---

## 38. Performance Engineering

### 38.1 Performance Budget

| Metric | Target | Measurement |
|---|---|---|
| App initial load (cold) | < 3 seconds on 3G | Lighthouse |
| App initial load (warm, cached) | < 1 second | Lighthouse |
| Product search response | < 200ms | Manual |
| Bill save (local) | < 500ms | Manual |
| Bill save (synced to server) | < 5 seconds | Manual |
| Dashboard render | < 1 second | Manual |
| Report generation (30 days) | < 3 seconds | Manual |

### 38.2 Bundle Optimization

- React production build with Vite
- Code splitting: each route is a separate chunk (lazy-loaded)
- Vendor chunk: React, Zustand, Dexie separated from app code
- Tree shaking: Tailwind CSS JIT purges unused styles
- Image optimization: Product images compressed to max 50KB via upload (client-side compression before Google Drive upload)
- PWA shell is pre-cached: app opens without network even on first revisit

### 38.3 Database Performance

**IndexedDB Query Optimization:**
- All search queries use indexed fields
- Full product catalog loaded into memory on app start (< 500KB for 500 products)
- In-memory search for billing (no IndexedDB query on each keystroke)
- Stock history queries paginated (load 20, then load more)

**Google Sheets Performance:**
- Never read entire sheets for operational queries
- Use DAILY_SUMMARY tab for report data (pre-aggregated)
- Use STOCK_SNAPSHOT tab for current stock reads (single-row per product)
- Pull only changed rows using `since_timestamp` filter

### 38.4 Caching Strategy

**Service Worker Cache (PWA):**
- App shell (HTML, JS, CSS): Cache First (served from cache, updated in background)
- Static assets (icons, images): Cache First with version-based invalidation
- API calls: Network First with cache fallback (serve cached response if network fails)
- Google Fonts: Not used (system fonts instead)

**In-Memory Cache:**
- Product catalog: Cached in Zustand store on app load
- Customer list: Cached in Zustand store on app load
- Category list: Cached in Zustand store on app load
- Cache invalidated on sync: New data from server replaces in-memory cache

---

## 39. Scalability Strategy

### 39.1 Expected Scale

The store operates with:
- ~300–500 products
- ~100–300 customers with udhaar
- ~20–50 suppliers
- ~30–80 bills per day
- ~2–4 devices concurrently

At this scale, Google Sheets + Apps Script is entirely sufficient. Scalability concerns are about long-term data accumulation, not concurrent load.

### 39.2 Data Growth Projections

| Table | Daily Growth | Monthly Growth | Annual Growth |
|---|---|---|---|
| BILLS | ~50 rows | ~1,500 rows | ~18,000 rows |
| BILL_ITEMS | ~200 rows | ~6,000 rows | ~72,000 rows |
| STOCK_MOVEMENTS | ~250 rows | ~7,500 rows | ~90,000 rows |
| UDHAAR_LEDGER | ~30 rows | ~900 rows | ~10,800 rows |
| EXPENSES | ~5 rows | ~150 rows | ~1,800 rows |
| AUDIT_LOG | ~500 rows | ~15,000 rows | ~180,000 rows |

By year 2, the system accumulates ~400,000 rows across all tabs. This is within Google Sheets' limits (5 million cells total) but will slow performance in some tabs.

**Annual archiving prevents degradation** by moving data older than 12 months to an archive sheet. After archiving, active data stays well within performance bounds.

### 39.3 Apps Script Quota Management

**Free tier limits relevant to this app:**
- Execution time: 6 minutes per call (well within; typical call < 10 seconds)
- Daily execution time: 6 hours (well within; 50 bills × 10s = 8 minutes/day)
- Simultaneous executions: 30 (well within; max 3 devices)
- URL fetch calls per day: 20,000 (not used; all data in Sheets)

**Monitoring:** Apps Script provides an execution log. Owner should check it monthly if issues arise.

### 39.4 Future Migration Path

If the business grows beyond Google Sheets' practical limits (multiple locations, 100+ bills/day, 5+ concurrent devices), migration path is:

1. Continue using the same React PWA frontend
2. Replace the Apps Script endpoint with a lightweight Node.js backend on Render or Railway
3. Migrate data to PostgreSQL or PlanetScale
4. Frontend changes: only the API endpoint URL changes; all workflows remain the same

This migration is 2–4 weeks of work for a developer. The modular architecture makes it feasible.

---

## 40. Deployment & Infrastructure Plan

### 40.1 Frontend Deployment (Netlify)

**Repository:** Private GitHub repository

**Netlify Configuration:**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "same-origin"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"
```

**Environment Variables:**
- `VITE_APP_VERSION`: Injected at build time; displayed in Settings > About
- No API keys or secrets in frontend environment variables

**Deployment Process:**
1. Developer pushes to `main` branch
2. Netlify auto-builds and deploys
3. Build preview available for pull requests
4. No manual deployment steps

### 40.2 Google Apps Script Deployment

**Versioning:**
- Apps Script maintains version history natively
- Before any update: Create a named version ("Pre-update backup vX")
- Deploy new version as a new Web App deployment
- Update the deployment URL in the store's CONFIG tab

**Script Structure:**
```
Code.gs          — Main router (doPost)
BillHandler.gs   — Bill CRUD operations
StockHandler.gs  — Stock movement operations
CustomerHandler.gs — Customer and udhaar operations
SupplierHandler.gs — Supplier operations
PurchaseHandler.gs — Purchase entry operations
ReportHandler.gs  — Report data aggregation
SyncHandler.gs    — Pull/push sync operations
IdempotencyHelper.gs — client_action_id management
LockHelper.gs    — Script lock management
ValidationHelper.gs — Request validation
SheetHelper.gs   — Sheet read/write utilities
Config.gs        — Constants and configuration
```

**Apps Script Security:**
- Web App deployed as: "Execute as Me" (the Gmail account owner)
- Access: "Anyone" (required for PWA access; secured by token authentication)
- Token checked on every request before any code executes

**Staging Environment:**
- A second Google Sheet + Apps Script deployment for testing
- Staging URL stored in a development-only environment variable
- Developers test against staging before deploying to production

### 40.3 Google Drive Setup

**Required Google Drive structure:**
```
Safai Market/
├── Safai Market — Live Data.gsheet    (main database)
├── Apps Script (embedded in sheet)
├── Product Images/                    (product photo uploads)
├── Invoice Photos/                    (purchase invoice photos)
├── Backups/
│   ├── 2024-01-backup.json
│   ├── 2024-02-backup.json
│   └── ...
└── Archive/
    └── Safai Market Archive 2024.gsheet
```

**Permissions:**
- The business Gmail account owns all files
- No sharing with external users for live data sheet
- Backup files can be shared with CA/accountant as needed

### 40.4 PWA Configuration

```javascript
// vite.config.js — VitePWA plugin configuration
VitePWA({
  registerType: 'prompt',          // Prompt user before SW update (not auto-update during billing)
  includeAssets: ['favicon.ico', 'icons/*.png'],
  manifest: {
    name: 'Safai Market',
    short_name: 'Safai Market',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#16A34A',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/script\.google\.com\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: { maxAgeSeconds: 300 }
        }
      }
    ]
  }
})
```

**Update Strategy:**
- Service worker updates are prompted, not auto-applied
- During billing (cart is non-empty), update prompt is deferred until cart is cleared
- Prevents mid-bill disruption from a service worker update

---

## 41. Maintenance & Operational Continuity

### 41.1 Recommended Setup for Long-Term Reliability

**Dedicated Business Gmail Account**
Create a Gmail account exclusively for the store (e.g., anupurnatradersshop@gmail.com). Never use a personal Gmail that could be accessed or changed by family members. This Gmail owns:
- The Google Sheet
- The Apps Script deployment
- Google Drive backup folder

**Recovery Email on the Business Gmail:**
Add the owner's personal Gmail as a recovery email. If the business Gmail password is forgotten, recovery is possible.

### 41.2 Routine Maintenance Calendar

| Frequency | Task | Who |
|---|---|---|
| Daily | Check dashboard alerts | Owner |
| Daily | Complete daily closing | Owner / Family |
| Weekly | Review udhaar overdue list | Owner |
| Weekly | Review What Is Finishing | Owner |
| Monthly | Export full backup | Owner |
| Monthly | Archive old data (if prompted) | Owner |
| Monthly | Review audit log for unusual activity | Owner |
| Quarterly | Physical inventory count | Owner |
| Annually | Archive previous year's data | Owner / Developer |
| As needed | Apps Script updates | Developer |

### 41.3 Handling Apps Script Downtime

Google Apps Script occasionally has outages (typically < 1 hour). The offline-first architecture handles this gracefully:
- All app functions continue to work offline
- Actions queue and sync automatically when Apps Script recovers
- No data is lost; no user action required during outage

Dashboard shows: "Server temporarily unavailable. Working offline. All your data is saved."

### 41.4 Google Sheets Maintenance Tips

**Prevent Accidental Edits:**
- Protect the data sheets (Tools > Protect Sheet) so only the Apps Script can edit them
- Leave CONFIG and CATEGORIES unprotected for occasional manual edits

**Avoid Manual Edits to Data Tabs:**
If a manual edit is ever made directly to the sheet (bypassing Apps Script), it should be documented in a comment on the cell and logged manually in the AUDIT_LOG tab.

**Monitor Sheet Size:**
Check the "row count" summary in Settings > Data Management monthly. If any sheet exceeds 100,000 rows, archive immediately.

### 41.5 Developer Handoff Protocol

If the developer who built the system leaves, the new developer needs:
1. Access to the GitHub repository (code)
2. Access to the business Gmail (for Apps Script and Sheets)
3. This PRD document
4. The secret API token (stored in CONFIG tab of the sheet)
5. The staging sheet URL

A "Developer README" file in the repository should document:
- Local setup instructions
- Staging vs production environment setup
- Apps Script deployment procedure
- Testing checklist
- Contact information for business owner

---

## 42. Testing Strategy

### 42.1 Test Categories

**Unit Tests (Vitest):**
- Business logic functions: bill total calculation, change calculation, stock movement validation
- Data transformation functions: CSV export formatting, WhatsApp message formatting
- Validation functions: phone number validation, price validation, quantity validation

**Integration Tests (Vitest + Testing Library):**
- Billing flow: add items, checkout, payment modes
- Customer payment flow: search customer, receive payment, verify balance
- Offline queue: create action offline, verify queue entry, simulate sync, verify synced state

**End-to-End Tests (Playwright):**
- Critical path: Create product → Create bill → Verify stock decreased → Daily closing
- Udhaar path: Create customer → Create udhaar bill → Receive payment → Verify balance
- Purchase path: Add supplier → Create purchase → Verify stock increased
- Return path: Find bill → Return item → Verify stock restored

**Manual Testing Checklist (Before Any Deployment):**

| Test | Steps | Expected |
|---|---|---|
| Offline billing | Turn off WiFi, create a bill | Bill saves locally, shows "Saved Offline" |
| Sync recovery | Create bill offline, turn WiFi back on | Bill syncs within 60 seconds |
| Duplicate bill prevention | Tap "Confirm Bill" twice rapidly | Only one bill created |
| Stock deduction | Create bill for 5 units | Stock decreases by 5 |
| Mixed payment | Bill with cash + UPI + udhaar | All three modes recorded correctly |
| Concurrent access | Two devices bill same product simultaneously | No negative stock without approval |
| PIN lockout | Enter wrong PIN 5 times | 30-minute lockout activated |
| Fast Layer consistency | Create bill, view product stock, compare to Sheets | Stock matches |

### 42.2 Device Testing Matrix

| Device | OS | Screen Size | Priority |
|---|---|---|---|
| Samsung Galaxy A32 | Android 11 | 6.4" | P0 — Primary target |
| Realme 8 | Android 11 | 6.4" | P0 |
| Xiaomi Redmi Note 10 | Android 11 | 6.43" | P1 |
| iPhone SE (3rd gen) | iOS 16 | 4.7" | P1 |
| Samsung Galaxy Tab | Android | 10" | P2 |

### 42.3 Real-World Scenario Testing

Before any major release, test these real-world scenarios:
1. **Rush Hour Simulation:** Create 20 bills in 10 minutes on one device while another device syncs
2. **Intermittent Network:** Toggle airplane mode on/off during billing; verify no data loss
3. **Low Battery:** Use app with battery at 15%; verify no performance degradation
4. **Shared Device:** Switch between Owner and Helper user contexts; verify role enforcement
5. **Large Product Catalog:** Load 500 products; verify search remains fast
6. **Day End:** Complete a full daily closing with 30+ bills, 5 expenses, and 3 udhaar payments

---

## 43. MVP Scope — Hard Boundaries

### 43.1 In MVP Scope (Must Ship)

| Module | Completeness Required |
|---|---|
| First-Time Setup | Full 10-step flow |
| Home Dashboard | All sections except advanced analytics |
| Product Inventory | Full CRUD + variant support |
| Product Search | Full search with Hinglish aliases |
| Billing / POS | Full flow including hold bills, mixed payment |
| Stock Movement Logging | Every stock change logged |
| Customer Management | Full CRUD |
| Udhaar Management | Full ledger; payment receipt; convert bill to udhaar |
| Supplier Management | Full CRUD |
| Purchase Entry | Full flow including free items |
| Daily Closing | Full flow with formula and difference tracking |
| What Is Finishing | Full low-stock center |
| Offline Queue | Full queue with retry and status |
| PWA Installation | Service worker, manifest, home screen install |
| Sync Center | Basic view of pending, failed, conflicts |
| WhatsApp Sharing | Bill, udhaar statement, closing summary |
| Backup Export | JSON and CSV exports |
| PIN Security | PIN for sensitive actions |
| Audit Log | All critical events logged |
| Role-Based Access | Owner, Family, Helper roles enforced |

### 43.2 Explicitly Out of MVP Scope

| Feature | Phase |
|---|---|
| Barcode Scanner | Phase 2 |
| Returns & Exchange Module | Phase 2 |
| Damage Register | Phase 2 |
| Price History & Bulk Price Update | Phase 2 |
| Advanced Reports | Phase 2 |
| Inventory Count Mode | Phase 2 |
| Voice Input | Phase 3 |
| Thermal Printer Integration | Phase 3 |
| AI-Based Insights | Phase 3 |
| Multi-Location Support | Phase 3 |
| GST Return Filing | Out of scope |
| WhatsApp Business API | Phase 3 |
| APK Conversion | Phase 3 |
| Hindi-Only UI | Phase 2 |
| Dark Mode | Phase 2 |
| Loyalty Points System | Phase 3 |
| Employee Payroll | Out of scope |

### 43.3 MVP Quality Standards

MVP does not mean lower quality on shipped features. Every MVP feature must:
- Work completely offline
- Handle the failure cases defined in Section 37
- Show correct data after every operation
- Be tested on the primary device (Samsung Galaxy A32)
- Be usable by a non-technical family member without training

---

## 44. Future Roadmap

### Phase 2 — Complete Operations (3–6 months after MVP)

**Returns & Exchange Module:** Full customer return and exchange workflow (Section 24)

**Damage Register:** Damage reporting with approval workflow (Section 25)

**Price History & Bulk Price Update:** Complete price management (Section 26)

**Inventory Count Mode:** Physical stock verification workflow (Section 30)

**Barcode Scanner:** Use device camera to scan product barcodes; match to existing products; accelerate product entry and billing

**Advanced Reports:** Product-level profitability, supplier-wise purchase analysis, customer lifetime value, seasonal sales patterns

**Hindi UI:** Full Hindi language support; translated all labels, messages, and reports

**Dark Mode:** Dark color scheme for night use and battery saving

**Multiple Supplier Prices:** Track buy price per supplier per product; system suggests cheapest supplier for each reorder

### Phase 3 — Intelligence & Scale (6–18 months)

**AI Demand Forecasting:** Predict which products to reorder based on historical sales patterns and seasonal trends (local model or Gemini API integration)

**Voice Input:** Voice-to-text for product search and note entry; Hindi voice recognition priority

**WhatsApp Business API:** Automated bill delivery, payment reminders, and udhaar statements via WhatsApp Business messaging API

**Thermal Printer Support:** Print bills on 58mm/80mm thermal printers via Bluetooth; supports ESC/POS command set

**Camera-Based Inventory Count:** Use phone camera to scan shelves and estimate quantities using computer vision

**APK Conversion:** Convert PWA to Android APK for Play Store distribution; allows offline installation without browser

**Multi-Location Support:** Track inventory across two shops; transfer stock between locations; consolidated reporting

**Customer Loyalty Program:** Points accumulation on purchases; redemption against future purchases; automatic birthday messages

---

## 45. Success Criteria & Definition of Done

### 45.1 Technical Success Criteria

| Criterion | Measurement Method |
|---|---|
| Billing works offline | Tested by turning off WiFi mid-billing |
| Bill save is idempotent | Tested by submitting duplicate bill requests |
| No data loss on sync | Tested by creating 100 offline bills and syncing |
| Stock is always accurate | Validated by comparing system stock to physical count after 1 week |
| Search returns results < 200ms | Measured with browser DevTools performance tab |
| App loads < 3 seconds on 3G | Measured with Lighthouse on simulated 3G |
| Crash rate < 0.1% of sessions | Measured via error tracking |
| Offline queue processes on reconnect | Tested by toggling airplane mode |

### 45.2 Business Success Criteria

These are the real-world outcomes that determine if the product succeeded:

**Week 1:**
- Owner can create a bill without looking at a guide
- Helper can search a product and create a bill independently
- Daily closing is completed every day

**Month 1:**
- Owner says: "I know exactly how much stock I have"
- Udhaar disputes are resolved by showing the ledger history to the customer
- Daily cash matches expected amount within ₹50 every day

**Month 3:**
- The paper notebook is no longer used
- WhatsApp is no longer used for tracking stock or udhaar
- Owner checks What Is Finishing before every supplier order
- Monthly report is shared with family or CA with confidence

**Month 6:**
- Owner trusts the profit estimate in the monthly report
- Inventory count confirms system stock is accurate within 2%
- No significant data recovery incidents

### 45.3 The Definitive Test

The product has succeeded when the owner of Anupurna Traders says:

> "I don't worry anymore. I look at my phone and I know what's happening in my shop."

---

## 46. Final Architecture Recommendations

### 46.1 The Most Important Thing to Get Right

**Stock consistency is non-negotiable.** Every stock-related engineering decision must be reviewed against one question: "Can this result in a stock number the owner cannot trust?" If yes, the approach must change.

The event-sourced stock architecture (append-only STOCK_MOVEMENTS + computed Fast Layer) is the correct approach. It must never be shortcut. No "just update the stock cell directly" optimizations. The 200ms extra time for the proper approach is always worth it.

### 46.2 Build in the Right Order

**Week 1–2:** Setup + Google Sheets architecture + Apps Script skeleton + offline queue foundation

**Week 3–4:** Product module + search + stock movement system

**Week 5–6:** Billing (the most complex module; must be rock solid before continuing)

**Week 7–8:** Customer + Udhaar module

**Week 9–10:** Supplier + Purchase entry

**Week 11–12:** Daily closing + basic reports + sync center

**Week 13–14:** PWA optimization + offline testing + performance tuning

**Week 15–16:** End-to-end testing + real-world scenario testing + owner onboarding

### 46.3 Development Principles for the Build Team

1. **Write apps script handlers defensively.** Validate everything. Log everything. Never trust client data.

2. **IndexedDB is the primary database.** All reads come from Dexie.js first. Google Sheets is for durability and multi-device sync, not for speed.

3. **Every action is queued, always.** Even when online. The queue is the only guarantee against duplicate actions and network failures.

4. **Test offline scenarios from day one.** Not as an afterthought. Offline support that is added after the fact is always fragile.

5. **Keep the Apps Script simple.** Complex server-side logic is harder to debug and maintain. Push validation logic to the client where appropriate.

6. **Preserve all data.** When in doubt, never delete. Archive, cancel, reverse, adjust — never destroy.

7. **Instrument everything.** Add client-side error logging from the beginning. Use a simple error capture (window.onerror → indexed to error_log in IndexedDB → sync to Apps Script periodically). This makes debugging production issues possible.

8. **Show sync status everywhere.** The moment the owner doesn't know if their data is synced, trust is broken.

### 46.4 Google Sheets Architecture — Final Summary

```
APPEND-ONLY LEDGER TABS           FAST LAYER TABS (Recomputed)
─────────────────────────         ──────────────────────────────
BILLS                     ──→     PRODUCTS (with current_stock)
BILL_ITEMS                ──→     CUSTOMERS (with current_udhaar)
STOCK_MOVEMENTS           ──→     DAILY_SUMMARY
UDHAAR_LEDGER             ──→     STOCK_SNAPSHOT
SUPPLIER_LEDGER           ──→
PURCHASES                         CONFIG TABS
PURCHASE_ITEMS            ──→     ──────────────────────────────
RETURNS                   ──→     CONFIG
DAMAGES                   ──→     USERS
EXPENSES                  ──→     CATEGORIES
PRICE_HISTORY             ──→     SUPPLIERS
AUDIT_LOG                 ──→     PROCESSED_ACTIONS
```

The arrow represents: "Apps Script reads these ledger events and updates the Fast Layer to reflect current state."

If Fast Layer is ever wrong: Rebuild from ledger. This is the recovery guarantee.

### 46.5 What Success Looks Like for the Engineering Team

The engineering team has done its job well when:

- A helper with 5 minutes of training can bill any product in the store
- The owner's end-of-day number matches the physical cash count
- The owner does not call the developer when internet goes down
- A device dies mid-billing and when a new device opens the app, all data is intact
- The system has been running for 3 months without a single data corruption incident
- The Google Sheet's event ledger tells a complete, accurate story of everything that happened in the store since day one

---

*This document is Version 6 of the Safai Market — Anupurna Traders PRD. It supersedes all previous versions. All implementation decisions must reference this document. Changes to this document require acknowledgment from both the development lead and the product owner.*

*Document produced by: Senior CTO + Product Architecture Review*  
*Status: Implementation-Ready*

---

**End of Document**
