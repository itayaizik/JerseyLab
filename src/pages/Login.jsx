import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { friendlyError } from "@/lib/errorMessages";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(friendlyError(err, "אימייל או סיסמה שגויים. ודא את הפרטים ונסה שוב."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="ברוך השב"
      subtitle="התחבר לחשבון שלך"
      footer={
        <>
          אין לך חשבון?{" "}
          <Link to="/register" className="text-brand-orange font-bold hover:underline">
            הרשמה
          </Link>
        </>
      }
    >
      <button
        onClick={handleGoogle}
        className="w-full h-11 text-sm font-medium border-2 border-brand-navy bg-white hover:bg-brand-cream transition-colors flex items-center justify-center gap-2 mb-5 font-body"
        style={{ boxShadow: '2px 2px 0 var(--brand-navy)' }}
      >
        <GoogleIcon className="w-5 h-5" />
        המשך עם Google
      </button>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-brand-navy/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-gray-400 font-heading">או</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 text-red-700 text-sm font-body">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1 font-body text-brand-navy">אימייל</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              className="w-full pl-10 pr-3 h-11 border-2 border-brand-navy bg-white text-sm focus:outline-none focus:border-brand-orange transition-colors font-body"
              dir="ltr"
              required
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium font-body text-brand-navy">סיסמה</label>
            <Link to="/forgot-password" className="text-xs text-brand-orange hover:underline font-body">
              שכחת סיסמה?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={128}
              className="w-full pl-10 pr-3 h-11 border-2 border-brand-navy bg-white text-sm focus:outline-none focus:border-brand-orange transition-colors font-body"
              dir="ltr"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full h-11 bg-brand-orange text-white font-bold font-heading uppercase tracking-wide text-sm hover:bg-brand-orange-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ boxShadow: '3px 3px 0 var(--brand-navy)' }}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          {loading ? 'מתחבר...' : 'התחברות'}
        </button>
      </form>
    </AuthLayout>
  );
}