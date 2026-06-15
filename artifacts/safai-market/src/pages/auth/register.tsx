import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft, ArrowRight, QrCode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { 
      toast({ title: "Password too short", description: "At least 8 characters required.", variant: "destructive" }); 
      return; 
    }
    setLoading(true);
    const { data, error } = await getSupabase().auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          phone: `+91${phone}`
        }
      }
    });
    setLoading(false);
    
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Now set up your shop." });
      if (data?.session) {
        useAuthStore.getState().setSession(data.session);
      }
      setLocation("/auth/setup");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 bg-[#f8fafc] border-b border-slate-200">
        <button onClick={() => setLocation("/auth/login")} className="p-2 -ml-2 text-[#006b2c] hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-[#006b2c]">Safai Market</h1>
        <button className="p-2 -mr-2 text-[#006b2c] hover:bg-slate-100 rounded-full transition-colors">
          <QrCode className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-8 pb-8 max-w-md mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-[28px] font-bold text-slate-900 leading-tight">Create Account</h2>
          <p className="text-slate-700 mt-2 text-[15px]">Join the Safai Market family today.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5 flex-1">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">Full Name</label>
            <Input 
              type="text" 
              placeholder="Enter your full name" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              required 
              autoFocus 
              className="h-[52px] rounded-2xl px-4 text-base border-slate-300 focus:border-[#006b2c] bg-white" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">Phone Number</label>
            <div className="flex gap-3">
              <div className="h-[52px] w-[72px] shrink-0 rounded-2xl border border-slate-300 bg-slate-50 flex items-center justify-center font-medium text-slate-700">
                +91
              </div>
              <Input 
                type="tel" 
                placeholder="10-digit mobile number" 
                value={phone} 
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                required 
                className="h-[52px] flex-1 rounded-2xl px-4 text-base border-slate-300 focus:border-[#006b2c] bg-white" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">Email Address</label>
            <Input 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="h-[52px] rounded-2xl px-4 text-base border-slate-300 focus:border-[#006b2c] bg-white" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">Password</label>
            <div className="relative">
              <Input 
                type={showPw ? "text" : "password"} 
                placeholder="Min. 8 characters" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                minLength={8} 
                className="h-[52px] rounded-2xl pl-4 pr-12 text-base border-slate-300 focus:border-[#006b2c] bg-white" 
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-slate-600 leading-relaxed">
              By clicking Create Account, you agree to our{" "}
              <button type="button" className="font-semibold text-[#006b2c]">Terms of Service</button>
              {" "}and{" "}
              <button type="button" className="font-semibold text-[#006b2c]">Privacy Policy</button>.
            </p>
          </div>

          <Button type="submit" className="w-full h-[52px] text-lg font-bold rounded-2xl mt-4 bg-[#006b2c] hover:bg-[#005a24] text-white flex items-center justify-center gap-2 shadow-md" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </Button>
        </form>

        <div className="mt-8 pb-6 text-center">
          <p className="text-[15px] text-slate-700">
            Already have an account?{" "}
            <button className="text-[#006b2c] font-bold" onClick={() => setLocation("/auth/login")}>Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
}
