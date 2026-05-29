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
}

interface CartStore {
  items: CartItem[];
  billDiscount: number;
  billDiscountType: "flat" | "pct";
  customerId: string;
  notes: string;

  addItem: (product: {
    id: number;
    name: string;
    sellPrice: number | string;
    buyPrice?: number | string | null;
    currentStock: number | string;
    unit?: string | null;
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
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, itemDiscount: discount } : i
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
