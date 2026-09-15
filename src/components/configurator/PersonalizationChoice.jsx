import React from 'react';
import { Ban, Type } from 'lucide-react';
import OptionCards from '@/components/configurator/OptionCards';
import { EXTRA_PRICES } from '@/lib/cart';
import { t } from '@/lib/i18n';

export const PERSONALIZATION_OPTIONS = [
  { id: 'no', label: t('בלי שם ומספר', 'No name or number'), desc: t('חולצה נקייה', 'A clean shirt'), icon: Ban, price: 0 },
  { id: 'yes', label: t('שם ומספר', 'Name and number'), desc: t('הדפסה על הגב', 'Printed on the back'), icon: Type, price: EXTRA_PRICES.name },
];

export default function PersonalizationChoice({ value, onChange, invalid }) {
  return <OptionCards options={PERSONALIZATION_OPTIONS} value={value} onChange={onChange} invalid={invalid} />;
}
