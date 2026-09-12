import React from 'react';

const statusConfig = {
  available: { label: 'זמין', bg: 'bg-brand-orange', text: 'text-white' },
  reserved: { label: 'שמור', bg: 'bg-amber-400', text: 'text-brand-navy' },
  sold: { label: 'נמכר', bg: 'bg-redcard', text: 'text-white' },
  hidden: { label: 'מוסתר', bg: 'bg-brand-navy/50', text: 'text-white' },
};

export default function StatusBadge({ status, className = '' }) {
  const config = statusConfig[status] || statusConfig.available;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${config.bg} ${config.text} ${className}`}>
      {config.label}
    </span>
  );
}