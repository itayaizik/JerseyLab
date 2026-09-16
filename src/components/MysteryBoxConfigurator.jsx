import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift, Check, ShoppingBag, Shirt, Sparkles, Ban, MessageSquare,
  Plus, Copy, Trash2, ChevronDown, CheckCircle2, User,
} from 'lucide-react';
import { addToCart, openCart, EXTRA_PRICES, LONG_SLEEVE_LABEL, SHORTS_LABEL } from '@/lib/cart';
import { BOX_TYPES, SIZES, NAME_PRICE, PATCHES_PRICE, MYSTERY_BOX_ID } from '@/lib/mysteryBox';
import { t } from '@/lib/i18n';

// Building mystery boxes - one, or a whole group's worth.
//
// Friends order together, and they do not all want the same thing: one wants
// shorts, another a name on the back, a third a retro shirt. So every box is
// its own card with its own style, size and extras, and a name saying who it
// is for, which travels with the order. A box can be copied, so ten boxes that
// differ only in size take ten taps rather than ten forms.
//
// One card is open at a time; the rest collapse to a line with their choices
// and price. What to leave out (teams, colours, notes) is asked once, for the
// whole order, with a note per box for anything personal.
//
// What goes into the cart stays in Hebrew, since it becomes the order the
// owner reads; the English words travel beside it (labelEn) for the cart to
// show. Each box is its own cart item.
//
// The shirt is a surprise until the box is opened, so nothing here promises to
// say what came out.

const TYPE_ICONS = { regular: Shirt, retro: Sparkles, mundial: Gift };
const MAX_BOXES = 30;

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

const LONG_SLEEVE_TEXT = t(LONG_SLEEVE_LABEL, 'Long sleeve');
const SHORTS_TEXT = t(SHORTS_LABEL, 'Shorts');

let nextId = 1;
const newBox = (from) => ({
  id: nextId++,
  forWhom: '',
  type: from?.type || 'regular',
  size: '',
  addName: false,
  patches: false,
  longSleeve: false,
  shorts: false,
  note: '',
});

const typeOf = (box) => BOX_TYPES.find(b => b.id === box.type) || BOX_TYPES[0];
// Same rule as a catalogue shirt: retro comes without shorts.
const shortsAllowed = (box) => box.type !== 'retro';
const wantsShorts = (box) => box.shorts && shortsAllowed(box);

const boxPrice = (box) => typeOf(box).price
  + (box.addName ? NAME_PRICE : 0)
  + (box.patches ? PATCHES_PRICE : 0)
  + (box.longSleeve ? EXTRA_PRICES.longSleeve : 0)
  + (wantsShorts(box) ? EXTRA_PRICES.shorts : 0);

const boxTitle = (box, i) => box.forWhom.trim() || t(`בוקס ${i + 1}`, `Box ${i + 1}`);

// "רגיל · L · שם ומספר · מכנס קצר"
function boxSummary(box) {
  const type = typeOf(box);
  return [
    t(type.label, type.labelEn),
    box.size || t('בלי מידה', 'No size yet'),
    box.addName && t('שם ומספר', 'Name and number'),
    box.patches && t("פאצ'ים", 'Patches'),
    box.longSleeve && LONG_SLEEVE_TEXT,
    wantsShorts(box) && SHORTS_TEXT,
  ].filter(Boolean).join(' · ');
}

const boxesLabel = (n) => (n === 1 ? t('בוקס אחד', '1 box') : t(`${n} בוקסים`, `${n} boxes`));

