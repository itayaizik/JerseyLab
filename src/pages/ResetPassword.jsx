import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { friendlyError } from "@/lib/errorMessages";

function PasswordField({ id, label, value, onChange, autoFocus, disabled }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-brand-navy/70">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-navy/35" aria-hidden="true" />
        <input
          id={id}
          type="password"
          autoComplete="new-password"
          autoFocus={autoFocus}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={128}
          className="shop-field pl-11"
          dir="ltr"
          required
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery link's URL fragment and establishes a
    // temporary session automatically - we just need to wait for it.
    supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(!!data.session);
      setReady(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoverySession(!!session);
        setReady(true);
      }
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    if (newPassword.length < 8) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      window.location.href = "/login";
    } catch (err) {
      setError(friendlyError(err, "איפוס הסיסמה נכשל. הקישור עשוי להיות שגוי או פג תוקף - נסו שוב."));
    } finally {
      setLoading(false);
    }
  };

  if (ready && !hasRecoverySession) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="קישור לא תקין"
        subtitle="קישור האיפוס חסר או שפג תוקפו"
        footer={<Link to="/forgot-password" className="shop-link">בקשת קישור חדש</Link>}
      >
        <p className="text-center text-[15px] leading-relaxed text-brand-navy/70">
          הקישור שבו השתמשתם נראה חלקי או שפג תוקפו. בקשו קישור איפוס סיסמה חדש.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={Lock} title="סיסמה חדשה" subtitle="הזינו את הסיסמה החדשה שלכם">
      {error && (
        <div role="alert" className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField id="reset-new" label="סיסמה חדשה" value={newPassword} onChange={setNewPassword} autoFocus disabled={!ready} />
        <PasswordField id="reset-confirm" label="אימות סיסמה" value={confirmPassword} onChange={setConfirmPassword} disabled={!ready} />
        <button type="submit" className="shop-btn w-full" disabled={loading || !ready}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {loading ? 'מאפס...' : 'איפוס הסיסמה'}
        </button>
      </form>
    </AuthLayout>
  );
}
