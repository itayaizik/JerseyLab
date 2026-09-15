import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function RegisterSuccess({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(), 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="py-6 text-center" role="status">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <Check className="h-8 w-8 text-emerald-600" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-brand-navy">{t('הפרופיל שלכם מוכן', 'Your profile is ready')}</h3>
      <p className="mb-1 text-[15px] text-brand-navy/70">{t('החשבון נוצר בהצלחה.', 'Your account was created.')}</p>
      <p className="text-xs text-brand-navy/45">{t('המידע יעזור לנו להציג לכם התאמות והמלצות רלוונטיות. מעבירים אתכם לחנות…', "This helps us show you relevant picks and recommendations. Taking you to the shop…")}</p>
    </div>
  );
}
