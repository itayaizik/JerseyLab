import React from 'react';
import { Shirt, Star } from 'lucide-react';
import OptionCards from '@/components/configurator/OptionCards';
import { EXTRA_PRICES } from '@/lib/cart';
import { t } from '@/lib/i18n';

export const SHIRT_TYPE_OPTIONS = [
  { id: 'regular', label: t('גרסה רגילה', 'Regular version'), desc: t('בד סטנדרטי, גזרה נוחה', 'Standard fabric, comfortable fit'), icon: Shirt, price: 0 },
  { id: 'player', label: t('גרסת שחקן', 'Player version'), desc: t('בד דק ונושם, גזרה צמודה', 'Light, breathable fabric, slim fit'), icon: Star, price: EXTRA_PRICES.player },
];

export default function ShirtTypeChoice({ value, onChange, invalid }) {
  return <OptionCards options={SHIRT_TYPE_OPTIONS} value={value} onChange={onChange} invalid={invalid} />;
}
