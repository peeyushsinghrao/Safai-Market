# Safai Market — Anupurna Traders
## Thermal Printer + Billing Machine Integration
### Production-Grade Architecture Document — V1

---

> **Document Classification:** Implementation-Ready Internal Technical Specification
> **Audience:** Engineering Lead, Frontend Developer, CTO
> **Depends On:** PRD V6 — All decisions inherit V6 principles
> **Status:** Active — Implementation-Ready

---

## Table of Contents

1. Architecture Foundation & Golden Rule
2. Printer Integration Philosophy
3. Supported Printer Types — Deep Design
4. Core Billing + Print Workflow
5. Print Queue System — Full Architecture
6. Print Logs System
7. Discount System — Full Design
8. Receipt Layout Design
9. ESC/POS Architecture
10. Bluetooth Printer Architecture
11. Wi-Fi Printer Architecture
12. Browser Print Architecture
13. Printer Settings Module
14. Database Schema — PRINT_QUEUE, PRINT_LOGS, PRINTER_SETTINGS
15. IndexedDB + Google Sheets Sync for Print Data
16. Offline Printing Strategy
17. Error Handling — All Printer Types
18. Edge Cases — Complete Catalog
19. UX Requirements — Mobile-First Print UI
20. Capacitor APK Integration Planning
21. Phase Implementation Plan
22. Testing Strategy for Print System

---

## 1. Architecture Foundation & Golden Rule

### 1.1 The Immutable Law of This System

The single most important rule of the entire printer integration is this:

```
THE APP IS THE SOURCE OF TRUTH.
THE PRINTER IS AN OUTPUT DEVICE ONLY.
```

This is not a preference. This is a hard architectural constraint that must be enforced at the code level. The printer subsystem is a side effect of a successfully saved bill — never a prerequisite to it.

### 1.2 The Correct Billing + Print Flow

```
┌─────────────────────────────┐
│   STEP 1: CREATE BILL       │  ← User adds items, discounts, payment
│   (In-Memory State Only)    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   STEP 2: VALIDATE BILL     │  ← Check totals, stock availability,
│   (Client-Side)             │    payment method, udhaar limits
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   STEP 3: SAVE BILL         │  ← Write to IndexedDB (BILLS table)
│   (IndexedDB — Atomic)      │    This is the point of no return
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   STEP 4: UPDATE STOCK      │  ← Deduct stock in IndexedDB
│   (IndexedDB)               │    Append to STOCK_MOVEMENTS
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   STEP 5: UPDATE UDHAAR     │  ← If udhaar selected, write
│   (IndexedDB, if needed)    │    UDHAAR_LEDGER entry
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   STEP 6: QUEUE SYNC        │  ← Add bill to SYNC_QUEUE for
│   (IndexedDB)               │    Google Sheets upload
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   STEP 7: BILL SUCCESS      │  ← Mark bill as complete
│   (UI State)                │    Show success confirmation
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   STEP 8: QUEUE PRINT JOB   │  ← Write to PRINT_QUEUE
│   (IndexedDB)               │    Only AFTER bill is saved
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   STEP 9: EXECUTE PRINT     │  ← Attempt print
│   (Async, Non-Blocking)     │    Failure here does NOT affect bill
└─────────────────────────────┘
```

**Critical rule:** If the print fails at Step 9, the bill is STILL SAVED. The user can reprint from bill history at any time. A failed print is a UX inconvenience, not a business failure.

### 1.3 The Wrong Flow — Must Never Happen

```
❌ WRONG — NEVER IMPLEMENT THIS

Printer prints
↓
Bill saves
```

```
❌ WRONG — NEVER IMPLEMENT THIS

Bill save and print are in the same transaction
↓
If print fails, bill rolls back
```

```
❌ WRONG — NEVER IMPLEMENT THIS

App waits for print confirmation before showing "Bill Saved"
```

### 1.4 Inheritance from PRD V6

This document inherits all principles from PRD V6. In the context of printing:

- **P3 (Billing Speed is Sacred):** Print must never slow down the billing flow. Print is always async.
- **P7 (Offline Actions Are Safe):** Print queue must survive app restarts and offline periods.
- **P9 (Sync Status Always Visible):** Pending print jobs must be visible in the UI.
- **P14 (Recovery is More Important than Prevention):** Reprint from any bill, any time.

---

## 2. Printer Integration Philosophy

### 2.1 Print is a Convenience, Not a Requirement

For Anupurna Traders, many customers do not need a printed receipt. WhatsApp sharing is often sufficient. The printing system must therefore be:

- **Optional at the transaction level:** Auto-print can be ON or OFF. Even when ON, a failed print must not block business.
- **Retriable from history:** Any bill can be reprinted from the bill history screen.
- **Gracefully degradable:** If no printer is connected, the app continues working perfectly.

### 2.2 The Three Print Tiers

```
TIER 1 — BROWSER PRINT (MVP)
Works immediately. No hardware needed.
PDF-quality bills. Works on any phone.
Best for: Getting started, shops without printers.

TIER 2 — WI-FI THERMAL PRINTER (Phase 2)
Requires thermal printer on same Wi-Fi network.
ESC/POS over TCP. Fast prints.
Best for: Desktop or counter-side printer setup.

TIER 3 — BLUETOOTH THERMAL PRINTER (Phase 3)
Requires Capacitor APK (not PWA).
ESC/POS over Bluetooth.
Best for: Mobile billing, counter-side Android devices.
```

### 2.3 Paper Sizes Supported

| Paper Width | Common Use | Characters Per Line |
|---|---|---|
| 58mm | Small handheld printers | 32 chars (font A) |
| 80mm | Standard counter printers | 48 chars (font A) |

All receipt layouts must be designed for 58mm as the minimum. 80mm layout is an enhanced version of the same structure.

---

## 3. Supported Printer Types — Deep Design

### 3.1 Type 1 — Browser Print

#### What It Is
Uses the browser's native `window.print()` API to render the bill as a printable HTML page. The user sees the system print dialog and can print to any connected printer, save as PDF, or share to WhatsApp as a PDF.

#### How It Works

```
User taps "Print"
↓
App generates print-formatted HTML layout (hidden div)
↓
App calls window.print()
↓
Browser opens system print dialog
↓
User selects printer or "Save as PDF"
↓
Done
```

#### Implementation Detail

```jsx
// PrintService.js — Browser Print Method
export const browserPrint = (billData) => {
  const printWindow = window.open('', '_blank');
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Bill #${billData.bill_number}</title>
        <style>
          /* 58mm receipt width */
          @page {
            size: 58mm auto;
            margin: 2mm;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            width: 54mm;
            margin: 0;
            padding: 0;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 3px 0; }
          .item-row { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        ${generateReceiptHTML(billData)}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  
  // Small delay to ensure render before print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
};
```

#### Browser Print Limitations

| Limitation | Impact | Workaround |
|---|---|---|
| Cannot send to thermal printer directly | Medium | User must select correct printer manually |
| Print dialog adds friction | Low | Use for non-rush scenarios |
| No way to know if print succeeded | Medium | Log as "print attempted" not "print confirmed" |
| Mobile browsers vary in print support | Medium | Test on Chrome Android specifically |
| Cannot control paper feed | Low | Add extra bottom margin in CSS |
| No silent print (always shows dialog) | Low | Expected behavior for browser tier |

#### Mobile Print Flow (Chrome Android)

```
User taps Print button
↓
App opens print preview tab
↓
Chrome shows "Print" option in menu
↓
User selects printer (or Save as PDF)
↓
Print executes
```

On Android, user can also share the generated PDF to WhatsApp directly from the print dialog — this is a key workflow for Anupurna Traders customers who want a digital receipt.

---

### 3.2 Type 2 — Wi-Fi Thermal Printer

#### What It Is
A thermal printer (e.g., Xprinter XP-58, Epson TM-T20, TVS RP 3200) connected to the same local Wi-Fi network as the billing device. The app sends raw ESC/POS bytes via a TCP socket connection to the printer's IP address on port 9100 (standard for most thermal printers).

#### Network Architecture

```
┌──────────────┐     Wi-Fi     ┌──────────────────┐
│  Phone/Tablet │◄────────────►│  Wi-Fi Router    │
│  (App)       │               │                  │
└──────────────┘               └────────┬─────────┘
                                        │
                                        │ Ethernet or Wi-Fi
                                        ▼
                               ┌──────────────────┐
                               │  Thermal Printer  │
                               │  IP: 192.168.1.50 │
                               │  Port: 9100       │
                               └──────────────────┘
```

#### Key Constraints

- Both the app device and printer must be on **the same local Wi-Fi network**.
- This will NOT work over mobile data.
- Printer must have a **static IP address** assigned (either manually or via DHCP reservation on router).
- Standard port for ESC/POS over TCP is **9100**.

#### PWA Limitation for Wi-Fi Printing

**Important:** Raw TCP socket connections are not available in browser-based PWAs due to web security restrictions. Wi-Fi printing from a PWA requires one of these approaches:

**Option A — WebSocket Bridge (Recommended for PWA)**

```
PWA App
↓
Sends ESC/POS bytes to WebSocket server (local mini server on device or PC)
↓
WebSocket server forwards to printer TCP:9100
```

Deploy a tiny Node.js bridge on a PC or Raspberry Pi on the same network:

```javascript
// bridge-server.js (runs on local machine/RPi)
const net = require('net');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8765 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const { printerIP, printerPort, escposBytes } = JSON.parse(data);
    const client = new net.Socket();
    
    client.connect(printerPort, printerIP, () => {
      client.write(Buffer.from(escposBytes));
      client.destroy();
      ws.send(JSON.stringify({ success: true }));
    });
    
    client.on('error', (err) => {
      ws.send(JSON.stringify({ success: false, error: err.message }));
    });
  });
});
```

**Option B — Capacitor APK (Recommended for Phase 3)**

In APK form, Capacitor plugins can open raw TCP sockets. This is the cleanest long-term solution.

**Option C — React Native / Native Android (Not in scope)**

#### Wi-Fi Printer Connection Testing

Before any print job, the system performs a connection test:

```javascript
// PrinterConnectionService.js
export const testWifiPrinterConnection = async (ip, port = 9100, timeoutMs = 3000) => {
  return new Promise((resolve) => {
    // Via WebSocket bridge
    const ws = new WebSocket(`ws://${BRIDGE_IP}:8765`);
    const timer = setTimeout(() => {
      ws.close();
      resolve({ connected: false, error: 'Connection timed out' });
    }, timeoutMs);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: 'test',
        printerIP: ip,
        printerPort: port
      }));
    };
    
    ws.onmessage = (event) => {
      clearTimeout(timer);
      const result = JSON.parse(event.data);
      resolve(result);
    };
    
    ws.onerror = () => {
      clearTimeout(timer);
      resolve({ connected: false, error: 'Bridge not reachable' });
    };
  });
};
```

#### Wi-Fi Print Reliability Rules

1. Always test connection before sending print job.
2. If connection fails, add job to PRINT_QUEUE with status `pending_wifi`.
3. Never block billing UI waiting for print confirmation.
4. Maximum 3 retry attempts per job, with exponential backoff: 5s → 15s → 45s.
5. After 3 failures, mark job as `failed` and show notification to user.
6. User can manually retry from Print Queue screen.

---

### 3.3 Type 3 — Bluetooth Thermal Printer

#### What It Is
A portable thermal printer (e.g., Rongta RPP02, Bixolon SPP-R200, iDPRT SP410) connected to the Android device via Bluetooth. This requires the Capacitor APK version of the app — it cannot be done from a PWA browser.

#### Android Bluetooth Architecture

```
App (React + Capacitor)
↓
Capacitor Plugin: @capacitor-community/bluetooth-le
OR custom Capacitor plugin for ESC/POS
↓
Android BluetoothAdapter API
↓
BluetoothSocket (RFCOMM)
↓
Thermal Printer
```

#### Required Android Permissions

In `AndroidManifest.xml`:

```xml
<!-- Bluetooth permissions for Android 12+ -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"
    android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />

<!-- Legacy Bluetooth for Android < 12 -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />

<!-- Location required for BT discovery on Android 6-11 -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

Runtime permission request flow:

```javascript
// BluetoothPermissionService.js
export const requestBluetoothPermissions = async () => {
  const { Permissions } = await import('@capacitor/core');
  
  const result = await Permissions.request({
    permissions: ['bluetooth', 'bluetoothScan', 'bluetoothConnect']
  });
  
  if (result.bluetooth !== 'granted') {
    throw new Error('BLUETOOTH_PERMISSION_DENIED');
  }
  
  return true;
};
```

#### Bluetooth Printer Discovery Flow

```
User opens Printer Settings
↓
Tap "Scan for Printers"
↓
App requests Bluetooth permissions (first time)
↓
BluetoothAdapter.startDiscovery()
↓
List of paired + nearby devices shown
↓
User selects printer
↓
App tests connection with short ESC/POS test sequence
↓
Printer name + MAC address saved to PRINTER_SETTINGS in IndexedDB
↓
"Printer Connected" shown
```

