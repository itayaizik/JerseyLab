import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Check, ShoppingCart, Shirt, Sparkles } from 'lucide-react';
import Seo from '@/components/Seo';
import HowItWorksNotice from '@/components/HowItWorksNotice';
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
    blurb: 'חולצה קלאסית מהארכיון. העונות הישנות, הדגמים שכבר לא מייצרים.',
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

const NAME_PRICE = 10;
const PATCHES_PRICE = 5;

export default function MysteryBox() {
  const [type, setType] = useState('regular');
  const [size, setSize] = useState('');
  const [addName, setAddName] = useState(false);
  const [customName, setCustomName] = useState('');
  const [patches, setPatches] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const selected = BOX_TYPES.find(b => b.id === type);
  const total = selected.price + (addName ? NAME_PRICE : 0) + (patches ? PATCHES_PRICE : 0);

  const handleAdd = () => {
    if (!size) { setError('בחר מידה'); return; }
    if (addName && !customName.trim()) { setError('כתוב את השם שיודפס מאחורה'); return; }
    setError('');

    const extras = [];
    if (addName) extras.push({ label: `שם ומספר: ${customName.trim()}`, price: NAME_PRICE });
    if (patches) extras.push({ label: 'כל הפאצ\'ים', price: PATCHES_PRICE });

    addToCart({
      shirtId: MYSTERY_BOX_ID,
      shirtName: `מיסטרי בוקס — ${selected.label}`,
      size,
      basePrice: selected.price,
      unitPrice: total,
      extras,
      deliveryNote: 'מיסטרי בוקס — נעדכן מה יצא לפני המשלוח',
    });

    toast({ title: 'המיסטרי בוקס נוסף לסל', description: 'פתח את הסל כדי לשלוח את הבקשה.' });
    navigate('/catalog');
  };

  return (
    <div className="bg-[#F2ECD9] min-h-screen">
      <Seo
        title="מיסטרי בוקס — JerseyLab"
        description="מיסטרי בוקס של JerseyLab: חולצת כדורגל מפתיעה לפי סגנון ומידה שתבחר. רגיל ₪70, רטרו ₪90, מונדיאל ₪70."
        canonicalPath="/mystery-box"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-[#1B2A4A]" style={{ background: '#1B2A4A' }}>
        <div className="absolute inset-0 opacity-[0.12]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />
        <div className="relative max-w-3xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-[#E8622A]"
            style={{ boxShadow: '4px 4px 0 #FFD95A' }}>
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading font-black text-4xl md:text-5xl text-white uppercase mb-3">
            מיסטרי בוקס
          </h1>
          <p className="font-body text-white/75 text-sm md:text-base max-w-xl mx-auto">
            אתה בוחר סגנון ומידה — אנחנו בוחרים את החולצה. חולצה מקורית באיכות שאנחנו
            עומדים מאחוריה, במחיר נמוך משמעותית מהקטלוג.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Step 1 — type */}
        <Step number={1} title="בחר סגנון">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BOX_TYPES.map(box => {
              const active = type === box.id;
              const Icon = box.icon;
              return (
                <button key={box.id} type="button" onClick={() => setType(box.id)}
                  aria-pressed={active}
                  className={`text-right p-4 border-2 transition-all ${active ? 'bg-[#1B2A4A] border-[#1B2A4A] text-white' : 'bg-white border-[#1B2A4A]/25 hover:border-[#1B2A4A]'}`}
                  style={active ? { boxShadow: '3px 3px 0 #E8622A' } : undefined}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${active ? 'text-[#FFD95A]' : 'text-[#E8622A]'}`} />
                    {active && <Check className="w-4 h-4 text-[#FFD95A]" />}
                  </div>
                  <p className={`font-heading font-black text-lg uppercase ${active ? 'text-white' : 'text-[#1B2A4A]'}`}>
                    {box.label}
                  </p>
                  <p className={`font-mono font-bold text-xl mt-0.5 ${active ? 'text-[#FFD95A]' : 'text-[#E8622A]'}`}>
                    ₪{box.price}
                  </p>
                  <p className={`text-xs font-body mt-2 leading-relaxed ${active ? 'text-white/70' : 'text-[#1B2A4A]/60'}`}>
                    {box.blurb}
                  </p>
                </button>
              );
            })}
          </div>
        </Step>

        {/* Step 2 — size */}
        <Step number={2} title="בחר מידה">
          <div className="flex flex-wrap gap-2">
            {SIZES.map(s => (
              <button key={s} type="button" onClick={() => { setSize(s); setError(''); }}
                aria-pressed={size === s}
                className={`min-w-[56px] min-h-[44px] px-4 border-2 font-mono font-bold text-sm transition-colors ${size === s ? 'bg-[#E8622A] text-white border-[#E8622A]' : 'bg-white text-[#1B2A4A] border-[#1B2A4A]/30 hover:border-[#1B2A4A]'}`}>
                {s}
              </button>
            ))}
          </div>
          <Link to="/size-guide" className="inline-block mt-3 text-xs font-body text-[#1B2A4A]/60 underline hover:text-[#E8622A]">
            לא בטוח? מדריך המידות
          </Link>
        </Step>

        {/* Step 3 — extras */}
        <Step number={3} title="תוספות (לא חובה)">
          <div className="space-y-2">
            <Extra
              checked={addName}
              onChange={setAddName}
              label="שם ומספר מאחורה"
              price={NAME_PRICE}
              hint="הדפסה בסגנון החולצה שתקבל"
            />
            {addName && (
              <div className="pr-4 pb-1">
                <label htmlFor="mb-name" className="text-xs font-body text-[#1B2A4A]/70 block mb-1">
                  שם ומספר להדפסה
                </label>
                <input id="mb-name" value={customName} maxLength={40}
                  onChange={e => { setCustomName(e.target.value); setError(''); }}
                  placeholder="MESSI 10"
                  className="w-full max-w-xs border-2 border-[#1B2A4A] px-3 py-2.5 text-sm bg-white focus:outline-none font-body" />
              </div>
            )}
            <Extra
              checked={patches}
              onChange={setPatches}
              label="כל הפאצ'ים"
              price={PATCHES_PRICE}
              hint="פאצ'ים של הליגה והטורניר, לפי החולצה"
            />
          </div>
        </Step>

        {/* Total + submit */}
        <div className="bg-white border-2 border-[#1B2A4A] p-5" style={{ boxShadow: '4px 4px 0 #1B2A4A' }}>
          <div className="space-y-1.5 mb-4 text-sm font-body">
            <Row label={`מיסטרי בוקס ${selected.label}`} value={selected.price} />
            {addName && <Row label="שם ומספר מאחורה" value={NAME_PRICE} />}
            {patches && <Row label="כל הפאצ'ים" value={PATCHES_PRICE} />}
            {size && <Row label="מידה" text={size} />}
          </div>

          <div className="flex items-center justify-between py-3 border-t-2 border-[#1B2A4A]">
            <span className="font-heading font-bold text-[#1B2A4A] uppercase">סה"כ</span>
            <span className="font-mono font-black text-2xl text-[#E8622A]">₪{total}</span>
          </div>

          {error && <p className="text-red-600 text-sm font-body mb-2">{error}</p>}

          <button type="button" onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 bg-[#E8622A] text-white py-3.5 font-heading font-bold text-sm uppercase tracking-wider hover:bg-[#D0551F] transition-colors"
            style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
            <ShoppingCart className="w-4 h-4" />
            הוסף לסל
          </button>
        </div>

        <HowItWorksNotice variant="full" />

        {/* What you actually get */}
        <div className="bg-white border-2 border-[#1B2A4A] p-5" style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
          <h2 className="font-heading font-bold text-sm text-[#1B2A4A] uppercase tracking-wide mb-3">מה בדיוק מקבלים?</h2>
          <ul className="space-y-2 text-sm font-body text-[#1B2A4A]/75">
            {[
              'חולצה אחת, במידה שבחרת, מהסגנון שבחרת.',
              'אנחנו בוחרים את הקבוצה והעונה — זה מה שהופך את זה למיסטרי.',
              'נעדכן אותך איזו חולצה יצאה לפני שהיא נשלחת.',
              'לא אהבת? כתוב לנו לפני המשלוח ונחליף לסגנון אחר.',
            ].map(line => (
              <li key={line} className="flex gap-2">
                <Check className="w-4 h-4 text-[#E8622A] flex-shrink-0 mt-0.5" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, children }) {
  return (
    <section className="bg-white border-2 border-[#1B2A4A] p-5" style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-6 h-6 flex-shrink-0 bg-[#1B2A4A] text-white font-mono font-bold text-xs flex items-center justify-center">
          {number}
        </span>
        <h2 className="font-heading font-bold text-sm text-[#1B2A4A] uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </section>
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
