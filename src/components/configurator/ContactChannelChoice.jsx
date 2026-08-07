import React from 'react';
import { MessageCircle, Instagram } from 'lucide-react';

const OPTIONS = [
  { id: 'whatsapp', label: 'WhatsApp', desc: 'נחזור אליך להודעה בוואטסאפ', icon: MessageCircle },
  { id: 'instagram', label: 'Instagram', desc: 'נשלח לך הודעה באינסטגרם', icon: Instagram },
];

export default function ContactChannelChoice({ value, onChange, error }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(opt => {
          const Icon = opt.icon;
          const isSelected = value === opt.id;
          return (
            <button key={opt.id} type="button" onClick={() => onChange(opt.id)}
              className={`flex flex-col items-center gap-1.5 p-3 border-2 transition-all duration-200 text-center ${
                isSelected
                  ? 'border-[#1B2A4A] bg-[#1B2A4A] text-white'
                  : `bg-white text-[#1B2A4A] hover:bg-[#F2ECD9] ${error ? 'border-red-500' : 'border-[#1B2A4A]/30 hover:border-[#1B2A4A]'}`
              }`}>
              <Icon className="w-5 h-5" />
              <span className="text-sm font-heading font-bold uppercase leading-none">{opt.label}</span>
              <span className={`text-[10px] font-body leading-tight ${isSelected ? 'opacity-90' : 'opacity-60'}`}>{opt.desc}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
