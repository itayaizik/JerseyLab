import React from 'react';
import { Shirt, Star } from 'lucide-react';
import OptionCards from '@/components/configurator/OptionCards';
import { EXTRA_PRICES } from '@/lib/cart';

export const SHIRT_TYPE_OPTIONS = [
  { id: 'regular', label: 'גרסה רגילה', desc: 'בד סטנדרטי, גזרה נוחה', icon: Shirt, price: 0 },
  { id: 'player', label: 'גרסת שחקן', desc: 'בד דק ונושם, גזרה צמודה', icon: Star, price: EXTRA_PRICES.player },
];

export default function ShirtTypeChoice({ value, onChange, invalid }) {
  return <OptionCards options={SHIRT_TYPE_OPTIONS} value={value} onChange={onChange} invalid={invalid} />;
}
