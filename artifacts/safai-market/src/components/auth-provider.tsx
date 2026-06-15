import { useEffect, useRef } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useCartStore } from "@/stores/cart";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setShop, isLoading } = useAuthStore();
  const loadingShopRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      useAuthStore.setState({ isLoading: false });
      return;
    }

    const sb = getSupabase();

    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadShop(session.access_token);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadShop(session.access_token);
      } else {
        setShop(null);
        useCartStore.getState().clearCart(); // FIX BUG-010: clear cart on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadShop = async (token: string) => {
    // Prevent concurrent duplicate calls that cause infinite request loops
    if (loadingShopRef.current) return;
    loadingShopRef.current = true;
    try {
      const res = await fetch("/api/shops/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const shop = await res.json();
        setShop(shop);
        // FIX BUG-013: Sync server shop data into settings so storeName/gstNumber
        // survive device switching
        useSettingsStore.getState().syncFromShop(shop);
      } else if (res.status === 401) {
        // Token is stale/invalid — sign out to clear the bad session
        // and prevent infinite loops
        console.warn("Auth token rejected (401) — signing out stale session");
        await getSupabase().auth.signOut();
      } else {
        // 404 = no shop yet (new user), which is fine
        setShop(null);
      }
    } catch {
      setShop(null);
    } finally {
      loadingShopRef.current = false;
    }
  };

  return <>{children}</>;
}
