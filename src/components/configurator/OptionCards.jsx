import React from 'react';

// A small set of choices shown as cards: regular or player version, print or no
// print, WhatsApp or Instagram. One component so every choice in the order flow
// selects the same way.

export default function OptionCards({ options, value, onChange, invalid = false, columns = 2 }) {
  return (
    <div className={`grid gap-2.5 ${columns === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {options.map(opt => {
        const Icon = opt.icon;
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-start transition ${
              isSelected
                ? 'border-brand-orange bg-brand-orange-soft ring-1 ring-inset ring-brand-orange'
                : `bg-white hover:border-brand-navy/30 ${invalid ? 'border-red-300' : 'border-brand-line'}`
            }`}
          >
            {Icon && (
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${isSelected ? 'bg-white text-brand-orange-ink' : 'bg-brand-mist text-brand-navy'}`}>
                <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
              </span>
            )}
            <span className="text-[15px] font-semibold leading-tight text-brand-navy">{opt.label}</span>
            {opt.desc && <span className="text-[13px] leading-snug text-brand-navy/55">{opt.desc}</span>}
            {opt.price > 0 && <span className="text-[13px] font-semibold text-brand-orange-ink">+₪{opt.price}</span>}
          </button>
        );
      })}
    </div>
  );
}
