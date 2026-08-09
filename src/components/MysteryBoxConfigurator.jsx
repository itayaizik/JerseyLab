import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Check, ShoppingCart, Shirt, Sparkles, Ban, MessageSquare } from 'lucide-react';
import { addToCart } from '@/lib/cart';
import { toast } from '@/components/ui/use-toast';
import { BOX_TYPES, SIZES, PATCHES_PRICE, MYSTERY_BOX_ID } from '@/lib/mysteryBox';

// The whole mystery box purchase, in one tall panel. Prices come from
// src/lib/mysteryBox.js so the home page's price list and what this actually
// charges can never disagree.

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

export default function MysteryBoxConfigurator({ idPrefix = 'mb', className = '', headerAction = null }) {
  const [type, setType] = useState('regular');
  const [size, setSize] = useState('');
  const [patches, setPatches] = useState(false);
  const [excludeClubs, setExcludeClubs] = useState('');
  const [excludeColors, setExcludeColors] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const selected = BOX_TYPES.find(b => b.id === type);
  const total = selected.price + (patches ? PATCHES_PRICE : 0);

  // Two of these can be on the page at once (home page and, after navigating,
  // the product page), so field ids have to be unique per instance.
  const fid = (name) => `${idPrefix}-${name}`;

  const toggleColor = (label) => {
    setExcludeColors(prev => prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]);
  };

  const handleAdd = () => {
    if (!size) { setError('בחר מידה'); return; }
    setError('');

    const extras = [];
    if (patches) extras.push({ label: 'כל הפאצ\'ים', price: PATCHES_PRICE });

    // Preferences are not priced, so they travel separately from `extras` —
    // they still have to reach the order, or the whole point of asking is lost.
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

  return (
    <div className={`bg-white border-2 border-[#1B2A4A] ${className}`} style={{ boxShadow: '5px 5px 0 #1B2A4A' }}>

      <div className="bg-[#1B2A4A] px-4 py-3 flex items-center gap-2">
        <Gift className="w-4 h-4 text-[#FFD95A] flex-shrink-0" />
        <p className="font-heading font-bold text-sm text-white uppercase tracking-wide">בנה את הבוקס</p>
        {headerAction}
      </div>

      <div className="p-4 space-y-5">
        <Field number={1} title="סגנון">
          <div className="space-y-2">
            {BOX_TYPES.map(box => {
              const active = type === box.id;
              const Icon = TYPE_ICONS[box.id];
              return (
                <button key={box.id} type="button" onClick={() => setType(box.id)}
                  aria-pressed={active}
                  className={`w-full text-right p-3 border-2 transition-colors ${active ? 'bg-[#1B2A4A] border-[#1B2A4A]' : 'bg-white border-[#1B2A4A]/25 hover:border-[#1B2A4A]'}`}>
                  <span className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#FFD95A]' : 'text-[#E8622A]'}`} />
                    <span className={`font-heading font-black text-base uppercase ${active ? 'text-white' : 'text-[#1B2A4A]'}`}>
                      {box.label}
                    </span>
                    <span className={`mr-auto font-mono font-bold text-base ${active ? 'text-[#FFD95A]' : 'text-[#E8622A]'}`}>
                      ₪{box.price}
                    </span>
                    {active && <Check className="w-4 h-4 text-[#FFD95A] flex-shrink-0" />}
                  </span>
                  <span className={`block text-xs font-body mt-1 leading-relaxed ${active ? 'text-white/70' : 'text-[#1B2A4A]/55'}`}>
                    {box.blurb}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field number={2} title="מידה">
          <div className="grid grid-cols-3 gap-2">
            {SIZES.map(s => (
              <button key={s} type="button" onClick={() => { setSize(s); setError(''); }}
                aria-pressed={size === s}
                className={`min-h-[44px] border-2 font-mono font-bold text-sm transition-colors ${size === s ? 'bg-[#E8622A] text-white border-[#E8622A]' : 'bg-white text-[#1B2A4A] border-[#1B2A4A]/30 hover:border-[#1B2A4A]'}`}>
                {s}
              </button>
            ))}
          </div>
          <Link to="/size-guide" className="inline-block mt-2.5 text-xs font-body text-[#1B2A4A]/55 underline hover:text-[#E8622A]">
            לא בטוח? מדריך המידות
          </Link>
        </Field>

        <Field number={3} title="תוספות">
          {/* Name-and-number is deliberately not offered here. A mystery box
              ships blank: we do not know which shirt will come out, so there
              is no player to print, and asking would promise a choice the
              product cannot keep. */}
          <Extra checked={patches} onChange={setPatches} label="כל הפאצ'ים" price={PATCHES_PRICE}
            hint="פאצ'ים של הליגה והטורניר, לפי החולצה" />
        </Field>

        <Field number={4} title="מה לא לשלוח" optional>
          <p className="text-xs font-body text-[#1B2A4A]/55 mb-3 leading-relaxed">
            ההפתעה נשארת הפתעה — אבל אנחנו נמנע ממה שתסמן כאן.
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
                  className={`flex items-center gap-1.5 min-h-[36px] pr-2 pl-2.5 border-2 text-xs font-body transition-colors ${off ? 'bg-[#1B2A4A] border-[#1B2A4A] text-white line-through' : 'bg-white border-[#1B2A4A]/25 text-[#1B2A4A] hover:border-[#1B2A4A]'}`}>
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
            placeholder="ליגה שאתה מעדיף, שחקן שתשמח לקבל, מתנה למישהו — כל דבר שיעזור לנו לבחור."
            className="w-full border-2 border-[#1B2A4A]/30 focus:border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none font-body resize-none" />
          <p className="text-[11px] text-[#1B2A4A]/40 font-mono mt-1">{notes.length}/500</p>
        </Field>
      </div>

      {/* Total */}
      <div className="border-t-2 border-[#1B2A4A] p-4 bg-[#F2ECD9]/60">
        <div className="space-y-1.5 mb-3 text-sm font-body">
          <Row label={`מיסטרי בוקס ${selected.label}`} value={selected.price} />
          {patches && <Row label="כל הפאצ'ים" value={PATCHES_PRICE} />}
          {size && <Row label="מידה" text={size} />}
        </div>

        <div className="flex items-center justify-between py-2.5 border-t-2 border-[#1B2A4A]">
          <span className="font-heading font-bold text-[#1B2A4A] uppercase">סה"כ</span>
          <span className="font-mono font-black text-2xl text-[#E8622A]">₪{total}</span>
        </div>

        {error && <p className="text-red-600 text-sm font-body mt-1 mb-2">{error}</p>}

        <button type="button" onClick={handleAdd}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-[#E8622A] text-white py-3.5 font-heading font-bold text-sm uppercase tracking-wider hover:bg-[#D0551F] transition-colors"
          style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
          <ShoppingCart className="w-4 h-4" />
          הוסף לסל
        </button>
        <p className="text-[11px] text-center text-[#1B2A4A]/50 font-body mt-2">
          בלי תשלום באתר — שליחת בקשה בלבד.
        </p>
      </div>
    </div>
  );
}

function Field({ number, title, optional, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-5 flex-shrink-0 bg-[#1B2A4A] text-white font-mono font-bold text-[10px] flex items-center justify-center">
          {number}
        </span>
        <h2 className="font-heading font-bold text-sm text-[#1B2A4A] uppercase tracking-wide">{title}</h2>
        {optional && (
          <span className="text-[10px] font-body text-[#1B2A4A]/40 border border-[#1B2A4A]/20 px-1.5 py-0.5">לא חובה</span>
        )}
      </div>
      {children}
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
