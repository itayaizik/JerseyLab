import React from 'react';
import { ShieldCheck, BadgeCheck, MessageCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

const items = [
  { icon: ShieldCheck, label: t('נבדקת לפני שליחה', 'Checked before shipping') },
  { icon: BadgeCheck, label: t('איכות 1:1', '1:1 quality') },
  { icon: MessageCircle, label: t('מענה מהיר בוואטסאפ', 'Fast replies on WhatsApp') },
];

export default function TrustBar({ className = '' }) {
  return (
    <ul className={`grid grid-cols-3 gap-2 ${className}`}>
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-brand-mist px-2 py-3 text-center">
          <Icon className="h-5 w-5 text-brand-orange-ink" aria-hidden="true" />
          <span className="text-xs font-medium leading-tight text-brand-navy/75">{label}</span>
        </li>
      ))}
    </ul>
  );
}
