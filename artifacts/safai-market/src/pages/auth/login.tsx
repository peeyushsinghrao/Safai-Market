import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Store, Globe, HelpCircle, X, Check, User, Lock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Initialize from localStorage or default to english
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("safai-language") || "en";
  });

  const sb = getSupabase();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast({ title: "Login failed", description: error.message, variant: "destructive" });
  };

  const handleSetLanguage = (code: string) => {
    setLanguage(code);
    localStorage.setItem("safai-language", code);
    setLanguageOpen(false);
    if (code === "hi") {
      toast({ title: "Coming Soon", description: "Hindi support coming soon", variant: "default" });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col relative font-sans">
      <div className="flex flex-col items-center pt-12 pb-8 px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#006b2c] rounded-2xl flex items-center justify-center shadow-sm">
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#006b2c]">Safai Market</h1>
        </div>
        <p className="text-slate-700 text-lg font-medium">Smart Billing for Your Shop</p>
      </div>

      <div className="px-6 space-y-5 relative z-10 w-full max-w-md mx-auto">
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">Phone or Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input 
                type="email" 
                placeholder="Enter phone or email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                autoFocus 
                className="h-[52px] rounded-2xl pl-12 text-base border-slate-300 focus:border-[#006b2c] bg-white" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input 
                type={showPw ? "text" : "password"} 
                placeholder="Enter password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="h-[52px] rounded-2xl pl-12 pr-12 text-base border-slate-300 focus:border-[#006b2c] bg-white" 
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="flex justify-end pt-0.5">
            <button type="button" className="text-sm font-semibold text-[#006b2c]" onClick={() => setLocation("/auth/forgot-password")}>
              Forgot Password?
            </button>
          </div>

          <Button type="submit" className="w-full h-[52px] text-lg font-bold rounded-2xl mt-4 bg-[#006b2c] hover:bg-[#005a24] text-white flex items-center justify-center gap-2 shadow-md" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </Button>
        </form>
      </div>

      <div className="mt-8 px-6 flex-1 flex flex-col items-center max-w-md mx-auto w-full relative z-0">
        <div className="w-full bg-slate-200 rounded-3xl overflow-hidden shadow-lg aspect-[4/3] flex items-center justify-center relative mb-8">
           <img src="/hero-dashboard.png" alt="Dashboard Preview" className="w-full h-full object-cover" />
        </div>
        
        <div className="mb-8">
          <p className="text-base text-slate-700">
            Don't have an account?{" "}
            <button className="text-[#006b2c] font-bold" onClick={() => setLocation("/auth/register")}>Register</button>
          </p>
        </div>

        <div className="flex items-center justify-center gap-8 pb-8 w-full mt-auto">
          <button 
            type="button" 
            className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
            onClick={() => setLanguageOpen(true)}
          >
            <Globe className="w-6 h-6" />
          </button>
          <button 
            type="button" 
            className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Language Selection Sheet */}
      <>
        {languageOpen && <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={() => setLanguageOpen(false)} />}
        <div className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300",
          languageOpen ? "translate-y-0" : "translate-y-full"
        )}>
          <div className="p-4">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-1 bg-slate-400/20 rounded-full" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Select Language</h3>
              <button onClick={() => setLanguageOpen(false)} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="space-y-2 pb-6">
              <button 
                onClick={() => handleSetLanguage("en")}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 active:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇬🇧</span>
                  <span className="font-semibold text-slate-800">English</span>
                </div>
                {language === "en" && <Check className="w-5 h-5 text-[#006b2c]" />}
              </button>
              <button 
                onClick={() => handleSetLanguage("hi")}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 active:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇮🇳</span>
                  <span className="font-semibold text-slate-800">Hindi (हिंदी)</span>
                </div>
                {language === "hi" && <Check className="w-5 h-5 text-[#006b2c]" />}
              </button>
            </div>
          </div>
        </div>
      </>

      {/* Help FAQ Sheet */}
      <>
        {helpOpen && <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={() => setHelpOpen(false)} />}
        <div className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 max-h-[85vh] flex flex-col",
          helpOpen ? "translate-y-0" : "translate-y-full"
        )}>
          <div className="p-4 shrink-0 border-b border-slate-100">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-1 bg-slate-400/20 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Help & Support</h3>
              <button onClick={() => setHelpOpen(false)} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
          </div>
          <div className="p-4 overflow-y-auto space-y-4 pb-8">
            <p className="text-sm text-slate-500 mb-4">Frequently asked questions about Safai Market.</p>
            
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-semibold text-sm mb-1 text-slate-800">How do I reset my password?</p>
                <p className="text-sm text-slate-500 leading-relaxed">Tap "Forgot password?" on the login screen to receive a reset link in your email.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-semibold text-sm mb-1 text-slate-800">How do I add products?</p>
                <p className="text-sm text-slate-500 leading-relaxed">Go to More → Inventory → Add Product to create new items in your catalog.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-semibold text-sm mb-1 text-slate-800">How do I print bills?</p>
                <p className="text-sm text-slate-500 leading-relaxed">Go to Device Center to pair a Bluetooth thermal printer, then bills will print automatically after checkout.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-semibold text-sm mb-1 text-slate-800">How do I record stock?</p>
                <p className="text-sm text-slate-500 leading-relaxed">Use the Purchase Entry screen to record new stock received from suppliers.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <a href="mailto:support@safaimarket.com" className="flex items-center justify-center w-full h-[52px] bg-[#006b2c]/10 text-[#006b2c] font-bold rounded-2xl text-base">
                Email Support Team
              </a>
            </div>
          </div>
        </div>
      </>
    </div>
  );
}
