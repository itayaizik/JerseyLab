import React from 'react';
import { Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function OtpStep({ email, otpCode, setOtpCode, onVerify, onResend, loading, error, resendCooldown = 0 }) {
  return (
    <div>
      <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">אימות אימייל</h3>
      <p className="text-sm text-gray-500 font-body mb-5">שלחנו קוד בן 6 ספרות ל־{email}. הזן אותו למטה.</p>

      <div className="flex justify-center mb-5" dir="ltr">
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

      {error && <p className="text-red-500 text-sm mb-3 font-body text-center">{error}</p>}

      <button type="button" onClick={onVerify} disabled={loading || otpCode.length < 6}
        className="w-full flex items-center justify-center gap-1.5 bg-[#1B2A4A] text-white py-3 text-sm font-heading font-bold uppercase hover:bg-[#2a3f6b] transition-colors disabled:opacity-50"
        style={{ boxShadow: '3px 3px 0 #E8622A' }}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'אימות וסיום'}
      </button>

      <p className="text-center text-sm text-[#1B2A4A]/50 mt-4 font-body">
        לא קיבלת קוד?{' '}
        <button type="button" onClick={onResend} disabled={resendCooldown > 0} className="text-[#E8622A] font-bold font-heading uppercase hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline">
          {resendCooldown > 0 ? `שלח שוב (${resendCooldown}s)` : 'שלח שוב'}
        </button>
      </p>
    </div>
  );
}