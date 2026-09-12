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
          <div key={it.label} className="flex flex-col items-center text-center gap-1 bg-brand-cream py-2.5 px-1" style={{ border: '1px solid var(--brand-navy)' }}>
            <Icon className="w-4 h-4 text-brand-orange" />
            <span className="text-[10px] font-heading font-bold text-brand-navy uppercase leading-tight">{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}