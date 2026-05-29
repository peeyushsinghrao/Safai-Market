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
}

interface SettingsStore {
  settings: ShopSettings;
  updateSettings: (partial: Partial<ShopSettings>) => void;
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
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
    }),
    { name: "safai-shop-settings" }
  )
);
