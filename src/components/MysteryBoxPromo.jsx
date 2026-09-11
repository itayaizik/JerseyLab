import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, ArrowLeft } from 'lucide-react';
import { BOX_TYPES } from '@/lib/mysteryBox';
import { MYSTERY_BOX_PANELS } from '@/components/MysteryBoxInfo';

// The mystery box on the home page: a pitch on one side, the explanation on
// the other.
//
// It used to sit directly under the hero as a wide banner, which put a side
// product ahead of the catalogue itself. It now sits further down, after a
// visitor has seen actual shirts, where an unusual offer reads as a discovery
// rather than an interruption.
//
// The right block is the offer and the way in; the left block answers the three
// questions the product page answers at length — what it is, what arrives, and
// what you can rule out — condensed to what fits without scrolling.

// The three panels worth showing here. The rest stay on the product page.
const PROMO_PANEL_TITLES = ['מה זה מיסטרי בוקס?', 'מה מקבלים', 'מה אפשר לפסול'];

const promoPanels = PROMO_PANEL_TITLES
  .map(title => MYSTERY_BOX_PANELS.find(p => p.title === title))
  .filter(Boolean);

// One line per panel, short enough to scan. Taken from the panel's own copy so
// the two pages cannot drift apart.
function panelLine(panel) {
  if (panel.items?.length) return panel.items[0];
  return panel.paragraphs?.[0] || '';
}

export default function MysteryBoxPromo() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-5 items-stretch">

        {/* The offer */}
        <div className="bg-[#1B2A4A] border-2 border-[#1B2A4A] p-6 flex flex-col"
          style={{ boxShadow: '5px 5px 0 #E8622A' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-12 flex-shrink-0 bg-[#E8622A] flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-heading uppercase tracking-[0.2em] text-[#FFD95A]">חדש</p>
              <h2 className="font-heading font-black text-2xl text-white uppercase leading-none">מיסטרי בוקס</h2>
            </div>
          </div>

          <p className="font-body text-sm text-white/70 leading-relaxed mb-5">
            אתה בוחר סגנון ומידה, אנחנו בוחרים את החולצה. אותה איכות כמו בקטלוג,
            במחיר נמוך יותר.
          </p>

          <div className="space-y-1.5 mb-6">
            {BOX_TYPES.map(box => (
              <div key={box.id} className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="font-body text-sm text-white/70">{box.label}</span>
                <span className="font-mono font-bold text-base text-[#FFD95A]">₪{box.price}</span>
              </div>
            ))}
          </div>

          <Link to="/mystery-box"
            className="mt-auto flex items-center justify-center gap-2 bg-[#FFD95A] text-[#1B2A4A] py-3.5 font-heading font-bold text-sm uppercase tracking-wider hover:bg-white transition-colors">
            בנה את הבוקס
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* What it actually is */}
        <div className="bg-white border-2 border-[#1B2A4A] p-6 lg:p-7 flex flex-col"
          style={{ boxShadow: '5px 5px 0 #1B2A4A' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 flex-1">
            {promoPanels.map(panel => {
              const Icon = panel.icon;
              return (
                <div key={panel.title} className="flex flex-col gap-2">
                  <span className="w-8 h-8 flex-shrink-0 bg-[#F2ECD9] border border-[#1B2A4A]/15 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#E8622A]" />
                  </span>
                  <h3 className="font-heading font-bold text-sm text-[#1B2A4A] uppercase leading-tight">
                    {panel.title}
                  </h3>
                  <p className="font-body text-[13px] text-[#1B2A4A]/65 leading-relaxed">
                    {panelLine(panel)}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-5 pt-4 border-t border-[#1B2A4A]/10 font-body text-xs text-[#1B2A4A]/55">
            כל הפרטים, כולל מה אפשר לפסול ומה קורה אם לא אהבת,
            {' '}
            <Link to="/mystery-box" className="text-[#E8622A] font-bold hover:underline">בעמוד המיסטרי בוקס</Link>.
          </p>
        </div>

      </div>
    </section>
  );
}
