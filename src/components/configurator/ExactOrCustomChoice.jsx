import React from 'react';
import { PackageCheck, Wand2 } from 'lucide-react';

export default function ExactOrCustomChoice({ shirt, value, onChange }) {
  const exactDesc = shirt.local_stock_player_version && shirt.local_stock_custom_name
    ? `גרסת שחקן - ${shirt.local_stock_custom_name}`
    : shirt.local_stock_player_version
    ? 'גרסת שחקן, בלי הדפסה'
    : shirt.local_stock_custom_name
    ? `גרסה רגילה - ${shirt.local_stock_custom_name}`
    : 'גרסה רגילה, בלי הדפסה';

  const options = [
    { id: 'exact', label: 'קנה בדיוק את זו', desc: exactDesc, shipping: 'מלאי בארץ - עד שבוע', icon: PackageCheck },
    { id: 'custom', label: 'הזמנה בהתאמה אישית', desc: 'בחר גרסה, שם ומספר משלך', shipping: 'הזמנה מיוחדת - עד 3 שבועות', icon: Wand2 },
  ];

  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map(opt => {
        const Icon = opt.icon;
        const isSelected = value === opt.id;
        return (
          <button key={opt.id} type="button" onClick={() => onChange(opt.id)}
            className={`flex items-start gap-3 p-3.5 border-2 transition-all duration-200 text-right ${
              isSelected ? 'border-[#1B2A4A] bg-[#1B2A4A] text-white' : 'border-[#1B2A4A]/30 bg-white text-[#1B2A4A] hover:border-[#1B2A4A] hover:bg-[#F2ECD9]'
            }`}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-bold uppercase leading-tight">{opt.label}</p>
              <p className={`text-xs font-body mt-0.5 ${isSelected ? 'opacity-90' : 'opacity-70'}`}>{opt.desc}</p>
              <p className={`text-[10px] font-body mt-1 font-bold ${isSelected ? 'text-white' : 'text-[#E8622A]'}`}>{opt.shipping}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
