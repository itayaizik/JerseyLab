import React from 'react';
import { Link } from 'react-router-dom';
import { t } from '@/lib/i18n';

// Consent checkbox for any form that collects personal details.
//
// Amendment 13 to the Protection of Privacy Law, in force since August 2025,
// expects consent to be given actively rather than inferred from the fact that
// somebody used the site. So this is an unticked box the person ticks
// themselves, next to a link to the policy they are agreeing to — not a line of
// small print saying that submitting implies agreement.

export default function PrivacyConsent({ checked, onChange, error, id = 'privacy-consent' }) {
  const linkClass = 'font-semibold text-brand-orange-ink hover:underline';
  return (
    <div>
      <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 transition ${error ? 'bg-red-50 ring-1 ring-red-300' : 'bg-brand-mist'}`}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-brand-orange"
        />
        <span className="text-[13px] leading-relaxed text-brand-navy/75">
          {t('קראתי ואני מאשר/ת את', 'I have read and accept the')}{' '}
          <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
            {t('מדיניות הפרטיות', 'privacy policy')}
          </Link>
          {' '}{t('ואת', 'and the')}{' '}
          <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className={linkClass}>
            {t('תנאי השימוש', 'terms of use')}
          </Link>
          {t(', והשימוש בפרטיי ליצירת קשר בנוגע לפנייה זו.', ', and the use of my details to contact me about this enquiry.')}
        </span>
      </label>
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
