import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Gift, Check, ShoppingCart, Shirt, Sparkles, Ban, MessageSquare,
  ChevronLeft, ChevronRight, Pencil,
} from 'lucide-react';
import { addToCart } from '@/lib/cart';
import { toast } from '@/components/ui/use-toast';
import { BOX_TYPES, SIZES, NAME_PRICE, PATCHES_PRICE, MYSTERY_BOX_ID } from '@/lib/mysteryBox';

// Building a mystery box, one question at a time.
//
// It used to be four blocks stacked on one screen, which asked a visitor to
// take in style, size, extras and exclusions all at once before answering any
// of them. This asks one question per step, in the order a person actually
// decides: what kind of shirt, then what size, then anything extra, then
// anything to rule out.
//
// Two rules make the flow feel guided rather than restrictive:
//   - Answered steps collapse into a one-line summary with an edit link, so
//     what you already chose stays visible and changeable without going back.
//   - Only the current step is expanded, and the total updates with each
//     answer, so the price is never a surprise at the end.
//
// Steps 1 and 2 are required; 3 and 4 are optional and say so.

const TYPE_ICONS = { regular: Shirt, retro: Sparkles, mundial: Gift };

// Swatches rather than a text field: picking from a list is one tap, and it
// keeps the answers consistent enough for us to actually act on them.
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
  const [excludeClubs, setExcludeClubs] = useState('');
  const [excludeColors, setExcludeColors] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const selected = BOX_TYPES.find(b => b.id === type);
  const total = selected.price + (addName ? NAME_PRICE : 0) + (patches ? PATCHES_PRICE : 0);

  // Two of these can be on the page at once, so field ids are per instance.
  const fid = (name) => `${idPrefix}-${name}`;

  const toggleColor = (label) => {
    setExcludeColors(prev => prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]);
  };

  // A step can only be left once its required answer exists. Returning to an
  // earlier step is always allowed.
  const canLeave = (index) => (index === 1 ? !!size : true);

  const goNext = () => {
    if (!canLeave(step)) { setError('בחר מידה כדי להמשיך'); return; }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const goTo = (index) => {
    if (index > step && !canLeave(step)) { setError('בחר מידה כדי להמשיך'); return; }
    setError('');
    setStep(index);
  };

  const handleAdd = () => {
    if (!size) { setError('בחר מידה'); setStep(1); return; }
    setError('');

    const extras = [];
    if (addName) extras.push({ label: 'שם ומספר מאחורה (לבחירתנו)', price: NAME_PRICE });
    if (patches) extras.push({ label: 'כל הפאצ\'ים', price: PATCHES_PRICE });

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

    toast({ title: 'המיסטרי בוקס נוסף לסל', description: 'פתח את הסל כדי לשלוח את הבקשה.' });
    navigate('/catalog');
  };

  // One-line recap of an answered step, shown when it is collapsed.
  const summaryOf = (id) => {
    if (id === 'type') return `${selected.label} · ₪${selected.price}`;
    if (id === 'size') return size || 'טרם נבחרה';
    if (id === 'extras') {
      const on = [addName && 'שם ומספר', patches && 'פאצ\'ים'].filter(Boolean);
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

  return (
    <div className={`bg-white border-2 border-[#1B2A4A] ${className}`} style={{ boxShadow: '5px 5px 0 #1B2A4A' }}>

      <div className={`bg-[#1B2A4A] flex items-center gap-2 ${lg ? 'px-5 py-4' : 'px-4 py-3'}`}>
        <Gift className={`text-[#FFD95A] flex-shrink-0 ${lg ? 'w-5 h-5' : 'w-4 h-4'}`} />
        <p className={`font-heading font-bold text-white uppercase tracking-wide ${lg ? 'text-lg' : 'text-sm'}`}>בנה את הבוקס</p>
        <span className="mr-auto font-mono text-xs text-white/50">{step + 1}/{STEPS.length}</span>
        {headerAction}
      </div>

      {/* Progress. Answered steps stay reachable. */}
      <div className="flex gap-1 px-4 pt-4" dir="ltr">
        {STEPS.map((s, i) => (
          <button key={s.id} type="button" onClick={() => goTo(i)}
            aria-label={`שלב ${i + 1}: ${s.title}`}
            aria-current={i === step ? 'step' : undefined}
            className={`h-1.5 flex-1 transition-colors ${
              i === step ? 'bg-[#E8622A]' : i < step ? 'bg-[#1B2A4A]' : 'bg-[#1B2A4A]/15'
            }`} />
        ))}
      </div>

      <div className={lg ? 'p-5 space-y-3' : 'p-4 space-y-3'}>
        {STEPS.map((s, i) => {
          const open = i === step;
          const done = i < step;

          return (
            <div key={s.id} className={`border-2 transition-colors ${open ? 'border-[#1B2A4A]' : 'border-[#1B2A4A]/15'}`}>
              <button type="button" onClick={() => goTo(i)}
                aria-expanded={open}
                className={`w-full flex items-center gap-2.5 px-3 min-h-[48px] text-right transition-colors ${open ? 'bg-[#1B2A4A]' : 'hover:bg-[#F2ECD9]'}`}>
                <span className={`w-6 h-6 flex-shrink-0 flex items-center justify-center font-mono text-[11px] font-bold ${
                  open ? 'bg-[#FFD95A] text-[#1B2A4A]' : done ? 'bg-[#1B2A4A] text-white' : 'bg-[#1B2A4A]/10 text-[#1B2A4A]/50'
                }`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span className={`font-heading font-bold text-sm uppercase ${open ? 'text-white' : 'text-[#1B2A4A]'}`}>
                  {s.title}
                </span>
                {!s.required && !open && (
                  <span className="text-[10px] font-body text-[#1B2A4A]/40 border border-[#1B2A4A]/20 px-1.5">לא חובה</span>
                )}
                {!open && (
                  <span className="mr-auto flex items-center gap-1.5 text-xs font-body text-[#1B2A4A]/60 truncate">
                    {summaryOf(s.id)}
                    <Pencil className="w-3 h-3 flex-shrink-0 text-[#E8622A]" />
                  </span>
                )}
              </button>

              {open && (
                <div className="p-3.5">
                  {s.id === 'type' && (
                    <div className={lg ? 'grid grid-cols-1 sm:grid-cols-3 gap-3' : 'space-y-2'}>
                      {BOX_TYPES.map(box => {
                        const active = type === box.id;
                        const Icon = TYPE_ICONS[box.id];
                        return (
                          <button key={box.id} type="button"
                            onClick={() => { setType(box.id); setStep(1); }}
                            aria-pressed={active}
                            className={`w-full text-right border-2 transition-colors ${lg ? 'p-4' : 'p-3'} ${active ? 'bg-[#1B2A4A] border-[#1B2A4A]' : 'bg-white border-[#1B2A4A]/25 hover:border-[#1B2A4A]'}`}
                            style={active && lg ? { boxShadow: '3px 3px 0 #E8622A' } : undefined}>
                            <span className="flex items-center gap-2">
                              <Icon className={`flex-shrink-0 ${lg ? 'w-5 h-5' : 'w-4 h-4'} ${active ? 'text-[#FFD95A]' : 'text-[#E8622A]'}`} />
                              <span className={`font-heading font-black uppercase ${lg ? 'text-lg' : 'text-base'} ${active ? 'text-white' : 'text-[#1B2A4A]'}`}>
                                {box.label}
                              </span>
                              {active && <Check className="w-4 h-4 text-[#FFD95A] flex-shrink-0 mr-auto" />}
                            </span>
                            <span className={`block font-mono font-black mt-1 ${lg ? 'text-2xl' : 'text-base'} ${active ? 'text-[#FFD95A]' : 'text-[#E8622A]'}`}>
                              ₪{box.price}
                            </span>
                            <span className={`block text-xs font-body mt-1.5 leading-relaxed ${active ? 'text-white/70' : 'text-[#1B2A4A]/55'}`}>
                              {box.blurb}
                            </span>
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
                            className={`border-2 font-mono font-bold transition-colors ${lg ? 'min-h-[52px] text-base' : 'min-h-[44px] text-sm'} ${size === v ? 'bg-[#E8622A] text-white border-[#E8622A]' : 'bg-white text-[#1B2A4A] border-[#1B2A4A]/30 hover:border-[#1B2A4A]'}`}>
                            {v}
                          </button>
                        ))}
                      </div>
                      <Link to="/size-guide" className="inline-block mt-2.5 text-xs font-body text-[#1B2A4A]/55 underline hover:text-[#E8622A]">
                        לא בטוח? מדריך המידות
                      </Link>
                    </>
                  )}

                  {s.id === 'extras' && (
                    <div className={lg ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-2'}>
                      {/* The name add-on has no text field on purpose: the shirt
                          is the surprise, so the print is too. */}
                      <Extra checked={addName} onChange={setAddName} label="שם ומספר מאחורה" price={NAME_PRICE}
                        hint="אנחנו בוחרים את השם והמספר שמתאימים לחולצה שתצא" />
                      <Extra checked={patches} onChange={setPatches} label="כל הפאצ'ים" price={PATCHES_PRICE}
                        hint="פאצ'ים של הליגה והטורניר, לפי החולצה" />
                    </div>
                  )}

                  {s.id === 'exclude' && (
                    <>
                      <p className="text-xs font-body text-[#1B2A4A]/55 mb-3 leading-relaxed">
                        ההפתעה נשארת הפתעה, אבל אנחנו נמנע ממה שתסמן כאן.
                      </p>

                      <label htmlFor={fid('clubs')} className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#1B2A4A] uppercase tracking-wide mb-1.5">
                        <Ban className="w-3.5 h-3.5 text-[#E8622A]" />
                        קבוצות שלא תרצה לקבל
                      </label>
                      <input id={fid('clubs')} value={excludeClubs} maxLength={200}
                        onChange={e => setExcludeClubs(e.target.value)}
                        placeholder="למשל: ברצלונה, מכבי תל אביב"
                        className="w-full border-2 border-[#1B2A4A]/30 focus:border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none font-body" />

                      <p className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#1B2A4A] uppercase tracking-wide mt-4 mb-2">
                        <Ban className="w-3.5 h-3.5 text-[#E8622A]" />
                        צבעים שלא תרצה לקבל
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {COLORS.map(c => {
                          const off = excludeColors.includes(c.label);
                          return (
                            <button key={c.label} type="button" onClick={() => toggleColor(c.label)}
                              aria-pressed={off}
                              className={`flex items-center gap-1.5 min-h-[44px] pr-2.5 pl-3 border-2 text-xs font-body transition-colors ${off ? 'bg-[#1B2A4A] border-[#1B2A4A] text-white line-through' : 'bg-white border-[#1B2A4A]/25 text-[#1B2A4A] hover:border-[#1B2A4A]'}`}>
                              <span className="w-3.5 h-3.5 flex-shrink-0 border border-[#1B2A4A]/40" style={{ background: c.hex }} />
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                      {excludeColors.length > 0 && (
                        <p className="text-xs font-body text-[#1B2A4A]/60 mt-2">
                          לא נשלח: <strong className="text-[#1B2A4A]">{excludeColors.join(', ')}</strong>
                        </p>
                      )}

                      <label htmlFor={fid('notes')} className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#1B2A4A] uppercase tracking-wide mt-4 mb-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#E8622A]" />
                        הערות
                      </label>
                      <textarea id={fid('notes')} value={notes} maxLength={500} rows={3}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="ליגה שאתה מעדיף, שחקן שתשמח לקבל, מתנה למישהו. כל דבר שיעזור לנו לבחור."
                        className="w-full border-2 border-[#1B2A4A]/30 focus:border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none font-body resize-none" />
                      <p className="text-[11px] text-[#1B2A4A]/40 font-mono mt-1">{notes.length}/500</p>
                    </>
                  )}

                  {/* Step navigation. The last step has no "next" — the order
                      button below is the next thing to press. */}
                  {!isLast && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#1B2A4A]/10">
                      {step > 0 && (
                        <button type="button" onClick={() => goTo(step - 1)}
                          className="inline-flex items-center gap-1 min-h-[44px] px-3 text-xs font-heading font-bold uppercase text-[#1B2A4A]/60 hover:text-[#1B2A4A] transition-colors">
                          <ChevronRight className="w-4 h-4" />
                          חזרה
                        </button>
                      )}
                      <button type="button" onClick={goNext}
                        className="mr-auto inline-flex items-center gap-1.5 min-h-[44px] bg-[#1B2A4A] text-white px-5 text-xs font-heading font-bold uppercase tracking-wide hover:bg-[#E8622A] transition-colors">
                        {STEPS[step].required ? 'המשך' : 'דלג'}
                        <ChevronLeft className="w-4 h-4" />
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
      <div className={`border-t-2 border-[#1B2A4A] bg-[#F2ECD9]/60 ${lg ? 'p-5' : 'p-4'}`}>
        <div className="space-y-1.5 mb-3 text-sm font-body">
          <Row label={`מיסטרי בוקס ${selected.label}`} value={selected.price} />
          {addName && <Row label="שם ומספר מאחורה" value={NAME_PRICE} />}
          {patches && <Row label="כל הפאצ'ים" value={PATCHES_PRICE} />}
          {size && <Row label="מידה" text={size} />}
        </div>

        <div className="flex items-center justify-between py-2.5 border-t-2 border-[#1B2A4A]">
          <span className={`font-heading font-bold text-[#1B2A4A] uppercase ${lg ? 'text-lg' : ''}`}>סה"כ</span>
          <span className={`font-mono font-black text-[#E8622A] ${lg ? 'text-4xl' : 'text-2xl'}`}>₪{total}</span>
        </div>

        {error && <p role="alert" className="text-red-600 text-sm font-body mt-1 mb-2">{error}</p>}

        <button type="button" onClick={handleAdd}
          className={`mt-2 w-full flex items-center justify-center gap-2 font-heading font-bold uppercase tracking-wider transition-colors ${lg ? 'py-4 text-base' : 'py-3.5 text-sm'} ${
            size ? 'bg-[#E8622A] text-white hover:bg-[#D0551F]' : 'bg-[#1B2A4A]/15 text-[#1B2A4A]/45 cursor-not-allowed'
          }`}
          style={size ? { boxShadow: '3px 3px 0 #1B2A4A' } : undefined}>
          <ShoppingCart className={lg ? 'w-5 h-5' : 'w-4 h-4'} />
          {size ? 'הוסף לסל' : 'בחר מידה כדי להמשיך'}
        </button>
        <p className="text-[11px] text-center text-[#1B2A4A]/50 font-body mt-2">
          בלי תשלום באתר, שליחת בקשה בלבד.
        </p>
      </div>
    </div>
  );
}

function Extra({ checked, onChange, label, price, hint }) {
  return (
    <label className={`flex items-start gap-3 p-3 border-2 cursor-pointer transition-colors ${checked ? 'border-[#E8622A] bg-[#E8622A]/5' : 'border-[#1B2A4A]/20 hover:border-[#1B2A4A]/50'}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 flex-shrink-0 accent-[#E8622A]" />
      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between gap-2">
          <span className="font-body font-bold text-sm text-[#1B2A4A]">{label}</span>
          <span className="font-mono font-bold text-sm text-[#E8622A] flex-shrink-0">+₪{price}</span>
        </span>
        <span className="block text-xs font-body text-[#1B2A4A]/55 mt-0.5">{hint}</span>
      </span>
    </label>
  );
}

function Row({ label, value, text }) {
  return (
    <div className="flex items-center justify-between text-[#1B2A4A]/75">
      <span>{label}</span>
      <span className="font-mono font-bold text-[#1B2A4A]">{text ?? `₪${value}`}</span>
    </div>
  );
}
