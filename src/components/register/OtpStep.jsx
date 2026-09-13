import React from 'react';
import { Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function OtpStep({ email, otpCode, setOtpCode, onVerify, onResend, loading, error, resendCooldown = 0 }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-brand-navy">אימות אימייל</h3>
      <p className="mb-6 mt-1 text-sm leading-relaxed text-brand-navy/55">
        שלחנו קוד בן 6 ספרות ל־<span dir="ltr" className="font-medium text-brand-navy">{email}</span>. הזינו אותו כאן.
      </p>

      <div className="mb-5 flex justify-center" dir="ltr">
        <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && <p role="alert" className="mb-3 text-center text-sm text-red-600">{error}</p>}

      <button type="button" onClick={onVerify} disabled={loading || otpCode.length < 6} className="shop-btn w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'אימות וסיום'}
      </button>

      <p className="mt-4 text-center text-sm text-brand-navy/55">
        לא קיבלתם קוד?{' '}
        <button type="button" onClick={onResend} disabled={resendCooldown > 0} className="shop-link disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40">
          {resendCooldown > 0 ? `שליחה חוזרת (${resendCooldown})` : 'שליחה חוזרת'}
        </button>
      </p>
    </div>
  );
}
