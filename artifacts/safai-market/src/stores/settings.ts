import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ShopSettings {
  storeName: string;
  storeTagline: string;
  address: string;
  phone: string;
  gstNumber: string;
  footerMessage: string;
  paperSize: "58mm" | "A4" | "A5";
  showDiscount: boolean;
  showGst: boolean;
  showProfit: boolean;
  animationsEnabled: boolean;
  soundsEnabled: boolean;
  logoUrl?: string;
}

interface SettingsStore {
  settings: ShopSettings;
  updateSettings: (partial: Partial<ShopSettings>) => void;
  syncFromShop: (shop: { name?: string | null; phone?: string | null; address?: string | null; gstNumber?: string | null }) => void;
  persistToServer: () => Promise<void>;
}

const DEFAULT_SETTINGS: ShopSettings = {
  storeName: "My Shop",
  storeTagline: "Safai Market",
  address: "",
  phone: "",
  gstNumber: "",
  footerMessage: "Thank you for shopping!",
  paperSize: "58mm",
  showDiscount: true,
  showGst: false,
  showProfit: false,
  animationsEnabled: true,
  soundsEnabled: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      syncFromShop: (shop) => {
        set((state) => ({
          settings: {
            ...state.settings,
            storeName: shop.name?.trim() || state.settings.storeName,
            phone: shop.phone?.trim() || state.settings.phone,
            address: shop.address?.trim() || state.settings.address,
            gstNumber: shop.gstNumber?.trim() || state.settings.gstNumber,
            // Auto-enable GST display if GST number is present
            showGst: Boolean(shop.gstNumber?.trim()) || state.settings.showGst,
          },
        }));
      },
      persistToServer: async () => {
        const { settings } = get();
        const { useAuthStore } = await import("./auth");
        const token = useAuthStore.getState().getToken();
        if (!token) return;
        try {
          await fetch("/api/shops/my", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: settings.storeName,
              phone: settings.phone || null,
              address: settings.address || null,
              gstNumber: settings.gstNumber || null,
            }),
          });
        } catch {
          // Fail silently — settings still saved in localStorage
        }
      },
    }),
    { name: "safai-shop-settings" }
  )
);
