import React from 'react';
import { MessageCircle, Instagram } from 'lucide-react';
import OptionCards from '@/components/configurator/OptionCards';
import { t } from '@/lib/i18n';

const OPTIONS = [
  { id: 'whatsapp', label: 'WhatsApp', desc: t('נחזור אליכם בהודעה בוואטסאפ', "We'll message you on WhatsApp"), icon: MessageCircle },
  { id: 'instagram', label: 'Instagram', desc: t('נשלח לכם הודעה באינסטגרם', "We'll message you on Instagram"), icon: Instagram },
];

export default function ContactChannelChoice({ value, onChange, error }) {
  return (
    <div>
      <OptionCards options={OPTIONS} value={value} onChange={onChange} invalid={!!error} />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
