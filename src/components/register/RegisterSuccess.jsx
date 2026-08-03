import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

export default function RegisterSuccess({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(), 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-[#E8622A] flex items-center justify-center mx-auto mb-4"
        style={{ border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #1B2A4A' }}>
        <Check className="w-8 h-8 text-white" />
      </div>
      <h3 className="font-heading font-bold text-xl mb-2 text-[#1B2A4A] uppercase">הפרופיל שלך מוכן!</h3>
      <p className="text-[#1B2A4A]/70 text-sm font-body mb-1">החשבון נוצר בהצלחה.</p>
      <p className="text-[#1B2A4A]/40 text-xs font-body">המידע יעזור לנו להציג לך התאמות והמלצות רלוונטיות יותר. מעביר אותך לחנות…</p>
    </div>
  );
}