import React from 'react';
import { Link } from 'react-router-dom';
import { Baby, Ban, Check, Gift, Shirt, Sparkles, User } from 'lucide-react';
import { EXTRA_PRICES } from '@/lib/cart';
import { BOX_TYPES, NAME_PRICE, PATCHES_PRICE, EXCLUDE_COLORS, isKidsType } from '@/lib/mysteryBox';
import { kidsSizeHint } from '@/lib/kidsKit';
import { typeOf, shortsAllowed, longSleeveAllowed, sizesFor, LONG_SLEEVE_TEXT, SHORTS_TEXT } from '@/lib/mysteryBoxes';
import { t } from '@/lib/i18n';

// The questions for one mystery box: who it is for, the style, the size, the
// extras and a note. The builder shows them inside each box's card; a friend
// filling in their box from a shared link sees them on a page of their own.

const TYPE_ICONS = { regular: Shirt, retro: Sparkles, mundial: Gift, kids: Baby };

export default function MysteryBoxFields({ box, onChange, fid, missingSize = false, nameRequired = false, missingName = false, freePatches = false }) {
  const type = typeOf(box);
  const kids = isKidsType(box.type);
  const sizes = sizesFor(box);
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
        <div role="group" className="grid grid-cols-2 gap-2 min-[380px]:grid-cols-4">
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
        <div role="group" className={`grid gap-1.5 ${kids ? 'grid-cols-4' : 'grid-cols-6'}`}>
          {sizes.map(v => (
            <button key={v} type="button" aria-pressed={box.size === v}
              onClick={() => onChange({ size: v })}
              className={`shop-chip min-h-[2.75rem] px-0 font-semibold tabular-nums ${box.size === v ? 'shop-chip-active' : missingSize ? 'border-red-300' : ''}`}>
              <span dir="ltr">{v}</span>
            </button>
          ))}
        </div>
        {kids && (
          <p className="mt-2 text-[12px] text-brand-navy/60">
            {box.size ? kidsSizeHint(box.size) : t('מידות ילדים נבחרות לפי הגובה של הילד.', "Kids sizes go by the child's height.")}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-brand-navy/70">{t('תוספות', 'Extras')}</p>
        {/* A kids box is a kit: the shorts and the printing are in the ₪100,
            and there is no long-sleeved version to offer. */}
        {kids && (
          <div className="mb-2 rounded-2xl border border-brand-orange/40 bg-brand-orange-soft/50 p-3">
            <p className="text-[14px] font-semibold text-brand-navy">{t('כלול במחיר', 'Included in the price')}</p>
            <ul className="mt-1.5 space-y-1">
              <li className="flex items-center gap-2 text-[13px] text-brand-navy/70">
                <Check className="h-4 w-4 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
                {box.size
                  ? t(`מכנס תואם במידה ${box.size}`, `Matching shorts, size ${box.size}`)
                  : t('מכנס קצר תואם באותה מידה', 'Matching shorts, same size')}
              </li>
              <li className="flex items-center gap-2 text-[13px] text-brand-navy/70">
                <Check className="h-4 w-4 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
                {t('שם ומספר מאחורה', 'Name and number on the back')}
              </li>
            </ul>
          </div>
        )}
        <div className="grid grid-cols-1 gap-2 min-[440px]:grid-cols-2">
          {!kids && (
            <Extra checked={box.addName} onChange={v => onChange({ addName: v })}
              label={t('שם ומספר מאחורה', 'Name and number')} price={NAME_PRICE}
              hint={t('שחקן שמתאים לחולצה - גם הוא הפתעה', 'A player to match the shirt - a surprise too')} />
          )}
          <Extra checked={box.patches} onChange={v => onChange({ patches: v })}
            label={t("פאצ'ים", 'Patches')} price={freePatches ? 0 : PATCHES_PRICE} wasPrice={PATCHES_PRICE}
            hint={freePatches
              ? t('חינם בהזמנה הזו', 'Free on this order')
              : t('של הליגה והטורניר', 'League and tournament')} />
          {longSleeveAllowed(box) && (
            <Extra checked={box.longSleeve} onChange={v => onChange({ longSleeve: v })}
              label={LONG_SLEEVE_TEXT} price={EXTRA_PRICES.longSleeve}
              hint={t('אותה חולצה, שרוול ארוך', 'The same shirt, long sleeved')} />
          )}
          {shortsAllowed(box) && (
            <Extra checked={box.shorts} onChange={v => onChange({ shorts: v })}
              label={SHORTS_TEXT} price={EXTRA_PRICES.shorts}
              hint={box.size ? t(`מכנס תואם במידה ${box.size}`, `Matching shorts, size ${box.size}`) : t('מכנס תואם באותה מידה', 'Matching shorts, same size')} />
          )}
        </div>
      </div>

      {/* What to leave out. Per box, because a group of friends does not share
          a taste: one will not wear red, another does not want Maccabi. */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-brand-navy/70">
          <Ban className="h-4 w-4 text-brand-orange-ink" aria-hidden="true" />
          {t('מה לא לשלוח בבוקס הזה', "What not to send in this box")}
          <span className="font-normal text-brand-navy/40">{t('(לא חובה)', '(optional)')}</span>
        </p>
        <input id={fid('clubs')} value={box.excludeClubs} maxLength={200}
          onChange={e => onChange({ excludeClubs: e.target.value })}
          placeholder={t('קבוצות - למשל: ברצלונה, מכבי תל אביב', 'Teams - for example: Barcelona, Maccabi Tel Aviv')}
          aria-label={t('קבוצות שלא לשלוח', "Teams not to send")}
          className="shop-field" />
        <div role="group" aria-label={t('צבעים שלא לשלוח', 'Colours not to send')} className="mt-2 flex flex-wrap gap-1.5">
          {EXCLUDE_COLORS.map(c => {
            const off = box.excludeColors.includes(c.label);
            return (
              <button key={c.label} type="button" aria-pressed={off}
                onClick={() => onChange({
                  excludeColors: off
                    ? box.excludeColors.filter(x => x !== c.label)
                    : [...box.excludeColors, c.label],
                })}
                className={`shop-chip gap-1.5 text-[13px] ${off ? 'shop-chip-active' : ''}`}>
                <span className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-brand-navy/15" style={{ background: c.hex }} aria-hidden="true" />
                {t(c.label, c.en)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor={fid('note')} className="mb-1.5 block text-sm font-medium text-brand-navy/70">
          {t('הערה לבוקס הזה', 'A note for this box')} <span className="font-normal text-brand-navy/40">{t('(לא חובה)', '(optional)')}</span>
        </label>
        <input id={fid('note')} value={box.note} maxLength={200}
          onChange={e => onChange({ note: e.target.value })}
          placeholder={t('כל דבר שחשוב לדעת', 'Anything else worth knowing')}
          className="shop-field" />
      </div>
    </div>
  );
}

// `wasPrice` is what the extra costs when the order is not big enough to get
// it free: struck through beside the word, so the saving is visible rather than
// merely stated.
function Extra({ checked, onChange, label, price, wasPrice = 0, hint }) {
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3 transition ${
      checked ? 'border-brand-orange bg-brand-orange-soft ring-1 ring-inset ring-brand-orange' : 'border-brand-line bg-white hover:border-brand-navy/30'
    }`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-brand-orange" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-semibold text-brand-navy">{label}</span>
          <span className="flex flex-shrink-0 items-baseline gap-1.5 text-[13px] font-semibold tabular-nums">
            {price <= 0 && wasPrice > 0 && (
              <span className="font-normal text-brand-navy/40 line-through">₪{wasPrice}</span>
            )}
            <span className={price > 0 ? 'text-brand-orange-ink' : 'text-emerald-700 dark:text-emerald-400'}>
              {price > 0 ? `+₪${price}` : t('חינם', 'Free')}
            </span>
          </span>
        </span>
        <span className="mt-0.5 block text-[12px] text-brand-navy/55">{hint}</span>
      </span>
    </label>
  );
}
