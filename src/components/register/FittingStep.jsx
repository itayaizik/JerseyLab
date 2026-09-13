import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Ruler } from 'lucide-react';
import { recommendSize } from '@/lib/sizeTables';

const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
const FITS = [
  { id: 'tight', label: 'צמודה' },
  { id: 'semi_tight', label: 'מעט צמודה' },
  { id: 'regular', label: 'רגילה' },
  { id: 'semi_loose', label: 'מעט רחבה' },
  { id: 'loose', label: 'רחבה' },
];
const BUILDS = [
  { id: 'very_slim', label: 'רזה מאוד' },
  { id: 'slim', label: 'רזה' },
  { id: 'average', label: 'ממוצע' },
  { id: 'broad', label: 'רחב' },
  { id: 'muscular', label: 'שרירי' },
];

function rangeError(val, min, max, label, unit) {
  if (!val) return '';
  const n = Number(val);
  if (isNaN(n) || n < min || n > max) return `${label} צריך להיות בין ${min} ל־${max} ${unit}`;
  return '';
}

function ChipGroup({ label, options, value, onSelect, ltr = false }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt.id} type="button" aria-pressed={value === opt.id} onClick={() => onSelect(opt.id)}
          className={`shop-chip px-4 ${ltr ? 'min-w-[3.5rem] font-semibold tabular-nums' : ''} ${value === opt.id ? 'shop-chip-active' : ''}`}>
          <span dir={ltr ? 'ltr' : undefined}>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function FittingStep({ data, onChange, onContinue, onBack }) {
  const [touched, setTouched] = useState({});
  const touch = (f) => setTouched((p) => ({ ...p, [f]: true }));

  const hErr = rangeError(data.height, 100, 250, 'גובה', 'ס"מ');
  const wErr = rangeError(data.weight, 30, 200, 'משקל', 'ק"ג');
  const hasInvalid = !!(hErr || wErr);
  const canContinue = !!data.usual_size && !hasInvalid;

  const rec = data.usual_size
    ? recommendSize({
        usualSize: data.usual_size,
        fitPreference: data.fit_preference,
        height: data.height,
        weight: data.weight,
      })
    : null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-brand-navy">התאמת מידות</h3>
      <p className="mb-5 mt-1 text-sm text-brand-navy/55">נתאים לכם חולצות לפי הרגלי הלבישה שלכם</p>

      {/* 1 - usual size (required, most important) */}
      <p className="mb-1 text-sm font-medium text-brand-navy/70">
        איזו מידה אתם לובשים בדרך כלל? <span className="text-brand-orange-ink">*</span>
      </p>
      <p className="mb-2.5 text-xs text-brand-navy/50">המידה הרגילה שלכם היא נקודת ההתחלה החשובה ביותר להמלצה.</p>
      <ChipGroup ltr label="מידה רגילה" options={SIZES.map(s => ({ id: s, label: s }))} value={data.usual_size}
        onSelect={(s) => onChange('usual_size', data.usual_size === s ? '' : s)} />

      {/* 2 - fit preference */}
      <p className="mb-2.5 mt-5 text-sm font-medium text-brand-navy/70">העדפת גזרה</p>
      <ChipGroup label="העדפת גזרה" options={FITS} value={data.fit_preference} onSelect={(id) => onChange('fit_preference', id)} />

      {/* 3 - body details (optional, for refinement) */}
      <p className="mb-2.5 mt-5 text-sm font-medium text-brand-navy/70">
        פרטי גוף <span className="font-normal text-brand-navy/40">(לא חובה, לדיוק ההמלצה)</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="fit-height" className="mb-1.5 block text-xs text-brand-navy/55">גובה (ס"מ)</label>
          <input id="fit-height" type="number" dir="ltr" value={data.height}
            onChange={(e) => onChange('height', e.target.value)} onBlur={() => touch('height')}
            placeholder="180" className="shop-field text-right tabular-nums" />
          {touched.height && hErr && <p className="mt-1 text-xs text-red-600">{hErr}</p>}
        </div>
        <div>
          <label htmlFor="fit-weight" className="mb-1.5 block text-xs text-brand-navy/55">משקל (ק"ג)</label>
          <input id="fit-weight" type="number" dir="ltr" value={data.weight}
            onChange={(e) => onChange('weight', e.target.value)} onBlur={() => touch('weight')}
            placeholder="75" className="shop-field text-right tabular-nums" />
          {touched.weight && wErr && <p className="mt-1 text-xs text-red-600">{wErr}</p>}
        </div>
      </div>

      <p className="mb-2.5 mt-5 text-sm font-medium text-brand-navy/70">מבנה גוף</p>
      <ChipGroup label="מבנה גוף" options={BUILDS} value={data.body_build}
        onSelect={(id) => onChange('body_build', data.body_build === id ? '' : id)} />

      {/* Live recommendation */}
      {rec && (
        <div className="mt-5 rounded-2xl bg-brand-mist p-4" aria-live="polite">
          <div className="flex items-start gap-2.5">
            <Ruler className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
            <p className="text-[15px] leading-relaxed text-brand-navy">
              {`לפי המידה הרגילה שלכם${rec.fitUsed ? ' והגזרה שבחרתם' : ''}, אנחנו ממליצים על `}
              <strong dir="ltr" className="text-lg font-bold text-brand-orange-ink">{rec.recommended}</strong>.
            </p>
          </div>
          {rec.note && <p className="mt-1.5 pr-6 text-xs leading-relaxed text-brand-navy/65">{rec.note}</p>}
          <p className="mt-1.5 pr-6 text-[11px] text-brand-navy/45">חולצות כדורגל עשויות להיות קטנות מבגדים רגילים; גרסת שחקן צמודה יותר.</p>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <button type="button" onClick={onBack} className="shop-btn-secondary px-4">
          <ChevronRight className="h-4 w-4" aria-hidden="true" /> חזרה
        </button>
        <button type="button" onClick={onContinue} disabled={!canContinue} className="shop-btn-dark flex-1">
          המשך <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
