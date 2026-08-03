import React from 'react';
import { ShieldCheck, BadgeCheck, MessageCircle } from 'lucide-react';

const items = [
  { icon: ShieldCheck, label: 'נבדק לפני שליחה' },
  { icon: BadgeCheck, label: 'איכות 1:1' },
  { icon: MessageCircle, label: 'מענה מהיר בוואטסאפ' },
];

export default function TrustBar() {
  return (
    <div className="grid grid-cols-3 gap-2 mb-5">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className="flex flex-col items-center text-center gap-1 bg-[#F2ECD9] py-2.5 px-1" style={{ border: '1px solid #1B2A4A' }}>
            <Icon className="w-4 h-4 text-[#E8622A]" />
            <span className="text-[10px] font-heading font-bold text-[#1B2A4A] uppercase leading-tight">{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}