#### Bluetooth UUID for Serial/ESC/POS

Most thermal printers use the Standard Serial Port Profile (SPP) UUID:

```
UUID: 00001101-0000-1000-8000-00805F9B34FB
```

#### Bluetooth Print Implementation (Capacitor)

```javascript
// BluetoothPrintService.js
import { BluetoothSerial } from '@capacitor-community/bluetooth-serial';

export const bluetoothPrint = async (macAddress, escposBytes) => {
  try {
    // Check if already connected
    const isConnected = await BluetoothSerial.isConnected({ address: macAddress });
    
    if (!isConnected.connected) {
      await BluetoothSerial.connect({ address: macAddress });
      // Wait for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Write ESC/POS bytes in chunks (max 512 bytes per write for stability)
    const CHUNK_SIZE = 512;
    for (let i = 0; i < escposBytes.length; i += CHUNK_SIZE) {
      const chunk = escposBytes.slice(i, i + CHUNK_SIZE);
      await BluetoothSerial.write({ data: btoa(String.fromCharCode(...chunk)) });
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return { success: true };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

#### Bluetooth Connection State Management

```
States: disconnected → connecting → connected → printing → idle → disconnected

disconnected:
  - On app start
  - After printer turns off
  - After Android BT disables
  - After explicit disconnect

connecting:
  - User taps print
  - Auto-reconnect attempt

connected:
  - BT socket open
  - Keep-alive test passed

printing:
  - ESC/POS bytes being written

idle:
  - Connected, not actively printing
  - Keep connection open if auto-print enabled

disconnected (from idle):
  - Printer goes out of range
  - Printer turned off
  - Android OS terminates BT connection
```

#### Bluetooth Error Handling Matrix

| Error | Cause | Recovery Action |
|---|---|---|
| `BLUETOOTH_NOT_ENABLED` | Android BT off | Prompt user to enable BT |
| `DEVICE_NOT_FOUND` | Printer off or out of range | Show "Turn on printer" message |
| `CONNECTION_REFUSED` | Printer busy or UUID mismatch | Retry with 2s delay |
| `PERMISSION_DENIED` | User denied BT permission | Link to Android settings |
| `WRITE_FAILED` | Printer buffer full or paper end | Retry after 3s |
| `DISCONNECTED_DURING_PRINT` | BT dropout | Mark as failed, retry queued |

---

## 4. Core Billing + Print Workflow

### 4.1 Detailed Step-by-Step Flow

#### Phase A — Bill Creation (User-Facing)

```
User opens Billing screen
↓
Searches products (IndexedDB full-text search)
↓
Adds items to cart (in-memory state)
↓
[OPTIONAL] Applies item-level discounts
↓
[OPTIONAL] Applies bill-level discount
↓
Selects payment method: Cash / UPI / Udhaar / Split
↓
[OPTIONAL] Enters customer name (required for Udhaar)
↓
Taps "Create Bill" button
```

#### Phase B — Bill Saving (Atomic, Must All Succeed)

```javascript
// BillingService.js — createBill() — this must be atomic
const createBill = async (billData) => {
  const db = await getDB(); // Dexie.js IndexedDB instance
  
  // Start atomic operation
  await db.transaction('rw', 
    db.bills, 
    db.bill_items, 
    db.stock_movements, 
    db.udhaar_ledger,
    db.sync_queue,
    db.print_queue,
    async () => {
    
    // --- STEP 1: Generate Bill ID ---
    const billId = generateBillId(); // e.g., "BILL-20250621-0042"
    const timestamp = Date.now();
    
    // --- STEP 2: Save Bill Header ---
    await db.bills.add({
      id: billId,
      bill_number: billData.billNumber,
      customer_name: billData.customerName || null,
      customer_id: billData.customerId || null,
      subtotal: billData.subtotal,
      discount_amount: billData.discountAmount || 0,
      discount_type: billData.discountType || null, // 'fixed' | 'percent'
      discount_percent: billData.discountPercent || null,
      discount_reason: billData.discountReason || null,
      total_amount: billData.totalAmount,
      payment_method: billData.paymentMethod, // 'cash'|'upi'|'udhaar'|'split'
      cash_amount: billData.cashAmount || 0,
      upi_amount: billData.upiAmount || 0,
      udhaar_amount: billData.udhaarAmount || 0,
      status: 'completed',
      created_at: timestamp,
      created_by: billData.userId,
      device_id: billData.deviceId,
      synced: false
    });
    
    // --- STEP 3: Save Bill Items ---
    for (const item of billData.items) {
      await db.bill_items.add({
        id: generateId(),
        bill_id: billId,
        product_id: item.productId,
        product_name: item.productName,
        qty: item.qty,
        unit: item.unit,
        unit_price: item.unitPrice,
        item_discount: item.itemDiscount || 0,
        item_discount_type: item.itemDiscountType || null,
        item_total: item.itemTotal,
        created_at: timestamp
      });
    }
    
    // --- STEP 4: Update Stock (via STOCK_MOVEMENTS) ---
    for (const item of billData.items) {
      await db.stock_movements.add({
        id: generateId(),
        product_id: item.productId,
        movement_type: 'sale',
        qty_change: -item.qty,
        reference_id: billId,
        reference_type: 'bill',
        created_at: timestamp,
        created_by: billData.userId,
        synced: false
      });
      
      // Update fast layer stock in PRODUCTS table
      await db.products
        .where('id').equals(item.productId)
        .modify(product => {
          product.current_stock -= item.qty;
          product.last_sale_at = timestamp;
        });
    }
    
    // --- STEP 5: Update Udhaar (if applicable) ---
    if (billData.udhaarAmount > 0) {
      await db.udhaar_ledger.add({
        id: generateId(),
        customer_id: billData.customerId,
        entry_type: 'credit', // amount customer now owes
        amount: billData.udhaarAmount,
        reference_id: billId,
        reference_type: 'bill',
        note: `Bill #${billData.billNumber}`,
        created_at: timestamp,
        created_by: billData.userId,
        synced: false
      });
    }
    
    // --- STEP 6: Queue Sync ---
    await db.sync_queue.add({
      id: generateId(),
      action: 'create_bill',
      payload: billId,
      status: 'pending',
      created_at: timestamp,
      attempts: 0
    });
    
    // --- STEP 7: Queue Print (if print enabled) ---
    const printerSettings = await db.printer_settings.get('default');
    
    if (printerSettings?.auto_print_enabled) {
      await db.print_queue.add({
        id: generateId(),
        bill_id: billId,
        bill_data_snapshot: JSON.stringify(billData), // Snapshot for offline print
        printer_type: printerSettings.active_printer_type,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        created_at: timestamp,
        is_reprint: false,
        queued_by: billData.userId
      });
    }
  }); // End transaction
  
  return { success: true, billId };
};
```

#### Phase C — Print Execution (Async, After Transaction Commits)

```javascript
// After createBill() resolves successfully:
const handleBillSuccess = async (billId) => {
  // Show success UI immediately
  setShowSuccessScreen(true);
  
  // Process print queue async (non-blocking)
  processPrintQueue().catch(err => {
    console.error('Print queue processing error:', err);
    // Do NOT surface this to user as a billing error
    // It will be retried by the background queue processor
  });
};
```

---

## 5. Print Queue System — Full Architecture

### 5.1 Why a Print Queue?

Without a queue:
- App crashes after bill save → print never happens
- Printer offline → print silently fails, no retry
- Multiple bills created fast → prints race and corrupt each other
- Reprint with no tracking → duplicates accumulate

With a queue:
- Every print job is durable (survives restarts)
- Retry logic is centralized
- Duplicate prevention is enforced
- Print history is auditable

### 5.2 PRINT_QUEUE Schema (IndexedDB)

```javascript
// Dexie.js schema definition
db.version(1).stores({
  print_queue: '++id, bill_id, status, created_at, printer_type, attempts'
});

/*
PRINT_QUEUE Record Structure:
{
  id: string,                    // UUID, primary key
  bill_id: string,               // Reference to BILLS table
  bill_data_snapshot: string,    // JSON string — full bill data at time of queue
                                 // Needed for offline print when bill might not sync yet
  printer_type: 'browser'        // 'browser' | 'wifi' | 'bluetooth'
              | 'wifi'
              | 'bluetooth',
  status: 'pending'              // See status lifecycle below
        | 'printing'
        | 'completed'
        | 'failed'
        | 'cancelled'
        | 'retrying',
  attempts: number,              // How many times we've tried
  max_attempts: number,          // Default: 3
  last_attempt_at: number,       // Timestamp of last attempt
  last_error: string | null,     // Error message from last failure
  completed_at: number | null,   // Timestamp of successful print
  created_at: number,            // When job was created
  is_reprint: boolean,           // Was this initiated by user as reprint?
  original_print_id: string|null,// If reprint, references original job ID
  queued_by: string,             // User ID who triggered it
  copies: number,                // Default: 1
  paper_size: '58mm' | '80mm',   // From printer settings at time of queue
  synced: boolean                // For analytics — sync to Google Sheets
}
*/
```

### 5.3 Print Queue Status Lifecycle

```
                    ┌──────────┐
                    │  pending │  ← Job created
                    └────┬─────┘
                         │ Queue processor picks up
                         ▼
                    ┌──────────┐
                    │ printing │  ← Active print attempt
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
       ┌──────────┐          ┌──────────┐
       │completed │          │ retrying │  ← attempts < max_attempts
       └──────────┘          └────┬─────┘
                                  │ attempts >= max_attempts
                                  ▼
                            ┌──────────┐
                            │  failed  │  ← User must manually retry
                            └──────────┘
                                  │ User taps "Retry"
                                  ▼
                            ┌──────────┐
                            │  pending │  ← Reset to pending, attempts reset
                            └──────────┘
```

### 5.4 Queue Processor Logic

```javascript
// PrintQueueProcessor.js
export class PrintQueueProcessor {
  
  constructor() {
    this.isProcessing = false;
    this.processingInterval = null;
  }
  
  // Start background queue processing (call on app init)
  start() {
    // Process immediately on start
    this.process();
    
    // Then check every 10 seconds
    this.processingInterval = setInterval(() => {
      this.process();
    }, 10000);
  }
  
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
  
  async process() {
    if (this.isProcessing) return; // Prevent concurrent processing
    
    this.isProcessing = true;
    
    try {
      const db = await getDB();
      
      // Get pending jobs, oldest first
      const pendingJobs = await db.print_queue
        .where('status').equals('pending')
        .sortBy('created_at');
      
      for (const job of pendingJobs) {
        await this.processJob(job);
      }
      
      // Also check retrying jobs that are due
      const retryingJobs = await db.print_queue
        .where('status').equals('retrying')
        .toArray();
      
      const now = Date.now();
      const dueForRetry = retryingJobs.filter(job => {
        const backoffMs = this.getBackoffMs(job.attempts);
        return (now - job.last_attempt_at) > backoffMs;
      });
      
      for (const job of dueForRetry) {
        await db.print_queue.update(job.id, { status: 'pending' });
        await this.processJob({ ...job, status: 'pending' });
      }
      
    } finally {
      this.isProcessing = false;
    }
  }
  
  getBackoffMs(attempts) {
    // Exponential backoff: 5s, 15s, 45s
    const backoffs = [5000, 15000, 45000];
    return backoffs[Math.min(attempts - 1, backoffs.length - 1)];
  }
  
  async processJob(job) {
    const db = await getDB();
    
    // Mark as printing
    await db.print_queue.update(job.id, {
      status: 'printing',
      last_attempt_at: Date.now(),
      attempts: job.attempts + 1
    });
    
    try {
      const billData = JSON.parse(job.bill_data_snapshot);
      let result;
      
      switch (job.printer_type) {
        case 'browser':
          result = await browserPrint(billData);
          // Browser print always "succeeds" since we can't confirm
          result = { success: true };
          break;
          
        case 'wifi':
          result = await wifiPrint(billData, job.copies, job.paper_size);
          break;
          
        case 'bluetooth':
          result = await bluetoothPrint(billData, job.copies, job.paper_size);
          break;
          
        default:
          throw new Error(`Unknown printer type: ${job.printer_type}`);
      }
      
      if (result.success) {
        // Mark completed
        await db.print_queue.update(job.id, {
          status: 'completed',
          completed_at: Date.now()
        });
        
        // Write to print logs
        await writePrintLog({
          bill_id: job.bill_id,
          print_queue_id: job.id,
          status: 'success',
          printer_type: job.printer_type,
          is_reprint: job.is_reprint,
          queued_by: job.queued_by
        });
        
      } else {
        throw new Error(result.error || 'Print failed');
      }
      
    } catch (error) {
      const newAttempts = job.attempts + 1; // +1 because we incremented above
      
      if (newAttempts >= job.max_attempts) {
        // Mark as permanently failed
        await db.print_queue.update(job.id, {
          status: 'failed',
          last_error: error.message
        });
        
        await writePrintLog({
          bill_id: job.bill_id,
          print_queue_id: job.id,
          status: 'failed',
          printer_type: job.printer_type,
          error_message: error.message,
          is_reprint: job.is_reprint,
          queued_by: job.queued_by
        });
        
        // Notify user
        notifyPrintFailure(job.bill_id);
        
      } else {
        // Schedule retry
        await db.print_queue.update(job.id, {
          status: 'retrying',
          last_error: error.message
        });
      }
    }
  }
}

