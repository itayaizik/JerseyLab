import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { friendlyError } from "@/lib/errorMessages";

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
      setError(friendlyError(err, "איפוס הסיסמה נכשל. הקישור עשוי להיות שגוי או פג תוקף - נסה שוב."));
    } finally {
      setLoading(false);
    }
  };

  if (ready && !hasRecoverySession) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="קישור לא תקין"
        subtitle="קישור האיפוס חסר או פג תוקף"
        footer={
          <Link to="/forgot-password" className="text-[#E8622A] font-bold hover:underline">בקש קישור חדש</Link>
        }
      >
        <p className="text-sm text-[#1B2A4A]/70 text-center font-body leading-relaxed">
          הקישור שבו השתמשת נראה חלקי או שפג תוקפו. בקש קישור איפוס סיסמה חדש.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="סיסמה חדשה"
      subtitle="הזן את הסיסמה החדשה שלך"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 text-red-700 text-sm font-body">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1 font-body text-[#1B2A4A]">סיסמה חדשה</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              maxLength={128}
              className="w-full pl-10 pr-3 h-11 border-2 border-[#1B2A4A] bg-white text-sm focus:outline-none focus:border-[#E8622A] transition-colors font-body"
              dir="ltr"
              required
              disabled={!ready}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1 font-body text-[#1B2A4A]">אימות סיסמה</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              maxLength={128}
              className="w-full pl-10 pr-3 h-11 border-2 border-[#1B2A4A] bg-white text-sm focus:outline-none focus:border-[#E8622A] transition-colors font-body"
              dir="ltr"
              required
              disabled={!ready}
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full h-11 bg-[#E8622A] text-white font-bold font-heading uppercase tracking-wide text-sm hover:bg-[#D0551F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ boxShadow: '3px 3px 0 #1B2A4A' }}
          disabled={loading || !ready}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {loading ? 'מאפס...' : 'אפס סיסמה'}
        </button>
      </form>
    </AuthLayout>
  );
}