export default function MysteryBoxConfigurator({ idPrefix = 'mb', className = '', headerAction = null, size: scale = 'md' }) {
  const lg = scale === 'lg';

  const [boxes, setBoxes] = useState(() => [newBox()]);
  const [openId, setOpenId] = useState(() => null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [excludeClubs, setExcludeClubs] = useState('');
  const [excludeColors, setExcludeColors] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [missingSize, setMissingSize] = useState([]);
  // What the last press of the button put in the cart, shown until the next
  // change so it is clear the boxes went in and more can follow.
  const [lastAdded, setLastAdded] = useState(null);

  // The first box starts open.
  const currentOpen = openId ?? boxes[0]?.id;

  // Two of these can be on the page at once, so field ids are per instance.
  const fid = (name) => `${idPrefix}-${name}`;

  const touched = () => { setLastAdded(null); setError(''); };

  const update = (id, patch) => {
    touched();
    setBoxes(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)));
    if (patch.size) setMissingSize(prev => prev.filter(x => x !== id));
  };

  const addBox = (copyOf) => {
    if (boxes.length >= MAX_BOXES) return;
    touched();
    const last = boxes[boxes.length - 1];
    const box = copyOf ? { ...copyOf, id: nextId++, forWhom: '', note: '' } : newBox(last);
    setBoxes(prev => {
      if (!copyOf) return [...prev, box];
      const at = prev.findIndex(b => b.id === copyOf.id);
      return [...prev.slice(0, at + 1), box, ...prev.slice(at + 1)];
    });
    setOpenId(box.id);
  };

  const removeBox = (id) => {
    touched();
    setBoxes(prev => (prev.length > 1 ? prev.filter(b => b.id !== id) : prev));
    if (currentOpen === id) setOpenId(null);
  };

  const toggleColor = (label) => {
    touched();
    setExcludeColors(prev => prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]);
  };

  const total = boxes.reduce((sum, b) => sum + boxPrice(b), 0);
  const count = boxes.length;

  const handleAdd = () => {
    const noSize = boxes.filter(b => !b.size).map(b => b.id);
    if (noSize.length) {
      setMissingSize(noSize);
      setOpenId(noSize[0]);
      setError(noSize.length === 1
        ? t('חסרה מידה לאחד הבוקסים', 'One of the boxes has no size')
        : t(`חסרה מידה ל-${noSize.length} בוקסים`, `${noSize.length} boxes have no size`));
      return;
    }
    setError('');

    // Preferences for the whole order, carried by every box: they carry no
    // price, but they have to reach the order, or asking was theatre.
    const shared = [];
    if (excludeClubs.trim()) shared.push({ label: 'לא לשלוח קבוצות', labelEn: "Don't send teams", value: excludeClubs.trim() });
    if (excludeColors.length) {
      shared.push({
        label: 'לא לשלוח צבעים', labelEn: "Don't send colours",
        value: excludeColors.join(', '),
        valueEn: excludeColors.map(c => COLORS.find(x => x.label === c)?.en || c).join(', '),
      });
    }
    if (notes.trim()) shared.push({ label: 'הערות', labelEn: 'Notes', value: notes.trim() });

    boxes.forEach(box => {
      const type = typeOf(box);
      const extras = [];
      if (box.addName) extras.push({ label: 'שם ומספר מאחורה (לבחירתנו)', labelEn: 'Name and number on the back (our pick)', price: NAME_PRICE });
      if (box.patches) extras.push({ label: 'כל הפאצ\'ים', labelEn: 'All patches', price: PATCHES_PRICE });
      // The same words a catalogue shirt uses, so the supplier text reads them.
      if (box.longSleeve) extras.push({ label: LONG_SLEEVE_LABEL, labelEn: 'Long sleeve', price: EXTRA_PRICES.longSleeve });
      if (wantsShorts(box)) extras.push({ label: `${SHORTS_LABEL} במידה ${box.size}`, labelEn: `Shorts, size ${box.size}`, price: EXTRA_PRICES.shorts });

      const details = [];
      if (box.forWhom.trim()) details.push({ label: 'עבור', labelEn: 'For', value: box.forWhom.trim() });
      if (box.note.trim()) details.push({ label: 'הערה לבוקס', labelEn: 'Note for this box', value: box.note.trim() });

      addToCart({
        shirtId: MYSTERY_BOX_ID,
        shirtName: `מיסטרי בוקס — ${type.label}`,
        shirtNameEn: `Mystery Box — ${type.labelEn}`,
        size: box.size,
        basePrice: type.price,
        unitPrice: boxPrice(box),
        extras,
        details: [...details, ...shared],
        deliveryNote: 'מיסטרי בוקס — הפתעה עד הפתיחה',
        deliveryNoteEn: 'Mystery Box — a surprise until you open it',
      });
    });

    // A fresh start for the next round, in the style used last; the order-wide
    // preferences stay, since the same group is usually still ordering.
    const fresh = newBox(boxes[boxes.length - 1]);
    setLastAdded({ count, names: boxes.map(b => b.forWhom.trim()).filter(Boolean) });
    setBoxes([fresh]);
    setOpenId(fresh.id);
    setMissingSize([]);
  };

  const pad = lg ? 'px-5 sm:px-8' : 'px-5';

  return (
    <div className={`shop-card overflow-hidden ${className}`}>
      <div className={`flex items-center gap-3 pt-6 ${pad}`}>
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-brand-orange-ink">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={`font-semibold text-brand-navy ${lg ? 'text-xl' : 'text-lg'}`}>{t('בניית הבוקסים', 'Build your boxes')}</p>
          <p className="text-[13px] text-brand-navy/55">
            {t('מזמינים לכמה אנשים? לכל בוקס סגנון, מידה ותוספות משלו.', 'Ordering for a few people? Every box gets its own style, size and extras.')}
          </p>
        </div>
        {headerAction && <span className="ms-auto">{headerAction}</span>}
      </div>

      {lastAdded && (
        <div role="status" className={`mt-4 ${pad}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              {t(`נוספו לסל ${boxesLabel(lastAdded.count)}`, `Added ${boxesLabel(lastAdded.count)} to your cart`)}
              {lastAdded.names.length > 0 && ` (${lastAdded.names.join(', ')})`}
              {t('. רוצים עוד? בנו כאן ותוסיפו.', '. Want more? Build them here and add.')}
            </span>
            <button type="button" onClick={openCart} className="font-semibold underline underline-offset-2">
              {t('לסל', 'View cart')}
            </button>
          </div>
        </div>
      )}

      <ol className={`space-y-2.5 py-5 ${pad}`}>
        {boxes.map((box, i) => {
          const open = box.id === currentOpen;
          const type = typeOf(box);
          const missing = missingSize.includes(box.id);
          return (
            <li key={box.id} className={`overflow-hidden rounded-2xl border transition ${open ? 'border-brand-line ring-1 ring-brand-line' : missing ? 'border-red-300' : 'border-transparent'}`}>
              {/* Collapsed line: who it is for, what it is, what it costs. */}
              <div className={`flex items-center gap-2 ${open ? 'bg-white' : 'bg-brand-mist'}`}>
                <button type="button" onClick={() => setOpenId(open ? -1 : box.id)} aria-expanded={open}
                  className="flex min-h-[3.75rem] min-w-0 flex-1 items-center gap-3 ps-4 text-start">
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${open ? 'bg-brand-orange text-white' : 'bg-brand-navy text-white'}`}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-brand-navy">{boxTitle(box, i)}</span>
                    <span className={`block truncate text-[12px] ${missing ? 'text-red-600' : 'text-brand-navy/55'}`}>{boxSummary(box)}</span>
                  </span>
                  <span className="flex-shrink-0 text-[15px] font-semibold tabular-nums text-brand-navy">₪{boxPrice(box)}</span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 text-brand-navy/40 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                <span className="flex flex-shrink-0 items-center pe-2">
                  <button type="button" onClick={() => addBox(box)} disabled={count >= MAX_BOXES}
                    aria-label={t(`שכפול ${boxTitle(box, i)}`, `Copy ${boxTitle(box, i)}`)} title={t('שכפול', 'Copy')}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-navy/55 transition hover:bg-brand-mist-dark hover:text-brand-navy disabled:opacity-30">
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {count > 1 && (
                    <button type="button" onClick={() => removeBox(box.id)}
                      aria-label={t(`הסרת ${boxTitle(box, i)}`, `Remove ${boxTitle(box, i)}`)} title={t('הסרה', 'Remove')}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-navy/55 transition hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </span>
              </div>

              {open && (
                <div className="space-y-5 bg-white px-4 pb-5 pt-2">
                  <div>
                    <label htmlFor={fid(`who-${box.id}`)} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-brand-navy/70">
                      <User className="h-4 w-4 text-brand-orange-ink" aria-hidden="true" />
                      {t('למי הבוקס?', 'Who is this box for?')}
                      <span className="font-normal text-brand-navy/40">{t('(לא חובה)', '(optional)')}</span>
                    </label>
                    <input id={fid(`who-${box.id}`)} value={box.forWhom} maxLength={40}
                      onChange={e => update(box.id, { forWhom: e.target.value })}
                      placeholder={t('למשל: דני', 'For example: Danny')}
                      className="shop-field" />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-brand-navy/70">{t('סגנון', 'Style')}</p>
                    <div role="group" className="grid grid-cols-3 gap-2">
                      {BOX_TYPES.map(option => {
                        const active = box.type === option.id;
                        const Icon = TYPE_ICONS[option.id];
                        return (
                          <button key={option.id} type="button" aria-pressed={active}
                            onClick={() => update(box.id, { type: option.id })}
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
                      <p className={`text-sm font-medium ${missing ? 'text-red-600' : 'text-brand-navy/70'}`}>
                        {t('מידה', 'Size')} <span className="text-brand-orange-ink">*</span>
                      </p>
                      <Link to="/size-guide" className="shop-link text-[13px]">{t('מדריך מידות', 'Size guide')}</Link>
                    </div>
                    <div role="group" className="grid grid-cols-6 gap-1.5">
                      {SIZES.map(v => (
                        <button key={v} type="button" aria-pressed={box.size === v}
                          onClick={() => update(box.id, { size: v })}
                          className={`shop-chip min-h-[2.75rem] px-0 font-semibold tabular-nums ${box.size === v ? 'shop-chip-active' : missing ? 'border-red-300' : ''}`}>
                          <span dir="ltr">{v}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-brand-navy/70">{t('תוספות', 'Extras')}</p>
                    <div className="grid grid-cols-1 gap-2 min-[440px]:grid-cols-2">
                      <Extra checked={box.addName} onChange={v => update(box.id, { addName: v })}
                        label={t('שם ומספר מאחורה', 'Name and number')} price={NAME_PRICE}
                        hint={t('שחקן שמתאים לחולצה - גם הוא הפתעה', 'A player to match the shirt - a surprise too')} />
                      <Extra checked={box.patches} onChange={v => update(box.id, { patches: v })}
                        label={t("כל הפאצ'ים", 'All patches')} price={PATCHES_PRICE}
                        hint={t('של הליגה והטורניר', 'League and tournament')} />
                      <Extra checked={box.longSleeve} onChange={v => update(box.id, { longSleeve: v })}
                        label={LONG_SLEEVE_TEXT} price={EXTRA_PRICES.longSleeve}
                        hint={t('אותה חולצה, שרוול ארוך', 'The same shirt, long sleeved')} />
                      {shortsAllowed(box) && (
                        <Extra checked={box.shorts} onChange={v => update(box.id, { shorts: v })}
                          label={SHORTS_TEXT} price={EXTRA_PRICES.shorts}
                          hint={box.size ? t(`מכנס תואם במידה ${box.size}`, `Matching shorts, size ${box.size}`) : t('מכנס תואם באותה מידה', 'Matching shorts, same size')} />
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor={fid(`note-${box.id}`)} className="mb-1.5 block text-sm font-medium text-brand-navy/70">
                      {t('הערה לבוקס הזה', 'A note for this box')} <span className="font-normal text-brand-navy/40">{t('(לא חובה)', '(optional)')}</span>
                    </label>
                    <input id={fid(`note-${box.id}`)} value={box.note} maxLength={200}
                      onChange={e => update(box.id, { note: e.target.value })}
                      placeholder={t('למשל: אוהד מכבי, בלי הפועל', 'For example: a Liverpool fan, nothing from Everton')}
                      className="shop-field" />
                  </div>

                  <button type="button" onClick={() => setOpenId(-1)} className="shop-btn-dark min-h-[2.75rem] w-full text-sm">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {t('הבוקס מוכן', 'Box done')}
                  </button>
                </div>
              )}
            </li>
          );
        })}

        <li>
          <button type="button" onClick={() => addBox()} disabled={count >= MAX_BOXES}
            className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-orange/50 text-[15px] font-semibold text-brand-orange-ink transition hover:border-brand-orange hover:bg-brand-orange-soft disabled:opacity-40">
            <Plus className="h-5 w-5" aria-hidden="true" />
            {t('הוספת בוקס לחבר', 'Add a box for a friend')}
          </button>
        </li>
      </ol>

      {/* What to leave out - once, for the whole order. */}
      <div className={`pb-5 ${pad}`}>
        <div className="overflow-hidden rounded-2xl border border-brand-line">
          <button type="button" onClick={() => setPrefsOpen(o => !o)} aria-expanded={prefsOpen}
            className="flex min-h-[3.5rem] w-full items-center gap-3 bg-brand-mist px-4 text-start">
            <Ban className="h-5 w-5 flex-shrink-0 text-brand-orange-ink" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-brand-navy">{t('מה לא לשלוח', 'What not to send')}</span>
              <span className="block text-[12px] text-brand-navy/55">{t('לכל הבוקסים · לא חובה', 'For all the boxes · optional')}</span>
            </span>
            <ChevronDown className={`h-4 w-4 flex-shrink-0 text-brand-navy/40 transition-transform ${prefsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {prefsOpen && (
            <div className="bg-white px-4 pb-4 pt-3">
              <p className="mb-4 text-[13px] leading-relaxed text-brand-navy/55">
                {t('ההפתעה נשארת הפתעה, אבל אנחנו נמנע ממה שתסמנו כאן.', "The surprise stays a surprise, but we'll avoid whatever you mark here.")}
              </p>

              <label htmlFor={fid('clubs')} className="mb-1.5 block text-sm font-medium text-brand-navy/70">
                {t('קבוצות שלא תרצו לקבל', "Teams you don't want")}
              </label>
              <input id={fid('clubs')} value={excludeClubs} maxLength={200}
                onChange={e => { setExcludeClubs(e.target.value); touched(); }}
                placeholder={t('למשל: ברצלונה, מכבי תל אביב', 'For example: Barcelona, Maccabi Tel Aviv')}
                className="shop-field" />

              <p className="mb-2 mt-5 text-sm font-medium text-brand-navy/70">{t('צבעים שלא תרצו לקבל', "Colours you don't want")}</p>
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
                placeholder={t('ליגה שאתם מעדיפים, מתנה למישהו. כל דבר שחשוב לכם.', 'A league you prefer, a gift for someone. Anything that matters to you.')}
                className="shop-field resize-none py-3" />
            </div>
          )}
        </div>
      </div>

      {/* Total */}
      <div className={`border-t border-brand-line bg-brand-mist/60 py-6 ${pad}`}>
        <ul className="space-y-1.5 text-sm">
          {boxes.map((box, i) => (
            <li key={box.id} className="flex items-center justify-between gap-3 text-brand-navy/70">
              <span className="min-w-0 truncate">{boxTitle(box, i)} · {boxSummary(box)}</span>
              <span className="flex-shrink-0 font-semibold tabular-nums text-brand-navy">₪{boxPrice(box)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-baseline justify-between border-t border-brand-line pt-3">
          <span className={`font-semibold text-brand-navy ${lg ? 'text-lg' : ''}`}>
            {t('סה״כ', 'Total')} <span className="text-sm font-normal text-brand-navy/55">({boxesLabel(count)})</span>
          </span>
          <span className={`font-bold tabular-nums text-brand-navy ${lg ? 'text-3xl' : 'text-2xl'}`}>₪{total}</span>
        </div>

        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

        <button type="button" onClick={handleAdd} className={`shop-btn mt-4 w-full ${lg ? 'min-h-[3.75rem] text-base' : ''}`}>
          <ShoppingBag className={lg ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
          {count === 1 ? t('הוספה לסל', 'Add to cart') : t(`הוספת ${count} בוקסים לסל`, `Add ${count} boxes to cart`)}
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
