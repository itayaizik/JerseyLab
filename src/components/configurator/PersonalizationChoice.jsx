import React from 'react';
import { Ban, Type } from 'lucide-react';
import OptionCards from '@/components/configurator/OptionCards';
import { EXTRA_PRICES } from '@/lib/cart';

export const PERSONALIZATION_OPTIONS = [
  { id: 'no', label: 'בלי שם ומספר', desc: 'חולצה נקייה', icon: Ban, price: 0 },
  { id: 'yes', label: 'שם ומספר', desc: 'הדפסה על הגב', icon: Type, price: EXTRA_PRICES.name },
];

export default function PersonalizationChoice({ value, onChange, invalid }) {
  return <OptionCards options={PERSONALIZATION_OPTIONS} value={value} onChange={onChange} invalid={invalid} />;
}
