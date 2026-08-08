import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Check, ShoppingCart, Shirt, Sparkles, Ban, MessageSquare } from 'lucide-react';
import Seo from '@/components/Seo';
import HowItWorksNotice from '@/components/HowItWorksNotice';
import MysteryBoxInfo from '@/components/MysteryBoxInfo';
import { addToCart } from '@/lib/cart';
import { toast } from '@/components/ui/use-toast';

// A mystery box has no catalogue row behind it, so it carries a sentinel id.
// The admin panel and the profile page both fall back to the stored name when
// no shirt matches, which is what makes this work without a fake DB entry.
export const MYSTERY_BOX_ID = 'mystery-box';

const BOX_TYPES = [
  {
    id: 'regular',
    label: 'רגיל',
    price: 70,
    icon: Shirt,
    blurb: 'חולצת מועדון מהעונות האחרונות — ליגות אירופה או ישראל.',
  },
  {
    id: 'retro',
    label: 'רטרו',
    price: 90,
    icon: Sparkles,
    blurb: 'חולצה קלאסית מהארכיון. עונות ישנות ודגמים שכבר לא מייצרים.',
  },
  {
    id: 'mundial',
    label: 'מונדיאל',
    price: 70,
    icon: Gift,
    blurb: 'חולצת נבחרת — מונדיאל או יורו, בית או חוץ.',
  },
];

const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

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

const NAME_PRICE = 10;
const PATCHES_PRICE = 5;

export default function MysteryBox() {
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

  const toggleColor = (label) => {
    setExcludeColors(prev => prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]);
  };

  const handleAdd = () => {
    if (!size) { setError('בחר מידה'); return; }
    setError('');

    const extras = [];
    if (addName) extras.push({ label: 'שם ומספר מאחורה (לבחירתנו)', price: NAME_PRICE });
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
    <div className="bg-[#F2ECD9] min-h-screen">
      <Seo
        title="מיסטרי בוקס — JerseyLab"
        description="מיסטרי בוקס של JerseyLab: חולצת כדורגל מפתיעה לפי סגנון ומידה שתבחר. רגיל ₪70, רטרו ₪90, מונדיאל ₪70. אפשר לסמן קבוצות וצבעים שלא תרצה לקבל."
        canonicalPath="/mystery-box"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-[#1B2A4A]" style={{ background: '#1B2A4A' }}>
        <div className="absolute inset-0 opacity-[0.12]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />
        <div className="relative max-w-6xl mx-auto px-4 py-9 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-3 bg-[#E8622A]"
            style={{ boxShadow: '4px 4px 0 #FFD95A' }}>
            <Gift className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-black text-4xl md:text-5xl text-white uppercase mb-2">
            מיסטרי בוקס
          </h1>
          <p className="font-body text-white/75 text-sm md:text-base max-w-xl mx-auto">
            אתה בוחר סגנון ומידה — אנחנו בוחרים את החולצה.
          </p>
        </div>
      </section>

      {/* The configurator is a tall panel on the right; everything a customer
          needs to know before committing runs down the column beside it. */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] gap-6 items-start">

          {/* ===== The box ===== */}
          <div className="bg-white border-2 border-[#1B2A4A] lg:sticky lg:top-24"
            style={{ boxShadow: '5px 5px 0 #1B2A4A' }}>

            <div className="bg-[#1B2A4A] px-5 py-3 flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#FFD95A] flex-shrink-0" />
              <p className="font-heading font-bold text-sm text-white uppercase tracking-wide">בנה את הבוקס</p>
            </div>

            <div className="p-5 space-y-6">
              <Field number={1} title="סגנון">
                <div className="space-y-2">
                  {BOX_TYPES.map(box => {
                    const active = type === box.id;
                    const Icon = box.icon;
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
                <div className="space-y-2">
                  {/* No name field on purpose: the shirt is a surprise, so the
                      print is too — we pick the player that fits it. */}
                  <Extra checked={addName} onChange={setAddName} label="שם ומספר מאחורה" price={NAME_PRICE}
                    hint="אנחנו בוחרים את השם והמספר שמתאימים לחולצה שתצא" />
                  <Extra checked={patches} onChange={setPatches} label="כל הפאצ'ים" price={PATCHES_PRICE}
                    hint="פאצ'ים של הליגה והטורניר, לפי החולצה" />
                </div>
              </Field>

              {/* ===== Preferences ===== */}
              <Field number={4} title="מה לא לשלוח" optional>
                <p className="text-xs font-body text-[#1B2A4A]/55 mb-3 leading-relaxed">
                  ההפתעה נשארת הפתעה — אבל אנחנו נמנע ממה שתסמן כאן.
                </p>

                <label htmlFor="mb-clubs" className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#1B2A4A] uppercase tracking-wide mb-1.5">
                  <Ban className="w-3.5 h-3.5 text-[#E8622A]" />
                  קבוצות שלא תרצה לקבל
                </label>
                <input id="mb-clubs" value={excludeClubs} maxLength={200}
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

                <label htmlFor="mb-notes" className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#1B2A4A] uppercase tracking-wide mt-4 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#E8622A]" />
                  הערות
                </label>
                <textarea id="mb-notes" value={notes} maxLength={500} rows={3}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ליגה שאתה מעדיף, שחקן שתשמח לקבל, מתנה למישהו — כל דבר שיעזור לנו לבחור."
                  className="w-full border-2 border-[#1B2A4A]/30 focus:border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none font-body resize-none" />
                <p className="text-[11px] text-[#1B2A4A]/40 font-mono mt-1">{notes.length}/500</p>
              </Field>
            </div>

            {/* Total */}
            <div className="border-t-2 border-[#1B2A4A] p-5 bg-[#F2ECD9]/60">
              <div className="space-y-1.5 mb-3 text-sm font-body">
                <Row label={`מיסטרי בוקס ${selected.label}`} value={selected.price} />
                {addName && <Row label="שם ומספר מאחורה" value={NAME_PRICE} />}
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

          {/* ===== Everything about it ===== */}
          <div className="space-y-5">
            <MysteryBoxInfo />
            <HowItWorksNotice variant="full" />
          </div>
        </div>
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
