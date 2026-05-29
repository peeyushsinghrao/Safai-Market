import { useEffect } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setShop, isLoading } = useAuthStore();

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
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadShop = async (token: string) => {
    try {
      const res = await fetch("/api/shops/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const shop = await res.json();
        setShop(shop);
      } else {
        setShop(null);
      }
    } catch {
      setShop(null);
    }
  };

  return <>{children}</>;
}
