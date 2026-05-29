export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ReceiptData {
  storeName?: string;
  storeTagline?: string;
  storeAddress?: string;
  storePhone?: string;
  footerMessage?: string;
  billNumber: string;
  date: string;
  time: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount?: number;
  totalAmount: number;
  cashAmount: number;
  upiAmount: number;
  udhaarAmount: number;
  customerName?: string;
  notes?: string;
  estimatedProfit?: number | null;
}

export function printReceipt(data: ReceiptData) {
  const storeName = data.storeName || "My Shop";
  const storeTag = data.storeTagline || "Safai Market";
  const footerMsg = data.footerMessage || "Thank you for shopping!";

  const fmtCurr = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

  const itemsHTML = data.items
    .map(
      (item) => `
    <tr>
      <td class="item-name">${escapeHtml(item.productName)}</td>
      <td class="item-qty">${item.quantity}</td>
      <td class="item-price">${fmtCurr(item.unitPrice)}</td>
      <td class="item-total">${fmtCurr(item.totalPrice)}</td>
    </tr>`
    )
    .join("");

  const paymentRows: string[] = [];
  if (data.cashAmount > 0) paymentRows.push(`<tr><td>Cash</td><td>${fmtCurr(data.cashAmount)}</td></tr>`);
  if (data.upiAmount > 0) paymentRows.push(`<tr><td>UPI</td><td>${fmtCurr(data.upiAmount)}</td></tr>`);
  if (data.udhaarAmount > 0) paymentRows.push(`<tr><td>Udhaar${data.customerName ? ` (${data.customerName})` : ""}</td><td>${fmtCurr(data.udhaarAmount)}</td></tr>`);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Receipt ${data.billNumber}</title>
  <style>
    @page {
      size: 58mm auto;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10pt;
      width: 58mm;
      padding: 3mm 2mm;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .store-name {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      letter-spacing: 1px;
    }
    .store-tag {
      font-size: 9pt;
      text-align: center;
      color: #333;
    }
    .store-meta {
      font-size: 7.5pt;
      text-align: center;
      color: #555;
      margin-top: 1mm;
    }
    .divider {
      border: none;
      border-top: 1px dashed #000;
      margin: 2mm 0;
    }
    .bill-meta {
      font-size: 8pt;
      display: flex;
      justify-content: space-between;
      margin-bottom: 1mm;
    }
    table.items {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin: 1mm 0;
    }
    table.items thead th {
      border-bottom: 1px solid #000;
      padding: 1mm 0;
      text-align: left;
      font-weight: bold;
      font-size: 7.5pt;
    }
    table.items tbody td {
      padding: 1mm 0;
      vertical-align: top;
    }
    .item-name { width: 40%; word-break: break-word; }
    .item-qty { width: 10%; text-align: center; }
    .item-price { width: 22%; text-align: right; }
    .item-total { width: 28%; text-align: right; }
    table.totals {
      width: 100%;
      font-size: 8.5pt;
      margin-top: 1mm;
    }
    table.totals td { padding: 0.5mm 0; }
    table.totals td:last-child { text-align: right; }
    .grand-total {
      font-size: 11pt;
      font-weight: bold;
    }
    table.payment {
      width: 100%;
      font-size: 8pt;
      margin-top: 1mm;
    }
    table.payment td { padding: 0.5mm 0; }
    table.payment td:last-child { text-align: right; }
    .udhaar-row td { font-weight: bold; }
    .footer {
      text-align: center;
      font-size: 8pt;
      margin-top: 3mm;
      color: #333;
    }
    .thank-you {
      font-size: 10pt;
      font-weight: bold;
      text-align: center;
      margin-top: 2mm;
    }
    @media print {
      body { width: 58mm; }
    }
  </style>
</head>
<body>
  <div class="store-name">${escapeHtml(storeName)}</div>
  <div class="store-tag">${escapeHtml(storeTag)}</div>
  ${data.storePhone ? `<div class="store-meta">${escapeHtml(data.storePhone)}</div>` : ""}
  ${data.storeAddress ? `<div class="store-meta">${escapeHtml(data.storeAddress)}</div>` : ""}
  <hr class="divider" />
  <div class="bill-meta">
    <span>Bill: <strong>${data.billNumber}</strong></span>
    <span>${data.date}</span>
  </div>
  <div class="bill-meta">
    <span>Time: ${data.time}</span>
    ${data.customerName ? `<span>Cust: ${escapeHtml(data.customerName)}</span>` : ""}
  </div>
  <hr class="divider" />

  <table class="items">
    <thead>
      <tr>
        <th class="item-name">Item</th>
        <th class="item-qty">Qty</th>
        <th class="item-price">Price</th>
        <th class="item-total">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <hr class="divider" />

  <table class="totals">
    ${data.discountAmount && data.discountAmount > 0
      ? `<tr><td>Subtotal</td><td style="text-align:right">${fmtCurr(data.subtotal)}</td></tr>
         <tr><td>Discount</td><td style="text-align:right">-${fmtCurr(data.discountAmount)}</td></tr>`
      : ""}
    <tr class="grand-total"><td>TOTAL</td><td style="text-align:right">${fmtCurr(data.totalAmount)}</td></tr>
  </table>

  <hr class="divider" />

  <table class="payment">
    ${paymentRows.join("\n")}
  </table>

  ${data.notes ? `<hr class="divider" /><div style="font-size:8pt">Note: ${escapeHtml(data.notes)}</div>` : ""}

  <hr class="divider" />
  <div class="thank-you">Thank You!</div>
  <div class="footer">${escapeHtml(footerMsg)}</div>
  <div style="margin-top: 5mm;"></div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=300,height=600");
  if (!win) {
    alert("Popup blocked. Please allow popups to print receipts.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