export const printQueueProcessor = new PrintQueueProcessor();
```

### 5.5 Duplicate Print Prevention

Duplicate prevention is critical. The system must never print the same bill twice accidentally.

```javascript
// Before adding a new print job, check for existing:
const addToPrintQueue = async (billId, isReprint = false) => {
  const db = await getDB();
  
  if (!isReprint) {
    // Check if a non-reprint job for this bill already exists
    const existing = await db.print_queue
      .where('bill_id').equals(billId)
      .filter(job => !job.is_reprint)
      .first();
    
    if (existing && ['pending', 'printing', 'retrying'].includes(existing.status)) {
      // Job already in queue — do not duplicate
      console.warn(`Print job for bill ${billId} already in queue (${existing.status})`);
      return null;
    }
  }
  
  // Safe to add
  const printerSettings = await db.printer_settings.get('default');
  
  const job = {
    id: generateId(),
    bill_id: billId,
    bill_data_snapshot: await getBillSnapshot(billId),
    printer_type: printerSettings?.active_printer_type || 'browser',
    status: 'pending',
    attempts: 0,
    max_attempts: 3,
    last_attempt_at: null,
    last_error: null,
    completed_at: null,
    created_at: Date.now(),
    is_reprint: isReprint,
    original_print_id: null,
    queued_by: getCurrentUserId(),
    copies: printerSettings?.copies_count || 1,
    paper_size: printerSettings?.paper_size || '58mm',
    synced: false
  };
  
  await db.print_queue.add(job);
  return job.id;
};
```

### 5.6 Reprint Workflow

```
User opens Bill History
↓
Finds bill to reprint
↓
Taps "Reprint" button
↓
App shows confirmation: "Reprint Bill #XXX?"
↓
User confirms
↓
addToPrintQueue(billId, isReprint: true)
↓
Job added with is_reprint: true
↓
Queue processor picks up and executes
↓
Print log records reprint event with user ID
```

The `is_reprint: true` flag ensures:
- Analytics can distinguish original prints from reprints
- Duplicate detection is bypassed for reprints
- Print log records who initiated the reprint

### 5.7 Stale Queue Cleanup

On app start, clean up stale jobs from previous sessions:

```javascript
const cleanupStaleQueue = async () => {
  const db = await getDB();
  const staleThresholdMs = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();
  
  // Jobs stuck in 'printing' state are from a crashed session
  const stuckJobs = await db.print_queue
    .where('status').equals('printing')
    .toArray();
  
  for (const job of stuckJobs) {
    const timeSinceAttempt = now - (job.last_attempt_at || job.created_at);
    
    if (timeSinceAttempt > staleThresholdMs) {
      // Reset to pending for retry
      await db.print_queue.update(job.id, {
        status: job.attempts >= job.max_attempts ? 'failed' : 'retrying',
        last_error: 'App was closed during printing. Will retry.'
      });
    }
  }
};
```

---

## 6. Print Logs System

### 6.1 Purpose

The PRINT_LOGS table is the audit trail for all printing activity. It answers questions like:
- Was this bill printed?
- Who reprinted it and when?
- Which printer type was used?
- How many print failures happened today?
- Is there a pattern of printer failures at certain times?

### 6.2 PRINT_LOGS Schema

```javascript
db.version(1).stores({
  print_logs: '++id, bill_id, status, created_at, printer_type, queued_by'
});

/*
PRINT_LOGS Record Structure:
{
  id: string,                    // UUID
  bill_id: string,               // Reference to bill
  print_queue_id: string,        // Reference to the queue job
  status: 'success'              // 'success' | 'failed' | 'reprint_success' | 'reprint_failed'
        | 'failed'
        | 'reprint_success'
        | 'reprint_failed',
  printer_type: string,          // 'browser' | 'wifi' | 'bluetooth'
  printer_name: string | null,   // Friendly name of printer used
  printer_ip: string | null,     // For Wi-Fi printer
  printer_mac: string | null,    // For BT printer
  paper_size: string,            // '58mm' | '80mm'
  copies: number,                // How many copies were printed
  is_reprint: boolean,
  error_message: string | null,  // If failed
  attempt_number: number,        // Which attempt succeeded/failed
  created_at: number,            // Timestamp
  queued_by: string,             // User ID
  device_id: string,             // Device identifier
  synced: boolean                // Synced to Google Sheets for reports
}
*/
```

### 6.3 Writing to Print Logs

```javascript
// PrintLogService.js
export const writePrintLog = async ({
  bill_id,
  print_queue_id,
  status,
  printer_type,
  is_reprint,
  error_message = null,
  queued_by,
  attempt_number = 1
}) => {
  const db = await getDB();
  const printerSettings = await db.printer_settings.get('default');
  
  await db.print_logs.add({
    id: generateId(),
    bill_id,
    print_queue_id,
    status,
    printer_type,
    printer_name: printerSettings?.printer_name || null,
    printer_ip: printer_type === 'wifi' ? printerSettings?.wifi_printer_ip : null,
    printer_mac: printer_type === 'bluetooth' ? printerSettings?.bluetooth_mac : null,
    paper_size: printerSettings?.paper_size || '58mm',
    copies: printerSettings?.copies_count || 1,
    is_reprint: is_reprint || false,
    error_message,
    attempt_number,
    created_at: Date.now(),
    queued_by,
    device_id: getDeviceId(),
    synced: false
  });
  
  // Add to sync queue for Google Sheets reporting
  await db.sync_queue.add({
    id: generateId(),
    action: 'sync_print_log',
    payload: bill_id,
    status: 'pending',
    created_at: Date.now(),
    attempts: 0
  });
};
```

### 6.4 Print Log Analytics (For Reports)

The Google Sheets PRINT_LOGS tab (synced from IndexedDB) enables:

| Metric | Query |
|---|---|
| Total prints today | COUNT where status='success' AND date=today |
| Reprint rate | COUNT(is_reprint=true) / COUNT(is_reprint=false) |
| Print failure rate | COUNT(status='failed') / COUNT(*) |
| Most failed printer type | GROUP BY printer_type WHERE status='failed' |
| Bills never printed | LEFT JOIN BILLS where no matching PRINT_LOGS success |

---

## 7. Discount System — Full Design

### 7.1 Philosophy

Discounts at Anupurna Traders are real and common:
- Regular customers get small price reductions
- Bulk buyers expect item-level discounts
- Occasional promotional discounts on full bills
- Owner discretion discounts for loyal relationships

The discount system must be fast, optional, and visible without cluttering the billing UI.

### 7.2 Discount Types

#### Type A — Item-Level Discount

Applied to a single line item in the cart.

```
Example:
Harpic 1L × 2
Unit Price: ₹95
Item Discount: ₹10 (fixed)
Item Total: ₹(95×2) - ₹10 = ₹180

OR

Harpic 1L × 2
Unit Price: ₹95
Item Discount: 5% 
Item Total: ₹190 - ₹9.50 = ₹180.50 → round to ₹181
```

#### Type B — Bill-Level Discount

Applied to the full bill after all items are summed.

```
Example:
Item subtotal: ₹1,200
Bill Discount: ₹50 (fixed)
Final Total: ₹1,150

OR

Item subtotal: ₹1,200
Bill Discount: 10%
Discount Amount: ₹120
Final Total: ₹1,080
```

#### Combining Both Types

Both types can coexist. Calculation order:

```
For each item:
  item_total = (qty × unit_price) - item_discount

subtotal = sum(all item_totals)

bill_discount_amount = (bill_discount_type === 'percent')
  ? subtotal × (bill_discount_percent / 100)
  : bill_discount_fixed

total = subtotal - bill_discount_amount
```

### 7.3 Discount Data Model

```javascript
// Within a BILL record:
{
  // Bill-level discount fields
  discount_amount: 0,         // Computed final discount in ₹
  discount_type: null,        // 'fixed' | 'percent' | null
  discount_percent: null,     // If type=percent, the % value (e.g., 10 for 10%)
  discount_reason: null,      // Optional text ("Festival offer", "Regular customer")
  
  // Bill totals
  subtotal: 1200,             // Sum of all item_totals (after item discounts)
  total_amount: 1150,         // subtotal - discount_amount
}

// Within a BILL_ITEM record:
{
  qty: 2,
  unit_price: 95,
  item_discount: 10,          // ₹10 fixed discount on this item
  item_discount_type: 'fixed',// 'fixed' | 'percent'
  item_total: 180,            // (qty × unit_price) - item_discount
}
```

### 7.4 Discount UX Design — Billing Cart Screen

#### Cart Layout with Discount

```
┌─────────────────────────────────────┐
│  🛒 BILL CART                 [×]   │
├─────────────────────────────────────┤
│  Harpic 1L                          │
│  2 × ₹95          [-%] [−] [2] [+] │
│  ₹190                               │
├─────────────────────────────────────┤
│  Vim Bar 200g                        │
│  5 × ₹18          [-%] [−] [5] [+] │
│  ₹90                                │
├─────────────────────────────────────┤
│                                     │
│  Subtotal                   ₹280   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🏷️ Bill Discount   [Add]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  TOTAL                     ₹280   │
│                                     │
│  [Cash] [UPI] [Udhaar] [Split]     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     ✅ CREATE BILL          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Item-Level Discount — Tap [-%] on any item

```
┌─────────────────────────────────────┐
│  Item Discount — Harpic 1L    [×]  │
├─────────────────────────────────────┤
│                                     │
│  [Fixed ₹]        [Percent %]      │
│   ───●───              ─────       │
│                                     │
│  Amount:  [    10    ]              │
│                                     │
│  [Remove Discount]    [Apply]      │
│                                     │
└─────────────────────────────────────┘
```

#### Bill-Level Discount — Tap [Add] on Bill Discount row

```
┌─────────────────────────────────────┐
│  Bill Discount                [×]  │
├─────────────────────────────────────┤
│                                     │
│  [Fixed ₹]        [Percent %]      │
│   ───●───              ─────       │
│                                     │
│  Amount:  [    50    ]              │
│                                     │
│  Reason (optional):                 │
│  [                              ]   │
│                                     │
│  [Remove]              [Apply]     │
│                                     │
└─────────────────────────────────────┘
```

### 7.5 Real-Time Discount Calculation

```javascript
// DiscountCalculator.js
export const calculateBillTotals = (items, billDiscount) => {
  
  // Step 1: Calculate each item total
  const itemsWithTotals = items.map(item => {
    const grossTotal = item.qty * item.unit_price;
    let itemDiscountAmount = 0;
    
    if (item.item_discount && item.item_discount > 0) {
      if (item.item_discount_type === 'percent') {
        itemDiscountAmount = Math.round((grossTotal * item.item_discount) / 100 * 100) / 100;
      } else {
        itemDiscountAmount = item.item_discount;
      }
    }
    
    const itemTotal = grossTotal - itemDiscountAmount;
    
    return {
      ...item,
      gross_total: grossTotal,
      item_discount_amount: itemDiscountAmount,
      item_total: Math.max(0, itemTotal) // Never negative
    };
  });
  
  // Step 2: Compute subtotal
  const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.item_total, 0);
  
  // Step 3: Compute bill-level discount
  let billDiscountAmount = 0;
  
  if (billDiscount?.amount > 0) {
    if (billDiscount.type === 'percent') {
      billDiscountAmount = Math.round((subtotal * billDiscount.amount) / 100 * 100) / 100;
    } else {
      billDiscountAmount = billDiscount.amount;
    }
  }
  
  // Guard: discount cannot exceed subtotal
  billDiscountAmount = Math.min(billDiscountAmount, subtotal);
  
  // Step 4: Final total
  const totalAmount = subtotal - billDiscountAmount;
  
  return {
    items: itemsWithTotals,
    subtotal: Math.round(subtotal * 100) / 100,
    bill_discount_amount: Math.round(billDiscountAmount * 100) / 100,
    total_amount: Math.round(totalAmount * 100) / 100
  };
};
```

### 7.6 Discount Permission Control

```javascript
// discount_permissions in PRINTER_SETTINGS (reusing same config context)
// Or better — in APP_CONFIG in IndexedDB:

{
  discount_mode: 'all_users',       // 'all_users' | 'owner_only'
  max_item_discount_percent: 20,    // Max % discount helper can apply
  max_bill_discount_percent: 10,    // Max % bill discount for helpers
  max_fixed_discount: 500,          // Max ₹ fixed discount for helpers
  require_discount_reason: false    // If true, reason field is mandatory
}
```

