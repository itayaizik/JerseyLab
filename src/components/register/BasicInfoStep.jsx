import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';

const inputCls = 'w-full border-2 border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none font-body';

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="text-xs font-heading font-bold text-[#1B2A4A]/60 uppercase block mb-1">
        {label}{required && <span className="text-[#E8622A]"> *</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1 font-body">{error}</p>}
    </div>
  );
}

export default function BasicInfoStep({ data, onChange, onContinue, onGoogle }) {
  const [touched, setTouched] = useState({});
  const touch = (f) => setTouched((p) => ({ ...p, [f]: true }));

  const errors = {
    full_name: !data.full_name.trim() ? 'שדה חובה' : '',
    email: !data.email.trim()
      ? 'שדה חובה'
      : !/^\S+@\S+\.\S+$/.test(data.email)
        ? 'כתובת אימייל לא תקינה'
        : '',
    password: !data.password
      ? 'שדה חובה'
      : data.password.length < 8
        ? 'הסיסמה חייבת להכיל לפחות 8 תווים'
      : data.password.length > 128
        ? 'הסיסמה ארוכה מדי (מקסימום 128 תווים)'
        : '',
    confirmPassword: !data.confirmPassword
      ? 'שדה חובה'
      : data.confirmPassword !== data.password
        ? 'הסיסמאות אינן תואמות'
        : '',
  };
  const isValid = Object.values(errors).every((e) => !e);
  const show = (f) => (touched[f] ? errors[f] : '');

  return (
    <div>
      <button
        type="button"
        onClick={onGoogle}
        className="w-full flex items-center justify-center gap-2 border-2 border-[#1B2A4A] bg-white text-[#1B2A4A] h-12 text-sm font-heading font-bold uppercase hover:bg-[#F2ECD9] transition-colors mb-4"
      >
        <GoogleIcon className="w-5 h-5" /> המשך עם Google
      </button>

      <div className="relative flex items-center my-4">
        <div className="flex-1 h-px bg-[#1B2A4A]/15" />
        <span className="px-3 text-xs text-[#1B2A4A]/40 font-body">או</span>
        <div className="flex-1 h-px bg-[#1B2A4A]/15" />
      </div>

      <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-3">פרטים בסיסיים</h3>

      <div className="space-y-3">
        <Field label="שם מלא" required error={show('full_name')}>
          <input
            value={data.full_name}
            onChange={(e) => onChange('full_name', e.target.value)}
            onBlur={() => touch('full_name')}
            placeholder="ישראל ישראלי"
            maxLength={100}
            autoComplete="name"
            className={inputCls}
            autoFocus
          />
        </Field>
        <Field label="אימייל" required error={show('email')}>
          <input
            type="email"
            dir="ltr"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            onBlur={() => touch('email')}
            placeholder="you@example.com"
            maxLength={254}
            autoComplete="email"
            className={inputCls}
          />
        </Field>
        <Field label="סיסמה" required error={show('password')}>
          <input
            type="password"
            dir="ltr"
            value={data.password}
            onChange={(e) => onChange('password', e.target.value)}
            onBlur={() => touch('password')}
            placeholder="••••••••"
            maxLength={128}
            autoComplete="new-password"
            className={inputCls}
          />
        </Field>
        <Field label="אימות סיסמה" required error={show('confirmPassword')}>
          <input
            type="password"
            dir="ltr"
            value={data.confirmPassword}
            onChange={(e) => onChange('confirmPassword', e.target.value)}
            onBlur={() => touch('confirmPassword')}
            placeholder="••••••••"
            maxLength={128}
            autoComplete="new-password"
            className={inputCls}
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!isValid}
        className="w-full flex items-center justify-center gap-1.5 bg-[#1B2A4A] text-white h-12 mt-5 font-heading font-bold uppercase hover:bg-[#2a3f6b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ boxShadow: '3px 3px 0 #E8622A' }}
      >
        המשך <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}