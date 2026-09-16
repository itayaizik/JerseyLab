import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift, Check, ShoppingBag, Shirt, Sparkles, Ban, MessageSquare,
  ChevronLeft, ChevronRight, Pencil, Minus, Plus, CheckCircle2,
} from 'lucide-react';
import { addToCart, openCart, EXTRA_PRICES, LONG_SLEEVE_LABEL, SHORTS_LABEL } from '@/lib/cart';
import { BOX_TYPES, SIZES, NAME_PRICE, PATCHES_PRICE, MYSTERY_BOX_ID } from '@/lib/mysteryBox';
import { t } from '@/lib/i18n';

// Building mystery boxes, one question at a time.
//
// It asks one question per step, in the order a person actually decides: what
// kind of shirt, then what sizes, then anything extra, then anything to rule
// out. Answered steps collapse into a one-line summary with an edit mark, so
// what you already chose stays visible and changeable; the total updates with
// each answer, so the price is never a surprise at the end.
//
// Many people order together with friends, so the size step takes a count per
// size - two M and one XL is three boxes - and adding keeps the builder as it
// is, ready for the next round in another style.
//
// Steps 1 and 2 are required; 3 and 4 are optional and say so.
//
// What goes into the cart stays in Hebrew, since it becomes the order the
// owner reads; the English words travel beside it (labelEn) for the cart to
// show. Each box is its own cart item, exactly as if it were added alone.

const TYPE_ICONS = { regular: Shirt, retro: Sparkles, mundial: Gift };

// A group of friends, not a warehouse order.
const MAX_PER_SIZE = 20;

// Swatches rather than a text field: picking from a list is one tap, and it
// keeps the answers consistent enough for us to actually act on them.
//
// These stay literal hex values on purpose, and are the one exception the brand
// token check allows. They describe the colour of a shirt, not the colour of the
// site. 'כתום' being the same orange as the brand accent is a coincidence, and
// if the brand accent is ever changed, the orange shirt must stay orange.
const COLORS = [
  { label: 'אדום', en: 'Red', hex: '#D32F2F' },
  { label: 'כחול', en: 'Blue', hex: '#1E4FA3' },
  { label: 'ירוק', en: 'Green', hex: '#2E7D32' },
  { label: 'צהוב', en: 'Yellow', hex: '#F2C300' },
  { label: 'שחור', en: 'Black', hex: '#1A1A1A' },
  { label: 'לבן', en: 'White', hex: '#FFFFFF' },
  { label: 'כתום', en: 'Orange', hex: '#E8622A' },
  { label: 'סגול', en: 'Purple', hex: '#6A3DA8' },
  { label: 'ורוד', en: 'Pink', hex: '#E05A9B' },
];
const colorName = (label) => t(label, COLORS.find(c => c.label === label)?.en);

const STEPS = [
  { id: 'type', title: t('איזה סגנון?', 'Which style?'), required: true },
  { id: 'size', title: t('כמה ובאילו מידות?', 'How many, in which sizes?'), required: true },
  { id: 'extras', title: t('תוספות', 'Extras'), required: false },
  { id: 'exclude', title: t('מה לא לשלוח', 'What not to send'), required: false },
];

const LONG_SLEEVE_TEXT = t(LONG_SLEEVE_LABEL, 'Long sleeve');
const SHORTS_TEXT = t(SHORTS_LABEL, 'Shorts');

// "M ×2 · XL" - the chosen sizes in size order.
const sizesSummary = (counts) => SIZES
  .filter(s => counts[s] > 0)
  .map(s => (counts[s] > 1 ? `${s} ×${counts[s]}` : s))
  .join(' · ');

const boxesLabel = (n) => (n === 1 ? t('בוקס אחד', '1 box') : t(`${n} בוקסים`, `${n} boxes`));

