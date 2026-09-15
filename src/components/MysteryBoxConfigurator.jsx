import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift, Check, ShoppingBag, Shirt, Sparkles, Ban, MessageSquare,
  ChevronLeft, ChevronRight, Pencil,
} from 'lucide-react';
import { addToCart, openCart, EXTRA_PRICES, LONG_SLEEVE_LABEL, SHORTS_LABEL } from '@/lib/cart';
import { BOX_TYPES, SIZES, NAME_PRICE, PATCHES_PRICE, MYSTERY_BOX_ID } from '@/lib/mysteryBox';

// Building a mystery box, one question at a time.
//
// It asks one question per step, in the order a person actually decides: what
// kind of shirt, then what size, then anything extra, then anything to rule
// out. Answered steps collapse into a one-line summary with an edit mark, so
// what you already chose stays visible and changeable; the total updates with
// each answer, so the price is never a surprise at the end.
//
// Steps 1 and 2 are required; 3 and 4 are optional and say so.

const TYPE_ICONS = { regular: Shirt, retro: Sparkles, mundial: Gift };

// Swatches rather than a text field: picking from a list is one tap, and it
// keeps the answers consistent enough for us to actually act on them.
//
// These stay literal hex values on purpose, and are the one exception the brand
// token check allows. They describe the colour of a shirt, not the colour of the
// site. 'כתום' being the same orange as the brand accent is a coincidence, and
// if the brand accent is ever changed, the orange shirt must stay orange.
const COLORS = [
  { label: 'אדום', hex: '#D32F2F' },
  { label: 'כחול', hex: '#1E4FA3' },
  { label: 'ירוק', hex: '#2E7D32' },
  { label: 'צהוב', hex: '#F2C300' },
  { label: 'שחור', hex: '#1A1A1A' },
  { label: 'לבן', hex: '#FFFFFF' },
  { label: 'כתום', hex: '#E8622A' },
  { label: 'סגול', hex: '#6A3DA8' },
  { label: 'ורוד', hex: '#E05A9B' },
];

const STEPS = [
  { id: 'type', title: 'איזה סגנון?', required: true },
  { id: 'size', title: 'איזו מידה?', required: true },
  { id: 'extras', title: 'תוספות', required: false },
  { id: 'exclude', title: 'מה לא לשלוח', required: false },
];