```javascript
// DiscountPermissionService.js
export const canApplyDiscount = (user, discountValue, discountType, discountScope) => {
  const config = getAppConfig();
  
  if (config.discount_mode === 'owner_only' && user.role !== 'owner') {
    return {
      allowed: false,
      reason: 'Only owner can apply discounts. Ask owner to create this bill.'
    };
  }
  
  if (user.role === 'helper') {
    if (discountType === 'percent') {
      const maxPercent = discountScope === 'item' 
        ? config.max_item_discount_percent 
        : config.max_bill_discount_percent;
        
      if (discountValue > maxPercent) {
        return {
          allowed: false,
          reason: `Maximum ${maxPercent}% discount allowed for helpers.`
        };
      }
    }
    
    if (discountType === 'fixed' && discountValue > config.max_fixed_discount) {
      return {
        allowed: false,
        reason: `Maximum ₹${config.max_fixed_discount} discount allowed for helpers.`
      };
    }
  }
  
  return { allowed: true };
};
```

### 7.7 Negative Bill Guard

The system must never produce a bill with a negative total:

```javascript
// In CreateBill validation, before saving:
if (totalAmount < 0) {
  throw new Error('NEGATIVE_BILL_TOTAL: Discount exceeds item prices. Please reduce discount.');
}

if (totalAmount === 0) {
  // Allow zero-total bills only for owner role
  if (currentUser.role !== 'owner') {
    throw new Error('ZERO_BILL_TOTAL: Bill total cannot be zero. Contact owner.');
  }
}
```

### 7.8 Discount Analytics in Reports

Discount data logged to Google Sheets BILLS and BILL_ITEMS tabs enables:

| Report | Data Source | Insight |
|---|---|---|
| Total discounts given today | BILLS.discount_amount sum | Daily margin impact |
| Discount by user | BILLS.discount + BILLS.created_by | Helper vs owner patterns |
| Most discounted products | BILL_ITEMS.item_discount sum, group by product | Pricing review flags |
| Discount reason analysis | BILLS.discount_reason | Understand discount drivers |
| Average discount % | AVG(discount_amount/subtotal) | Price discipline tracking |

---

## 8. Receipt Layout Design

### 8.1 Receipt Structure Overview

```
┌─────────────────────────────────────┐  ← Header (Shop Info)
│       ANUPURNA TRADERS              │
│         Safai Market                │
│    📍 [Address Line 1]              │
│    📱 [Phone Number]                │
│─────────────────────────────────────│  ← Bill Info
│  Bill No: #0042   Date: 21/06/25   │
│  Time: 04:35 PM   Cashier: Owner   │
│─────────────────────────────────────│  ← Items
│  ITEM            QTY   RATE  TOTAL │
│─────────────────────────────────────│
│  Harpic 1L         2   ₹95   ₹190 │
│  (Disc: -₹10)                ₹180 │
│  Vim Bar 200g      5   ₹18    ₹90 │
│  Surf Excel 500g   1  ₹115   ₹115 │
│─────────────────────────────────────│  ← Totals
│  Subtotal                    ₹385  │
│  Discount (Bill)             -₹20  │
│  ─────────────────────────────────  │
│  TOTAL                       ₹365  │
│─────────────────────────────────────│  ← Payment
│  Paid: Cash ₹400                   │
│  Change: ₹35                       │
│─────────────────────────────────────│  ← Udhaar (if applicable)
│  Udhaar Added: ₹200                │
│  Total Due: ₹850                   │
│─────────────────────────────────────│  ← Footer
│     Thank you! Aapka dhanyawad!     │
│  Wapas aayenge — Anupurna Traders  │
│                                     │
└─────────────────────────────────────┘
```

### 8.2 Receipt HTML Template (Browser Print + PDF)

```javascript
// ReceiptTemplate.js
export const generateReceiptHTML = (bill) => {
  const itemRows = bill.items.map(item => {
    const itemRow = `
      <div class="item-row">
        <span class="item-name">${item.product_name}</span>
        <span class="item-qty">${item.qty}</span>
        <span class="item-rate">₹${item.unit_price}</span>
        <span class="item-total">₹${item.item_total}</span>
      </div>
    `;
    
    const discountRow = item.item_discount > 0 ? `
      <div class="item-discount-row">
        <span class="discount-label">  (Discount: -₹${item.item_discount_amount})</span>
        <span class="discount-net">₹${item.item_total}</span>
      </div>
    ` : '';
    
    return itemRow + discountRow;
  }).join('');
  
  const billDiscountRow = bill.discount_amount > 0 ? `
    <div class="total-row discount">
      <span>Discount${bill.discount_type === 'percent' ? ` (${bill.discount_percent}%)` : ''}</span>
      <span>-₹${bill.discount_amount}</span>
    </div>
  ` : '';
  
  const udhaarRow = bill.udhaar_amount > 0 ? `
    <div class="divider"></div>
    <div class="udhaar-section">
      <div>Udhaar Added: ₹${bill.udhaar_amount}</div>
      <div>Total Outstanding: ₹${bill.customer_total_udhaar}</div>
    </div>
  ` : '';
  
  const changeRow = bill.payment_method === 'cash' && bill.cash_tendered > bill.total_amount ? `
    <div class="payment-row">
      <span>Cash Received</span><span>₹${bill.cash_tendered}</span>
    </div>
    <div class="payment-row">
      <span>Change</span><span>₹${bill.cash_tendered - bill.total_amount}</span>
    </div>
  ` : '';
  
  return `
    <div class="receipt">
      <!-- Header -->
      <div class="center bold shop-name">ANUPURNA TRADERS</div>
      <div class="center">Safai Market</div>
      <div class="center small">${bill.shop_address || ''}</div>
      <div class="center small">📱 ${bill.shop_phone || ''}</div>
      <div class="divider"></div>
      
      <!-- Bill Info -->
      <div class="bill-info-row">
        <span>Bill#: ${bill.bill_number}</span>
        <span>${formatDate(bill.created_at)}</span>
      </div>
      <div class="bill-info-row">
        <span>Time: ${formatTime(bill.created_at)}</span>
        <span>${bill.cashier_name || ''}</span>
      </div>
      ${bill.customer_name ? `<div>Customer: ${bill.customer_name}</div>` : ''}
      <div class="divider"></div>
      
      <!-- Items Header -->
      <div class="item-header">
        <span class="item-name">ITEM</span>
        <span class="item-qty">QTY</span>
        <span class="item-rate">RATE</span>
        <span class="item-total">AMT</span>
      </div>
      <div class="divider-dashed"></div>
      
      <!-- Items -->
      ${itemRows}
      <div class="divider"></div>
      
      <!-- Totals -->
      <div class="total-row">
        <span>Subtotal</span>
        <span>₹${bill.subtotal}</span>
      </div>
      ${billDiscountRow}
      <div class="divider"></div>
      <div class="total-row grand-total">
        <span>TOTAL</span>
        <span>₹${bill.total_amount}</span>
      </div>
      <div class="divider"></div>
      
      <!-- Payment -->
      <div class="payment-method">
        Paid: ${formatPaymentMethod(bill)}
      </div>
      ${changeRow}
      
      <!-- Udhaar -->
      ${udhaarRow}
      
      <!-- Footer -->
      <div class="divider"></div>
      <div class="center">Thank you! Aapka dhanyawad!</div>
      <div class="center small">Wapas aayenge — Anupurna Traders</div>
      <div class="spacer"></div>
    </div>
  `;
};
```

### 8.3 Receipt Layout for Different Scenarios

#### Scenario A — Simple Cash Bill, No Discount
```
ANUPURNA TRADERS
  Safai Market
Bill#: 0042    21/06/25
Time: 4:35 PM  Owner
---------------------------------
ITEM          QTY RATE    AMT
---------------------------------
Harpic 1L       2  ₹95   ₹190
Vim Bar         5  ₹18    ₹90
---------------------------------
TOTAL                     ₹280
---------------------------------
Paid: Cash
=================================
    Thank you! Aapka dhanyawad!
```

#### Scenario B — With Item Discount + Bill Discount
```
ANUPURNA TRADERS
  Safai Market
Bill#: 0043    21/06/25
---------------------------------
ITEM          QTY RATE    AMT
---------------------------------
Harpic 1L       2  ₹95   ₹190
  Discount:           -₹10 ₹180
Surf Excel      1 ₹115   ₹115
---------------------------------
Subtotal                  ₹295
Discount (5%)             -₹15
---------------------------------
TOTAL                     ₹280
---------------------------------
Paid: UPI
=================================
```

#### Scenario C — Udhaar Bill
```
ANUPURNA TRADERS
  Safai Market
Bill#: 0044    21/06/25
Customer: Ramesh Ji
---------------------------------
[items...]
---------------------------------
TOTAL                     ₹450
---------------------------------
Paid: Udhaar ₹450
---------------------------------
Udhaar Added:             ₹450
Total Outstanding:       ₹1,250
=================================
    Thank you! Aapka dhanyawad!
```

#### Scenario D — Split Payment
```
---------------------------------
TOTAL                     ₹600
---------------------------------
Cash:                     ₹400
UPI:                      ₹200
---------------------------------
Paid: ₹600
=================================
```

---

## 9. ESC/POS Architecture

### 9.1 What is ESC/POS

ESC/POS is the industry-standard command language for thermal printers invented by Epson. It consists of byte sequences that control printing behavior. Understanding this is required for Bluetooth and Wi-Fi direct printing.

### 9.2 Core ESC/POS Commands

```javascript
// ESCPOSCommands.js
export const ESC = 0x1B;
export const GS = 0x1D;
export const LF = 0x0A;  // Line feed (new line + print)
export const NUL = 0x00;

export const COMMANDS = {
  // Initialization
  INIT: [ESC, 0x40],                    // Reset printer to default state
  
  // Text Alignment
  ALIGN_LEFT: [ESC, 0x61, 0x00],       // Left align
  ALIGN_CENTER: [ESC, 0x61, 0x01],     // Center align
  ALIGN_RIGHT: [ESC, 0x61, 0x02],      // Right align
  
  // Text Style
  BOLD_ON: [ESC, 0x45, 0x01],          // Bold text on
  BOLD_OFF: [ESC, 0x45, 0x00],         // Bold text off
  UNDERLINE_ON: [ESC, 0x2D, 0x01],     // Underline on
  UNDERLINE_OFF: [ESC, 0x2D, 0x00],    // Underline off
  
  // Font Size
  FONT_NORMAL: [GS, 0x21, 0x00],       // Normal size
  FONT_DOUBLE_HEIGHT: [GS, 0x21, 0x01],// 2x height
  FONT_DOUBLE_WIDTH: [GS, 0x21, 0x10], // 2x width
  FONT_DOUBLE_BOTH: [GS, 0x21, 0x11],  // 2x height and width
  
  // Line Spacing
  LINE_SPACING_DEFAULT: [ESC, 0x32],   // Default line spacing
  
  // Character Sets
  CHARSET_PC437: [ESC, 0x74, 0x00],    // USA / Standard Latin
  CHARSET_PC858: [ESC, 0x74, 0x13],    // Multilingual (includes ₹ on some printers)
  
  // Paper
  FEED_LINE: [LF],                     // Feed one line
  FEED_N_LINES: (n) => [ESC, 0x64, n], // Feed N lines
  CUT_PAPER_FULL: [GS, 0x56, 0x00],   // Full paper cut
  CUT_PAPER_PARTIAL: [GS, 0x56, 0x01],// Partial cut (leaves small connection)
  
  // Open Cash Drawer (if connected)
  OPEN_DRAWER: [ESC, 0x70, 0x00, 0x19, 0xFA],
};
```

### 9.3 ESC/POS Receipt Builder

