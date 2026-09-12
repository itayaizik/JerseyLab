import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mail, Check, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

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
      title="שכחת סיסמה?"
      subtitle="נשלח לך קישור לאיפוס"
      footer={
        <>
          נזכרת בסיסמה?{' '}
          <Link to="/login" className="text-brand-orange font-bold hover:underline">התחבר</Link>
        </>
      }
    >
      {sent ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-brand-orange flex items-center justify-center mx-auto mb-4" style={{ border: '2px solid var(--brand-navy)', boxShadow: '3px 3px 0 var(--brand-navy)' }}>
            <Check className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm text-brand-navy font-body leading-relaxed">
            אם קיים חשבון עם המייל הזה, קישור לאיפוס סיסמה יישלח אליך בקרוב.
          </p>
        </div>
      ) : (
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
          <button
            type="submit"
            className="w-full h-11 bg-brand-orange text-white font-bold font-heading uppercase tracking-wide text-sm hover:bg-brand-orange-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ boxShadow: '3px 3px 0 var(--brand-navy)' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
