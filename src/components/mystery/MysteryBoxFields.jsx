import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Shirt, Sparkles, User } from 'lucide-react';
import { EXTRA_PRICES } from '@/lib/cart';
import { BOX_TYPES, SIZES, NAME_PRICE, PATCHES_PRICE } from '@/lib/mysteryBox';
import { typeOf, shortsAllowed, LONG_SLEEVE_TEXT, SHORTS_TEXT } from '@/lib/mysteryBoxes';
import { t } from '@/lib/i18n';

// The questions for one mystery box: who it is for, the style, the size, the
// extras and a note. The builder shows them inside each box's card; a friend
// filling in their box from a shared link sees them on a page of their own.

const TYPE_ICONS = { regular: Shirt, retro: Sparkles, mundial: Gift };

export default function MysteryBoxFields({ box, onChange, fid, missingSize = false, nameRequired = false, missingName = false }) {
  const type = typeOf(box);
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={fid('who')} className={`mb-1.5 flex items-center gap-1.5 text-sm font-medium ${missingName ? 'text-red-600' : 'text-brand-navy/70'}`}>
          <User className="h-4 w-4 text-brand-orange-ink" aria-hidden="true" />
          {nameRequired ? t('השם שלך', 'Your name') : t('למי הבוקס?', 'Who is this box for?')}
          {nameRequired
            ? <span className="text-brand-orange-ink">*</span>
            : <span className="font-normal text-brand-navy/40">{t('(לא חובה)', '(optional)')}</span>}
        </label>
        <input id={fid('who')} value={box.forWhom} maxLength={40}
          onChange={e => onChange({ forWhom: e.target.value })}
          placeholder={t('למשל: דני', 'For example: Danny')}
          aria-invalid={missingName || undefined}
          className={`shop-field ${missingName ? 'border-red-300' : ''}`} />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-brand-navy/70">{t('סגנון', 'Style')}</p>
        <div role="group" className="grid grid-cols-3 gap-2">
          {BOX_TYPES.map(option => {
            const active = box.type === option.id;
            const Icon = TYPE_ICONS[option.id];
            return (
              <button key={option.id} type="button" aria-pressed={active}
                onClick={() => onChange({ type: option.id })}
                title={t(option.blurb, option.blurbEn)}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition ${
                  active ? 'border-brand-orange bg-brand-orange-soft ring-1 ring-inset ring-brand-orange' : 'border-brand-line bg-white hover:border-brand-navy/30'
                }`}>
                <Icon className={`h-5 w-5 ${active ? 'text-brand-orange-ink' : 'text-brand-navy/60'}`} aria-hidden="true" />
                <span className="text-[14px] font-semibold text-brand-navy">{t(option.label, option.labelEn)}</span>
                <span className="text-[13px] tabular-nums text-brand-navy/60">₪{option.price}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-brand-navy/50">{t(type.blurb, type.blurbEn)}</p>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className={`text-sm font-medium ${missingSize ? 'text-red-600' : 'text-brand-navy/70'}`}>
            {t('מידה', 'Size')} <span className="text-brand-orange-ink">*</span>
          </p>
          <Link to="/size-guide" target="_blank" className="shop-link text-[13px]">{t('מדריך מידות', 'Size guide')}</Link>
        </div>
        <div role="group" className="grid grid-cols-6 gap-1.5">
          {SIZES.map(v => (
            <button key={v} type="button" aria-pressed={box.size === v}
              onClick={() => onChange({ size: v })}
              className={`shop-chip min-h-[2.75rem] px-0 font-semibold tabular-nums ${box.size === v ? 'shop-chip-active' : missingSize ? 'border-red-300' : ''}`}>
              <span dir="ltr">{v}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-brand-navy/70">{t('תוספות', 'Extras')}</p>
        <div className="grid grid-cols-1 gap-2 min-[440px]:grid-cols-2">
          <Extra checked={box.addName} onChange={v => onChange({ addName: v })}
            label={t('שם ומספר מאחורה', 'Name and number')} price={NAME_PRICE}
            hint={t('שחקן שמתאים לחולצה - גם הוא הפתעה', 'A player to match the shirt - a surprise too')} />
          <Extra checked={box.patches} onChange={v => onChange({ patches: v })}
            label={t("כל הפאצ'ים", 'All patches')} price={PATCHES_PRICE}
            hint={t('של הליגה והטורניר', 'League and tournament')} />
          <Extra checked={box.longSleeve} onChange={v => onChange({ longSleeve: v })}
            label={LONG_SLEEVE_TEXT} price={EXTRA_PRICES.longSleeve}
            hint={t('אותה חולצה, שרוול ארוך', 'The same shirt, long sleeved')} />
          {shortsAllowed(box) && (
            <Extra checked={box.shorts} onChange={v => onChange({ shorts: v })}
              label={SHORTS_TEXT} price={EXTRA_PRICES.shorts}
              hint={box.size ? t(`מכנס תואם במידה ${box.size}`, `Matching shorts, size ${box.size}`) : t('מכנס תואם באותה מידה', 'Matching shorts, same size')} />
          )}
        </div>
      </div>

      <div>
        <label htmlFor={fid('note')} className="mb-1.5 block text-sm font-medium text-brand-navy/70">
          {t('הערה לבוקס הזה', 'A note for this box')} <span className="font-normal text-brand-navy/40">{t('(לא חובה)', '(optional)')}</span>
        </label>
        <input id={fid('note')} value={box.note} maxLength={200}
          onChange={e => onChange({ note: e.target.value })}
          placeholder={t('למשל: אוהד מכבי, בלי הפועל', 'For example: a Liverpool fan, nothing from Everton')}
          className="shop-field" />
      </div>
    </div>
  );
}

function Extra({ checked, onChange, label, price, hint }) {
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3 transition ${
      checked ? 'border-brand-orange bg-brand-orange-soft ring-1 ring-inset ring-brand-orange' : 'border-brand-line bg-white hover:border-brand-navy/30'
    }`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-brand-orange" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-semibold text-brand-navy">{label}</span>
          <span className="flex-shrink-0 text-[13px] font-semibold tabular-nums text-brand-orange-ink">+₪{price}</span>
        </span>
        <span className="mt-0.5 block text-[12px] text-brand-navy/55">{hint}</span>
      </span>
    </label>
  );
}
