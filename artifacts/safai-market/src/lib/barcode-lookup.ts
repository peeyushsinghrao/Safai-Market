interface BarcodeProductInfo {
  name?: string;
  brand?: string;
  imageUrl?: string;
}

const CACHE_PREFIX = "bc-cache-";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getCached(barcode: string): BarcodeProductInfo | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + barcode);
    if (!raw) return null;
    const { info, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + barcode);
      return null;
    }
    return info;
  } catch {
    return null;
  }
}

function setCache(barcode: string, info: BarcodeProductInfo) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + barcode,
      JSON.stringify({ info, ts: Date.now() })
    );
  } catch {
    // Ignore storage errors
  }
}

async function tryOpenFoodFacts(barcode: string): Promise<BarcodeProductInfo | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const name =
      p.product_name_en ||
      p.product_name ||
      p.generic_name_en ||
      p.generic_name ||
      null;
    const brand = p.brands?.split(",")[0]?.trim() || null;
    if (!name && !brand) return null;
    return { name: name || undefined, brand: brand || undefined };
  } catch {
    return null;
  }
}

async function tryUpcItemDb(barcode: string): Promise<BarcodeProductInfo | null> {
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;
    return {
      name: item.title || undefined,
      brand: item.brand || undefined,
    };
  } catch {
    return null;
  }
}

export async function lookupBarcodeProduct(
  barcode: string
): Promise<BarcodeProductInfo | null> {
  if (!barcode || barcode.length < 4) return null;

  const cached = getCached(barcode);
  if (cached) return cached;

  const offResult = await tryOpenFoodFacts(barcode);
  if (offResult?.name) {
    setCache(barcode, offResult);
    return offResult;
  }

  const upcResult = await tryUpcItemDb(barcode);
  if (upcResult?.name) {
    setCache(barcode, upcResult);
    return upcResult;
  }

  const emptyResult: BarcodeProductInfo = {};
  setCache(barcode, emptyResult);
  return emptyResult;
}
