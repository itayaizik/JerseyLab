import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

export default function RegisterSuccess({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(), 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="py-6 text-center" role="status">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <Check className="h-8 w-8 text-emerald-600" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-brand-navy">הפרופיל שלכם מוכן</h3>
      <p className="mb-1 text-[15px] text-brand-navy/70">החשבון נוצר בהצלחה.</p>
      <p className="text-xs text-brand-navy/45">המידע יעזור לנו להציג לכם התאמות והמלצות רלוונטיות. מעבירים אתכם לחנות…</p>
    </div>
  );
}
