import React from 'react';
import { PackageCheck, Wand2 } from 'lucide-react';
import { stockPrint } from '@/lib/localStock';

// "Buy exactly this one" or "make me my own".
//
// Local stock is held as individual shirts, so one size can have several: a
// size S printed MESSI 10 and another printed YAMAL 19 are two different
// purchases. Each is offered as its own option, headed by what is printed on
// its back, and choosing one records which shirt it was - the order then says
// which of the two the customer wants instead of just "size S from stock".

export default function ExactOrCustomChoice({ items = [], value, itemId, onChange }) {
  const options = [
    ...items.map(item => {
      const print = stockPrint(item);
      return {
        key: `exact-${item.id}`,
        mode: 'exact',
        id: item.id,
        label: print ? `קנה בדיוק את זו · ${print}` : 'קנה בדיוק את זו',
        desc: [item.player_version ? 'גרסת שחקן' : 'גרסה רגילה', !print && 'בלי הדפסה'].filter(Boolean).join(' · '),
        shipping: 'מלאי בארץ - עד שבוע',
        icon: PackageCheck,
      };
    }),
    {
      key: 'custom',
      mode: 'custom',
      id: '',
      label: 'הזמנה בהתאמה אישית',
      desc: 'בחר גרסה, שם ומספר משלך',
      shipping: 'הזמנה מיוחדת - עד 3 שבועות',
      icon: Wand2,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map(opt => {
        const Icon = opt.icon;
        const isSelected = value === opt.mode && (opt.mode !== 'exact' || itemId === opt.id);
        return (
          <button key={opt.key} type="button" onClick={() => onChange(opt.mode, opt.id)} aria-pressed={isSelected}
            className={`flex items-start gap-3 p-3.5 border-2 transition-all duration-200 text-right ${
              isSelected ? 'border-brand-navy bg-brand-navy text-white' : 'border-brand-navy/30 bg-white text-brand-navy hover:border-brand-navy hover:bg-brand-cream'
            }`}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-bold uppercase leading-tight">{opt.label}</p>
              <p className={`text-xs font-body mt-0.5 ${isSelected ? 'opacity-90' : 'opacity-70'}`}>{opt.desc}</p>
              <p className={`text-[10px] font-body mt-1 font-bold ${isSelected ? 'text-white' : 'text-brand-orange'}`}>{opt.shipping}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
