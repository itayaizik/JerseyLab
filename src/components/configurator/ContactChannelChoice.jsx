import React from 'react';
import { MessageCircle, Instagram } from 'lucide-react';
import OptionCards from '@/components/configurator/OptionCards';

const OPTIONS = [
  { id: 'whatsapp', label: 'WhatsApp', desc: 'נחזור אליכם בהודעה בוואטסאפ', icon: MessageCircle },
  { id: 'instagram', label: 'Instagram', desc: 'נשלח לכם הודעה באינסטגרם', icon: Instagram },
];

export default function ContactChannelChoice({ value, onChange, error }) {
  return (
    <div>
      <OptionCards options={OPTIONS} value={value} onChange={onChange} invalid={!!error} />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
