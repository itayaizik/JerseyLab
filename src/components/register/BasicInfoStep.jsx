import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import FormField, { fieldClass } from '@/components/shop/FormField';
import { t } from '@/lib/i18n';

export default function BasicInfoStep({ data, onChange, onContinue, onGoogle }) {
  const [touched, setTouched] = useState({});
  const touch = (f) => setTouched((p) => ({ ...p, [f]: true }));
  const required = t('שדה חובה', 'Required');

  const errors = {
    full_name: !data.full_name.trim() ? required : '',
    email: !data.email.trim()
      ? required
      : !/^\S+@\S+\.\S+$/.test(data.email)
        ? t('כתובת אימייל לא תקינה', 'Invalid email address')
        : '',
    password: !data.password
      ? required
      : data.password.length < 8
        ? t('הסיסמה חייבת להכיל לפחות 8 תווים', 'The password must be at least 8 characters')
      : data.password.length > 128
        ? t('הסיסמה ארוכה מדי (מקסימום 128 תווים)', 'The password is too long (128 characters at most)')
        : '',
    confirmPassword: !data.confirmPassword
      ? required
      : data.confirmPassword !== data.password
        ? t('הסיסמאות אינן תואמות', "The passwords don't match")
        : '',
  };
  const isValid = Object.values(errors).every((e) => !e);
  const show = (f) => (touched[f] ? errors[f] : '');

  return (
    <div>
      <button type="button" onClick={onGoogle} className="shop-btn-secondary w-full">
        <GoogleIcon className="h-5 w-5" /> {t('המשך עם Google', 'Continue with Google')}
      </button>

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-brand-line" />
        <span className="text-sm text-brand-navy/40">{t('או', 'or')}</span>
        <span className="h-px flex-1 bg-brand-line" />
      </div>

      <h3 className="mb-4 text-lg font-semibold text-brand-navy">{t('פרטים בסיסיים', 'Basic details')}</h3>

      <div className="space-y-4">
        <FormField id="reg-name" label={t('שם מלא', 'Full name')} required error={show('full_name')}>
          <input
            id="reg-name"
            value={data.full_name}
            onChange={(e) => onChange('full_name', e.target.value)}
            onBlur={() => touch('full_name')}
            placeholder={t('ישראל ישראלי', 'Alex Morgan')}
            maxLength={100}
            autoComplete="name"
            className={fieldClass(show('full_name'))}
            autoFocus
          />
        </FormField>
        <FormField id="reg-email" label={t('אימייל', 'Email')} required error={show('email')}>
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
            className={`${fieldClass(show('email'))} text-start`}
          />
        </FormField>
        <FormField id="reg-password" label={t('סיסמה', 'Password')} required error={show('password')} hint={t('לפחות 8 תווים', 'At least 8 characters')}>
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
            className={`${fieldClass(show('password'))} text-start`}
          />
        </FormField>
        <FormField id="reg-confirm" label={t('אימות סיסמה', 'Confirm password')} required error={show('confirmPassword')}>
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
            className={`${fieldClass(show('confirmPassword'))} text-start`}
          />
        </FormField>
      </div>

      <button type="button" onClick={onContinue} disabled={!isValid} className="shop-btn-dark mt-6 w-full">
        {t('המשך', 'Continue')} <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
