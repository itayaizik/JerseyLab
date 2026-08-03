import React from 'react';

const tagStyles = {
  'נדיר': 'bg-amber-100 text-amber-800 border-amber-300',
  'רטרו': 'bg-orange-100 text-orange-800 border-orange-300',
  'חדש': 'bg-turf/20 text-pitch border-turf',
  'סייל': 'bg-redcard/10 text-redcard border-redcard/30',
  'מלאי מוגבל': 'bg-red-600 text-white border-red-700 animate-pulse',
};

export default function TagBadge({ tag }) {
  const style = tagStyles[tag] || 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold border ${style}`}>
      {tag}
    </span>
  );
}