import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/supabase";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPw) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (password.length < 6) { toast({ title: "Password too short", description: "At least 6 characters.", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await getSupabase().auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Now set up your shop." });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-green-50 flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-muted-foreground mt-1 text-sm">Start managing your shop today</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 p-6 space-y-5">
          <form onSubmit={handleRegister} className="space-y-3">
            <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoFocus className="h-12 rounded-xl text-base" />
            <div className="relative">
              <Input type={showPw ? "text" : "password"} placeholder="Password (min. 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="h-12 rounded-xl text-base pr-12" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <Input type={showPw ? "text" : "password"} placeholder="Confirm password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required className="h-12 rounded-xl text-base" />
            <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl mt-2" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </div>
      </div>

      <div className="pb-10 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button className="text-primary font-semibold" onClick={() => setLocation("/auth/login")}>Sign in</button>
        </p>
      </div>
    </div>
  );
}