```javascript
// ESCPOSBuilder.js
export class ESCPOSBuilder {
  constructor(paperWidth = '58mm') {
    this.bytes = [];
    this.charPerLine = paperWidth === '80mm' ? 48 : 32;
    this.encoding = 'windows-1252'; // Best for Indian + English text
  }
  
  // Initialize printer
  init() {
    this.addBytes(COMMANDS.INIT);
    this.addBytes(COMMANDS.LINE_SPACING_DEFAULT);
    return this;
  }
  
  // Add raw bytes
  addBytes(byteArray) {
    this.bytes.push(...byteArray);
    return this;
  }
  
  // Encode and add text
  addText(text) {
    // Encode text to bytes
    // Note: ₹ symbol requires special handling
    const encoded = encodeText(text);
    this.bytes.push(...encoded);
    return this;
  }
  
  // Add a full line with newline
  addLine(text = '') {
    this.addText(text);
    this.addBytes(COMMANDS.FEED_LINE);
    return this;
  }
  
  // Center text
  addCenterLine(text) {
    this.addBytes(COMMANDS.ALIGN_CENTER);
    this.addLine(text);
    this.addBytes(COMMANDS.ALIGN_LEFT);
    return this;
  }
  
  // Bold line
  addBoldLine(text) {
    this.addBytes(COMMANDS.BOLD_ON);
    this.addLine(text);
    this.addBytes(COMMANDS.BOLD_OFF);
    return this;
  }
  
  // Divider line (dashes)
  addDivider(char = '-') {
    this.addLine(char.repeat(this.charPerLine));
    return this;
  }
  
  // Two-column row: left text + right text
  addTwoColumnRow(left, right) {
    const totalLen = this.charPerLine;
    const rightLen = right.length;
    const leftMaxLen = totalLen - rightLen - 1;
    
    // Truncate left if too long
    const leftText = left.length > leftMaxLen 
      ? left.substring(0, leftMaxLen - 2) + '..' 
      : left;
    
    const spaces = totalLen - leftText.length - rightLen;
    const row = leftText + ' '.repeat(Math.max(1, spaces)) + right;
    
    this.addLine(row);
    return this;
  }
  
  // Four-column item row: name, qty, rate, total
  addItemRow(name, qty, rate, total) {
    // On 58mm: name=14, qty=4, rate=7, total=7
    // On 80mm: name=22, qty=5, rate=10, total=11
    const layout = this.charPerLine === 32 
      ? { name: 14, qty: 4, rate: 7, total: 7 }
      : { name: 22, qty: 5, rate: 10, total: 11 };
    
    const nameStr = (name || '').substring(0, layout.name).padEnd(layout.name);
    const qtyStr = String(qty).padStart(layout.qty);
    const rateStr = `Rs${rate}`.padStart(layout.rate);
    const totalStr = `Rs${total}`.padStart(layout.total);
    
    this.addLine(`${nameStr}${qtyStr}${rateStr}${totalStr}`);
    return this;
  }
  
  // Feed lines before cut
  feedAndCut(lines = 3) {
    this.addBytes(COMMANDS.FEED_N_LINES(lines));
    this.addBytes(COMMANDS.CUT_PAPER_PARTIAL);
    return this;
  }
  
  // Build final byte array
  build() {
    return new Uint8Array(this.bytes);
  }
}
```

### 9.4 Full Receipt Builder Using ESC/POS

```javascript
// ReceiptBuilder.js
export const buildReceiptBytes = (bill, paperSize = '58mm') => {
  const printer = new ESCPOSBuilder(paperSize);
  
  printer
    .init()
    
    // Header
    .addCenterLine('')
    .addBytes(COMMANDS.FONT_DOUBLE_WIDTH)
    .addCenterLine('ANUPURNA')
    .addBytes(COMMANDS.FONT_NORMAL)
    .addCenterLine('TRADERS - Safai Market')
    .addCenterLine(bill.shop_address || '')
    .addCenterLine(`Ph: ${bill.shop_phone || ''}`)
    .addDivider()
    
    // Bill info
    .addTwoColumnRow(`Bill#: ${bill.bill_number}`, formatDate(bill.created_at))
    .addTwoColumnRow(`Time: ${formatTime(bill.created_at)}`, bill.cashier_name || '')
    .addDivider('-')
    
    // Item header
    .addLine(paperSize === '58mm' 
      ? 'ITEM          QTY RATE   AMT'
      : 'ITEM                  QTY   RATE      AMT'
    )
    .addDivider('-');
  
  // Items
  for (const item of bill.items) {
    printer.addItemRow(item.product_name, item.qty, item.unit_price, item.item_total);
    
    if (item.item_discount_amount > 0) {
      printer.addTwoColumnRow(
        `  Disc: -Rs${item.item_discount_amount}`,
        `Rs${item.item_total}`
      );
    }
  }
  
  printer
    .addDivider()
    .addTwoColumnRow('Subtotal', `Rs${bill.subtotal}`);
  
  if (bill.discount_amount > 0) {
    const discLabel = bill.discount_type === 'percent'
      ? `Discount (${bill.discount_percent}%)`
      : 'Discount';
    printer.addTwoColumnRow(discLabel, `-Rs${bill.discount_amount}`);
  }
  
  printer
    .addDivider()
    .addBytes(COMMANDS.BOLD_ON)
    .addTwoColumnRow('TOTAL', `Rs${bill.total_amount}`)
    .addBytes(COMMANDS.BOLD_OFF)
    .addDivider();
  
  // Payment
  if (bill.payment_method === 'cash') {
    printer.addTwoColumnRow('Paid: Cash', `Rs${bill.cash_tendered || bill.total_amount}`);
    if (bill.cash_tendered > bill.total_amount) {
      printer.addTwoColumnRow('Change', `Rs${bill.cash_tendered - bill.total_amount}`);
    }
  } else if (bill.payment_method === 'upi') {
    printer.addLine('Paid: UPI');
  } else if (bill.payment_method === 'udhaar') {
    printer.addTwoColumnRow('Udhaar Added', `Rs${bill.udhaar_amount}`);
    printer.addTwoColumnRow('Total Due', `Rs${bill.customer_total_udhaar}`);
  } else if (bill.payment_method === 'split') {
    if (bill.cash_amount > 0) printer.addTwoColumnRow('Cash', `Rs${bill.cash_amount}`);
    if (bill.upi_amount > 0) printer.addTwoColumnRow('UPI', `Rs${bill.upi_amount}`);
    if (bill.udhaar_amount > 0) printer.addTwoColumnRow('Udhaar', `Rs${bill.udhaar_amount}`);
  }
  
  printer
    .addDivider()
    .addCenterLine('Dhanyawad! Wapas aayenge.')
    .addCenterLine('-- Anupurna Traders --')
    .feedAndCut(4);
  
  return printer.build();
};
```

### 9.5 The ₹ Symbol Problem

The Indian Rupee symbol (₹) is Unicode U+20B9, added in 2010. Most thermal printers use older character sets that don't include it. Solutions:

| Approach | Details |
|---|---|
| Use `Rs` instead | Most reliable, works on all printers |
| Use `INR` | Alternative ASCII fallback |
| Check printer charset | Some newer printers support CP858 or custom codepage with ₹ |
| Image-based ₹ | Print ₹ as a bitmap image (complex, not worth it for receipts) |

**Recommendation:** Use `Rs` in ESC/POS output. Use `₹` in HTML/browser print (full Unicode support). The printer settings can have a toggle: "Show ₹ symbol" (HTML/PDF) vs "Rs prefix" (thermal).

---

## 10. Bluetooth Printer Architecture (APK Deep Dive)

### 10.1 Capacitor Plugin Architecture

```
React App (TypeScript)
  │
  │ import { BluetoothSerial } from '@custom/capacitor-escpos-bt'
  │
  ▼
Capacitor Bridge Layer
  │
  ├─ iOS: CoreBluetooth Framework (MFi certified printers only)
  └─ Android: BluetoothAdapter + BluetoothSocket (RFCOMM)
```

### 10.2 Custom Capacitor Plugin Specification

For production use, the recommended approach is a custom Capacitor plugin that wraps Android's BluetoothAdapter specifically for ESC/POS printers. Key interface:

```typescript
// capacitor-escpos-bt plugin interface
interface ESCPOSBluetoothPlugin {
  
  // Check if Bluetooth is enabled
  isEnabled(): Promise<{ enabled: boolean }>;
  
  // Enable Bluetooth (shows system dialog)
  enable(): Promise<{ enabled: boolean }>;
  
  // Get list of paired devices
  getPairedDevices(): Promise<{ devices: BluetoothDevice[] }>;
  
  // Scan for new devices (requires location permission on Android < 12)
  scanDevices(options: { duration: number }): Promise<{ devices: BluetoothDevice[] }>;
  
  // Connect to device
  connect(options: { address: string }): Promise<{ connected: boolean }>;
  
  // Disconnect
  disconnect(options: { address: string }): Promise<{ disconnected: boolean }>;
  
  // Check connection status
  isConnected(options: { address: string }): Promise<{ connected: boolean }>;
  
  // Print bytes (base64 encoded)
  printBytes(options: { 
    address: string; 
    data: string; // base64 
    chunkSize?: number; 
  }): Promise<{ success: boolean; bytesWritten: number }>;
  
  // Listen for connection state changes
  addListener(
    eventName: 'connectionStateChange',
    listenerFunc: (event: ConnectionStateEvent) => void
  ): Promise<PluginListenerHandle>;
}

interface BluetoothDevice {
  name: string;
  address: string;
  bonded: boolean;
}

interface ConnectionStateEvent {
  address: string;
  state: 'connected' | 'disconnected' | 'connecting' | 'error';
  error?: string;
}
```

### 10.3 Android Native Implementation (Java/Kotlin Excerpt)

```kotlin
// ESCPOSBluetoothPlugin.kt
@PluginMethod
fun printBytes(call: PluginCall) {
  val address = call.getString("address") ?: run {
    call.reject("Address required")
    return
  }
  
  val base64Data = call.getString("data") ?: run {
    call.reject("Data required")
    return
  }
  
  val bytes = Base64.decode(base64Data, Base64.DEFAULT)
  val chunkSize = call.getInt("chunkSize", 512)!!
  
  val socket = connectedSockets[address] ?: run {
    call.reject("Not connected to $address")
    return
  }
  
  CoroutineScope(Dispatchers.IO).launch {
    try {
      val outputStream = socket.outputStream
      var offset = 0
      
      while (offset < bytes.size) {
        val end = minOf(offset + chunkSize, bytes.size)
        outputStream.write(bytes, offset, end - offset)
        outputStream.flush()
        offset = end
        delay(50) // Small delay between chunks
      }
      
      withContext(Dispatchers.Main) {
        val result = JSObject()
        result.put("success", true)
        result.put("bytesWritten", bytes.size)
        call.resolve(result)
      }
      
    } catch (e: IOException) {
      withContext(Dispatchers.Main) {
        call.reject("Print failed: ${e.message}")
      }
    }
  }
}
```

### 10.4 Bluetooth Connection Keep-Alive Strategy

Maintaining a persistent BT connection avoids the 500ms–2s reconnect delay that would make each print feel slow:

```javascript
// BluetoothConnectionManager.js
class BluetoothConnectionManager {
  constructor() {
    this.currentConnection = null;
    this.keepAliveInterval = null;
  }
  
  async connect(macAddress) {
    if (this.currentConnection?.address === macAddress) {
      const isStillConnected = await ESCPOSBluetooth.isConnected({ address: macAddress });
      if (isStillConnected.connected) return true;
    }
    
    await ESCPOSBluetooth.connect({ address: macAddress });
    this.currentConnection = { address: macAddress, connectedAt: Date.now() };
    
    // Start keep-alive: send zero-byte test every 30 seconds
    this.keepAliveInterval = setInterval(async () => {
      const alive = await ESCPOSBluetooth.isConnected({ address: macAddress });
      if (!alive.connected) {
        clearInterval(this.keepAliveInterval);
        this.currentConnection = null;
        notifyBluetoothDisconnected();
      }
    }, 30000);
    
    return true;
  }
  
  async disconnect() {
    if (this.currentConnection) {
      clearInterval(this.keepAliveInterval);
      await ESCPOSBluetooth.disconnect({ address: this.currentConnection.address });
      this.currentConnection = null;
    }
  }
}
```

---

## 11. Wi-Fi Printer Architecture

### 11.1 Printer IP Configuration

The printer must have a stable IP. Two approaches:

**Method A — DHCP Reservation (Recommended)**
On the Wi-Fi router admin panel, assign a fixed IP to the printer's MAC address. This way the printer always gets the same IP without manual configuration.

**Method B — Manual Static IP**
Set a static IP directly on the printer (via printer settings menu or utility software). Common assignment: `192.168.1.50`.

The printer's IP is stored in PRINTER_SETTINGS.wifi_printer_ip. The app does not auto-discover printers — the owner enters the IP once during setup.

### 11.2 Connection Test Flow in Settings

```javascript
// Settings screen — "Test Connection" button
const testPrinterConnection = async () => {
  setTestStatus('testing');
  
  const settings = await getPrinterSettings();
  const result = await testWifiPrinterConnection(
    settings.wifi_printer_ip, 
    settings.wifi_printer_port || 9100
  );
  
  if (result.connected) {
    setTestStatus('success');
    showToast('✅ Printer connected successfully!');
    
    // Optionally send test print
    if (await confirmTestPrint()) {
      await wifiPrint(generateTestBillData(), 1, settings.paper_size);
    }
  } else {
    setTestStatus('failed');
    showToast(`❌ Cannot reach printer: ${result.error}`);
    showDetailedWifiTroubleshoot(result.error);
  }
};
```

### 11.3 Wi-Fi Print Troubleshooting Guide (In-App)

When Wi-Fi print fails, show this contextual guide:

```
Cannot reach printer at 192.168.1.50:9100

