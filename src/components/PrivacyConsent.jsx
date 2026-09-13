import React from 'react';
import { Link } from 'react-router-dom';

// Consent checkbox for any form that collects personal details.
//
// Amendment 13 to the Protection of Privacy Law, in force since August 2025,
// expects consent to be given actively rather than inferred from the fact that
// somebody used the site. So this is an unticked box the person ticks
// themselves, next to a link to the policy they are agreeing to — not a line of
// small print saying that submitting implies agreement.

export default function PrivacyConsent({ checked, onChange, error, id = 'privacy-consent' }) {
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
          קראתי ואני מאשר/ת את{' '}
          <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-orange-ink hover:underline">
            מדיניות הפרטיות
          </Link>
          {' '}ואת{' '}
          <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-orange-ink hover:underline">
            תנאי השימוש
          </Link>
          , והשימוש בפרטיי ליצירת קשר בנוגע לפנייה זו.
        </span>
      </label>
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
