import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import FormField, { fieldClass } from '@/components/shop/FormField';

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
      <button type="button" onClick={onGoogle} className="shop-btn-secondary w-full">
        <GoogleIcon className="h-5 w-5" /> המשך עם Google
      </button>

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-brand-line" />
        <span className="text-sm text-brand-navy/40">או</span>
        <span className="h-px flex-1 bg-brand-line" />
      </div>

      <h3 className="mb-4 text-lg font-semibold text-brand-navy">פרטים בסיסיים</h3>

      <div className="space-y-4">
        <FormField id="reg-name" label="שם מלא" required error={show('full_name')}>
          <input
            id="reg-name"
            value={data.full_name}
            onChange={(e) => onChange('full_name', e.target.value)}
            onBlur={() => touch('full_name')}
            placeholder="ישראל ישראלי"
            maxLength={100}
            autoComplete="name"
            className={fieldClass(show('full_name'))}
            autoFocus
          />
        </FormField>
        <FormField id="reg-email" label="אימייל" required error={show('email')}>
          <input
            id="reg-email"
            type="email"
            dir="ltr"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            onBlur={() => touch('email')}
            placeholder="you@example.com"
            maxLength={254}
            autoComplete="email"
            className={`${fieldClass(show('email'))} text-right`}
          />
        </FormField>
        <FormField id="reg-password" label="סיסמה" required error={show('password')} hint="לפחות 8 תווים">
          <input
            id="reg-password"
            type="password"
            dir="ltr"
            value={data.password}
            onChange={(e) => onChange('password', e.target.value)}
            onBlur={() => touch('password')}
            placeholder="••••••••"
            maxLength={128}
            autoComplete="new-password"
            className={`${fieldClass(show('password'))} text-right`}
          />
        </FormField>
        <FormField id="reg-confirm" label="אימות סיסמה" required error={show('confirmPassword')}>
          <input
            id="reg-confirm"
            type="password"
            dir="ltr"
            value={data.confirmPassword}
            onChange={(e) => onChange('confirmPassword', e.target.value)}
            onBlur={() => touch('confirmPassword')}
            placeholder="••••••••"
            maxLength={128}
            autoComplete="new-password"
            className={`${fieldClass(show('confirmPassword'))} text-right`}
          />
        </FormField>
      </div>

      <button type="button" onClick={onContinue} disabled={!isValid} className="shop-btn-dark mt-6 w-full">
        המשך <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
