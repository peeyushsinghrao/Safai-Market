function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerRow = headers.map(escapeCSV).join(",");
  const dataRows = rows.map(row => row.map(escapeCSV).join(","));
  return [headerRow, ...dataRows].join("\n");
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportProductsCSV(products: any[]) {
  const headers = [
    "ID", "Name", "Brand", "Category", "Unit",
    "Buy Price", "Sell Price", "MRP", "Current Stock",
    "Low Stock Limit", "Barcode", "HSN Code", "GST Rate %",
    "Status", "Created At"
  ];
  const rows = products.map(p => [
    p.id, p.name, p.brand ?? "", p.categoryName ?? "", p.unit ?? "",
    p.buyPrice ?? "", p.sellPrice ?? "", p.mrp ?? "",
    p.currentStock ?? "", p.lowStockLimit ?? "",
    p.barcode ?? "", p.hsnCode ?? "", p.gstRate ?? "0",
    p.status ?? "active",
    p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : ""
  ]);
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(`products-${date}.csv`, buildCSV(headers, rows));
}

export function exportBillsCSV(bills: any[]) {
  const headers = [
    "Bill No", "Date", "Customer", "Items",
    "Total Amount", "Cash", "UPI", "Udhaar",
    "Discount", "Est. Profit", "Status"
  ];
  const rows = bills.map(b => [
    b.billNumber,
    b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "",
    b.customerName ?? "Walk-in",
    b.itemCount ?? "",
    b.totalAmount ?? "", b.cashAmount ?? "",
    b.upiAmount ?? "", b.udhaarAmount ?? "",
    b.discountAmount ?? "",
    b.estimatedProfit ?? "",
    b.status ?? ""
  ]);
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(`bills-${date}.csv`, buildCSV(headers, rows));
}

export function exportCustomersCSV(customers: any[]) {
  const headers = [
    "ID", "Name", "Phone", "Email", "Address",
    "Udhaar Balance", "Total Bills", "Created At"
  ];
  const rows = customers.map(c => [
    c.id, c.name, c.phone ?? "", c.email ?? "",
    c.address ?? "", c.udhaarBalance ?? "0",
    c.totalBills ?? "",
    c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : ""
  ]);
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(`customers-${date}.csv`, buildCSV(headers, rows));
}
