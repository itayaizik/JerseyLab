import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Ruler } from 'lucide-react';
import { recommendSize } from '@/lib/sizeTables';
import { t, isEn } from '@/lib/i18n';

const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
const FITS = [
  { id: 'tight', label: t('צמודה', 'Tight') },
  { id: 'semi_tight', label: t('מעט צמודה', 'Slightly tight') },
  { id: 'regular', label: t('רגילה', 'Regular') },
  { id: 'semi_loose', label: t('מעט רחבה', 'Slightly loose') },
  { id: 'loose', label: t('רחבה', 'Loose') },
];
const BUILDS = [
  { id: 'very_slim', label: t('רזה מאוד', 'Very slim') },
  { id: 'slim', label: t('רזה', 'Slim') },
  { id: 'average', label: t('ממוצע', 'Average') },
  { id: 'broad', label: t('רחב', 'Broad') },
  { id: 'muscular', label: t('שרירי', 'Muscular') },
];

function rangeError(val, min, max, label, unit) {
  if (!val) return '';
  const n = Number(val);
  if (isNaN(n) || n < min || n > max) {
    return t(`${label} צריך להיות בין ${min} ל־${max} ${unit}`, `${label} must be between ${min} and ${max} ${unit}`);
  }
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

  const hErr = rangeError(data.height, 100, 250, t('גובה', 'Height'), t('ס"מ', 'cm'));
  const wErr = rangeError(data.weight, 30, 200, t('משקל', 'Weight'), t('ק"ג', 'kg'));
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
      <h3 className="text-lg font-semibold text-brand-navy">{t('התאמת מידות', 'Your size')}</h3>
      <p className="mb-5 mt-1 text-sm text-brand-navy/55">{t('נתאים לכם חולצות לפי הרגלי הלבישה שלכם', 'We match shirts to the way you like to wear them')}</p>

      {/* 1 - usual size (required, most important) */}
      <p className="mb-1 text-sm font-medium text-brand-navy/70">
        {t('איזו מידה אתם לובשים בדרך כלל?', 'What size do you usually wear?')} <span className="text-brand-orange-ink">*</span>
      </p>
      <p className="mb-2.5 text-xs text-brand-navy/50">{t('המידה הרגילה שלכם היא נקודת ההתחלה החשובה ביותר להמלצה.', 'Your usual size is the most important starting point for our recommendation.')}</p>
      <ChipGroup ltr label={t('מידה רגילה', 'Usual size')} options={SIZES.map(s => ({ id: s, label: s }))} value={data.usual_size}
        onSelect={(s) => onChange('usual_size', data.usual_size === s ? '' : s)} />

      {/* 2 - fit preference */}
      <p className="mb-2.5 mt-5 text-sm font-medium text-brand-navy/70">{t('העדפת גזרה', 'Preferred fit')}</p>
      <ChipGroup label={t('העדפת גזרה', 'Preferred fit')} options={FITS} value={data.fit_preference} onSelect={(id) => onChange('fit_preference', id)} />

      {/* 3 - body details (optional, for refinement) */}
      <p className="mb-2.5 mt-5 text-sm font-medium text-brand-navy/70">
        {t('פרטי גוף', 'Body details')} <span className="font-normal text-brand-navy/40">{t('(לא חובה, לדיוק ההמלצה)', '(optional, for a more accurate recommendation)')}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="fit-height" className="mb-1.5 block text-xs text-brand-navy/55">{t('גובה (ס"מ)', 'Height (cm)')}</label>
          <input id="fit-height" type="number" dir="ltr" value={data.height}
            onChange={(e) => onChange('height', e.target.value)} onBlur={() => touch('height')}
            placeholder="180" className="shop-field text-start tabular-nums" />
          {touched.height && hErr && <p className="mt-1 text-xs text-red-600">{hErr}</p>}
        </div>
        <div>
          <label htmlFor="fit-weight" className="mb-1.5 block text-xs text-brand-navy/55">{t('משקל (ק"ג)', 'Weight (kg)')}</label>
          <input id="fit-weight" type="number" dir="ltr" value={data.weight}
            onChange={(e) => onChange('weight', e.target.value)} onBlur={() => touch('weight')}
            placeholder="75" className="shop-field text-start tabular-nums" />
          {touched.weight && wErr && <p className="mt-1 text-xs text-red-600">{wErr}</p>}
        </div>
      </div>

      <p className="mb-2.5 mt-5 text-sm font-medium text-brand-navy/70">{t('מבנה גוף', 'Build')}</p>
      <ChipGroup label={t('מבנה גוף', 'Build')} options={BUILDS} value={data.body_build}
        onSelect={(id) => onChange('body_build', data.body_build === id ? '' : id)} />

      {/* Live recommendation */}
      {rec && (
        <div className="mt-5 rounded-2xl bg-brand-mist p-4" aria-live="polite">
          <div className="flex items-start gap-2.5">
            <Ruler className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
            <p className="text-[15px] leading-relaxed text-brand-navy">
              {rec.fitUsed
                ? t('לפי המידה הרגילה שלכם והגזרה שבחרתם, אנחנו ממליצים על ', 'Based on your usual size and the fit you chose, we recommend ')
                : t('לפי המידה הרגילה שלכם, אנחנו ממליצים על ', 'Based on your usual size, we recommend ')}
              <strong dir="ltr" className="text-lg font-bold text-brand-orange-ink">{rec.recommended}</strong>.
            </p>
          </div>
          {/* The recommendation's own note is written in Hebrew. */}
          {rec.note && !isEn && <p className="mt-1.5 ps-6 text-xs leading-relaxed text-brand-navy/65">{rec.note}</p>}
          <p className="mt-1.5 ps-6 text-[11px] text-brand-navy/45">{t('חולצות כדורגל עשויות להיות קטנות מבגדים רגילים; גרסת שחקן צמודה יותר.', 'Football shirts can run smaller than regular clothes; the player version fits tighter.')}</p>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <button type="button" onClick={onBack} className="shop-btn-secondary px-4">
          <ChevronRight className="h-4 w-4" aria-hidden="true" /> {t('חזרה', 'Back')}
        </button>
        <button type="button" onClick={onContinue} disabled={!canContinue} className="shop-btn-dark flex-1">
          {t('המשך', 'Continue')} <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