export default function MysteryBoxConfigurator({ idPrefix = 'mb', className = '', headerAction = null, size: scale = 'md' }) {
  const lg = scale === 'lg';

  const [step, setStep] = useState(0);
  const [type, setType] = useState('regular');
  const [size, setSize] = useState('');
  const [addName, setAddName] = useState(false);
  const [patches, setPatches] = useState(false);
  const [longSleeve, setLongSleeve] = useState(false);
  const [shorts, setShorts] = useState(false);
  const [excludeClubs, setExcludeClubs] = useState('');
  const [excludeColors, setExcludeColors] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const selected = BOX_TYPES.find(b => b.id === type);
  // Same rule as a catalogue shirt: retro comes without shorts.
  const shortsAllowed = type !== 'retro';
  const wantsShorts = shorts && shortsAllowed;
  const total = selected.price + (addName ? NAME_PRICE : 0) + (patches ? PATCHES_PRICE : 0)
    + (longSleeve ? EXTRA_PRICES.longSleeve : 0) + (wantsShorts ? EXTRA_PRICES.shorts : 0);

  // Two of these can be on the page at once, so field ids are per instance.
  const fid = (name) => `${idPrefix}-${name}`;

  const toggleColor = (label) => {
    setExcludeColors(prev => prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]);
  };

  // A step can only be left once its required answer exists. Returning to an
  // earlier step is always allowed.
  const canLeave = (index) => (index === 1 ? !!size : true);

  const goNext = () => {
    if (!canLeave(step)) { setError('בחרו מידה כדי להמשיך'); return; }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const goTo = (index) => {
    if (index > step && !canLeave(step)) { setError('בחרו מידה כדי להמשיך'); return; }
    setError('');
    setStep(index);
  };

  const handleAdd = () => {
    if (!size) { setError('בחרו מידה'); setStep(1); return; }
    setError('');

    const extras = [];
    if (addName) extras.push({ label: 'שם ומספר מאחורה (לבחירתנו)', price: NAME_PRICE });
    if (patches) extras.push({ label: 'כל הפאצ\'ים', price: PATCHES_PRICE });
    // The same words a catalogue shirt uses, so the supplier text reads them.
    if (longSleeve) extras.push({ label: LONG_SLEEVE_LABEL, price: EXTRA_PRICES.longSleeve });
    if (wantsShorts) extras.push({ label: `${SHORTS_LABEL} במידה ${size}`, price: EXTRA_PRICES.shorts });

    // Preferences carry no price, so they travel separately from `extras` —
    // but they still have to reach the order, or asking was theatre.
    const details = [];
    if (excludeClubs.trim()) details.push({ label: 'לא לשלוח קבוצות', value: excludeClubs.trim() });
    if (excludeColors.length) details.push({ label: 'לא לשלוח צבעים', value: excludeColors.join(', ') });
    if (notes.trim()) details.push({ label: 'הערות', value: notes.trim() });

    addToCart({
      shirtId: MYSTERY_BOX_ID,
      shirtName: `מיסטרי בוקס — ${selected.label}`,
      size,
      basePrice: selected.price,
      unitPrice: total,
      extras,
      details,
      deliveryNote: 'מיסטרי בוקס — נעדכן מה יצא לפני המשלוח',
    });

    // The cart drawer opens on the spot, so the customer sees the box went in
    // and can send the request from there.
    openCart();
  };

  // One-line recap of an answered step, shown when it is collapsed.
  const summaryOf = (id) => {
    if (id === 'type') return `${selected.label} · ₪${selected.price}`;
    if (id === 'size') return size || 'טרם נבחרה';
    if (id === 'extras') {
      const on = [addName && 'שם ומספר', patches && 'פאצ\'ים', longSleeve && LONG_SLEEVE_LABEL, wantsShorts && SHORTS_LABEL].filter(Boolean);
      return on.length ? on.join(' · ') : 'בלי תוספות';
    }
    const picked = [
      excludeClubs.trim() && 'קבוצות',
      excludeColors.length && `${excludeColors.length} צבעים`,
      notes.trim() && 'הערות',
    ].filter(Boolean);
    return picked.length ? picked.join(' · ') : 'בלי העדפות';
  };

  const isLast = step === STEPS.length - 1;
  const pad = lg ? 'px-5 sm:px-8' : 'px-5';

  return (
    <div className={`shop-card overflow-hidden ${className}`}>
      <div className={`flex items-center gap-3 pt-6 ${pad}`}>
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-brand-orange-ink">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className={`font-semibold text-brand-navy ${lg ? 'text-xl' : 'text-lg'}`}>בניית הבוקס</p>
        <span dir="ltr" className="ms-auto text-sm tabular-nums text-brand-navy/45">{step + 1}/{STEPS.length}</span>
        {headerAction}
      </div>

      {/* Progress. Answered steps stay reachable. */}
      <div className={`flex gap-1.5 pt-4 ${pad}`} dir="ltr">
        {STEPS.map((s, i) => (
          <button key={s.id} type="button" onClick={() => goTo(i)}
            aria-label={`שלב ${i + 1}: ${s.title}`}
            aria-current={i === step ? 'step' : undefined}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i === step ? 'bg-brand-orange' : i < step ? 'bg-brand-navy' : 'bg-brand-line'
            }`} />
        ))}
      </div>

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
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-brand-navy/45">לא חובה</span>
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
                            onClick={() => { setType(box.id); setStep(1); }}
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
                              <span className="text-base font-semibold text-brand-navy">{box.label}</span>
                              {active && <Check className="ms-auto h-5 w-5 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />}
                            </span>
                            <span className={`mt-3 block font-bold tabular-nums text-brand-navy ${lg ? 'text-2xl' : 'text-xl'}`}>₪{box.price}</span>
                            <span className="mt-1 block text-[13px] leading-relaxed text-brand-navy/55">{box.blurb}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {s.id === 'size' && (
                    <>
                      <div className={`grid gap-2 ${lg ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-3'}`}>
                        {SIZES.map(v => (
                          <button key={v} type="button"
                            onClick={() => { setSize(v); setError(''); setStep(2); }}
                            aria-pressed={size === v}
                            className={`shop-chip font-semibold tabular-nums ${lg ? 'min-h-[3rem] text-base' : ''} ${size === v ? 'shop-chip-active' : ''}`}>
                            <span dir="ltr">{v}</span>
                          </button>
                        ))}
                      </div>
                      <Link to="/size-guide" className="shop-link mt-3 text-sm">לא בטוחים? מדריך המידות</Link>
                    </>
                  )}

                  {s.id === 'extras' && (
                    <div className={lg ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'space-y-2.5'}>
                      {/* The name add-on has no text field on purpose: the shirt
                          is the surprise, so the print is too. */}
                      <Extra checked={addName} onChange={setAddName} label="שם ומספר מאחורה" price={NAME_PRICE}
                        hint="שחקן שמתאים לחולצה שתצא - גם הוא הפתעה" />
                      <Extra checked={patches} onChange={setPatches} label="כל הפאצ'ים" price={PATCHES_PRICE}
                        hint="פאצ'ים של הליגה והטורניר, לפי החולצה" />
                      <Extra checked={longSleeve} onChange={setLongSleeve} label={LONG_SLEEVE_LABEL} price={EXTRA_PRICES.longSleeve}
                        hint="אותה חולצה, עם שרוולים ארוכים" />
                      {shortsAllowed && (
                        <Extra checked={shorts} onChange={setShorts} label={SHORTS_LABEL} price={EXTRA_PRICES.shorts}
                          hint={size ? `מכנס תואם לחולצה, במידה ${size}` : 'מכנס תואם לחולצה, באותה מידה'} />
                      )}
                    </div>
                  )}

                  {s.id === 'exclude' && (
                    <>
                      <p className="mb-4 text-[13px] leading-relaxed text-brand-navy/55">
                        ההפתעה נשארת הפתעה, אבל אנחנו נמנע ממה שתסמנו כאן.
                      </p>

                      <label htmlFor={fid('clubs')} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-brand-navy/70">
                        <Ban className="h-4 w-4 text-brand-orange-ink" aria-hidden="true" />
                        קבוצות שלא תרצו לקבל
                      </label>
                      <input id={fid('clubs')} value={excludeClubs} maxLength={200}
                        onChange={e => setExcludeClubs(e.target.value)}
                        placeholder="למשל: ברצלונה, מכבי תל אביב"
                        className="shop-field" />

                      <p className="mb-2 mt-5 flex items-center gap-1.5 text-sm font-medium text-brand-navy/70">
                        <Ban className="h-4 w-4 text-brand-orange-ink" aria-hidden="true" />
                        צבעים שלא תרצו לקבל
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {COLORS.map(c => {
                          const off = excludeColors.includes(c.label);
                          return (
                            <button key={c.label} type="button" onClick={() => toggleColor(c.label)}
                              aria-pressed={off}
                              className={`shop-chip px-3.5 ${off ? 'border-brand-navy bg-brand-navy text-white line-through hover:border-brand-navy hover:text-white' : ''}`}>
                              <span className="h-4 w-4 flex-shrink-0 rounded-full ring-1 ring-brand-navy/20" style={{ background: c.hex }} aria-hidden="true" />
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                      {excludeColors.length > 0 && (
                        <p className="mt-2 text-[13px] text-brand-navy/60">
                          לא נשלח: <strong className="font-semibold text-brand-navy">{excludeColors.join(', ')}</strong>
                        </p>
                      )}

                      <label htmlFor={fid('notes')} className="mb-1.5 mt-5 flex items-center gap-1.5 text-sm font-medium text-brand-navy/70">
                        <MessageSquare className="h-4 w-4 text-brand-orange-ink" aria-hidden="true" />
                        הערות
                      </label>
                      <textarea id={fid('notes')} value={notes} maxLength={500} rows={3}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="ליגה שאתם מעדיפים, שחקן שתשמחו לקבל, מתנה למישהו. כל דבר שחשוב לכם."
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
                          חזרה
                        </button>
                      )}
                      <button type="button" onClick={goNext} className="shop-btn-dark ms-auto min-h-[2.75rem] px-5 text-sm">
                        {STEPS[step].required ? 'המשך' : 'דלג'}
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
          <Row label={`מיסטרי בוקס ${selected.label}`} value={selected.price} />
          {addName && <Row label="שם ומספר מאחורה" value={NAME_PRICE} />}
          {patches && <Row label="כל הפאצ'ים" value={PATCHES_PRICE} />}
          {longSleeve && <Row label={LONG_SLEEVE_LABEL} value={EXTRA_PRICES.longSleeve} />}
          {wantsShorts && <Row label={SHORTS_LABEL} value={EXTRA_PRICES.shorts} />}
          {size && <Row label="מידה" text={size} />}
        </div>

        <div className="mt-3 flex items-baseline justify-between border-t border-brand-line pt-3">
          <span className={`font-semibold text-brand-navy ${lg ? 'text-lg' : ''}`}>סה״כ</span>
          <span className={`font-bold tabular-nums text-brand-navy ${lg ? 'text-3xl' : 'text-2xl'}`}>₪{total}</span>
        </div>

        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

        <button type="button" onClick={handleAdd}
          className={`shop-btn mt-4 w-full ${lg ? 'min-h-[3.75rem] text-base' : ''} ${size ? '' : 'opacity-60 shadow-none'}`}>
          <ShoppingBag className={lg ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
          {size ? 'הוספה לסל' : 'בחרו מידה כדי להמשיך'}
        </button>
        <p className="mt-2 text-center text-xs text-brand-navy/50">
          בלי תשלום באתר, שליחת בקשה בלבד.
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
    <div className="flex items-center justify-between text-brand-navy/70">
      <span>{label}</span>
      <span dir={text ? 'ltr' : undefined} className="font-semibold tabular-nums text-brand-navy">{text ?? `₪${value}`}</span>
    </div>
  );
}
