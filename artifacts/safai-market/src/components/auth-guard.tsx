import { useLocation } from "wouter";
import { useAuthStore } from "@/stores/auth";
import { useEffect } from "react";
import { Store } from "lucide-react";

// FIX BUG-012: /auth/onboarding must be public or guard redirects to itself infinitely
const PUBLIC_PATHS = ["/auth/login", "/auth/register", "/auth/onboarding"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { session, shop, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_PATHS.some(p => location.startsWith(p));

    if (!session && !isPublic) {
      setLocation("/auth/login");
      return;
    }

    if (session && isPublic) {
      if (!shop) {
        setLocation("/auth/onboarding");
      } else {
        setLocation("/");
      }
      return;
    }

    if (session && !shop && location !== "/auth/onboarding") {
      setLocation("/auth/onboarding");
    }
  }, [session, shop, isLoading, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-green-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30 animate-pulse">
            <Store className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
