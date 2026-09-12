import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

export default function RegisterSuccess({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(), 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-brand-orange flex items-center justify-center mx-auto mb-4"
        style={{ border: '2px solid var(--brand-navy)', boxShadow: '3px 3px 0 var(--brand-navy)' }}>
        <Check className="w-8 h-8 text-white" />
      </div>
      <h3 className="font-heading font-bold text-xl mb-2 text-brand-navy uppercase">הפרופיל שלך מוכן!</h3>
      <p className="text-brand-navy/70 text-sm font-body mb-1">החשבון נוצר בהצלחה.</p>
      <p className="text-brand-navy/40 text-xs font-body">המידע יעזור לנו להציג לך התאמות והמלצות רלוונטיות יותר. מעביר אותך לחנות…</p>
    </div>
  );
}