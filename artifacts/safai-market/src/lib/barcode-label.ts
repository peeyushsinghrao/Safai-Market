export interface LabelData {
  productName: string;
  barcode: string;
  price: number;
  storeName?: string;
  unit?: string;
  mrp?: number;
}

function generateBarcodeSVG(code: string): string {
  const bars: string[] = [];
  let x = 0;
  const h = 40;
  bars.push(`<rect x="${x}" y="0" width="3" height="${h}" fill="black"/>`);
  x += 5;

  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const pattern = [
      (charCode & 1) ? 3 : 1,
      (charCode & 2) ? 1 : 2,
      (charCode & 4) ? 2 : 1,
      (charCode & 8) ? 1 : 3,
      (charCode & 16) ? 3 : 1,
    ];
    let filled = true;
    for (const w of pattern) {
      if (filled) {
        bars.push(`<rect x="${x}" y="0" width="${w}" height="${h}" fill="black"/>`);
      }
      x += w + 1;
      filled = !filled;
    }
    x += 1;
  }

  bars.push(`<rect x="${x}" y="0" width="3" height="${h}" fill="black"/>`);
  x += 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${h + 16}">
    ${bars.join("")}
    <text x="${x / 2}" y="${h + 12}" text-anchor="middle"
      font-family="monospace" font-size="8" fill="black">${code}</text>
  </svg>`;
}

export function printBarcodeLabel(labels: LabelData[], labelsPerRow = 2) {
  const labelHTML = labels.map(label => {
    const barcodeSVG = generateBarcodeSVG(label.barcode);
    const b64 = btoa(unescape(encodeURIComponent(barcodeSVG)));

    return `
    <div class="label">
      ${label.storeName ? `<div class="store-name">${label.storeName}</div>` : ""}
      <div class="product-name">${label.productName}${label.unit ? ` (${label.unit})` : ""}</div>
      <div class="barcode-img">
        <img src="data:image/svg+xml;base64,${b64}" alt="${label.barcode}" />
      </div>
      <div class="price-row">
        <div class="price">₹${label.price.toFixed(0)}</div>
        ${label.mrp && label.mrp > label.price
          ? `<div class="mrp">MRP ₹${label.mrp.toFixed(0)}</div>`
          : ""}
      </div>
    </div>`;
  }).join("");

  const labelWidth = labelsPerRow === 2 ? "48%" : "98%";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Barcode Labels</title>
  <style>
    @page { size: A4; margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: white; }
    .labels-grid { display: flex; flex-wrap: wrap; gap: 4mm; }
    .label {
      width: ${labelWidth};
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4mm 3mm;
      text-align: center;
      page-break-inside: avoid;
    }
    .store-name { font-size: 7pt; color: #666; font-weight: bold; margin-bottom: 1mm; letter-spacing: 0.5px; }
    .product-name { font-size: 9pt; font-weight: bold; color: #000; margin-bottom: 2mm; line-height: 1.2; max-height: 2.4em; overflow: hidden; }
    .barcode-img { margin: 2mm auto; display: flex; justify-content: center; }
    .barcode-img img { max-width: 100%; height: 44pt; }
    .price-row { display: flex; justify-content: center; align-items: baseline; gap: 4px; margin-top: 1mm; }
    .price { font-size: 14pt; font-weight: bold; color: #000; }
    .mrp { font-size: 8pt; color: #888; text-decoration: line-through; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="labels-grid">${labelHTML}</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=794,height=1123");
  if (!win) {
    alert("Please allow popups to print barcode labels.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}
