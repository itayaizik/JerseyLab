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

export default function ExactOrCustomChoice({ items = [], value, itemId, onChange, invalid = false }) {
  const options = [
    ...items.map(item => {
      const print = stockPrint(item);
      return {
        key: `exact-${item.id}`,
        mode: 'exact',
        id: item.id,
        label: print ? `החולצה שבמלאי · ${print}` : 'החולצה שבמלאי',
        desc: [item.player_version ? 'גרסת שחקן' : 'גרסה רגילה', !print && 'בלי הדפסה'].filter(Boolean).join(' · '),
        shipping: 'מגיעה עד שבוע או באיסוף מקריית אונו',
        local: true,
        icon: PackageCheck,
      };
    }),
    {
      key: 'custom',
      mode: 'custom',
      id: '',
      label: 'הזמנה אישית',
      desc: 'בוחרים גרסה, שם ומספר משלכם',
      shipping: 'מגיעה עד 3 שבועות',
      local: false,
      icon: Wand2,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {options.map(opt => {
        const Icon = opt.icon;
        const isSelected = value === opt.mode && (opt.mode !== 'exact' || itemId === opt.id);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.mode, opt.id)}
            aria-pressed={isSelected}
            className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-start transition ${
              isSelected
                ? 'border-brand-orange bg-brand-orange-soft ring-1 ring-inset ring-brand-orange'
                : `bg-white hover:border-brand-navy/30 ${invalid ? 'border-red-300' : 'border-brand-line'}`
            }`}
          >
            <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${isSelected ? 'bg-white text-brand-orange-ink' : 'bg-brand-mist text-brand-navy'}`}>
              <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold leading-tight text-brand-navy" dir="auto">{opt.label}</span>
              <span className="mt-1 block text-[13px] text-brand-navy/55">{opt.desc}</span>
              <span className={`mt-1 block text-[13px] font-medium ${opt.local ? 'text-emerald-700' : 'text-brand-navy/55'}`}>{opt.shipping}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
