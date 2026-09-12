import React from 'react';
import { Ban, Type } from 'lucide-react';

const options = [
  { id: 'no', label: 'בלי שם ומספר', desc: 'חולצה נקייה', icon: Ban, price: 0 },
  { id: 'yes', label: 'שם ומספר', desc: 'הדפסה על הגב', icon: Type, price: 15 },
];

export default function PersonalizationChoice({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(opt => {
        const Icon = opt.icon;
        const isSelected = value === opt.id;
        return (
          <button key={opt.id} type="button" onClick={() => onChange(opt.id)}
            className={`flex flex-col items-center gap-1.5 p-4 border-2 transition-all duration-200 text-center ${
              isSelected ? 'border-brand-navy bg-brand-navy text-white scale-105' : 'border-brand-navy/30 bg-white text-brand-navy hover:border-brand-navy hover:bg-brand-cream'
            }`}>
            <Icon className="w-6 h-6" />
            <span className="text-sm font-heading font-bold uppercase leading-tight">{opt.label}</span>
            {opt.price > 0
              ? <span className="text-[10px] font-mono opacity-80">+₪{opt.price}</span>
              : <span className="text-[10px] font-body opacity-70">{opt.desc}</span>}
          </button>
        );
      })}
    </div>
  );
}