Checklist:
□ Is the printer turned ON?
□ Is the phone on the same Wi-Fi network as the printer?
□ Has the printer's IP address changed?
   (Check printer by printing a test page from printer itself)
□ Is the printer showing any error lights?
□ Try turning printer off and on again.

If IP has changed:
  Go to Settings → Printer → Wi-Fi Printer IP
  Enter new IP address and test again.
```

### 11.4 Same-Network Detection

Before sending a Wi-Fi print job, warn if the device might not be on the right network:

```javascript
const checkSameNetworkHint = async (printerIP) => {
  // Extract network prefix from printer IP
  const printerNetwork = printerIP.split('.').slice(0, 3).join('.'); // e.g., "192.168.1"
  
  // Get device IP using WebRTC local candidate trick (PWA only)
  const deviceIP = await getDeviceLocalIP();
  
  if (deviceIP) {
    const deviceNetwork = deviceIP.split('.').slice(0, 3).join('.');
    
    if (deviceNetwork !== printerNetwork) {
      return {
        sameNetwork: false,
        warning: `Your phone is on ${deviceNetwork}.x but printer is on ${printerNetwork}.x. They must be on the same Wi-Fi network.`
      };
    }
  }
  
  return { sameNetwork: true };
};
```

---

## 12. Browser Print Architecture

### 12.1 Print Stylesheet

```css
/* print.css — included globally, activated on print media */
@media print {
  /* Hide everything except receipt */
  body > *:not(#print-receipt-container) {
    display: none !important;
  }
  
  #print-receipt-container {
    display: block !important;
  }
  
  /* Receipt styling */
  @page {
    size: 80mm auto; /* Default to 80mm for browser print */
    margin: 3mm;
  }
  
  .receipt {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    line-height: 1.4;
    width: 74mm;
    color: #000;
  }
  
  .receipt .shop-name {
    font-size: 14px;
    font-weight: bold;
  }
  
  .receipt .grand-total {
    font-size: 13px;
    font-weight: bold;
  }
  
  .receipt .divider {
    border-top: 1px solid #000;
    margin: 4px 0;
  }
  
  .receipt .divider-dashed {
    border-top: 1px dashed #000;
    margin: 4px 0;
  }
}
```

### 12.2 Print Preview Modal

Before opening the system print dialog, show an in-app preview:

```jsx
// PrintPreviewModal.jsx
const PrintPreviewModal = ({ bill, onPrint, onClose }) => {
  return (
    <BottomSheet onClose={onClose}>
      <div className="p-4">
        <h3 className="text-lg font-bold mb-3">Print Preview</h3>
        
        {/* Scaled receipt preview */}
        <div className="bg-white border rounded p-3 mb-4 overflow-y-auto max-h-96">
          <div 
            dangerouslySetInnerHTML={{ __html: generateReceiptHTML(bill) }}
            style={{ transform: 'scale(0.9)', transformOrigin: 'top left' }}
          />
        </div>
        
        {/* Paper size selector */}
        <div className="flex gap-2 mb-4">
          <button 
            className={`flex-1 py-2 rounded ${paperSize === '58mm' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            onClick={() => setPaperSize('58mm')}
          >
            58mm
          </button>
          <button 
            className={`flex-1 py-2 rounded ${paperSize === '80mm' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            onClick={() => setPaperSize('80mm')}
          >
            80mm
          </button>
        </div>
        
        <button
          className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-bold"
          onClick={onPrint}
        >
          🖨️ Print / Save PDF
        </button>
        
        <button
          className="w-full mt-2 py-2 text-gray-500"
          onClick={onClose}
        >
          Skip Printing
        </button>
      </div>
    </BottomSheet>
  );
};
```

---

## 13. Printer Settings Module

### 13.1 Settings Screen Layout

```
┌─────────────────────────────────────┐
│  ← Printer Settings                 │
├─────────────────────────────────────┤
│                                     │
│  PRINTER TYPE                       │
│  ┌─────────────────────────────┐   │
│  │ ● Browser / PDF Print       │   │
│  │ ○ Wi-Fi Thermal Printer     │   │
│  │ ○ Bluetooth Printer (APK)   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ─── WI-FI PRINTER ─────────────   │
│                                     │
│  Printer IP Address                 │
│  [  192.168.1.50              ]    │
│                                     │
│  Port                               │
│  [  9100                      ]    │
│                                     │
│  [  🔌 Test Connection  ]          │
│                                     │
│  ─── BLUETOOTH PRINTER ──────────  │
│                                     │
│  [  📡 Scan for Printers  ]        │
│                                     │
│  Selected: Rongta RPP02             │
│  MAC: 00:11:22:33:44:55            │
│                                     │
│  [  🔗 Reconnect  ]                │
│                                     │
│  ─── PRINT SETTINGS ─────────────  │
│                                     │
│  Paper Size                         │
│  [  58mm ▼  ]                      │
│                                     │
│  Auto Print After Bill              │
│  [  ●  ON                    ]     │
│                                     │
│  Number of Copies                   │
│  [  −  ]  1  [  +  ]              │
│                                     │
│  ─── TEST ───────────────────────  │
│                                     │
│  [  🧾 Print Test Receipt  ]       │
│                                     │
└─────────────────────────────────────┘
```

### 13.2 Bluetooth Printer Discovery Screen

```
┌─────────────────────────────────────┐
│  ← Select Printer                   │
├─────────────────────────────────────┤
│                                     │
│  PAIRED DEVICES                     │
│  ┌─────────────────────────────┐   │
│  │  🖨️ Rongta RPP02            │   │
│  │  00:11:22:33:44:55          │   │
│  │  ✅ Currently selected      │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  🖨️ BIXOLON SPP-R200        │   │
│  │  AA:BB:CC:DD:EE:FF          │   │
│  │  [  Select  ]               │   │
│  └─────────────────────────────┘   │
│                                     │
│  NEARBY DEVICES                     │
│  ⟳ Scanning... (12s remaining)     │
│  ─────────────────────────────────  │
│  📱 Unknown Device                  │
│  📱 XP-58                          │
│      [  Pair & Select  ]           │
│                                     │
│  [  Stop Scan  ]                   │
│                                     │
└─────────────────────────────────────┘
```

### 13.3 Test Print Content

```
================================
      ANUPURNA TRADERS
       Safai Market
================================
       TEST PRINT
================================
Paper:  58mm
Chars:  32 per line
Date:   21/06/2025
Time:   04:35 PM
================================
ITEM          QTY RATE   AMT
--------------------------------
Test Item 1     1  Rs10   Rs10
Test Item 2     2  Rs25   Rs50
--------------------------------
Subtotal               Rs60
Discount               -Rs5
--------------------------------
TOTAL                  Rs55
================================
Printer is working correctly!
================================
```

---

## 14. Database Schema

### 14.1 PRINT_QUEUE — Full Schema

```javascript
// IndexedDB (Dexie.js)
db.version(1).stores({
  print_queue: [
    '++rowid',          // Auto-increment (not used as primary key)
    'id',               // Primary key: UUID string
    'bill_id',          // For lookups by bill
    'status',           // For filtering pending/failed
    'created_at',       // For ordering
    'printer_type',     // For type-based queries
    'attempts',         // For retry logic
    'synced'            // For sync tracking
  ].join(', ')
});

/*
Complete field reference:
Field                   Type            Description
──────────────────────────────────────────────────────────────────
id                      string          UUID primary key
bill_id                 string          FK → BILLS.id
bill_data_snapshot      string          JSON — full bill at queue time
printer_type            string          'browser'|'wifi'|'bluetooth'
status                  string          'pending'|'printing'|'completed'|'failed'|'retrying'|'cancelled'
attempts                number          Current attempt count (starts at 0)
max_attempts            number          Max retry attempts (default: 3)
last_attempt_at         number|null     Unix timestamp of last attempt
last_error              string|null     Error message from last failure
completed_at            number|null     Unix timestamp of success
created_at              number          Unix timestamp of job creation
is_reprint              boolean         Was this user-initiated reprint?
original_print_id       string|null     If reprint, original PRINT_QUEUE.id
queued_by               string          User ID
copies                  number          Print copies (default: 1)
paper_size              string          '58mm'|'80mm'
synced                  boolean         Synced to Google Sheets?
*/
```

### 14.2 PRINT_LOGS — Full Schema

```javascript
db.version(1).stores({
  print_logs: [
    '++rowid',
    'id',
    'bill_id',
    'status',
    'created_at',
    'printer_type',
    'queued_by',
    'synced'
  ].join(', ')
});

/*
Complete field reference:
Field                   Type            Description
──────────────────────────────────────────────────────────────────
id                      string          UUID primary key
bill_id                 string          FK → BILLS.id
print_queue_id          string          FK → PRINT_QUEUE.id
status                  string          'success'|'failed'|'reprint_success'|'reprint_failed'
printer_type            string          'browser'|'wifi'|'bluetooth'
printer_name            string|null     Human-readable printer name
printer_ip              string|null     IP for Wi-Fi type
printer_mac             string|null     MAC for Bluetooth type
paper_size              string          '58mm'|'80mm'
copies                  number
is_reprint              boolean
error_message           string|null     If status=failed
attempt_number          number          Which attempt this was
created_at              number          Unix timestamp
queued_by               string          User ID
device_id               string          Device identifier
synced                  boolean         Synced to Google Sheets?
*/
```

### 14.3 PRINTER_SETTINGS — Full Schema

```javascript
db.version(1).stores({
  printer_settings: 'key' // key-value store, single record with key='default'
});

/*
Record with key='default':
{
  key: 'default',
  
  // Active printer type
  active_printer_type: 'browser',   // 'browser'|'wifi'|'bluetooth'
  
  // Wi-Fi printer settings
  wifi_printer_ip: '192.168.1.50',
  wifi_printer_port: 9100,
  wifi_printer_name: 'Xprinter 58mm',
  wifi_last_connected: null,        // Timestamp
  wifi_connection_status: 'unknown',// 'connected'|'disconnected'|'unknown'
  
  // Bluetooth printer settings
  bluetooth_mac: '00:11:22:33:44:55',
  bluetooth_name: 'Rongta RPP02',
  bluetooth_last_connected: null,
  bluetooth_connection_status: 'disconnected',
  
  // General print settings
  paper_size: '58mm',               // '58mm'|'80mm'
  auto_print_enabled: true,         // Print automatically after bill creation
  copies_count: 1,                  // Number of copies per print
  show_rupee_symbol: false,         // true=₹ (HTML only), false=Rs (safe for ESC/POS)
  
  // Receipt customization
  receipt_header_line1: 'ANUPURNA TRADERS',
  receipt_header_line2: 'Safai Market',
  receipt_address: '',
  receipt_phone: '',
  receipt_footer_line1: 'Dhanyawad! Wapas aayenge.',
  receipt_footer_line2: '-- Anupurna Traders --',
  
  // Discount permission settings
  discount_mode: 'all_users',       // 'all_users'|'owner_only'
  max_item_discount_percent: 20,
  max_bill_discount_percent: 10,
  max_fixed_discount: 500,
  require_discount_reason: false,
  
  // Metadata
  last_updated: null,               // Timestamp
  updated_by: null,                 // User ID
}
*/
```

### 14.4 Google Sheets Tabs for Print Data

Add these tabs to the Google Sheets workbook:

**PRINT_LOGS tab:**
```
Columns:
A: log_id
B: bill_id
C: print_queue_id
D: status
E: printer_type
F: printer_name
G: paper_size
H: copies
I: is_reprint
J: error_message
K: attempt_number
L: created_at (ISO)
M: queued_by
N: device_id
```

**Apps Script sync handler:**
```javascript
// In Apps Script — handle sync_print_log action
function handleSyncPrintLog(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('PRINT_LOGS');
  
  sheet.appendRow([
    payload.id,
    payload.bill_id,
    payload.print_queue_id,
    payload.status,
    payload.printer_type,
    payload.printer_name || '',
    payload.paper_size,
    payload.copies,
    payload.is_reprint,
    payload.error_message || '',
    payload.attempt_number,
    new Date(payload.created_at).toISOString(),
    payload.queued_by,
    payload.device_id
  ]);
}
```

---

## 15. IndexedDB + Google Sheets Sync for Print Data

### 15.1 Sync Strategy for Print Data

Print data has lower sync priority than billing data. Sync order:

```
Priority 1: BILLS (most critical)
Priority 2: BILL_ITEMS
Priority 3: STOCK_MOVEMENTS
Priority 4: UDHAAR_LEDGER
Priority 5: SYNC_QUEUE items
Priority 6: PRINT_LOGS (lowest — analytics only)
```

PRINT_QUEUE is never synced to Google Sheets (it's transient data). PRINT_LOGS is synced for reporting and audit.

### 15.2 Sync Trigger for Print Logs

```javascript
// SyncService.js addition
const syncPrintLogs = async () => {
  const db = await getDB();
  
  const unsyncedLogs = await db.print_logs
    .where('synced').equals(false)
    .limit(50) // Process in batches
    .toArray();
  
  if (unsyncedLogs.length === 0) return;
  
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'sync_print_logs',
        payload: unsyncedLogs
      })
    });
    
    if (response.ok) {
      // Mark all as synced
      const ids = unsyncedLogs.map(log => log.id);
      await db.print_logs
        .where('id').anyOf(ids)
        .modify({ synced: true });
    }
    
  } catch (error) {
    // Silent fail — print logs sync is non-critical
    console.error('Print log sync failed:', error);
  }
};
```

---

## 16. Offline Printing Strategy

### 16.1 Offline Print Rules

```
RULE 1: Bills save offline — always. No printer required.

