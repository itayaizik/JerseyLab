import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mail, Check, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { t } from "@/lib/i18n";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless - don't reveal whether the email exists.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title={t("שכחתם סיסמה?", "Forgot your password?")}
      subtitle={t("נשלח לכם קישור לאיפוס", "We'll send you a reset link")}
      footer={
        <>
          {t("נזכרתם בסיסמה?", "Remembered it?")}{' '}
          <Link to="/login" className="shop-link">{t("התחברות", "Log in")}</Link>
        </>
      }
    >
      {sent ? (
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <Check className="h-7 w-7 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="text-[15px] leading-relaxed text-brand-navy/75">
            {t("אם קיים חשבון עם המייל הזה, קישור לאיפוס סיסמה יישלח אליכם בקרוב.", "If there is an account with this email, a password reset link will be sent to you shortly.")}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-medium text-brand-navy/70">{t("אימייל", "Email")}</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-navy/35" aria-hidden="true" />
              <input
                id="forgot-email"
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
          <button type="submit" className="shop-btn w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {loading ? t('שולח...', 'Sending...') : t('שליחת קישור לאיפוס', 'Send reset link')}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
