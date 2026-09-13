import React from 'react';

const tagStyles = {
  'נדיר': 'bg-amber-100 text-amber-900',
  'רטרו': 'bg-brand-mist text-brand-navy',
  'חדש': 'bg-brand-orange-soft text-brand-orange-ink',
  'סייל': 'bg-red-50 text-red-700',
  'מלאי מוגבל': 'bg-red-600 text-white',
  'מלאי בארץ': 'bg-emerald-50 text-emerald-700',
};

export default function TagBadge({ tag }) {
  const style = tagStyles[tag] || 'bg-brand-mist text-brand-navy/70';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${style}`}>
      {tag}
    </span>
  );
}
