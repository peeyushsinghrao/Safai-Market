import { useState, useRef, useCallback, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Package, Check, Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth";
import { formatCurrency } from "@/lib/format";
import PageHeader from "@/components/page-header";
import { cn } from "@/lib/utils";

const BarcodeScannerModal = lazy(() => import("@/components/barcode-scanner-modal"));

const QTY_CHIPS = [1, 5, 10, 12, 24, 50, 100];

interface StockEntry {
  id: string;
  productId: number;
  productName: string;
  barcode: string;
  qty: number;
  prevStock: number;
  saved: boolean;
}

async function createStockMovement(
  token: string,
  productId: number,
  qty: number
): Promise<boolean> {
  try {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const res = await fetch(`${base}/api/stock-movements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId,
        movementType: "in",
        quantity: qty,
        notes: "Receive Stock",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function ReceiveStock() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getToken } = useAuthStore();

  const [barcodeInput, setBarcodeInput] = useState("");
  const [qtyInput, setQtyInput] = useState("1");
  const [foundProduct, setFoundProduct] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [entries, setEntries] = useState<StockEntry[]>([]);

  const barcodeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  const { data: allProducts } = useListProducts({ limit: 10000 });

  const lookupProduct = useCallback(
    (barcode: string) => {
      if (!barcode.trim()) return;
      const match = allProducts?.find(
        (p: any) => p.barcode === barcode.trim()
      );
      if (match) {
        setFoundProduct(match);
        setNotFound(false);
        setTimeout(() => qtyRef.current?.focus(), 50);
      } else {
        setFoundProduct(null);
        setNotFound(true);
        toast({
          title: "Product not found",
          description: `No product with barcode "${barcode}"`,
          variant: "destructive",
        });
      }
    },
    [allProducts, toast]
  );

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      lookupProduct(barcodeInput);
    }
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!foundProduct || !qtyInput || Number(qtyInput) <= 0) return;

    const token = getToken();
    if (!token) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }

    setSaving(true);
    const qty = Number(qtyInput);
    const ok = await createStockMovement(token, foundProduct.id, qty);

    if (ok) {
      const entry: StockEntry = {
        id: `e-${Date.now()}`,
        productId: foundProduct.id,
        productName: foundProduct.name,
        barcode: barcodeInput.trim(),
        qty,
        prevStock: Number(foundProduct.currentStock),
        saved: true,
      };
      setEntries((prev) => [entry, ...prev]);
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      toast({
        title: `Stock updated: ${foundProduct.name}`,
        description: `+${qty} units added`,
      });

      setBarcodeInput("");
      setQtyInput("1");
      setFoundProduct(null);
      setNotFound(false);
      setTimeout(() => barcodeRef.current?.focus(), 50);
    } else {
      toast({
        title: "Failed to update stock",
        description: "Please try again",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const handleScanDetected = (barcode: string) => {
    setScannerOpen(false);
    setBarcodeInput(barcode);
    setTimeout(() => lookupProduct(barcode), 100);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <PageHeader
        title="Receive Stock"
        subtitle="Rapid stock-in for multiple products"
        backTo="/more"
      />

      <div className="p-4 space-y-4 pb-24">
        {/* Barcode Input */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Scan or Enter Barcode
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={barcodeRef}
                value={barcodeInput}
                onChange={(e) => {
                  setBarcodeInput(e.target.value);
                  setFoundProduct(null);
                  setNotFound(false);
                }}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Scan barcode or type..."
                className={cn(
                  "h-14 text-base font-mono pr-4 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                  foundProduct && "border-emerald-400 bg-emerald-50",
                  notFound && "border-red-300 bg-red-50"
                )}
                autoFocus
                tabIndex={1}
              />
            </div>
            <button
              className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary active-elevate transition-transform"
              onClick={() => setScannerOpen(true)}
              tabIndex={2}
            >
              <Camera className="w-5 h-5" />
            </button>
            <Button
              variant="outline"
              className="h-14 px-4 rounded-2xl font-bold active-elevate transition-transform text-slate-700"
              onClick={() => lookupProduct(barcodeInput)}
              disabled={!barcodeInput.trim()}
              tabIndex={3}
            >
              Find
            </Button>
          </div>

          {/* Product info */}
          {foundProduct && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[15px] text-emerald-900 truncate">
                  {foundProduct.name}
                </p>
                <p className="text-[13px] text-emerald-700 font-medium">
                  Current stock: <strong>{Number(foundProduct.currentStock)} {foundProduct.unit}</strong>
                  {" · "}{formatCurrency(Number(foundProduct.sellPrice))}
                </p>
              </div>
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
          )}

          {notFound && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[14px] text-red-700 font-medium">
              Product not found. <button className="underline font-bold" onClick={() => setLocation(`/products/new?barcode=${encodeURIComponent(barcodeInput)}`)}>Add it now →</button>
            </div>
          )}
        </div>

        {/* Quantity Input */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quantity to Add
          </p>

          <div className="flex gap-2">
            <Input
              ref={qtyRef}
              type="number"
              min="1"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              onKeyDown={handleQtyKeyDown}
              className="h-14 text-2xl font-bold text-center flex-1 rounded-2xl border-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="1"
              tabIndex={4}
            />
          </div>

          {/* Qty chips */}
          <div className="flex flex-wrap gap-2">
            {QTY_CHIPS.map((chip) => (
              <button
                key={chip}
                className={cn(
                  "h-10 px-4 rounded-xl text-sm font-bold border transition-colors active:scale-95",
                  Number(qtyInput) === chip
                    ? "bg-primary text-white border-primary"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-primary/40 hover:text-primary"
                )}
                onClick={() => setQtyInput(String(chip))}
              >
                {chip}
              </button>
            ))}
          </div>

          <Button
            className="w-full h-14 font-bold text-[17px] rounded-2xl active-elevate transition-transform shadow-sm bg-primary hover:bg-primary/90 text-white"
            onClick={handleSave}
            disabled={!foundProduct || !qtyInput || Number(qtyInput) <= 0 || saving}
            tabIndex={5}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Add to Stock
              </>
            )}
          </Button>
        </div>

        {/* Entries list */}
        {entries.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                This Session ({entries.length})
              </p>
              <button
                className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
                onClick={() => setEntries([])}
              >
                Clear
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-slate-800 truncate">{entry.productName}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{entry.barcode}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[15px] font-bold text-emerald-600">+{entry.qty}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{entry.prevStock} → {entry.prevStock + entry.qty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        <BarcodeScannerModal
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onDetected={handleScanDetected}
        />
      </Suspense>
    </div>
  );
}
