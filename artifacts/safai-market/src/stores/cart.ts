import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  cartItemId: string;
  productId: number;
  productName: string;
  unitPrice: number;
  buyPrice: number | null;
  quantity: number;
  itemDiscount: number;
  availableStock: number;
  unit: string;
  // GST fields
  gstRate: number;
  gstInclusive: boolean;
}

interface CartStore {
  items: CartItem[];
  billDiscount: number;
  billDiscountType: "flat" | "pct";
  customerId: string;
  notes: string;
  _submitKey: string;

  addItem: (product: {
    id: number;
    name: string;
    sellPrice: number | string;
    buyPrice?: number | string | null;
    currentStock: number | string;
    unit?: string | null;
    gstRate?: number | string | null;
    gstInclusive?: boolean | null;
  }) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, delta: number) => void;
  setQty: (productId: number, qty: number) => void;
  setItemDiscount: (productId: number, discount: number) => void;
  setBillDiscount: (discount: number) => void;
  setBillDiscountType: (type: "flat" | "pct") => void;
  setCustomerId: (id: string) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;

  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  getQtyForProduct: (productId: number) => number;
  getGstBreakdown: () => { isInterState: boolean; totalGst: number; cgst: number; sgst: number; igst: number };
}

let nextId = 1;
const genId = () => `ci-${Date.now()}-${nextId++}`;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      billDiscount: 0,
      billDiscountType: "flat",
      customerId: "",
      notes: "",
      _submitKey: `sk-${Date.now()}`,

      addItem: (product) => {
        const { items } = get();
        const existing = items.find((i) => i.productId === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          const buyPrice =
            product.buyPrice != null && Number(product.buyPrice) > 0
              ? Number(product.buyPrice)
              : null;
          set({
            items: [
              ...items,
              {
                cartItemId: genId(),
                productId: product.id,
                productName: product.name,
                unitPrice: Number(product.sellPrice),
                buyPrice,
                quantity: 1,
                itemDiscount: 0,
                availableStock: Number(product.currentStock),
                unit: product.unit ?? "pcs",
                gstRate: Number(product.gstRate ?? 0),
                gstInclusive: product.gstInclusive ?? true,
              },
            ],
          });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQty: (productId, delta) => {
        const { items } = get();
        const item = items.find((i) => i.productId === productId);
        if (!item) return;
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
          set({ items: items.filter((i) => i.productId !== productId) });
        } else {
          set({
            items: items.map((i) =>
              i.productId === productId ? { ...i, quantity: newQty } : i
            ),
          });
        }
      },

      setQty: (productId, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.productId !== productId) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity: qty } : i
          ),
        });
      },

      setItemDiscount: (productId, discount) => {
        // FIX BUG-016: Clamp to [0, unitPrice], no negative discounts
        const item = get().items.find((i) => i.productId === productId);
        const clamped = Math.max(0, Math.min(discount, item?.unitPrice ?? discount));
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, itemDiscount: clamped } : i
          ),
        });
      },

      setBillDiscount: (discount) => set({ billDiscount: discount }),
      setBillDiscountType: (type) => set({ billDiscountType: type }),
      setCustomerId: (id) => set({ customerId: id }),
      setNotes: (notes) => set({ notes }),

      clearCart: () =>
        set({
          items: [],
          billDiscount: 0,
          billDiscountType: "flat",
          customerId: "",
          notes: "",
          _submitKey: `sk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        }),

      getSubtotal: () => {
        const { items } = get();
        return items.reduce(
          (sum, i) => sum + (i.unitPrice - i.itemDiscount) * i.quantity,
          0
        );
      },
      getDiscountAmount: () => {
        const { billDiscount, billDiscountType } = get();
        const sub = get().getSubtotal();
        if (billDiscountType === "pct") return (sub * billDiscount) / 100;
        return Math.min(billDiscount, sub);
      },
      getTotal: () => get().getSubtotal() - get().getDiscountAmount(),
      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
      getQtyForProduct: (productId) =>
        get().items.find((i) => i.productId === productId)?.quantity ?? 0,

      getGstBreakdown: () => {
        const { items } = get();
        const isInterState = false; // Future: derive from shop vs customer state
        let totalGst = 0;

        for (const item of items) {
          if (!item.gstRate || item.gstRate === 0) continue;
          const lineTotal = (item.unitPrice - item.itemDiscount) * item.quantity;
          if (item.gstInclusive) {
            totalGst += lineTotal * item.gstRate / (100 + item.gstRate);
          } else {
            totalGst += lineTotal * item.gstRate / 100;
          }
        }

        // Proportionally reduce GST by bill discount
        const sub = get().getSubtotal();
        const discountRatio = sub > 0 ? get().getDiscountAmount() / sub : 0;
        totalGst = totalGst * (1 - discountRatio);

        const half = totalGst / 2;
        return {
          isInterState,
          totalGst,
          cgst: isInterState ? 0 : half,
          sgst: isInterState ? 0 : half,
          igst: isInterState ? totalGst : 0,
        };
      },
    }),
    {
      name: "safai-cart-draft",
      partialize: (state) => ({
        items: state.items,
        billDiscount: state.billDiscount,
        billDiscountType: state.billDiscountType,
        customerId: state.customerId,
        notes: state.notes,
      }),
    }
  )
);