RULE 2: Browser print works offline (HTML is local, no network needed).

RULE 3: Wi-Fi print will fail offline (printer needs local network).
        → Job stays in PRINT_QUEUE with status 'retrying'
        → When Wi-Fi returns, queue processor retries automatically

RULE 4: Bluetooth print works offline (BT is local, no internet needed).
        → Bluetooth print is the best offline print method.

RULE 5: Print queue always has the bill_data_snapshot.
        → Print can execute even if bill hasn't synced to Google Sheets yet.

RULE 6: Never tell the user "Cannot create bill — printer offline"
        → Bill creation is always possible. Print is optional.
```

### 16.2 Offline Print Queue Behavior

```
App goes offline
↓
User creates bills normally
↓
Bills saved to IndexedDB ✅
↓
Print jobs added to PRINT_QUEUE ✅
↓
Queue processor attempts print
↓
Browser print: Works ✅
Bluetooth print: Works (if printer paired) ✅
Wi-Fi print: Fails → retrying status ⚠️
↓
App comes back online (Wi-Fi available)
↓
Queue processor retries Wi-Fi print jobs ✅
↓
Jobs complete, moved to completed status ✅
```

### 16.3 Bill Snapshot Importance

The `bill_data_snapshot` in PRINT_QUEUE is critical for offline printing:

```javascript
// When adding to print queue, always capture full bill data
const getBillSnapshot = async (billId) => {
  const db = await getDB();
  
  const bill = await db.bills.get(billId);
  const billItems = await db.bill_items.where('bill_id').equals(billId).toArray();
  const printerSettings = await db.printer_settings.get('default');
  const appConfig = await db.app_config.get('default');
  
  return JSON.stringify({
    ...bill,
    items: billItems,
    shop_name: appConfig?.shop_name || 'ANUPURNA TRADERS',
    shop_address: appConfig?.shop_address || '',
    shop_phone: appConfig?.shop_phone || '',
    cashier_name: getCurrentUserName(),
    // Include all data needed to render receipt without any DB lookups
  });
};
```

This snapshot means the receipt can be printed even if:
- The bill hasn't synced to Google Sheets
- The customer record isn't accessible
- The product catalog isn't loaded
- The app config has changed since billing

---

## 17. Error Handling — All Printer Types

### 17.1 Error Categories

```
Category A — Printer Hardware Errors (Recoverable)
  - Paper finished
  - Paper jam
  - Printer cover open
  - Low battery (portable printers)

Category B — Connectivity Errors (Retry-able)
  - Wi-Fi printer not reachable
  - Bluetooth connection dropped
  - Port connection refused

Category C — App Errors (Retry after fix)
  - Invalid ESC/POS bytes
  - Encoding error
  - Malformed bill data

Category D — System Errors (Non-retry)
  - Bluetooth permission denied
  - No printer configured
  - Android Bluetooth service unavailable