export default function MysteryBoxConfigurator({ idPrefix = 'mb', className = '', headerAction = null, size: scale = 'md' }) {
  const lg = scale === 'lg';

  const [step, setStep] = useState(0);
  const [type, setType] = useState('regular');
  const [counts, setCounts] = useState({});
  const [addName, setAddName] = useState(false);
  const [patches, setPatches] = useState(false);
  const [longSleeve, setLongSleeve] = useState(false);
  const [shorts, setShorts] = useState(false);
  const [excludeClubs, setExcludeClubs] = useState('');
  const [excludeColors, setExcludeColors] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  // What the last press of the button put in the cart, shown until the next
  // change so it is clear the boxes went in and more can follow.
  const [lastAdded, setLastAdded] = useState(null);

  const selected = BOX_TYPES.find(b => b.id === type);
  const selectedLabel = t(selected.label, selected.labelEn);
  // Same rule as a catalogue shirt: retro comes without shorts.
  const shortsAllowed = type !== 'retro';
  const wantsShorts = shorts && shortsAllowed;
  const boxCount = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const perBox = selected.price + (addName ? NAME_PRICE : 0) + (patches ? PATCHES_PRICE : 0)
    + (longSleeve ? EXTRA_PRICES.longSleeve : 0) + (wantsShorts ? EXTRA_PRICES.shorts : 0);
  const total = perBox * boxCount;

  // Two of these can be on the page at once, so field ids are per instance.
  const fid = (name) => `${idPrefix}-${name}`;

  // Any change starts a new round, so the note about the last one goes away.
  const touched = () => setLastAdded(null);

  const changeCount = (size, delta) => {
    touched();
    setError('');
    setCounts(prev => {
      const next = Math.min(MAX_PER_SIZE, Math.max(0, (prev[size] || 0) + delta));
      const copy = { ...prev };
      if (next) copy[size] = next; else delete copy[size];
      return copy;
    });
  };

  const toggleColor = (label) => {
    touched();
    setExcludeColors(prev => prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]);
  };

  const sizeError = t('בחרו לפחות מידה אחת', 'Choose at least one size');

  // A step can only be left once its required answer exists. Returning to an
  // earlier step is always allowed.
  const canLeave = (index) => (index === 1 ? boxCount > 0 : true);

  const goNext = () => {
    if (!canLeave(step)) { setError(sizeError); return; }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const goTo = (index) => {
    if (index > step && !canLeave(step)) { setError(sizeError); return; }
    setError('');
    setStep(index);
  };

  const handleAdd = () => {
    if (!boxCount) { setError(sizeError); setStep(1); return; }
    setError('');

    const extrasFor = (size) => {
      const extras = [];
      if (addName) extras.push({ label: 'שם ומספר מאחורה (לבחירתנו)', labelEn: 'Name and number on the back (our pick)', price: NAME_PRICE });
      if (patches) extras.push({ label: 'כל הפאצ\'ים', labelEn: 'All patches', price: PATCHES_PRICE });
      // The same words a catalogue shirt uses, so the supplier text reads them.
      if (longSleeve) extras.push({ label: LONG_SLEEVE_LABEL, labelEn: 'Long sleeve', price: EXTRA_PRICES.longSleeve });
      if (wantsShorts) extras.push({ label: `${SHORTS_LABEL} במידה ${size}`, labelEn: `Shorts, size ${size}`, price: EXTRA_PRICES.shorts });
      return extras;
    };

    // Preferences carry no price, so they travel separately from `extras` —
    // but they still have to reach the order, or asking was theatre.
    const details = [];
    if (excludeClubs.trim()) details.push({ label: 'לא לשלוח קבוצות', labelEn: "Don't send teams", value: excludeClubs.trim() });
    if (excludeColors.length) {
      details.push({
        label: 'לא לשלוח צבעים', labelEn: "Don't send colours",
        value: excludeColors.join(', '),
        valueEn: excludeColors.map(c => COLORS.find(x => x.label === c)?.en || c).join(', '),
      });
    }
    if (notes.trim()) details.push({ label: 'הערות', labelEn: 'Notes', value: notes.trim() });

    SIZES.forEach(size => {
      for (let i = 0; i < (counts[size] || 0); i++) {
        addToCart({
          shirtId: MYSTERY_BOX_ID,
          shirtName: `מיסטרי בוקס — ${selected.label}`,
          shirtNameEn: `Mystery Box — ${selected.labelEn}`,
          size,
          basePrice: selected.price,
          unitPrice: perBox,
          extras: extrasFor(size),
          details,
          deliveryNote: 'מיסטרי בוקס — נעדכן מה יצא לפני המשלוח',
          deliveryNoteEn: "Mystery Box — we'll tell you what came out before it ships",
        });
      }
    });

    // The builder stays as it is, so the next round - another style, other
    // sizes - is a couple of taps; only the sizes are cleared, so the same
    // boxes are not added twice by accident.
    setLastAdded({ count: boxCount, label: selectedLabel, sizes: sizesSummary(counts) });
    setCounts({});
    setStep(0);
  };

  // One-line recap of an answered step, shown when it is collapsed.
  const summaryOf = (id) => {
    if (id === 'type') return `${selectedLabel} · ₪${selected.price}`;
    if (id === 'size') return boxCount ? `${boxesLabel(boxCount)} · ${sizesSummary(counts)}` : t('טרם נבחרו', 'None chosen yet');
    if (id === 'extras') {
      const on = [
        addName && t('שם ומספר', 'Name and number'),
        patches && t('פאצ\'ים', 'Patches'),
        longSleeve && LONG_SLEEVE_TEXT,
        wantsShorts && SHORTS_TEXT,
      ].filter(Boolean);
      return on.length ? on.join(' · ') : t('בלי תוספות', 'No extras');
    }
    const picked = [
      excludeClubs.trim() && t('קבוצות', 'Teams'),
      excludeColors.length && t(`${excludeColors.length} צבעים`, `${excludeColors.length} colours`),
      notes.trim() && t('הערות', 'Notes'),
    ].filter(Boolean);
    return picked.length ? picked.join(' · ') : t('בלי העדפות', 'No preferences');
  };

  const isLast = step === STEPS.length - 1;
  const pad = lg ? 'px-5 sm:px-8' : 'px-5';

  return (
    <div className={`shop-card overflow-hidden ${className}`}>
      <div className={`flex items-center gap-3 pt-6 ${pad}`}>
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-brand-orange-ink">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className={`font-semibold text-brand-navy ${lg ? 'text-xl' : 'text-lg'}`}>{t('בניית הבוקס', 'Build your box')}</p>
        <span dir="ltr" className="ms-auto text-sm tabular-nums text-brand-navy/45">{step + 1}/{STEPS.length}</span>
        {headerAction}
      </div>

      {/* Progress. Answered steps stay reachable. */}
      <div className={`flex gap-1.5 pt-4 ${pad}`} dir="ltr">
        {STEPS.map((s, i) => (
          <button key={s.id} type="button" onClick={() => goTo(i)}
            aria-label={t(`שלב ${i + 1}: ${s.title}`, `Step ${i + 1}: ${s.title}`)}
            aria-current={i === step ? 'step' : undefined}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i === step ? 'bg-brand-orange' : i < step ? 'bg-brand-navy' : 'bg-brand-line'
            }`} />
        ))}
      </div>

      {lastAdded && (
        <div role="status" className={`mt-4 ${pad}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              {t(
                `נוספו לסל ${boxesLabel(lastAdded.count)} ${lastAdded.label} (${lastAdded.sizes}). רוצים עוד? בחרו סגנון ומידות והוסיפו.`,
                `Added ${boxesLabel(lastAdded.count)} ${lastAdded.label} (${lastAdded.sizes}) to your cart. Want more? Pick a style and sizes and add again.`,
              )}
            </span>
            <button type="button" onClick={openCart} className="font-semibold underline underline-offset-2">
              {t('לסל', 'View cart')}
            </button>
          </div>
        </div>
      )}

      <div className={`space-y-2.5 py-6 ${pad}`}>
        {STEPS.map((s, i) => {
          const open = i === step;
          const done = i < step;

          return (
            <div key={s.id} className={`overflow-hidden rounded-2xl transition ${open ? 'ring-1 ring-brand-line' : ''}`}>
              <button type="button" onClick={() => goTo(i)} aria-expanded={open}
                className={`flex min-h-[3.5rem] w-full items-center gap-3 px-4 text-start transition ${open ? 'bg-white' : 'bg-brand-mist hover:bg-brand-mist-dark'}`}>
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  open ? 'bg-brand-orange text-white' : done ? 'bg-brand-navy text-white' : 'bg-white text-brand-navy/50'
                }`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="text-[15px] font-semibold text-brand-navy">{s.title}</span>
                {!s.required && !open && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-brand-navy/45">{t('לא חובה', 'Optional')}</span>
                )}
                {!open && (
                  <span className="ms-auto flex min-w-0 items-center gap-1.5 text-[13px] text-brand-navy/60">
                    <span className="truncate">{summaryOf(s.id)}</span>
                    <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
                  </span>
                )}
              </button>

              {open && (
                <div className="px-4 pb-4 pt-1">
                  {s.id === 'type' && (
                    <div className={lg ? 'grid grid-cols-1 gap-3 sm:grid-cols-3' : 'space-y-2.5'}>
                      {BOX_TYPES.map(box => {
                        const active = type === box.id;
                        const Icon = TYPE_ICONS[box.id];
                        return (
                          <button key={box.id} type="button"
                            onClick={() => { setType(box.id); touched(); setStep(1); }}
                            aria-pressed={active}
                            className={`w-full rounded-2xl border text-start transition ${lg ? 'p-5' : 'p-4'} ${
                              active
                                ? 'border-brand-orange bg-brand-orange-soft ring-1 ring-inset ring-brand-orange'
                                : 'border-brand-line bg-white hover:border-brand-navy/30'
                            }`}>
                            <span className="flex items-center gap-2.5">
                              <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${active ? 'bg-white text-brand-orange-ink' : 'bg-brand-mist text-brand-navy'}`}>
                                <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
                              </span>
                              <span className="text-base font-semibold text-brand-navy">{t(box.label, box.labelEn)}</span>
                              {active && <Check className="ms-auto h-5 w-5 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />}
                            </span>
                            <span className={`mt-3 block font-bold tabular-nums text-brand-navy ${lg ? 'text-2xl' : 'text-xl'}`}>₪{box.price}</span>
                            <span className="mt-1 block text-[13px] leading-relaxed text-brand-navy/55">{t(box.blurb, box.blurbEn)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {s.id === 'size' && (
                    <>
                      <p className="mb-3 text-[13px] leading-relaxed text-brand-navy/55">
                        {t('מזמינים לכמה אנשים? בחרו כמה בוקסים בכל מידה. כל בוקס הוא חולצה אחרת.', 'Ordering for a few people? Choose how many boxes in each size. Every box is a different shirt.')}
                      </p>
                      {/* One size per row on a phone: a count and two buttons do not fit in
                          half the width of a small screen. */}
                      <div className={`grid gap-2 ${lg ? 'grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 min-[440px]:grid-cols-2'}`}>
                        {SIZES.map(v => {
                          const n = counts[v] || 0;
                          return (
                            <div key={v}
                              className={`flex items-center justify-between gap-2 rounded-2xl border p-1.5 transition ${n ? 'border-brand-orange bg-brand-orange-soft' : 'border-brand-line bg-white'}`}>
                              <button type="button" onClick={() => changeCount(v, 1)}
                                aria-label={t(`הוספת בוקס במידה ${v}`, `Add a box in size ${v}`)}
                                className="flex min-h-[2.75rem] min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 text-start">
                                <span dir="ltr" className="text-base font-bold tabular-nums text-brand-navy">{v}</span>
                                {n > 0 && (
                                  <span className="rounded-full bg-brand-orange px-2 py-0.5 text-xs font-bold tabular-nums text-white">×{n}</span>
                                )}
                              </button>
                              <span className="flex items-center gap-1">
                                <button type="button" onClick={() => changeCount(v, -1)} disabled={!n}
                                  aria-label={t(`הורדת בוקס במידה ${v}`, `Remove a box in size ${v}`)}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-navy transition hover:bg-white disabled:opacity-25">
                                  <Minus className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <button type="button" onClick={() => changeCount(v, 1)} disabled={n >= MAX_PER_SIZE}
                                  aria-label={t(`הוספת בוקס במידה ${v}`, `Add a box in size ${v}`)}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-navy text-white transition hover:bg-brand-navy-light disabled:opacity-25">
                                  <Plus className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <Link to="/size-guide" className="shop-link text-sm">{t('לא בטוחים? מדריך המידות', 'Not sure? See the size guide')}</Link>
                        {boxCount > 0 && (
                          <button type="button" onClick={() => { setCounts({}); touched(); }} className="text-sm text-brand-navy/55 underline-offset-2 hover:underline">
                            {t('איפוס', 'Clear')}
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {s.id === 'extras' && (
                    <>
                      {boxCount > 1 && (
                        <p className="mb-3 text-[13px] text-brand-navy/55">
                          {t(`התוספות חלות על כל ${boxCount} הבוקסים. רוצים תוספות שונות? הוסיפו לסל ובנו עוד סבב.`,
                            `Extras apply to all ${boxCount} boxes. Want different extras? Add these to the cart and build another round.`)}
                        </p>
                      )}
                      <div className={lg ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'space-y-2.5'}>
                        {/* The name add-on has no text field on purpose: the shirt
                            is the surprise, so the print is too. */}
                        <Extra checked={addName} onChange={v => { setAddName(v); touched(); }} label={t('שם ומספר מאחורה', 'Name and number on the back')} price={NAME_PRICE}
                          hint={t('שחקן שמתאים לחולצה שתצא - גם הוא הפתעה', 'A player to match the shirt that comes out - a surprise too')} />
                        <Extra checked={patches} onChange={v => { setPatches(v); touched(); }} label={t("כל הפאצ'ים", 'All patches')} price={PATCHES_PRICE}
                          hint={t("פאצ'ים של הליגה והטורניר, לפי החולצה", 'League and tournament patches, to match the shirt')} />
                        <Extra checked={longSleeve} onChange={v => { setLongSleeve(v); touched(); }} label={LONG_SLEEVE_TEXT} price={EXTRA_PRICES.longSleeve}
                          hint={t('אותה חולצה, עם שרוולים ארוכים', 'The same shirt, with long sleeves')} />
                        {shortsAllowed && (
                          <Extra checked={shorts} onChange={v => { setShorts(v); touched(); }} label={SHORTS_TEXT} price={EXTRA_PRICES.shorts}
                            hint={t('מכנס תואם לחולצה, באותה מידה של כל בוקס', 'Matching shorts, in the same size as each box')} />
                        )}
                      </div>
                    </>
                  )}

                  {s.id === 'exclude' && (
                    <>
                      <p className="mb-4 text-[13px] leading-relaxed text-brand-navy/55">
                        {t('ההפתעה נשארת הפתעה, אבל אנחנו נמנע ממה שתסמנו כאן.', "The surprise stays a surprise, but we'll avoid whatever you mark here.")}
                      </p>

                      <label htmlFor={fid('clubs')} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-brand-navy/70">
                        <Ban className="h-4 w-4 text-brand-orange-ink" aria-hidden="true" />
                        {t('קבוצות שלא תרצו לקבל', "Teams you don't want")}
                      </label>
                      <input id={fid('clubs')} value={excludeClubs} maxLength={200}
                        onChange={e => { setExcludeClubs(e.target.value); touched(); }}
                        placeholder={t('למשל: ברצלונה, מכבי תל אביב', 'For example: Barcelona, Maccabi Tel Aviv')}
                        className="shop-field" />

                      <p className="mb-2 mt-5 flex items-center gap-1.5 text-sm font-medium text-brand-navy/70">
                        <Ban className="h-4 w-4 text-brand-orange-ink" aria-hidden="true" />
                        {t('צבעים שלא תרצו לקבל', "Colours you don't want")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {COLORS.map(c => {
                          const off = excludeColors.includes(c.label);
                          return (
                            <button key={c.label} type="button" onClick={() => toggleColor(c.label)}
                              aria-pressed={off}
                              className={`shop-chip px-3.5 ${off ? 'border-brand-navy bg-brand-navy text-white line-through hover:border-brand-navy hover:text-white' : ''}`}>
                              <span className="h-4 w-4 flex-shrink-0 rounded-full ring-1 ring-brand-navy/20" style={{ background: c.hex }} aria-hidden="true" />
                              {t(c.label, c.en)}
                            </button>
                          );
                        })}
                      </div>
                      {excludeColors.length > 0 && (
                        <p className="mt-2 text-[13px] text-brand-navy/60">
                          {t('לא נשלח:', "We won't send:")} <strong className="font-semibold text-brand-navy">{excludeColors.map(colorName).join(', ')}</strong>
                        </p>
                      )}

                      <label htmlFor={fid('notes')} className="mb-1.5 mt-5 flex items-center gap-1.5 text-sm font-medium text-brand-navy/70">
                        <MessageSquare className="h-4 w-4 text-brand-orange-ink" aria-hidden="true" />
                        {t('הערות', 'Notes')}
                      </label>
                      <textarea id={fid('notes')} value={notes} maxLength={500} rows={3}
                        onChange={e => { setNotes(e.target.value); touched(); }}
                        placeholder={t('ליגה שאתם מעדיפים, שחקן שתשמחו לקבל, מתנה למישהו. כל דבר שחשוב לכם.', "A league you prefer, a player you'd love, a gift for someone. Anything that matters to you.")}
                        className="shop-field resize-none py-3" />
                      <p dir="ltr" className="mt-1 text-right text-[11px] tabular-nums text-brand-navy/40">{notes.length}/500</p>
                    </>
                  )}

                  {/* Step navigation. The last step has no "next" — the order
                      button below is the next thing to press. */}
                  {!isLast && (
                    <div className="mt-5 flex items-center gap-2 border-t border-brand-line pt-4">
                      {step > 0 && (
                        <button type="button" onClick={() => goTo(step - 1)} className="shop-link px-2 text-sm">
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          {t('חזרה', 'Back')}
                        </button>
                      )}
                      <button type="button" onClick={goNext} className="shop-btn-dark ms-auto min-h-[2.75rem] px-5 text-sm">
                        {STEPS[step].required ? t('המשך', 'Continue') : t('דלג', 'Skip')}
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className={`border-t border-brand-line bg-brand-mist/60 py-6 ${pad}`}>
        <div className="space-y-1.5 text-sm">
          <Row label={t(`מיסטרי בוקס ${selected.label}`, `Mystery Box ${selected.labelEn}`)} value={selected.price} />
          {addName && <Row label={t('שם ומספר מאחורה', 'Name and number on the back')} value={NAME_PRICE} />}
          {patches && <Row label={t("כל הפאצ'ים", 'All patches')} value={PATCHES_PRICE} />}
          {longSleeve && <Row label={LONG_SLEEVE_TEXT} value={EXTRA_PRICES.longSleeve} />}
          {wantsShorts && <Row label={SHORTS_TEXT} value={EXTRA_PRICES.shorts} />}
          {boxCount > 1 && <Row label={t('לבוקס', 'Per box')} value={perBox} />}
          {boxCount > 0 && <Row label={t('כמות', 'Boxes')} text={`${boxCount} · ${sizesSummary(counts)}`} />}
        </div>

        <div className="mt-3 flex items-baseline justify-between border-t border-brand-line pt-3">
          <span className={`font-semibold text-brand-navy ${lg ? 'text-lg' : ''}`}>{t('סה״כ', 'Total')}</span>
          <span className={`font-bold tabular-nums text-brand-navy ${lg ? 'text-3xl' : 'text-2xl'}`}>₪{boxCount ? total : perBox}</span>
        </div>

        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

        <button type="button" onClick={handleAdd}
          className={`shop-btn mt-4 w-full ${lg ? 'min-h-[3.75rem] text-base' : ''} ${boxCount ? '' : 'opacity-60 shadow-none'}`}>
          <ShoppingBag className={lg ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
          {boxCount === 0
            ? t('בחרו מידות כדי להמשיך', 'Choose sizes to continue')
            : boxCount === 1
              ? t('הוספה לסל', 'Add to cart')
              : t(`הוספת ${boxCount} בוקסים לסל`, `Add ${boxCount} boxes to cart`)}
        </button>
        <p className="mt-2 text-center text-xs text-brand-navy/50">
          {t('בלי תשלום באתר, שליחת בקשה בלבד.', 'No payment on the site - you only send a request.')}
        </p>
      </div>
    </div>
  );
}

function Extra({ checked, onChange, label, price, hint }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
      checked ? 'border-brand-orange bg-brand-orange-soft ring-1 ring-inset ring-brand-orange' : 'border-brand-line bg-white hover:border-brand-navy/30'
    }`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-brand-orange" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold text-brand-navy">{label}</span>
          <span className="flex-shrink-0 text-sm font-semibold tabular-nums text-brand-orange-ink">+₪{price}</span>
        </span>
        <span className="mt-0.5 block text-[13px] text-brand-navy/55">{hint}</span>
      </span>
    </label>
  );
}

function Row({ label, value, text }) {
  return (
    <div className="flex items-center justify-between gap-3 text-brand-navy/70">
      <span>{label}</span>
      <span dir={text ? 'ltr' : undefined} className="font-semibold tabular-nums text-brand-navy">{text ?? `₪${value}`}</span>
    </div>
  );
}
