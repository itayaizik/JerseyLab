import React from 'react';
import { KIDS_SIZES, kidsRow } from '@/lib/kidsKit';
import { t } from '@/lib/i18n';

// Kids sizes, chosen by the child rather than by the shirt.
//
// A parent does not know whether their six-year-old is a 22. They know how
// tall the child is, so every chip carries the height it is cut for and the
// age that usually goes with it. The grid is fixed at three across on a phone
// so the numbers line up in columns and can be read down.

export default function KidsSizeSelector({ value, onChange, invalid = false }) {
  return (
    <div>
      <div role="group" aria-label={t('מידת ילדים', 'Kids size')} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {KIDS_SIZES.map(size => {
          const row = kidsRow(size);
          const selected = value === size;
          return (
            <button
              key={size}
              type="button"
              aria-pressed={selected}
              aria-label={t(`מידה ${size}, לגובה ${row.height} סנטימטר, גיל ${row.age}`, `Size ${size}, for height ${row.height} cm, age ${row.age}`)}
              onClick={() => onChange(size)}
              className={`flex flex-col items-center gap-0.5 rounded-2xl border px-2 py-2.5 transition ${
                selected
                  ? 'border-brand-orange bg-brand-orange-soft'
                  : invalid
                    ? 'border-red-300 bg-white hover:border-brand-navy/30'
                    : 'border-brand-line bg-white hover:border-brand-navy/30'
              }`}
            >
              <span dir="ltr" className="text-[17px] font-bold tabular-nums text-brand-navy">{size}</span>
              <span dir="ltr" className="text-[11px] tabular-nums text-brand-navy/55">{row.height} {t('ס"מ', 'cm')}</span>
              <span className="text-[11px] text-brand-navy/45">{t(`גיל ${row.age}`, `Age ${row.age}`)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[13px] text-brand-navy/55">
        {t('בוחרים לפי הגובה של הילד. בין שתי מידות - עדיף הגדולה.', "Choose by the child's height. Between two sizes, take the larger one.")}
      </p>
    </div>
  );
}