```

### 17.2 User-Facing Error Messages

```javascript
// PrintErrorMessages.js
export const getPrintErrorMessage = (errorCode, printerType) => {
  const messages = {
    PAPER_OUT: {
      title: 'Printer has no paper',
      detail: 'Please add paper to the printer and tap Retry.',
      action: 'retry'
    },
    BLUETOOTH_NOT_ENABLED: {
      title: 'Bluetooth is off',
      detail: 'Turn on Bluetooth on your phone and tap Retry.',
      action: 'retry'
    },
    BLUETOOTH_PERMISSION_DENIED: {
      title: 'Bluetooth permission needed',
      detail: 'Go to phone Settings → Apps → Safai Market → Permissions and enable Bluetooth.',
      action: 'open_settings'
    },
    PRINTER_NOT_REACHABLE: {
      title: 'Cannot reach printer',
      detail: printerType === 'wifi' 
        ? 'Make sure the printer is on and connected to the same Wi-Fi network.'
        : 'Make sure the Bluetooth printer is turned on and nearby.',
      action: 'retry'
    },
    PRINT_FAILED: {
      title: 'Print failed',
      detail: 'Something went wrong. The bill is saved. You can reprint from Bill History.',
      action: 'view_history'
    },
    NO_PRINTER_CONFIGURED: {
      title: 'No printer set up',
      detail: 'Go to Settings → Printer to configure a printer.',
      action: 'open_settings'
    }
  };
  
  return messages[errorCode] || {
    title: 'Print failed',
    detail: 'An unexpected error occurred. The bill is saved. Please try printing again.',
    action: 'retry'
  };
};
```

### 17.3 Print Failure Notification System

```jsx
// PrintFailureNotification.jsx
// Shows as a dismissible banner at the top of the home screen
const PrintFailureNotification = ({ failedJobs, onRetry, onViewHistory }) => {
  if (failedJobs.length === 0) return null;
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mx-4 my-2 rounded">
      <div className="flex items-center">
        <span className="text-yellow-600 text-xl mr-2">🖨️</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">
            {failedJobs.length} bill{failedJobs.length > 1 ? 's' : ''} could not be printed
          </p>
          <p className="text-xs text-yellow-600">Bill data is saved. Tap to retry printing.</p>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={onRetry} className="text-xs bg-yellow-400 px-3 py-1 rounded">
          Retry Print
        </button>
        <button onClick={onViewHistory} className="text-xs text-yellow-700 px-3 py-1">
          View Bills
        </button>
      </div>
    </div>
  );
};
```

---

## 18. Edge Cases — Complete Catalog

### 18.1 Print-Specific Edge Cases

| Edge Case | Detection | Handling |
|---|---|---|
| **App closed during print** | On app restart, find PRINT_QUEUE status='printing' older than 30min | Reset to 'retrying' or 'failed' |
| **Same bill printed twice (auto-print race)** | Duplicate detection in addToPrintQueue | Check existing non-reprint job before adding |
| **Printer paper finished mid-print** | ESC/POS error response or no response | Mark as 'failed', show "Add paper" message |
| **Wi-Fi printer IP changed** | Connection test fails | Show "IP may have changed" guidance |
| **Bluetooth device renamed** | MAC address stays same, name may change | Store and match by MAC, show display name |
| **Print queue grows unbounded** | Queue has 100+ jobs | Archive completed/failed jobs older than 7 days |
| **Reprint of cancelled bill** | Bill status='cancelled' | Show warning: "This bill was cancelled. Print anyway?" |
| **Print during low storage** | IndexedDB quota warning | Skip queue, use browser print as fallback |
| **Multiple devices, same printer** | Both devices send print simultaneously | Queue processor must handle gracefully; BT prints serialized |
| **User deletes printer settings** | Settings cleared | All pending Wi-Fi/BT jobs marked cancelled; fall back to browser print |
| **App restart with items in 'printing' state** | On init, check stale 'printing' jobs | Auto-reset to 'pending' after 5-minute threshold |
| **ESC/POS bytes malformed** | Print fails silently | Validate byte array before sending; log error |
| **Print after bill correction** | User edits bill (future feature) | Reprint job must use latest bill snapshot, not original |

### 18.2 Discount-Specific Edge Cases

| Edge Case | Detection | Handling |
|---|---|---|
| **Discount > item price** | item_total < 0 | Cap discount at item price; show warning |
| **Bill discount > subtotal** | total_amount < 0 | Cap bill discount at subtotal; prevent negative total |
| **100% discount** | total_amount = 0 | Allow for owner only; require reason |
| **Discount applied after udhaar entry** | Udhaar entry made before discount applied | Discount must be applied before bill save; no post-save discount |
| **Helper applies over-limit discount** | canApplyDiscount() returns false | Block with clear message; don't silently reduce discount |
| **Discount on zero-qty item** | item qty somehow 0 | Item should not be in cart; validate cart before save |
| **Percentage discount rounding** | 10% of ₹195 = ₹19.50 | Round to 2 decimal places; show rounded amount |
| **Discount reason required but empty** | require_discount_reason=true | Block save until reason entered |

### 18.3 Billing Integrity Edge Cases

| Edge Case | Detection | Handling |
|---|---|---|
| **Bill ID collision** | Two devices generate same ID | Use UUIDs (extremely unlikely) or device+timestamp+sequence |
| **Stock goes negative** | current_stock < 0 after sale | Allow (stock can legitimately go negative due to supply gaps), log warning |
| **Bill save fails mid-transaction** | IndexedDB transaction aborts | All-or-nothing transaction; nothing partially saved |
| **Sync fails for bill** | Google Sheets API error | Bill remains in sync_queue; retried on next sync cycle |
| **Two bills for same udhaar customer simultaneously** | Two devices billing same customer | Last-write-wins on udhaar balance; both entries in UDHAAR_LEDGER |

---

## 19. UX Requirements — Mobile-First Print UI

### 19.1 Print Button in Billing Success Screen

```jsx
// BillSuccessScreen.jsx
const BillSuccessScreen = ({ bill, onNewBill, onHome }) => {
  const [printStatus, setPrintStatus] = useState('idle'); // idle|printing|success|failed
  
  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      
      {/* Success Header */}
      <div className="bg-green-500 text-white text-center py-6">
        <div className="text-5xl mb-2">✅</div>
        <div className="text-2xl font-bold">Bill Saved!</div>
        <div className="text-sm opacity-80">Bill #{bill.bill_number} — ₹{bill.total_amount}</div>
      </div>
      
      {/* Print Status Banner */}
      {printStatus === 'printing' && (
        <div className="bg-blue-50 text-blue-700 text-center py-2 text-sm">
          🖨️ Printing...
        </div>
      )}
      {printStatus === 'success' && (
        <div className="bg-green-50 text-green-700 text-center py-2 text-sm">
          ✅ Printed successfully
        </div>
      )}
      {printStatus === 'failed' && (
        <div className="bg-yellow-50 text-yellow-700 text-center py-2 text-sm">
          ⚠️ Print failed — Bill is saved
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="p-4 flex flex-col gap-3">
        
        {/* Primary: New Bill */}
        <button
          className="w-full bg-green-600 text-white py-4 rounded-xl text-xl font-bold"
          onClick={onNewBill}
        >
          + New Bill
        </button>
        
        {/* Print Button — large, accessible */}
        <button
          className={`w-full py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2
            ${printStatus === 'failed' 
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-400' 
              : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          onClick={() => handlePrint(bill, setPrintStatus)}
        >
          🖨️ {printStatus === 'failed' ? 'Retry Print' : 'Print Receipt'}
        </button>
        
        {/* WhatsApp Share */}
        <button
          className="w-full bg-[#25D366] text-white py-3 rounded-xl text-base font-medium flex items-center justify-center gap-2"
          onClick={() => shareToWhatsApp(bill)}
        >
          📱 Share on WhatsApp
        </button>
        
        <button onClick={onHome} className="text-gray-400 text-sm text-center py-2">
          Go to Home
        </button>
      </div>
    </div>
  );
};
```

### 19.2 Print Status Indicators Throughout App

**Home Dashboard — Pending Print Jobs Indicator:**
```
If any PRINT_QUEUE jobs have status='failed':
  Show yellow badge on settings icon: "⚠️ 2 prints failed"
```

**Bill History Row — Print Status:**
```
Each bill row shows:
  ✅ Printed    (at least one success log)
  🖨️ Printing  (job in queue)
  ⚠️ Not printed (no success log, no pending job)
  [Reprint]    (tap to reprint)
```

**Bill Detail Screen — Print History:**
```
Print History:
  ✅ Printed  21 Jun 4:35 PM  Browser  Owner
  ✅ Reprinted 21 Jun 5:02 PM  Browser  Owner
  ❌ Failed   21 Jun 4:34 PM  Wi-Fi   "Connection refused"
```

### 19.3 Print Settings Access

Print settings must be accessible in 2 taps from the billing screen:
```
Billing Screen → ⚙️ → Printer Settings
```

Or from the home screen:
```
Home → Menu → Settings → Printer
```

### 19.4 Minimum Touch Target Compliance

All print-related UI elements must meet V6 PRD P1 requirement (48×48 point minimum):

| Element | Minimum Size |
|---|---|
| Print button on success screen | 56px height, full width |
| Retry Print button | 48px height |
| Printer type selector radio | 48×48px touch area |
| Test print button | 48px height |
| Copies counter +/- buttons | 48×48px each |

---

## 20. Capacitor APK Integration Planning

### 20.1 APK Build Configuration

```json
// capacitor.config.json
{
  "appId": "com.safaimarket.anupurna",
  "appName": "Safai Market",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  },
  "android": {
    "buildOptions": {
      "keystorePath": "release.keystore",
      "keystoreAlias": "safaimarket"
    }
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#16a34a"
    }
  }
}
```

### 20.2 APK vs PWA Feature Matrix

| Feature | PWA (Chrome) | Capacitor APK |
|---|---|---|
| Browser Print | ✅ | ✅ |
| Wi-Fi Print (WebSocket bridge) | ✅ | ✅ |
| Wi-Fi Print (Raw TCP) | ❌ | ✅ |
| Bluetooth Print | ❌ | ✅ |
| Silent Print (no dialog) | ❌ | ✅ |
| Print from background | ❌ | ✅ |
| Notification for print failure | Limited | ✅ |
| Install without Play Store | ✅ (PWA install) | ✅ |

### 20.3 Feature Detection Pattern

```javascript
// CapacitorFeatureDetection.js
export const isRunningInCapacitor = () => {
  return window.Capacitor?.isNativePlatform() === true;
};

export const getAvailablePrinterTypes = () => {
  if (isRunningInCapacitor()) {
    return ['browser', 'wifi', 'bluetooth'];
  }
  return ['browser', 'wifi']; // No BT in PWA
};

export const getPrintService = (printerType) => {
  if (printerType === 'bluetooth' && !isRunningInCapacitor()) {
    throw new Error('Bluetooth printing requires the Safai Market app. Please install the APK.');
  }
  
  switch (printerType) {
    case 'browser': return BrowserPrintService;
    case 'wifi': return WifiPrintService;
    case 'bluetooth': return BluetoothPrintService;
    default: throw new Error(`Unknown printer type: ${printerType}`);
  }
};
```

### 20.4 Migration Path from PWA to APK

When the owner installs the APK after using the PWA:

1. APK opens and detects existing IndexedDB data (same origin scheme)
2. All bills, settings, and queue data survive the migration
3. PRINTER_SETTINGS migrates automatically
4. Owner is prompted: "You can now use Bluetooth printers! Set up in Settings → Printer."

---

## 21. Phase Implementation Plan

### Phase 1 — MVP (Weeks 1–4)

**Goal:** Every bill can be printed or saved as PDF. Discount system works.

**Deliverables:**

- [ ] `ReceiptTemplate.js` — HTML receipt generator
- [ ] `BrowserPrintService.js` — window.print() wrapper
- [ ] `print.css` — Print stylesheet (58mm and 80mm)
- [ ] Print button on BillSuccessScreen
- [ ] Reprint button on BillDetailScreen  
- [ ] `PRINT_QUEUE` IndexedDB table (basic: pending → completed/failed)
- [ ] `PRINT_LOGS` IndexedDB table
- [ ] `PRINTER_SETTINGS` IndexedDB table (browser print only)
- [ ] PrintPreviewModal (optional preview before printing)
- [ ] **Discount system — full implementation**
  - [ ] Item-level discount UI ([-%] button per item)
  - [ ] Bill-level discount UI (Discount row in cart)
  - [ ] `DiscountCalculator.js`
  - [ ] `DiscountPermissionService.js`
  - [ ] Discount shown on receipt (HTML and ESC/POS ready)
  - [ ] Discount fields in BILLS and BILL_ITEMS schema
- [ ] Print settings page (browser print only)

**Not in Phase 1:** Wi-Fi print, Bluetooth print, ESC/POS, Capacitor

---

### Phase 2 — Wi-Fi Thermal Printer (Weeks 8–11)

**Goal:** Owner can print to a counter-side thermal printer over Wi-Fi.

**Prerequisites:** Phase 1 complete, local WebSocket bridge server or alternative approach decided.

**Deliverables:**

- [ ] `ESCPOSBuilder.js` — full ESC/POS command library
- [ ] `ESCPOSReceiptBuilder.js` — builds receipt bytes from bill data
- [ ] `WifiPrintService.js` — sends bytes via WebSocket bridge
- [ ] WebSocket bridge server (`bridge-server.js`) — documentation + setup guide
- [ ] Wi-Fi printer settings UI (IP, port, test connection)
- [ ] `testWifiPrinterConnection()` — pre-print connection test
- [ ] Queue processor upgrade — Wi-Fi retry logic with backoff
- [ ] `PrintQueueProcessor.js` — background retry system
- [ ] Print queue screen (view pending/failed jobs)
- [ ] Advanced discount permissions (owner_only mode, max limits)
- [ ] Discount analytics sync to Google Sheets

---

### Phase 3 — Bluetooth + APK (Weeks 16–20)

**Goal:** Full mobile thermal printing on Android via Capacitor APK.

**Prerequisites:** Phase 2 complete, Capacitor APK build pipeline set up.

**Deliverables:**

- [ ] Capacitor project setup (`npx cap add android`)
- [ ] Custom ESC/POS Bluetooth plugin (or `@capacitor-community/bluetooth-serial`)
- [ ] `BluetoothPrintService.js` — full BT print implementation
- [ ] `BluetoothConnectionManager.js` — connection keep-alive
- [ ] Android permissions configuration (AndroidManifest.xml)
- [ ] Bluetooth printer discovery + pairing UI
- [ ] `BluetoothPermissionService.js`
- [ ] APK-specific feature detection (`isRunningInCapacitor()`)
- [ ] Auto-print on bill creation (silent, no dialog)
- [ ] Advanced printer recovery (auto-reconnect on disconnection)
- [ ] Full print queue screen with manual retry
- [ ] Print logs sync to Google Sheets (reports)
- [ ] APK signing + build pipeline

---

## 22. Testing Strategy for Print System

### 22.1 Unit Tests

```javascript
// __tests__/DiscountCalculator.test.js
describe('DiscountCalculator', () => {
  test('Fixed item discount reduces item total', () => {
    const items = [{ qty: 2, unit_price: 95, item_discount: 10, item_discount_type: 'fixed' }];
    const result = calculateBillTotals(items, null);
    expect(result.items[0].item_total).toBe(180); // (2×95) - 10
  });
  
  test('Percent item discount applies correctly', () => {
    const items = [{ qty: 1, unit_price: 100, item_discount: 10, item_discount_type: 'percent' }];
    const result = calculateBillTotals(items, null);
    expect(result.items[0].item_total).toBe(90); // 100 - 10%
  });
  
  test('Bill discount cannot exceed subtotal', () => {
    const items = [{ qty: 1, unit_price: 100, item_discount: 0, item_total: 100 }];
    const billDiscount = { amount: 200, type: 'fixed' };
    const result = calculateBillTotals(items, billDiscount);
    expect(result.total_amount).toBe(0); // Capped at 0
    expect(result.bill_discount_amount).toBe(100); // Capped at subtotal
  });
  
  test('Combined item and bill discounts', () => {
    const items = [
      { qty: 2, unit_price: 95, item_discount: 10, item_discount_type: 'fixed', item_total: 180 },
      { qty: 1, unit_price: 100, item_discount: 0, item_total: 100 }
    ];
    const billDiscount = { amount: 5, type: 'percent' };
    const result = calculateBillTotals(items, billDiscount);
    // Subtotal = 280, 5% = 14, total = 266
    expect(result.subtotal).toBe(280);
    expect(result.bill_discount_amount).toBe(14);
    expect(result.total_amount).toBe(266);
  });
});

// __tests__/ESCPOSBuilder.test.js
describe('ESCPOSBuilder', () => {
  test('INIT command is first bytes', () => {
    const builder = new ESCPOSBuilder('58mm');
    builder.init();
    const bytes = builder.build();
    expect(bytes[0]).toBe(0x1B); // ESC
    expect(bytes[1]).toBe(0x40); // @
  });
  
  test('Two column row fills line correctly', () => {
    const builder = new ESCPOSBuilder('58mm'); // 32 chars
    builder.addTwoColumnRow('TOTAL', 'Rs280');
    // Should produce exactly 32 chars + LF
    const bytes = builder.build();
    const lineBytes = bytes.slice(0, bytes.indexOf(0x0A));
    expect(lineBytes.length).toBe(32);
  });
  
  test('Item row truncates long product names', () => {
    const builder = new ESCPOSBuilder('58mm');
    builder.addItemRow('Very Long Product Name That Exceeds Width', 1, 100, 100);
    // Should not throw or produce > 32 chars per line
    expect(() => builder.build()).not.toThrow();
  });
});
```

### 22.2 Integration Tests

```javascript
// __tests__/PrintQueue.integration.test.js
describe('PrintQueue Integration', () => {
  
  beforeEach(async () => {
    // Reset IndexedDB
    await clearDatabase();
  });
  
  test('Print job added after bill creation', async () => {
    const bill = createTestBill();
    await setPrinterSettings({ auto_print_enabled: true, active_printer_type: 'browser' });
    
    await createBill(bill);
    
    const queue = await db.print_queue.toArray();
    expect(queue).toHaveLength(1);
    expect(queue[0].bill_id).toBe(bill.id);
    expect(queue[0].status).toBe('pending');
  });
  
  test('Duplicate print job prevented', async () => {
    const billId = 'test-bill-001';
    await addToPrintQueue(billId, false);
    await addToPrintQueue(billId, false); // Duplicate attempt
    
    const queue = await db.print_queue
      .where('bill_id').equals(billId)
      .filter(j => !j.is_reprint)
      .toArray();
    
    expect(queue).toHaveLength(1); // Only one job
  });
  
  test('Reprint bypasses duplicate check', async () => {
    const billId = 'test-bill-002';
    await addToPrintQueue(billId, false);
    // Complete the first job
    await db.print_queue.where('bill_id').equals(billId).modify({ status: 'completed' });
    
    await addToPrintQueue(billId, true); // Reprint
    
    const allJobs = await db.print_queue.where('bill_id').equals(billId).toArray();
    expect(allJobs).toHaveLength(2);
  });
  
  test('Failed job respects max_attempts', async () => {
    const processor = new PrintQueueProcessor();
    const mockPrint = jest.fn().mockRejectedValue(new Error('PRINTER_NOT_REACHABLE'));
    
    // Override print service
    jest.mock('../services/WifiPrintService', () => mockPrint);
    
    const billId = 'test-bill-003';
    await addToPrintQueue(billId, false);
    
    // Run 3 times
    for (let i = 0; i < 3; i++) {
      await processor.process();
    }
    
    const job = await db.print_queue.where('bill_id').equals(billId).first();
    expect(job.status).toBe('failed');
    expect(job.attempts).toBe(3);
  });
  
  test('Print log written on success and failure', async () => {
    // ... test that writePrintLog is called appropriately
  });
});
```

### 22.3 Manual Test Scenarios (QA Checklist)

#### Browser Print Tests
- [ ] Create bill → auto-print triggers → browser print dialog opens
- [ ] Print preview shows correct bill data
- [ ] 58mm layout prints correctly on thermal via system dialog
- [ ] 80mm layout prints correctly
- [ ] Reprint from bill history works
- [ ] Print with discount shows discount on receipt

#### Wi-Fi Print Tests
- [ ] Printer on same Wi-Fi → test connection succeeds
- [ ] Printer on different network → test connection fails with helpful message
- [ ] Print job succeeds → bill marked as printed
- [ ] Printer turned off during print → job marked as retrying → printer turns on → retry succeeds
- [ ] 3 failures → job marked as failed → notification shown
- [ ] User manually retries failed job → success

#### Bluetooth Print Tests (APK only)
- [ ] BT permission request shows on first scan
- [ ] Paired printer appears in list
- [ ] New printer can be discovered and paired
- [ ] Print after connect succeeds
- [ ] Printer turned off mid-print → error handled → retry
- [ ] BT disconnects during idle → auto-reconnect on next print
- [ ] Print large bill (50 items) without corruption

#### Discount Tests
- [ ] Item discount (fixed) reduces item total
- [ ] Item discount (percent) calculates correctly
- [ ] Bill discount (fixed) reduces bill total
- [ ] Bill discount (percent) calculates correctly
- [ ] Discount shown on HTML receipt
- [ ] Discount shown on ESC/POS receipt
- [ ] Helper cannot exceed max_discount_percent
- [ ] Owner can apply any discount
- [ ] Discount cannot make total negative
- [ ] Remove discount works

---

*This document covers the full printer integration and discount system for Safai Market — Anupurna Traders. It must be read alongside PRD V6. All implementation decisions must respect the SOURCE OF TRUTH architecture rule: app saves first, printer is always output only.*

---

**Document produced by:** Senior CTO + POS Architecture + Mobile Systems Review
**Status:** Implementation-Ready — V1
**Depends on:** Safai Market PRD V6

---
*End of Document*
