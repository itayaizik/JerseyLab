import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { friendlyError } from "@/lib/errorMessages";
import { t } from "@/lib/i18n";

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
      setError(friendlyError(err, t("אימייל או סיסמה שגויים. בדקו את הפרטים ונסו שוב.", "Wrong email or password. Check your details and try again.")));
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
      title={t("ברוכים השבים", "Welcome back")}
      subtitle={t("התחברו לחשבון שלכם", "Log in to your account")}
      footer={
        <>
          {t("אין לכם חשבון?", "Don't have an account?")}{" "}
          <Link to="/register" className="shop-link">{t("הרשמה", "Sign up")}</Link>
        </>
      }
    >
      <button type="button" onClick={handleGoogle} className="shop-btn-secondary w-full">
        <GoogleIcon className="h-5 w-5" />
        {t("המשך עם Google", "Continue with Google")}
      </button>

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-brand-line" />
        <span className="text-sm text-brand-navy/40">{t("או", "or")}</span>
        <span className="h-px flex-1 bg-brand-line" />
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-brand-navy/70">{t("אימייל", "Email")}</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-navy/35" aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              className="shop-field pl-11"
              dir="ltr"
              required
            />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-brand-navy/70">{t("סיסמה", "Password")}</label>
            <Link to="/forgot-password" className="shop-link text-[13px]">{t("שכחתם סיסמה?", "Forgot your password?")}</Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-navy/35" aria-hidden="true" />
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={128}
              className="shop-field pl-11"
              dir="ltr"
              required
            />
          </div>
        </div>
        <button type="submit" className="shop-btn w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {loading ? t('מתחבר...', 'Logging in...') : t('התחברות', 'Log in')}
        </button>
      </form>
    </AuthLayout>
  );
}
