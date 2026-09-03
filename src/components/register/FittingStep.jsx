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

const inputCls = 'w-full border-2 border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none font-mono';

function rangeError(val, min, max, label, unit) {
  if (!val) return '';
  const n = Number(val);
  if (isNaN(n) || n < min || n > max) return `${label} צריך להיות בין ${min} ל־${max} ${unit}`;
  return '';
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
      <h3 className="font-heading font-bold text-lg text-[#1B2A4A] mb-1">התאמת מידות</h3>
      <p className="text-sm text-gray-500 font-body mb-4">נתאים לך חולצות לפי הרגלי הלבישה שלך</p>

      {/* 1 - usual size (required, most important) */}
      <label className="text-xs font-heading font-bold text-[#1B2A4A]/60 uppercase block mb-1">
        איזו מידה אתה בדרך כלל לובש? <span className="text-[#E8622A]">*</span>
      </label>
      <p className="text-[11px] text-[#1B2A4A]/50 font-body mb-2">המידה שאתה בדרך כלל לובש היא נקודת ההתחלה החשובה ביותר להמלצה שלנו.</p>
      <div className="flex gap-1.5 flex-wrap">
        {SIZES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange('usual_size', data.usual_size === s ? '' : s)}
            className={`px-4 py-2 border-2 text-sm font-mono font-bold transition-colors ${
              data.usual_size === s
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                : 'border-[#1B2A4A]/30 text-[#1B2A4A] bg-white hover:border-[#1B2A4A]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 2 - fit preference */}
      <label className="text-xs font-heading font-bold text-[#1B2A4A]/60 uppercase block mt-4 mb-1.5">העדפת גזרה</label>
      <div className="grid grid-cols-5 gap-1">
        {FITS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange('fit_preference', f.id)}
            className={`py-2 px-1 border-2 text-[10px] font-heading font-bold transition-colors leading-tight ${
              data.fit_preference === f.id
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                : 'border-[#1B2A4A]/30 text-[#1B2A4A] bg-white hover:border-[#1B2A4A]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 3 - body details (optional, for refinement) */}
      <p className="text-xs font-heading font-bold text-[#1B2A4A]/60 uppercase mt-4 mb-1.5">פרטי גוף <span className="font-body normal-case text-[10px] text-[#1B2A4A]/40">(אופציונלי, לדיוק ההמלצה)</span></p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-heading font-bold text-[#1B2A4A]/50 uppercase block mb-1">גובה (ס"מ)</label>
          <input
            type="number"
            dir="ltr"
            value={data.height}
            onChange={(e) => onChange('height', e.target.value)}
            onBlur={() => touch('height')}
            placeholder="180"
            className={inputCls}
          />
          {touched.height && hErr && <p className="text-red-500 text-xs mt-1 font-body">{hErr}</p>}
        </div>
        <div>
          <label className="text-[11px] font-heading font-bold text-[#1B2A4A]/50 uppercase block mb-1">משקל (ק"ג)</label>
          <input
            type="number"
            dir="ltr"
            value={data.weight}
            onChange={(e) => onChange('weight', e.target.value)}
            onBlur={() => touch('weight')}
            placeholder="75"
            className={inputCls}
          />
          {touched.weight && wErr && <p className="text-red-500 text-xs mt-1 font-body">{wErr}</p>}
        </div>
      </div>

      <label className="text-xs font-heading font-bold text-[#1B2A4A]/60 uppercase block mt-3 mb-1.5">מבנה גוף</label>
      <div className="grid grid-cols-5 gap-1">
        {BUILDS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onChange('body_build', data.body_build === b.id ? '' : b.id)}
            className={`py-2 px-1 border-2 text-[11px] font-heading font-bold transition-colors leading-tight ${
              data.body_build === b.id
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                : 'border-[#1B2A4A]/30 text-[#1B2A4A] bg-white hover:border-[#1B2A4A]'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Live recommendation */}
      {rec && (
        <div className="bg-[#F2ECD9] border-2 border-[#1B2A4A] p-3 mt-4" style={{ boxShadow: '2px 2px 0 #E8622A' }}>
          <div className="flex items-start gap-2">
            <Ruler className="w-4 h-4 text-[#E8622A] flex-shrink-0 mt-0.5" />
            <p className="text-sm font-body text-[#1B2A4A] leading-relaxed">
              {`לפי המידה שאתה בדרך כלל לובש${rec.fitUsed ? ' והגזרה שבחרת' : ''}, אנחנו ממליצים על `}
              <strong className="font-heading font-black text-lg text-[#E8622A]">{rec.recommended}</strong>.
            </p>
          </div>
          {rec.note && <p className="text-xs text-[#1B2A4A]/70 font-body mt-1.5 leading-relaxed pr-6">{rec.note}</p>}
          <p className="text-[10px] text-[#1B2A4A]/40 font-body mt-1.5 pr-6">חולצות כדורגל עשויות להיות קטנות מבגדים רגילים; גרסת שחקן מתאימה צמוד יותר.</p>
        </div>
      )}

      <div className="flex gap-2 mt-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-4 py-3 border-2 border-[#1B2A4A] text-[#1B2A4A] text-sm font-heading font-bold uppercase hover:bg-[#F2ECD9] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> חזור
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#1B2A4A] text-white py-3 text-sm font-heading font-bold uppercase hover:bg-[#2a3f6b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          המשך <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}