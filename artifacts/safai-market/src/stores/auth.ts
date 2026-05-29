import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export interface ShopProfile {
  id: number;
  name: string;
  ownerId: string;
  phone?: string | null;
  address?: string | null;
  gstNumber?: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  shop: ShopProfile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setShop: (shop: ShopProfile | null) => void;
  signOut: () => Promise<void>;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      shop: null,
      isLoading: true,
      setSession: (session) =>
        set({ session, user: session?.user ?? null, isLoading: false }),
      setShop: (shop) => set({ shop }),
      signOut: async () => {
        await getSupabase().auth.signOut();
        set({ session: null, user: null, shop: null });
      },
      getToken: () => get().session?.access_token ?? null,
    }),
    {
      name: "safai-auth",
      partialize: (state) => ({ shop: state.shop }),
    }
  )
);
