import React from 'react';
import { t } from '@/lib/i18n';

export const NAME_MAX = 20;
export const NUMBER_MAX = 3;

// The name and number to print on the back. Latin letters and digits only,
// since that is what the print can do. Each field carries its own label and a
// live count, so the limit is visible before it is hit rather than after.
export default function NameNumberInput({ customName, customNumber, onChange, invalid = false }) {
  const fieldClass = `flex min-h-[3.25rem] items-center gap-3 rounded-2xl border bg-brand-mist px-4 transition focus-within:border-brand-navy/25 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-orange/60 ${
    invalid ? 'border-red-300' : 'border-transparent'
  }`;
  const inputClass = 'min-w-0 flex-1 bg-transparent text-[15px] font-semibold uppercase tracking-wide text-brand-navy placeholder:font-normal placeholder:text-brand-navy/30 focus:outline-none focus-visible:!outline-none';

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,9rem)] gap-2.5">
      <label className={fieldClass}>
        <span className="flex-shrink-0 text-[15px] text-brand-navy/55">{t('שם', 'Name')}</span>
        <input
          value={customName}
          onChange={e => onChange('customName', e.target.value.slice(0, NAME_MAX).replace(/[^a-zA-Z0-9 -]/g, ''))}
          placeholder="MESSI" dir="ltr" maxLength={NAME_MAX} autoComplete="off" aria-label={t('שם להדפסה', 'Name to print')}
          className={inputClass}
        />
        <span dir="ltr" className="flex-shrink-0 text-xs tabular-nums text-brand-navy/40">{customName.length}/{NAME_MAX}</span>
      </label>
      <label className={fieldClass}>
        <span className="flex-shrink-0 text-[15px] text-brand-navy/55">{t('מספר', 'Number')}</span>
        <input
          value={customNumber}
          onChange={e => onChange('customNumber', e.target.value.slice(0, NUMBER_MAX).replace(/[^0-9]/g, ''))}
          placeholder="10" type="text" inputMode="numeric" dir="ltr" maxLength={NUMBER_MAX} autoComplete="off" aria-label={t('מספר להדפסה', 'Number to print')}
          className={inputClass}
        />
      </label>
    </div>
  );
}
