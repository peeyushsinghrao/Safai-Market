import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Store, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/supabase";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const sb = getSupabase();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast({ title: "Login failed", description: error.message, variant: "destructive" });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.match(/^[6-9]\d{9}$/)) {
      toast({ title: "Invalid number", description: "Enter a valid 10-digit Indian mobile number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await sb.auth.signInWithOtp({ phone: `+91${phone}` });
    setLoading(false);
    if (error) {
      toast({ title: "OTP failed", description: error.message, variant: "destructive" });
    } else {
      setOtpSent(true);
      toast({ title: "OTP sent!", description: "Check your SMS for the code." });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await sb.auth.verifyOtp({ phone: `+91${phone}`, token: otp, type: "sms" });
    setLoading(false);
    if (error) toast({ title: "Invalid OTP", description: error.message, variant: "destructive" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-green-50 flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Safai Market</h1>
          <p className="text-muted-foreground mt-1 text-sm">Smart billing for your shop</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your shop</p>
          </div>

          <div className="flex gap-1 p-1 bg-muted/40 rounded-xl">
            {(["email", "phone"] as const).map(m => (
              <button key={m}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${mode === m ? "bg-white shadow text-primary" : "text-muted-foreground"}`}
                onClick={() => { setMode(m); setOtpSent(false); }}
              >{m === "email" ? "Email" : "Phone (OTP)"}</button>
            ))}
          </div>

          {mode === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoFocus className="h-12 rounded-xl text-base" />
              <div className="relative">
                <Input type={showPw ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 rounded-xl text-base pr-12" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">+91</div>
                <Input type="tel" placeholder="10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} required autoFocus className="h-12 rounded-xl text-base pl-12" />
              </div>
              <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <p className="text-sm text-muted-foreground">Enter the 6-digit OTP sent to +91 {phone}</p>
              <Input type="tel" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required autoFocus className="h-12 rounded-xl text-base text-center text-2xl font-bold tracking-[0.4em]" maxLength={6} />
              <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl" disabled={loading || otp.length < 6}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
              <button type="button" className="w-full text-sm text-muted-foreground underline py-1" onClick={() => setOtpSent(false)}>Change number</button>
            </form>
          )}
        </div>
      </div>

      <div className="pb-10 text-center">
        <p className="text-sm text-muted-foreground">
          New shop?{" "}
          <button className="text-primary font-semibold" onClick={() => setLocation("/auth/register")}>Create account</button>
        </p>
      </div>
    </div>
  );
}
