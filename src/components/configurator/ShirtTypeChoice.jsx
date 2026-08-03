import React from 'react';
import { Shirt, Star } from 'lucide-react';

const options = [
  { id: 'regular', label: 'גרסה רגילה', desc: 'בד סטנדרטי, גזרה נוחה', icon: Shirt, price: 0 },
  { id: 'player', label: 'גרסת שחקן', desc: 'בד דק ונושם, גזרה צמודה', icon: Star, price: 20 },
];

export default function ShirtTypeChoice({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(opt => {
        const Icon = opt.icon;
        const isSelected = value === opt.id;
        return (
          <button key={opt.id} type="button" onClick={() => onChange(opt.id)}
            className={`flex flex-col items-center gap-1.5 p-4 border-2 transition-all duration-200 text-center ${
              isSelected ? 'border-[#1B2A4A] bg-[#1B2A4A] text-white scale-105' : 'border-[#1B2A4A]/30 bg-white text-[#1B2A4A] hover:border-[#1B2A4A] hover:bg-[#F2ECD9]'
            }`}>
            <Icon className="w-6 h-6" />
            <span className="text-sm font-heading font-bold uppercase leading-tight">{opt.label}</span>
            <span className="text-[10px] font-body opacity-70 leading-tight">{opt.desc}</span>
            {opt.price > 0 && <span className="text-[10px] font-mono opacity-80">+₪{opt.price}</span>}
          </button>
        );
      })}
    </div>
  );
}